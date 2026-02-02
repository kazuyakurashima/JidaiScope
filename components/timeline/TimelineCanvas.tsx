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
  yearToPixel,
  pixelToYear,
  extractYearFromDate,
  isYearRangeVisible,
  isYearVisible,
  getVisibleYearRange,
  type CoordinateConfig,
} from '@/domain/timeline/coordinateSystem';
import { formatYearShort } from '@/utils/formatYear';
// TODO: Sprint 4 で和暦表示を有効化時に復活
// import { seirekiToWakaAsync } from '@/utils/wakaCalendar';
import {
  TIMELINE_AXIS_Y_RATIO,
  ERA_BAND_TOP_RATIO,
  ERA_BAND_BOTTOM_RATIO,
  ERA_LABEL_Y_RATIO,
  EVENT_MARKER_BASE_RADIUS,
  TAG_COLORS,
  DOUBLE_TAP_ZOOM_FACTOR,
  YEAR_RULER_INTERVALS,
  YEAR_RULER_Y_RATIO,
  YEAR_RULER_TICK_HEIGHT,
  YEAR_RULER_MIN_LABEL_SPACING,
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
  calculateLODLevel,
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

// 日本語フォント（和暦表示用）- MVP では無効化（クラッシュ原因調査中）
// TODO: Sprint 4 で日本語フォント対応を再検討
// const NOTO_SANS_JP_FONT = require('../../assets/fonts/NotoSansJP-Medium.ttf');

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
  /** 時代タップ時のコールバック（選択/ジャンプ用） */
  onEraPress?: (eraId: string) => void;
  /** 時代長押し時のコールバック（詳細表示用） */
  onEraLongPress?: (eraId: string) => void;
}

/** 長押し判定の閾値（ms）- 038-ext仕様に準拠 */
const LONG_PRESS_DELAY = 500;

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

/** 時代名の短縮マッピング（長い時代名用） */
const ERA_SHORT_NAMES: Record<string, string> = {
  安土桃山: '安土',
};

/** 時代名を取得（幅に応じて短縮名を使用） */
function getEraDisplayName(eraName: string, availableWidth: number, font: ReturnType<typeof useFont>): string {
  if (!font) return eraName;

  const fullWidth = font.measureText(eraName).width;
  if (fullWidth <= availableWidth) {
    return eraName;
  }

  // 短縮名があれば使用
  const shortName = ERA_SHORT_NAMES[eraName];
  if (shortName) {
    return shortName;
  }

  return eraName;
}

function getEventColor(tags: EventTag[]): string {
  if (tags.length === 0) return TAG_COLORS.default;
  return TAG_COLORS[tags[0]] ?? TAG_COLORS.default;
}

/**
 * Era ラベル表示判定（036 Year Ruler & Era Labels）
 *
 * LOD レベルに応じた表示ルール:
 * - L0-L1: 画面中央の年を含む時代のみ表示
 * - L2-L3: 幅60px以上の時代のみ表示
 */
