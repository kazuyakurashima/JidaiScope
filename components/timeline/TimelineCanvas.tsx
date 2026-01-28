/**
 * TimelineCanvas - メインタイムライン描画コンポーネント
 * Sprint 2: 020 Timeline Core, 021 Zoom Manager, 022 LOD Manager
 *
 * Skia を使用した真比率タイムラインの描画エンジン。
 * - 縄文〜令和（-14000年〜2025年）を一本のラインとして表示
 * - 時代背景帯とイベントマーカーの描画
 * - パン・ピンチズームジェスチャー対応
 * - ダブルタップで x2 ズーム（focal point 対応）
 * - タップでイベント詳細へ遷移
 * - LOD（Level of Detail）レベルに応じた表示制御
 */

import {
  Canvas,
  Rect,
  Circle,
  Line,
  Text,
  useFont,
  Group,
  vec,
} from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withDecay,
  runOnJS,
} from 'react-native-reanimated';

import type { Era, HistoricalEvent, EventTag, Reign } from '@/types/database';
import type { LODLevel } from '@/types/store';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineStore, useSettingsStore, useAppStore } from '@/stores';
import { filterReigns } from '@/domain/timeline/layerFilter';
import {
  clampScrollX,
  yearToPixel,
  extractYearFromDate,
  isYearRangeVisible,
  isYearVisible,
  type CoordinateConfig,
} from '@/domain/timeline/coordinateSystem';
import {
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  SCROLL_DECAY,
  TIMELINE_AXIS_Y_RATIO,
  ERA_BAND_TOP_RATIO,
  ERA_BAND_BOTTOM_RATIO,
  ERA_LABEL_Y_RATIO,
  EVENT_MARKER_BASE_RADIUS,
  TAG_COLORS,
  DOUBLE_TAP_ZOOM_FACTOR,
  LOD_THRESHOLDS,
} from '@/domain/timeline/constants';
import { ERA_COLORS } from '@/constants/tokens';
import { triggerHaptic, triggerEraBoundaryHaptic } from '@/utils/haptics';
import { hitTest, detectEraBoundaryCrossing } from './hitDetection';
import {
  filterEventsByLOD,
  getMarkerRadiusByLOD,
  shouldShowEventLabels,
  filterDensePeriodEvents,
  applyEventLimit,
} from '@/domain/timeline/lodManager';
import {
  REIGN_BAND_HEIGHT,
  REIGN_BAND_OFFSET,
  getReignColor,
} from './drawReigns';

// =============================================================================
// Font
// =============================================================================

const ROBOTO_FONT = require('../../assets/fonts/Roboto-Medium.ttf');

// =============================================================================
// Types
// =============================================================================

