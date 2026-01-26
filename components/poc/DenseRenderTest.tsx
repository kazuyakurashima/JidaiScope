/**
 * DenseRenderTest.tsx - Sprint 0 Day 3 PoC
 *
 * 検証項目:
 * 1. 約700イベント表示で60fps維持（通常350件 + 密集350件）
 * 2. 50events/10yr 密度での描画パフォーマンス（1850-1920 期間）
 * 3. メモリ使用量 < 150MB
 * 4. ビューポートカリング（画面外イベント非描画）
 *
 * 密集描画検証:
 * - 受け入れ条件 #4: 50events/10yr
 * - 検証期間: 1850-1920（明治維新前後）
 * - 各10年間で50件のイベントを保証
 *
 * LOD レベル:
 * - L0 (x1-x2): 時代帯のみ
 * - L1 (x2-x10): + major イベント（大マーカー）
 * - L2 (x10-x50): + medium イベント + 時代ラベル
 * - L3 (x50-x100): + minor イベント + 年マーカー
 */

import { Canvas, Rect, Circle, Group, Text, useFont, Line, vec } from '@shopify/react-native-skia';
import { View, StyleSheet, Dimensions, Text as RNText } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  useAnimatedReaction,
  useFrameCallback,
} from 'react-native-reanimated';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { Transforms3d } from '@shopify/react-native-skia';
import { MOCK_EVENTS, ERAS, EVENT_STATS, DENSE_STATS, yearToX, type HistoricalEvent } from '../../data/mockEvents';

// フォント
const ROBOTO_FONT = require('../../assets/fonts/Roboto-Medium.ttf');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ズーム制限
const MIN_ZOOM = 1;
const MAX_ZOOM = 100;

// フレームドロップ閾値 (16.67ms * 1.5 = 25ms 以上でドロップ判定)
const FRAME_DROP_THRESHOLD_MS = 25;

// タイムライン設定
const TIMELINE_START_YEAR = -300;  // 紀元前300年（弥生時代以降）
const TIMELINE_END_YEAR = 2030;

// LOD 閾値
const LOD_THRESHOLDS = {
  L0_L1: 2,   // x2 で L1 に遷移
  L1_L2: 10,  // x10 で L2 に遷移
  L2_L3: 50,  // x50 で L3 に遷移
};

// マーカーサイズ（重要度別）
const MARKER_SIZES = {
  major: 10,
  medium: 6,
  minor: 4,
};

// マーカーカラー（カテゴリ別）
const CATEGORY_COLORS = {
  political: '#FF6B6B',
  cultural: '#4ECDC4',
  military: '#FFE66D',
  economic: '#95E1D3',
  social: '#DDA0DD',
};

interface DenseRenderTestProps {
  width?: number;
  height?: number;
}

type LODLevel = 0 | 1 | 2 | 3;

