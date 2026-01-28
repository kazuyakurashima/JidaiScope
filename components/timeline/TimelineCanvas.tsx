/**
 * TimelineCanvas - メインタイムライン描画コンポーネント
 * Sprint 2: 020 Timeline Core
 *
 * Skia を使用した真比率タイムラインの描画エンジン。
 * - 縄文〜令和（-14000年〜2025年）を一本のラインとして表示
 * - 時代背景帯とイベントマーカーの描画
 * - パン・ピンチズームジェスチャー対応
 * - タップでイベント詳細へ遷移
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
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withDecay,
  runOnJS,
} from 'react-native-reanimated';

import type { Era, HistoricalEvent, EventTag } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineStore, useSettingsStore } from '@/stores';
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
  IMPORTANCE_SIZE_MULTIPLIER,
  TAG_COLORS,
  MAX_VISIBLE_EVENTS,
} from '@/domain/timeline/constants';
import { ERA_COLORS } from '@/constants/tokens';
import { hitTest, detectEraBoundaryCrossing } from './hitDetection';

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

function getMarkerRadius(importanceLevel: number): number {
  const multiplier = IMPORTANCE_SIZE_MULTIPLIER[importanceLevel] ?? 1.0;
  return EVENT_MARKER_BASE_RADIUS * multiplier;
}

// =============================================================================
// Component
// =============================================================================

export function TimelineCanvas({
  eras,
  events,
  onEventPress,
  onEraPress,
}: TimelineCanvasProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const { colors } = useTheme();

  // Store
  const zoomLevel = useTimelineStore((s) => s.zoomLevel);
  const setZoom = useTimelineStore((s) => s.setZoom);
  const scrollX = useTimelineStore((s) => s.scrollX);
  const setScroll = useTimelineStore((s) => s.setScroll);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

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
  // Haptics
  // ==========================================================================

  const triggerEraBoundaryHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

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
          // リアルタイムでストアを更新して描画に反映
          runOnJS(setZoom)(newZoom);
        })
        .onEnd(() => {
          'worklet';
          // 最終値をストアに確定
          runOnJS(setZoom)(scale.value);
        }),
    [setZoom, scale, pinchStartZoom]
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        'worklet';
        runOnJS(handleTap)(e.x, e.y, scale.value, translateX.value);
      }),
    [handleTap, scale, translateX]
  );

  const composedGesture = useMemo(
    () => Gesture.Race(tapGesture, Gesture.Simultaneous(panGesture, pinchGesture)),
    [tapGesture, panGesture, pinchGesture]
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
    [eras, screenWidth, setScroll, triggerEraBoundaryHaptic, scale]
  );

  // ==========================================================================
  // Render Helpers
  // ==========================================================================

  // 可視範囲内の時代を計算
  const visibleEras = useMemo(() => {
    return eras.filter((era) => isYearRangeVisible(era.startYear, era.endYear, config));
  }, [eras, config]);

  // 可視範囲内のイベントを計算（最大数制限）
  const visibleEvents = useMemo(() => {
    return events
      .filter((event) => {
        const year = extractYearFromDate(event.startDate);
        return isYearVisible(year, config);
      })
      .slice(0, MAX_VISIBLE_EVENTS);
  }, [events, config]);

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

            {/* イベントマーカー */}
            <Group>
              {visibleEvents.map((event) => {
                const year = extractYearFromDate(event.startDate);
                const x = yearToPixel(year, config);
                const radius = getMarkerRadius(event.importanceLevel);
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