function shouldShowEraLabel(
  era: Era,
  lodLevel: LODLevel,
  config: CoordinateConfig,
  eraWidthPx: number
): boolean {
  // L0-L1: 画面中央の年を含む時代のみ
  if (lodLevel <= 1) {
    const centerPixelX = config.screenWidth / 2;
    const centerYear = pixelToYear(centerPixelX, config);
    return era.startYear <= centerYear && centerYear < era.endYear;
  }

  // L2-L3: 幅60px以上の時代のみ
  return eraWidthPx >= 60;
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
  onEraLongPress,
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
  const selectedEraId = useTimelineStore((s) => s.selectedEraId);

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
  // 日本語フォント - MVP では無効化（Roboto で代用）
  // TODO: Sprint 4 で日本語フォント対応
  const jpFont = font;

  // ジェスチャーが最後に設定したscrollX値を追跡
  const lastGestureScrollXRef = useRef<number | null>(null);
  // 外部更新（EraPickerBar等）からの変更かどうかを追跡（無限ループ防止）
  const isExternalUpdateRef = useRef(false);
  // ピンチ中フラグ（ピンチ中は時代境界ハプティクスを無効化）
  const isPinchingRef = useRef(false);

  // Sync store with shared values（外部からの変更のみ）
  useEffect(() => {
    // ジェスチャーによる変更の場合はスキップ（競合を防ぐ）
    // EraPickerBarからのジャンプなど、外部からの変更のみ同期
    if (lastGestureScrollXRef.current !== null &&
        Math.abs(scrollX - lastGestureScrollXRef.current) < 1) {
      // ジェスチャーが設定した値とほぼ同じなのでスキップ
      return;
    }
    // 外部からの変更（EraPickerBarなど）→ translateXを更新
    // フラグを立てて handleGestureScroll での setScroll をスキップさせる
    isExternalUpdateRef.current = true;
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
  const rulerY = screenHeight * YEAR_RULER_Y_RATIO;

  // 現在の時代を計算（画面中央の年を含む時代）
  // 重複時代（例: 室町 1336-1573 & 戦国 1467-1590）の場合、
  // 最も短い時代（より具体的な時代）を優先
  // EraPickerBar の currentEraId と同一ロジック
  const focusedEraId = useMemo(() => {
    const centerPixelX = screenWidth / 2;
    const centerYear = pixelToYear(centerPixelX, config);

    // この年を含む全ての時代を検索
    const matchingEras = eras.filter(
      (e) => centerYear >= e.startYear && centerYear < e.endYear
    );

    if (matchingEras.length === 0) {
      return null;
    }

    // 期間でソート（短い順）して最も具体的な時代を選択
    matchingEras.sort(
      (a, b) => (a.endYear - a.startYear) - (b.endYear - b.startYear)
    );

    return matchingEras[0].id;
  }, [eras, config, screenWidth]);

  // ハイライト対象の時代ID（選択優先、なければ現在フォーカス中の時代）
  const highlightedEraId = selectedEraId ?? focusedEraId;

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  const handleEventPress = useCallback(
    (eventId: string) => {
      try {
        console.log('[TimelineCanvas] Event pressed:', eventId);
        if (onEventPress) {
          onEventPress(eventId);
        } else {
          router.push(`/event/${eventId}`);
        }
      } catch (error) {
        console.error('[TimelineCanvas] Event press error:', error);
      }
    },
    [onEventPress, router]
  );

  const handleEraPress = useCallback(
    (eraId: string) => {
      try {
        console.log('[TimelineCanvas] Era pressed:', eraId);
        void triggerHaptic('selection');
        if (onEraPress) {
          onEraPress(eraId);
        }
        // タップではデフォルトで詳細画面に遷移しない（038-ext仕様）
        // 長押しで詳細に遷移する
      } catch (error) {
        console.error('[TimelineCanvas] Era press error:', error);
      }
    },
    [onEraPress]
  );

  // 時代長押し → 詳細画面へ遷移
  const handleEraLongPress = useCallback(
    (eraId: string) => {
      try {
        console.log('[TimelineCanvas] Era long pressed:', eraId);
        void triggerHaptic('medium');
        if (onEraLongPress) {
          onEraLongPress(eraId);
        } else {
          router.push(`/era/${eraId}`);
        }
      } catch (error) {
        console.error('[TimelineCanvas] Era long press error:', error);
      }
    },
    [onEraLongPress, router]
  );

  const handleTap = useCallback(
    (x: number, y: number, currentScale: number, currentTranslateX: number) => {
      // 早期リターンでクラッシュを防止
      if (typeof x !== 'number' || typeof y !== 'number') {
        console.warn('[TimelineCanvas] Invalid tap coordinates');
        return;
      }
      if (!events || !eras || events.length === 0 || eras.length === 0) {
        console.warn('[TimelineCanvas] Data not ready for tap');
        return;
      }

      try {
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
      } catch (error) {
        console.error('[TimelineCanvas] Tap error:', error);
      }
    },
    [screenWidth, screenHeight, events, eras, handleEventPress, handleEraPress]
  );

  // ==========================================================================
  // Gestures
  // ==========================================================================

  // パンジェスチャー開始時のスクロール位置を保持
  const panStartScrollX = useSharedValue(0);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          'worklet';
          // パン開始時のスクロール位置を記録
          panStartScrollX.value = translateX.value;
        })
        .onUpdate((e) => {
          'worklet';
          // 開始位置からの移動量を計算（累積問題を回避）
          const newScrollX = panStartScrollX.value + e.translationX;
          // clampScrollX をインライン化（worklet から外部関数を呼べないため）
          // minScrollX = screenWidth * (1 - zoomLevel)
          const minScrollX = screenWidth * (1 - scale.value);
          const clamped = Math.max(minScrollX, Math.min(0, newScrollX));
          translateX.value = clamped;
        })
        .onEnd((e) => {
          'worklet';
          // 慣性スクロール（SCROLL_DECAY = 0.95 をインライン化）
          const minScrollX = screenWidth * (1 - scale.value);
          translateX.value = withDecay({
            velocity: e.velocityX,
            deceleration: 0.95,
            clamp: [minScrollX, 0],
          });
        }),
    [screenWidth, translateX, scale, panStartScrollX]
  );

  // ピンチズーム中のズーム＆LOD更新（リアルタイム）
  const prevLODRef = useRef<LODLevel>(calculateLODLevel(zoomLevel));

  const handlePinchUpdate = useCallback(
    (newZoom: number, newScrollX: number) => {
      setZoom(newZoom);
      setScroll(newScrollX);
      // ジェスチャーが設定した値を記録（useEffectで競合を防ぐ）
      lastGestureScrollXRef.current = newScrollX;
      // LODレベルが変わった場合のみ更新（パフォーマンス最適化）
      const newLOD = calculateLODLevel(newZoom);
      if (newLOD !== prevLODRef.current) {
        prevLODRef.current = newLOD;
        setLOD(newLOD);
      }
    },
    [setZoom, setScroll, setLOD]
  );

  // ピンチ開始時のスクロール位置とフォーカルポイントを保持
  const pinchStartScrollX = useSharedValue(0);
  const pinchFocalX = useSharedValue(0);

  // ピンチ状態を更新するヘルパー関数（worklet から runOnJS で呼び出し）
  const setPinching = useCallback((value: boolean) => {
    isPinchingRef.current = value;
  }, []);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin((e) => {
          'worklet';
          // ピンチ中フラグをON（時代境界ハプティクスを無効化）
          runOnJS(setPinching)(true);
          // ピンチ開始時の状態を記録
          pinchStartZoom.value = scale.value;
          pinchStartScrollX.value = translateX.value;
          // フォーカルポイント（ピンチの中心点）を記録
          pinchFocalX.value = e.focalX;
        })
        .onUpdate((e) => {
          'worklet';
          // 開始時のズームレベルを基準に計算（累積を防ぐ）
          // MIN_ZOOM_LEVEL = 1, MAX_ZOOM_LEVEL = 100 をインライン化
          const newZoom = Math.max(1, Math.min(100, pinchStartZoom.value * e.scale));
          scale.value = newZoom;

          // フォーカルポイントを維持するスクロール調整
          // ピンチした位置が同じ年を指し続けるように
          const zoomRatio = newZoom / pinchStartZoom.value;
          const newScrollX = (pinchStartScrollX.value - pinchFocalX.value) * zoomRatio + pinchFocalX.value;
          // スクロール範囲をクランプ
          const minScrollX = screenWidth * (1 - newZoom);
          const clampedScrollX = Math.max(minScrollX, Math.min(0, newScrollX));
          translateX.value = clampedScrollX;

          // リアルタイムでストアとLODを更新
          runOnJS(handlePinchUpdate)(newZoom, clampedScrollX);
        })
        .onEnd(() => {
          'worklet';
          // ピンチ中フラグをOFF
          runOnJS(setPinching)(false);
          // 最終値を確定
          runOnJS(handlePinchUpdate)(scale.value, translateX.value);
        }),
    [scale, pinchStartZoom, pinchStartScrollX, pinchFocalX, translateX, screenWidth, handlePinchUpdate, setPinching]
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        'worklet';
        // デバッグ: 引数を直接コピーして渡す
        const x = e.x;
        const y = e.y;
        const currentScale = scale.value;
        const currentTranslateX = translateX.value;
        runOnJS(handleTap)(x, y, currentScale, currentTranslateX);
      }),
    [handleTap, scale, translateX]
  );

  // 長押しでヒットテストして時代詳細画面へ遷移
  const handleLongPress = useCallback(
    (x: number, y: number, currentScale: number, currentTranslateX: number) => {
      if (typeof x !== 'number' || typeof y !== 'number') {
        return;
      }
      if (!eras || eras.length === 0) {
        return;
      }

      try {
        const lpConfig: CoordinateConfig = {
          screenWidth,
          screenHeight,
          zoomLevel: currentScale,
          scrollX: currentTranslateX,
        };

        const result = hitTest(x, y, {
          ...lpConfig,
          events: [],  // 長押しでは時代のみ検出
          eras,
        });

        if (result.type === 'era' && result.id) {
          handleEraLongPress(result.id);
        }
      } catch (error) {
        console.error('[TimelineCanvas] Long press error:', error);
      }
    },
    [screenWidth, screenHeight, eras, handleEraLongPress]
  );

  const longPressGesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(LONG_PRESS_DELAY)
        .onEnd((e) => {
          'worklet';
          const x = e.x;
          const y = e.y;
          const currentScale = scale.value;
          const currentTranslateX = translateX.value;
          runOnJS(handleLongPress)(x, y, currentScale, currentTranslateX);
        }),
    [handleLongPress, scale, translateX]
  );

  // ダブルタップズーム（x2）
  const handleDoubleTapZoom = useCallback(
    (tapX: number, currentZoom: number, currentScrollX: number) => {
      // 新しいズームレベル計算（最大値で制限、または最小に戻す）
      // MIN_ZOOM_LEVEL = 1, MAX_ZOOM_LEVEL = 100
      const newZoom = currentZoom >= 100
        ? 1
        : Math.min(100, currentZoom * DOUBLE_TAP_ZOOM_FACTOR);

      // タップ位置を基準にスクロール調整（focal point zoom）
      // タップした位置が同じ年を指すようにスクロールを調整
      const zoomRatio = newZoom / currentZoom;
      const newScrollX = (currentScrollX - tapX) * zoomRatio + tapX;
      // clampScrollX をインライン化（外部関数呼び出しを避ける）
      // minScrollX = screenWidth * (1 - zoomLevel), maxScrollX = 0
      const minScrollX = screenWidth * (1 - newZoom);
      const clampedScrollX = Math.max(minScrollX, Math.min(0, newScrollX));

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
          const tapX = e.x;
          const currentZoom = scale.value;
          const currentScrollX = translateX.value;
          runOnJS(handleDoubleTapZoom)(tapX, currentZoom, currentScrollX);
        }),
    [handleDoubleTapZoom, scale, translateX]
  );

  // Gesture.Exclusive: ダブルタップが失敗（タイムアウト）してから単タップを発火
  // これによりダブルタップが確実に検出される
  const tapGestures = useMemo(
    () => Gesture.Exclusive(doubleTapGesture, tapGesture),
    [doubleTapGesture, tapGesture]
  );

  // 長押しとタップを排他的に（長押しが成功したらタップは発火しない）
  const tapAndLongPressGestures = useMemo(
    () => Gesture.Exclusive(longPressGesture, tapGestures),
    [longPressGesture, tapGestures]
  );

  const composedGesture = useMemo(
    () => Gesture.Race(
      tapAndLongPressGestures,
      Gesture.Simultaneous(panGesture, pinchGesture)
    ),
    [tapAndLongPressGestures, panGesture, pinchGesture]
  );

  // ==========================================================================
  // Scroll sync and boundary detection
  // ==========================================================================

  // ジェスチャーからのスクロール更新をストアに反映
  const handleGestureScroll = useCallback(
    (curr: number, prev: number) => {
      // 外部更新（EraPickerBar等）の場合は setScroll をスキップ（無限ループ防止）
      if (isExternalUpdateRef.current) {
        isExternalUpdateRef.current = false;
        prevScrollXRef.current = curr;
        return;
      }

      // ピンチ中でなければ時代境界通過を検出してハプティクスを発火
      // ピンチ中は意図的なズーム操作なので、境界ハプティクスは不要
      if (!isPinchingRef.current) {
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
      }

      prevScrollXRef.current = curr;
      // ジェスチャーが設定した値を記録（useEffectで競合を防ぐ）
      lastGestureScrollXRef.current = curr;
      setScroll(curr);
    },
    [eras, screenWidth, scale, setScroll]
  );

  useAnimatedReaction(
    () => translateX.value,
    (current, previous) => {
      'worklet';
      if (previous !== null && previous !== current) {
        // 時代境界通過検出とストア更新（JS側で実行）
        runOnJS(handleGestureScroll)(current, previous);
      }
    },
    [handleGestureScroll]
  );

  // ==========================================================================
  // Render Helpers
  // ==========================================================================

  // 可視範囲内の時代を計算
  const visibleEras = useMemo(() => {
    return eras.filter((era) => isYearRangeVisible(era.startYear, era.endYear, config));
  }, [eras, config]);

  // 年代ルーラーの目盛り計算（036 Year Ruler）
  const yearMarks = useMemo(() => {
    const interval = YEAR_RULER_INTERVALS[lodLevel];
    const { startYear: visibleStartYear, endYear: visibleEndYear } = getVisibleYearRange(config);
    const marks: number[] = [];
    // 最初の目盛りを interval の倍数に揃える
    const alignedStart = Math.ceil(visibleStartYear / interval) * interval;
    for (let year = alignedStart; year <= visibleEndYear; year += interval) {
      marks.push(year);
    }
    return marks;
  }, [lodLevel, config]);

  // L3 和暦ラベルキャッシュ - MVP では無効化（西暦のみ表示）
  // TODO: Sprint 4 で日本語フォント対応後に有効化
  const warekiLabels = useMemo(() => new Map<number, string>(), []);

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

            {/* 年代ルーラー（036 Year Ruler） */}
            <Group>
              {yearMarks.map((year, index) => {
                const x = yearToPixel(year, config);
                // L3 で和暦表示（645年以降のみ）、それ以外は西暦
                // 日本語フォントが未読み込みの場合は西暦にフォールバック
                const warekiLabel = (lodLevel === 3 && jpFont) ? warekiLabels.get(year) : undefined;
                const label = warekiLabel ?? formatYearShort(year);
                // 和暦は日本語フォント、西暦は英語フォントを使用（フォールバック付き）
                const labelFont = warekiLabel ? jpFont : font;
                const textWidth = labelFont?.measureText(label).width ?? 0;

                // ラベル重複防止：前の目盛りとの間隔をチェック
                // L3 和暦は文字幅が大きいため間隔を広めに
                const minSpacing = warekiLabel ? YEAR_RULER_MIN_LABEL_SPACING * 1.5 : YEAR_RULER_MIN_LABEL_SPACING;
                const prevX = index > 0 ? yearToPixel(yearMarks[index - 1], config) : -Infinity;
                const shouldShowLabel = (x - prevX) >= minSpacing;

                return (
                  <Group key={`ruler-${year}`}>
                    {/* 目盛り線 */}
                    <Line
                      p1={vec(x, rulerY)}
                      p2={vec(x, rulerY + YEAR_RULER_TICK_HEIGHT)}
                      color={colors.primary}
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    {/* 年ラベル（間隔が十分な場合のみ表示、L3は和暦） */}
                    {labelFont && shouldShowLabel && (
                      <Text
                        x={x - textWidth / 2}
                        y={rulerY + YEAR_RULER_TICK_HEIGHT + 14}
                        text={label}
                        font={labelFont}
                        color={colors.text}
                        opacity={0.8}
                      />
                    )}
                  </Group>
                );
              })}
            </Group>

            {/* 時代背景帯 */}
            <Group>
              {visibleEras.map((era) => {
                const startX = yearToPixel(era.startYear, config);
                const endX = yearToPixel(era.endYear, config);
                const width = endX - startX;
                const isHighlighted = era.id === highlightedEraId;
                const eraColor = getEraColor(era.id, era.color);

                if (width < 1) return null;

                return (
                  <Group key={`era-${era.id}`}>
                    {/* 背景帯（ハイライト時はopacity強調） */}
                    <Rect
                      x={startX}
                      y={bandTop}
                      width={width}
                      height={bandHeight}
                      color={eraColor}
                      opacity={isHighlighted ? 0.7 : 0.4}
                    />
                    {/* ハイライト時の強調枠線 */}
                    {isHighlighted && (
                      <Rect
                        x={startX}
                        y={bandTop}
                        width={width}
                        height={bandHeight}
                        color={eraColor}
                        style="stroke"
                        strokeWidth={3}
                      />
                    )}
                    {/* 境界線 */}
                    <Line
                      p1={vec(startX, bandTop)}
                      p2={vec(startX, bandBottom)}
                      color={eraColor}
                      strokeWidth={1}
                      opacity={0.7}
                    />
                    {/* ラベル（LOD対応: L0-L1は中央の時代のみ、L2-L3は幅60px以上のみ） */}
                    {/* 長い時代名は短縮表示（安土桃山→安土）、日本語フォント使用 */}
                    {jpFont && shouldShowEraLabel(era, lodLevel, config, width) && (() => {
                      const displayName = getEraDisplayName(era.name, width, jpFont);
                      const textWidth = jpFont.measureText(displayName).width;
                      const labelX = startX + (width - textWidth) / 2;
                      return (
                        <Text
                          x={labelX}
                          y={labelY}
                          text={displayName}
                          font={jpFont}
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
                    {/* L3: イベントラベル表示（日本語フォント使用） */}
                    {showLabels && jpFont && (
                      <Text
                        x={x - jpFont.measureText(event.title).width / 2}
                        y={axisY - radius - 8}
                        text={event.title}
                        font={jpFont}
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