export function DenseRenderTest({
  width = SCREEN_WIDTH,
  height = 400
}: DenseRenderTestProps) {
  const font = useFont(ROBOTO_FONT, 10);
  const labelFont = useFont(ROBOTO_FONT, 12);

  // ズーム・パン状態
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedFocalX = useSharedValue(0);

  // フレームドロップ計測
  const frameDrops = useSharedValue(0);
  const totalFrames = useSharedValue(0);

  // UI 状態
  const [currentZoom, setCurrentZoom] = useState(1);
  const [currentLOD, setCurrentLOD] = useState<LODLevel>(0);
  const [frameStats, setFrameStats] = useState({ drops: 0, total: 0, rate: '0.0' });
  const [visibleEventCount, setVisibleEventCount] = useState(0);
  const [renderStats, setRenderStats] = useState({ rendered: 0, culled: 0 });

  // 現在の LOD レベルを ref で追跡（worklet 内での比較用）
  const currentLODRef = useRef<LODLevel>(0);

  // タイムラインの基本幅（ズーム x1 時）
  const baseTimelineWidth = width * 5;

  // フレームドロップ計測
  useFrameCallback((frameInfo) => {
    'worklet';
    const delta = frameInfo.timeSincePreviousFrame;
    if (delta !== null && delta > 0 && delta < 1000) {
      totalFrames.value++;
      if (delta > FRAME_DROP_THRESHOLD_MS) {
        frameDrops.value++;
      }
    }
  }, true);

  // ズームレベルに応じた LOD 判定
  const getLODLevel = useCallback((zoom: number): LODLevel => {
    if (zoom >= LOD_THRESHOLDS.L2_L3) return 3;
    if (zoom >= LOD_THRESHOLDS.L1_L2) return 2;
    if (zoom >= LOD_THRESHOLDS.L0_L1) return 1;
    return 0;
  }, []);

  // ズーム更新時の LOD チェック
  useAnimatedReaction(
    () => scale.value,
    (currentScale) => {
      'worklet';
      const roundedZoom = Math.round(currentScale * 10) / 10;
      const newLOD = getLODLevel(currentScale);
      runOnJS(setCurrentZoom)(roundedZoom);
      if (newLOD !== currentLODRef.current) {
        runOnJS(setCurrentLOD)(newLOD);
        currentLODRef.current = newLOD;
      }
    }
  );

  // パン操作中の translateX を React state に同期（カリング更新用）
  const [currentTranslateX, setCurrentTranslateX] = useState(0);

  // translateX の変化を React state に同期（スロットリング: 10px 単位）
  useAnimatedReaction(
    () => Math.round(translateX.value / 10) * 10,
    (current, previous) => {
      'worklet';
      if (current !== previous && previous !== null) {
        runOnJS(setCurrentTranslateX)(current);
      }
    }
  );

  // フレーム統計更新（1秒毎）- useEffect でクリーンアップ保証
  useEffect(() => {
    const interval = setInterval(() => {
      const drops = frameDrops.value;
      const total = totalFrames.value;
      const rate = total > 0 ? ((drops / total) * 100).toFixed(1) : '0.0';
      setFrameStats({ drops, total, rate });
    }, 1000);

    return () => clearInterval(interval);
    // Note: frameDrops, totalFrames are stable SharedValue refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ビューポート内のイベントをフィルタリング（純粋計算）
  const getVisibleEvents = useCallback(
    (zoom: number, offsetX: number, lod: LODLevel): HistoricalEvent[] => {
      // ビューポートの年範囲を計算
      const timelineWidth = baseTimelineWidth * zoom;
      const viewportStartX = -offsetX;
      const viewportEndX = viewportStartX + width;

      // X座標から年を逆算
      const totalYears = TIMELINE_END_YEAR - TIMELINE_START_YEAR;
      const startYear = TIMELINE_START_YEAR + (viewportStartX / timelineWidth) * totalYears;
      const endYear = TIMELINE_START_YEAR + (viewportEndX / timelineWidth) * totalYears;

      // マージンを追加（画面端のイベントも描画）
      const margin = 50 / zoom;
      const rangeStart = startYear - margin;
      const rangeEnd = endYear + margin;

      // LOD に応じてフィルタリング
      let filtered = MOCK_EVENTS.filter(e => e.year >= rangeStart && e.year <= rangeEnd);

      // LOD によるイベント表示制限
      if (lod === 0) {
        filtered = []; // L0: イベント非表示
      } else if (lod === 1) {
        filtered = filtered.filter(e => e.importance === 'major');
      } else if (lod === 2) {
        filtered = filtered.filter(e => e.importance === 'major' || e.importance === 'medium');
      }
      // L3: 全イベント表示

      return filtered;
    },
    [baseTimelineWidth, width]
  );

  // 現在のビューポート設定でイベントを取得（純粋計算、setState なし）
  const visibleEvents = useMemo(() => {
    return getVisibleEvents(currentZoom, currentTranslateX, currentLOD);
  }, [currentZoom, currentLOD, getVisibleEvents, currentTranslateX]);

  // 統計更新（副作用を useEffect に分離）
  useEffect(() => {
    const rendered = visibleEvents.length;
    const culled = MOCK_EVENTS.length - rendered;
    setRenderStats({ rendered, culled });
    setVisibleEventCount(rendered);
  }, [visibleEvents]);

  // ピンチジェスチャー
  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      'worklet';
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedFocalX.value = event.focalX;
    })
    .onUpdate((event) => {
      'worklet';
      const newScale = Math.min(Math.max(savedScale.value * event.scale, MIN_ZOOM), MAX_ZOOM);
      const scaleDiff = newScale / savedScale.value;
      const focalPoint = savedFocalX.value;
      translateX.value = savedTranslateX.value - (focalPoint - savedTranslateX.value) * (scaleDiff - 1);
      scale.value = newScale;
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
    });

  // パンジェスチャー
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = savedTranslateX.value + event.translationX;
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Skia 変換行列
  const transform = useDerivedValue<Transforms3d>(() => [
    { translateX: translateX.value },
    { scale: scale.value },
  ]);

  // タイムライン幅（ズーム適用前）
  const timelineWidth = baseTimelineWidth;

  // 時代帯の描画
  const renderEraBands = () => {
    // 表示範囲内の時代のみ描画
    const relevantEras = ERAS.filter(era => era.endYear >= TIMELINE_START_YEAR && era.startYear <= TIMELINE_END_YEAR);

    return relevantEras.map((era, index) => {
      const startX = yearToX(Math.max(era.startYear, TIMELINE_START_YEAR), timelineWidth, TIMELINE_START_YEAR, TIMELINE_END_YEAR);
      const endX = yearToX(Math.min(era.endYear, TIMELINE_END_YEAR), timelineWidth, TIMELINE_START_YEAR, TIMELINE_END_YEAR);
      const eraWidth = endX - startX;

      return (
        <Rect
          key={`era-${era.id}`}
          x={startX}
          y={0}
          width={eraWidth}
          height={height}
          color={era.color}
          opacity={0.4}
        />
      );
    });
  };

  // 時代ラベルの描画（L2以上）
  const renderEraLabels = () => {
    if (currentLOD < 2 || !labelFont) return null;

    const relevantEras = ERAS.filter(era => era.endYear >= TIMELINE_START_YEAR && era.startYear <= TIMELINE_END_YEAR);

    return relevantEras.map((era) => {
      const startX = yearToX(Math.max(era.startYear, TIMELINE_START_YEAR), timelineWidth, TIMELINE_START_YEAR, TIMELINE_END_YEAR);
      const endX = yearToX(Math.min(era.endYear, TIMELINE_END_YEAR), timelineWidth, TIMELINE_START_YEAR, TIMELINE_END_YEAR);
      const centerX = (startX + endX) / 2;

      return (
        <Text
          key={`era-label-${era.id}`}
          x={centerX - 20}
          y={height - 10}
          text={era.name}
          font={labelFont}
          color="#F7FAFC"
        />
      );
    });
  };

  // イベントマーカーの描画
  const renderEventMarkers = () => {
    return visibleEvents.map((event) => {
      const x = yearToX(event.year, timelineWidth, TIMELINE_START_YEAR, TIMELINE_END_YEAR);
      const y = height / 2 + (event.category === 'political' ? -30 :
                              event.category === 'military' ? -15 :
                              event.category === 'cultural' ? 0 :
                              event.category === 'economic' ? 15 : 30);
      const radius = MARKER_SIZES[event.importance];
      const color = CATEGORY_COLORS[event.category];

      return (
        <Circle
          key={event.id}
          cx={x}
          cy={y}
          r={radius}
          color={color}
        />
      );
    });
  };

  // 年マーカーの描画（L3のみ）
  const renderYearMarkers = () => {
    if (currentLOD < 3 || !font) return null;

    const markers = [];
    const yearInterval = 100; // 100年ごと

    for (let year = 0; year <= TIMELINE_END_YEAR; year += yearInterval) {
      if (year < TIMELINE_START_YEAR) continue;
      const x = yearToX(year, timelineWidth, TIMELINE_START_YEAR, TIMELINE_END_YEAR);

      markers.push(
        <Line
          key={`year-line-${year}`}
          p1={vec(x, height - 30)}
          p2={vec(x, height - 20)}
          color="#718096"
          strokeWidth={1}
        />
      );

      markers.push(
        <Text
          key={`year-text-${year}`}
          x={x - 15}
          y={height - 35}
          text={`${year}`}
          font={font}
          color="#718096"
        />
      );
    }

    return markers;
  };

  // タイムライン軸
  const renderTimelineAxis = () => (
    <Rect
      x={0}
      y={height / 2 - 1}
      width={timelineWidth}
      height={2}
      color="#4FD1C5"
    />
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* 情報バー */}
      <View style={styles.infoBar}>
        <RNText style={styles.infoText}>
          Zoom: x{currentZoom.toFixed(1)}
        </RNText>
        <RNText style={[styles.infoText, styles.lodBadge]}>
          LOD: L{currentLOD}
        </RNText>
        <RNText style={styles.infoText}>
          Drops: {frameStats.drops} ({frameStats.rate}%)
        </RNText>
      </View>

      {/* 統計バー */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>Total</RNText>
          <RNText style={styles.statValue}>{EVENT_STATS.total}</RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>Rendered</RNText>
          <RNText style={[styles.statValue, styles.highlightValue]}>{renderStats.rendered}</RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>Culled</RNText>
          <RNText style={styles.statValue}>{renderStats.culled}</RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>50/10yr</RNText>
          <RNText style={[styles.statValue, DENSE_STATS.valid ? styles.passValue : styles.failValue]}>
            {DENSE_STATS.valid ? 'PASS' : 'FAIL'}
          </RNText>
        </View>
      </View>

      {/* Canvas */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.canvasContainer}>
          <Canvas style={{ width, height }}>
            <Group transform={transform}>
              {/* 背景 */}
              <Rect x={0} y={0} width={timelineWidth} height={height} color="#0A0E14" />

              {/* 時代帯 */}
              {renderEraBands()}

              {/* タイムライン軸 */}
              {renderTimelineAxis()}

              {/* イベントマーカー */}
              {renderEventMarkers()}

              {/* 年マーカー（L3） */}
              {renderYearMarkers()}

              {/* 時代ラベル（L2+） */}
              {renderEraLabels()}
            </Group>
          </Canvas>
        </View>
      </GestureDetector>

      {/* LOD ガイド */}
      <View style={styles.lodGuide}>
        <RNText style={styles.lodGuideText}>
          L0 (x1-2): Era only | L1 (x2-10): +Major | L2 (x10-50): +Medium | L3 (x50+): +Minor
        </RNText>
      </View>

      {/* 操作ガイド */}
      <View style={styles.guideBar}>
        <RNText style={styles.guideText}>
          Pinch: Zoom | Drag: Scroll | {visibleEventCount} events visible
        </RNText>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1A1F2E',
  },
  infoText: {
    color: '#F7FAFC',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  lodBadge: {
    backgroundColor: '#4FD1C5',
    color: '#0A0E14',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#1A1F2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#718096',
    fontSize: 10,
  },
  statValue: {
    color: '#F7FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  highlightValue: {
    color: '#4FD1C5',
  },
  passValue: {
    color: '#4FD1C5',
  },
  failValue: {
    color: '#FF6B6B',
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  lodGuide: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#1A1F2E',
  },
  lodGuideText: {
    color: '#718096',
    fontSize: 10,
    textAlign: 'center',
  },
  guideBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1F2E',
    alignItems: 'center',
  },
  guideText: {
    color: '#718096',
    fontSize: 12,
  },
});

export default DenseRenderTest;