export interface TimelineCanvasProps {
  /** 時代データ */
  eras: Era[];
  /** イベントデータ */
  events: HistoricalEvent[];
  /** 在位データ（天皇・将軍） */
  reigns?: Reign[];
  /** イベントタップ時のコールバック */
  onEventPress?: (eventId: string) => void;
  /** 時代タップ時のコールバック */
  onEraPress?: (eraId: string) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

const ERA_COLOR_MAP: Record<string, string> = {
  jomon: ERA_COLORS.jomon,
  yayoi: ERA_COLORS.yayoi,
  kofun: ERA_COLORS.kofun,
  asuka: ERA_COLORS.asuka,
  nara: ERA_COLORS.nara,
  heian: ERA_COLORS.heian,
  kamakura: ERA_COLORS.kamakura,
  muromachi: ERA_COLORS.muromachi,
  sengoku: ERA_COLORS.sengoku,
  azuchi_momoyama: ERA_COLORS.azuchiMomoyama,
  edo: ERA_COLORS.edo,
  meiji: ERA_COLORS.meiji,
  taisho: ERA_COLORS.taisho,
  showa: ERA_COLORS.showa,
  heisei: ERA_COLORS.heisei,
};

function getEraColor(eraId: string, dbColor: string | null): string {
  if (dbColor) return dbColor;
  return ERA_COLOR_MAP[eraId] ?? '#4A5568';
}

function getEventColor(tags: EventTag[]): string {
  if (tags.length === 0) return TAG_COLORS.default;
  return TAG_COLORS[tags[0]] ?? TAG_COLORS.default;
}

/**
 * ズームレベルからLODレベルを計算
 *
 * 境界条件:
 * - L0 (全体俯瞰): 1 ≤ zoom < 2
 * - L1 (時代概要): 2 ≤ zoom < 10
 * - L2 (詳細表示): 10 ≤ zoom < 50
 * - L3 (最大詳細): 50 ≤ zoom
 *
 * 境界値（2, 10, 50）は上位LODに含まれる
 */
function calculateLODLevel(zoom: number): LODLevel {
  // 境界値は上位レベルに含める（zoom >= 2 → L1）
  if (zoom < LOD_THRESHOLDS.L0_MAX) return 0;  // 1 ≤ zoom < 2
  if (zoom < LOD_THRESHOLDS.L1_MAX) return 1;  // 2 ≤ zoom < 10
  if (zoom < LOD_THRESHOLDS.L2_MAX) return 2;  // 10 ≤ zoom < 50
  return 3;                                     // 50 ≤ zoom
}

// =============================================================================
// Component
// =============================================================================

export function TimelineCanvas({
  eras,
  events,
  reigns = [],
  onEventPress,
  onEraPress,
}: TimelineCanvasProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const { colors } = useTheme();

  // Timeline Store
  const zoomLevel = useTimelineStore((s) => s.zoomLevel);
  const setZoom = useTimelineStore((s) => s.setZoom);
  const scrollX = useTimelineStore((s) => s.scrollX);
  const setScroll = useTimelineStore((s) => s.setScroll);
  const lodLevel = useTimelineStore((s) => s.lodLevel);
  const setLOD = useTimelineStore((s) => s.setLOD);

  // Settings Store (Layer visibility)
  const visibleLayers = useSettingsStore((s) => s.visibleLayers);

  // App Store (Pro status)
  const proUnlocked = useAppStore((s) => s.proUnlocked);

  // Shared values for animation
  const translateX = useSharedValue(scrollX);
  const scale = useSharedValue(zoomLevel);
  const pinchStartZoom = useSharedValue(zoomLevel); // ピンチ開始時のズームレベル
  const prevScrollXRef = useRef(scrollX);

  // Font
  const font = useFont(ROBOTO_FONT, 12);

  // Sync store with shared values
  useEffect(() => {
    translateX.value = scrollX;
  }, [scrollX, translateX]);

  useEffect(() => {
    scale.value = zoomLevel;
  }, [zoomLevel, scale]);

  // ==========================================================================
  // Derived Values for Declarative Skia
  // ==========================================================================

  // 現在の座標設定
  const config: CoordinateConfig = useMemo(() => ({
    screenWidth,
    screenHeight,
    zoomLevel,
    scrollX,
  }), [screenWidth, screenHeight, zoomLevel, scrollX]);

  // Layout calculations
  const bandTop = screenHeight * ERA_BAND_TOP_RATIO;
  const bandBottom = screenHeight * ERA_BAND_BOTTOM_RATIO;
  const bandHeight = bandBottom - bandTop;
  const axisY = screenHeight * TIMELINE_AXIS_Y_RATIO;
  const labelY = screenHeight * ERA_LABEL_Y_RATIO;

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleEventPress = useCallback(
    (eventId: string) => {
      if (onEventPress) {
        onEventPress(eventId);
      } else {
        router.push(`/event/${eventId}`);
      }
    },
    [onEventPress, router]
  );

  const handleEraPress = useCallback(
    (eraId: string) => {
      if (onEraPress) {
        onEraPress(eraId);
      } else {
        // デフォルト動作: 時代詳細画面へ遷移
        router.push(`/era/${eraId}`);
      }
    },
    [onEraPress, router]
  );

  const handleTap = useCallback(
    (x: number, y: number, currentScale: number, currentTranslateX: number) => {
      const tapConfig: CoordinateConfig = {
        screenWidth,
        screenHeight,
        zoomLevel: currentScale,
        scrollX: currentTranslateX,
      };

      const result = hitTest(x, y, {
        ...tapConfig,
        events,
        eras,
      });

      if (result.type === 'event' && result.id) {
        handleEventPress(result.id);
      } else if (result.type === 'era' && result.id) {
        handleEraPress(result.id);
      }
    },
    [screenWidth, screenHeight, events, eras, handleEventPress, handleEraPress]
  );

  // ==========================================================================
  // Gestures
  // ==========================================================================

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          'worklet';
          // translationX は累積値なので前回との差分を計算
          const newScrollX = scrollX + e.translationX;
          const clamped = clampScrollX(newScrollX, screenWidth, scale.value);
          translateX.value = clamped;
        })
        .onEnd((e) => {
          'worklet';
          // 慣性スクロール
          const minScroll = clampScrollX(-Infinity, screenWidth, scale.value);
          translateX.value = withDecay({
            velocity: e.velocityX,
            deceleration: SCROLL_DECAY,
            clamp: [minScroll, 0],
          });
        }),
    [screenWidth, translateX, scale, scrollX]
  );

  // ピンチズーム中のズーム＆LOD更新（リアルタイム）
  const prevLODRef = useRef<LODLevel>(calculateLODLevel(zoomLevel));

  const handlePinchUpdate = useCallback(
    (newZoom: number) => {
      setZoom(newZoom);
      // LODレベルが変わった場合のみ更新（パフォーマンス最適化）
      const newLOD = calculateLODLevel(newZoom);
      if (newLOD !== prevLODRef.current) {
        prevLODRef.current = newLOD;
        setLOD(newLOD);
      }
    },
    [setZoom, setLOD]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          'worklet';
          // ピンチ開始時のズームレベルを記録
          pinchStartZoom.value = scale.value;
        })
        .onUpdate((e) => {
          'worklet';
          // 開始時のズームレベルを基準に計算（累積を防ぐ）
          const newZoom = Math.max(
            MIN_ZOOM_LEVEL,
            Math.min(MAX_ZOOM_LEVEL, pinchStartZoom.value * e.scale)
          );
          scale.value = newZoom;
          // リアルタイムでストアとLODを更新
          runOnJS(handlePinchUpdate)(newZoom);
        })
        .onEnd(() => {
          'worklet';
          // 最終値を確定（handlePinchUpdate で既に更新済み）
          runOnJS(handlePinchUpdate)(scale.value);
        }),
    [scale, pinchStartZoom, handlePinchUpdate]
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        'worklet';
        runOnJS(handleTap)(e.x, e.y, scale.value, translateX.value);
      }),
    [handleTap, scale, translateX]
  );

  // ダブルタップズーム（x2）
  const handleDoubleTapZoom = useCallback(
    (tapX: number, currentZoom: number, currentScrollX: number) => {
      // 新しいズームレベル計算（最大値で制限、または最小に戻す）
      const newZoom = currentZoom >= MAX_ZOOM_LEVEL
        ? MIN_ZOOM_LEVEL
        : Math.min(MAX_ZOOM_LEVEL, currentZoom * DOUBLE_TAP_ZOOM_FACTOR);

      // タップ位置を基準にスクロール調整（focal point zoom）
      // タップした位置が同じ年を指すようにスクロールを調整
      const zoomRatio = newZoom / currentZoom;
      const newScrollX = (currentScrollX - tapX) * zoomRatio + tapX;
      const clampedScrollX = clampScrollX(newScrollX, screenWidth, newZoom);

      // 状態更新
      setZoom(newZoom);
      setScroll(clampedScrollX);

      // LOD更新
      const newLOD = calculateLODLevel(newZoom);
      setLOD(newLOD);

      // ハプティクスフィードバック（fire-and-forget）
      void triggerHaptic('medium');
    },
    [screenWidth, setZoom, setScroll, setLOD]
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((e) => {
          'worklet';
          runOnJS(handleDoubleTapZoom)(e.x, scale.value, translateX.value);
        }),
    [handleDoubleTapZoom, scale, translateX]
  );

  // Gesture.Exclusive: ダブルタップが失敗（タイムアウト）してから単タップを発火
  // これによりダブルタップが確実に検出される
  const tapGestures = useMemo(
    () => Gesture.Exclusive(doubleTapGesture, tapGesture),
    [doubleTapGesture, tapGesture]
  );

  const composedGesture = useMemo(
    () => Gesture.Race(
      tapGestures,
      Gesture.Simultaneous(panGesture, pinchGesture)
    ),
    [tapGestures, panGesture, pinchGesture]
  );

  // ==========================================================================
  // Scroll sync and boundary detection
  // ==========================================================================

  useAnimatedReaction(
    () => translateX.value,
    (current, previous) => {
      'worklet';
      if (previous !== null && previous !== current) {
        // 時代境界通過検出（JS側で実行）
        runOnJS((curr: number, prev: number) => {
          const crossedEra = detectEraBoundaryCrossing(
            prev,
            curr,
            eras,
            screenWidth,
            scale.value
          );

          if (crossedEra) {
            triggerEraBoundaryHaptic();
          }

          prevScrollXRef.current = curr;
          setScroll(curr);
        })(current, previous);
      }
    },
    [eras, screenWidth, setScroll, scale]
  );

  // ==========================================================================
  // Render Helpers
  // ==========================================================================

  // 可視範囲内の時代を計算
  const visibleEras = useMemo(() => {
    return eras.filter((era) => isYearRangeVisible(era.startYear, era.endYear, config));
  }, [eras, config]);

  // LODレベルに基づくイベントフィルタリング
  const lodFilteredEvents = useMemo(() => {
    // Layer filter: イベントレイヤーが非表示なら空配列
    if (!visibleLayers.events) {
      return [];
    }
    // Step 1: LODレベルで重要度フィルタリング
    const byLOD = filterEventsByLOD(events, lodLevel);
    // Step 2: 密集期間（幕末〜明治）の追加フィルタリング
    return filterDensePeriodEvents(byLOD, lodLevel);
  }, [events, lodLevel, visibleLayers.events]);

  // 可視範囲内のイベントを計算（上限は可視範囲後に適用）
  const visibleEvents = useMemo(() => {
    // Step 3: 可視範囲フィルタ
    const inView = lodFilteredEvents.filter((event) => {
      const year = extractYearFromDate(event.startDate);
      return isYearVisible(year, config);
    });
    // Step 4: 表示上限を可視範囲内のイベントに適用
    return applyEventLimit(inView, lodLevel);
  }, [lodFilteredEvents, config, lodLevel]);

  // 在位データのフィルタリング（天皇・将軍レイヤー + Free/Pro制限）
  const visibleReigns = useMemo(() => {
    // 在位データがない場合は空配列
    if (reigns.length === 0) {
      return [];
    }

    // Layer filter + Free/Pro filter
    const filtered = filterReigns(reigns, { visibleLayers, proUnlocked });

    // 可視範囲フィルタ
    return filtered.filter((reign) =>
      isYearRangeVisible(reign.startYear, reign.endYear, config)
    );
  }, [reigns, visibleLayers, proUnlocked, config]);

  // LOD設定を取得
  const showLabels = shouldShowEventLabels(lodLevel);

  // ==========================================================================
  // LOD Transition Animation (Smooth Interpolation)
  // ==========================================================================

  const [eventOpacity, setEventOpacity] = useState(1);
  const [eventScale, setEventScale] = useState(1);
  const prevLodForAnimation = useRef(lodLevel);

  // アニメーションキャンセル関数を保持（opacity/scale 各2本 = 最大4本）
  const cancelFunctionsRef = useRef<(() => void)[]>([]);

  // performance.now() のフォールバック付き取得
  const getNow = useCallback(() => {
    return globalThis.performance?.now?.() ?? Date.now();
  }, []);

  /**
   * スムーズな補間アニメーション関数
   * @returns cancel関数（アニメーション停止用）
   */
  const animateValue = useCallback((
    from: number,
    to: number,
    duration: number,
    setValue: (v: number) => void,
    onComplete?: () => void
  ): () => void => {
    let rafId: number | null = null;
    let cancelled = false;
    const startTime = getNow();

    const animate = () => {
      if (cancelled) return;

      const elapsed = getNow() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * eased;
      setValue(value);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    rafId = requestAnimationFrame(animate);

    // cancel関数を返す
    return () => {
      cancelled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [getNow]);

  // LOD変更検出 → スムーズなフェード/スケールアニメーション + ハプティクス
  useEffect(() => {
    if (prevLodForAnimation.current !== lodLevel) {
      // LOD変更時のハプティクス（fire-and-forget）
      void triggerHaptic('selection');

      // 既存のアニメーションを全てキャンセル
      cancelFunctionsRef.current.forEach((cancel) => cancel());
      cancelFunctionsRef.current = [];

      // Phase 1: フェードアウト + スケールダウン (80ms)
      const cancelOpacity1 = animateValue(1, 0.5, 80, setEventOpacity, () => {
        // Phase 2: フェードイン (120ms)
        const cancelOpacity2 = animateValue(0.5, 1, 120, setEventOpacity);
        cancelFunctionsRef.current.push(cancelOpacity2);
      });

      const cancelScale1 = animateValue(1, 0.95, 80, setEventScale, () => {
        const cancelScale2 = animateValue(0.95, 1, 120, setEventScale);
        cancelFunctionsRef.current.push(cancelScale2);
      });

      cancelFunctionsRef.current.push(cancelOpacity1, cancelScale1);
      prevLodForAnimation.current = lodLevel;
    }

    return () => {
      // アンマウント時に全アニメーションをキャンセル
      cancelFunctionsRef.current.forEach((cancel) => cancel());
      cancelFunctionsRef.current = [];
    };
  }, [lodLevel, animateValue]);

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.canvasContainer}>
          <Canvas style={styles.canvas}>
            {/* 背景 */}
            <Rect
              x={0}
              y={0}
              width={screenWidth}
              height={screenHeight}
              color={colors.bg}
            />

            {/* 時代背景帯 */}
            <Group>
              {visibleEras.map((era) => {
                const startX = yearToPixel(era.startYear, config);
                const endX = yearToPixel(era.endYear, config);
                const width = endX - startX;

                if (width < 1) return null;

                return (
                  <Group key={`era-${era.id}`}>
                    {/* 背景帯 */}
                    <Rect
                      x={startX}
                      y={bandTop}
                      width={width}
                      height={bandHeight}
                      color={getEraColor(era.id, era.color)}
                      opacity={0.4}
                    />
                    {/* 境界線 */}
                    <Line
                      p1={vec(startX, bandTop)}
                      p2={vec(startX, bandBottom)}
                      color={getEraColor(era.id, era.color)}
                      strokeWidth={1}
                      opacity={0.7}
                    />
                    {/* ラベル */}
                    {font && width > 30 && (() => {
                      const textWidth = font.measureText(era.name).width;
                      const labelX = startX + (width - textWidth) / 2;
                      return (
                        <Text
                          x={labelX}
                          y={labelY}
                          text={era.name}
                          font={font}
                          color={colors.text}
                        />
                      );
                    })()}
                  </Group>
                );
              })}
            </Group>

            {/* タイムライン軸 */}
            <Line
              p1={vec(0, axisY)}
              p2={vec(screenWidth, axisY)}
              color={colors.primary}
              strokeWidth={2}
              opacity={0.3}
            />

            {/* 在位期間帯（天皇・将軍） - 024 Layer Management */}
            {visibleReigns.length > 0 && (
              <Group>
                {visibleReigns.map((reign) => {
                  const startX = yearToPixel(reign.startYear, config);
                  const endX = yearToPixel(reign.endYear, config);
                  const width = Math.max(2, endX - startX);
                  const color = getReignColor(reign.officeType);

                  // 天皇は軸の上、将軍は軸の下
                  const isEmperorReign = reign.officeType === 'emperor';
                  const bandY = isEmperorReign
                    ? axisY - REIGN_BAND_OFFSET - REIGN_BAND_HEIGHT
                    : axisY + REIGN_BAND_OFFSET;

                  return (
                    <Group key={`reign-${reign.id}`}>
                      <Rect
                        x={startX}
                        y={bandY}
                        width={width}
                        height={REIGN_BAND_HEIGHT}
                        color={color}
                        opacity={0.7}
                      />
                      {/* 高ズーム時に代数ラベル表示 */}
                      {font && zoomLevel >= 20 && width > 30 && reign.ordinal && (
                        <Text
                          x={startX + (width - font.measureText(`${reign.ordinal}`).width) / 2}
                          y={bandY + REIGN_BAND_HEIGHT / 2 + 4}
                          text={`${reign.ordinal}`}
                          font={font}
                          color={colors.text}
                        />
                      )}
                    </Group>
                  );
                })}
              </Group>
            )}

            {/* イベントマーカー（LOD切替時フェード/スケール対応） */}
            <Group
              opacity={eventOpacity}
              transform={[{ scale: eventScale }]}
              origin={vec(screenWidth / 2, axisY)}
            >
              {visibleEvents.map((event) => {
                const year = extractYearFromDate(event.startDate);
                const x = yearToPixel(year, config);
                // LODレベルに基づいたマーカー半径
                const radius = getMarkerRadiusByLOD(
                  EVENT_MARKER_BASE_RADIUS,
                  event.importanceLevel,
                  lodLevel
                );
                const color = getEventColor(event.tags);

                return (
                  <Group key={`event-${event.id}`}>
                    <Circle cx={x} cy={axisY} r={radius} color={color} />
                    {/* 期間イベント対応 */}
                    {event.endDate && (
                      <Line
                        p1={vec(x, axisY)}
                        p2={vec(yearToPixel(extractYearFromDate(event.endDate), config), axisY)}
                        color={color}
                        strokeWidth={2}
                        opacity={0.6}
                      />
                    )}
                    {/* L3: イベントラベル表示 */}
                    {showLabels && font && (
                      <Text
                        x={x - font.measureText(event.title).width / 2}
                        y={axisY - radius - 8}
                        text={event.title}
                        font={font}
                        color={colors.text}
                      />
                    )}
                  </Group>
                );
              })}
            </Group>
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});

// =============================================================================
// Export
// =============================================================================

export default TimelineCanvas;
