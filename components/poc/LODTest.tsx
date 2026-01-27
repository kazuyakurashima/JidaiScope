/**
 * LODTest.tsx - Sprint 0 Day 2 PoC
 *
 * 検証項目:
 * 1. LOD L0→L1→L2→L3 の段階的切替
 * 2. LOD切替時間 < 100ms（フレーム基準: useFrameCallback で計測）
 * 3. ハプティクス応答 < 50ms
 * 4. 滑らかな遷移（カクツキなし）
 *
 * LOD レベル定義:
 * - L0 (x1-x2): 時代帯のみ、ラベルなし
 * - L1 (x2-x10): 時代帯 + 主要イベント (大きいマーカー)
 * - L2 (x10-x50): + 中規模イベント + 時代ラベル
 * - L3 (x50-x100): + 小イベント + 年マーカー + 詳細ラベル
 *
 * アニメーション仕様:
 * - 遷移方式: フェード + スケール（200ms withTiming）
 * - スケール: 0.95 → 1.0（出現時）、1.0 → 0.95（消失時）
 * - 描画最適化: 遷移中は currentLOD + previousLOD のみ描画
 *
 * 計測仕様:
 * - LOD切替時間: 初回フレーム到達までの時間（アニメ完了時間ではない）
 * - 連続遷移: 同フレーム内で連続変更時、先行遷移は「スキップ」扱い (frameMs = -2)
 */

import { Canvas, Rect, Circle, Group, Text, useFont, Line, vec } from '@shopify/react-native-skia';
import { View, StyleSheet, Dimensions, Text as RNText } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  useAnimatedReaction,
  withTiming,
  useFrameCallback,
} from 'react-native-reanimated';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Transforms3d } from '@shopify/react-native-skia';
import { triggerLODHaptic, type LODLevel } from '../../utils/haptics';

import { ERA_COLOR_ARRAY, getColors } from '@/constants/tokens';

// フォント
const ROBOTO_FONT = require('../../assets/fonts/Roboto-Medium.ttf');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ダークテーマのカラーを取得（PoC はダークモード固定）
const COLORS = getColors('dark');

// ズーム制限
const MIN_ZOOM = 1;
const MAX_ZOOM = 100;

// LOD 閾値
const LOD_THRESHOLDS = {
  L0_L1: 2,   // x2 で L1 に遷移
  L1_L2: 10,  // x10 で L2 に遷移
  L2_L3: 50,  // x50 で L3 に遷移
};

// 時代名（ERA_COLOR_ARRAY に対応）
const ERA_NAMES = ['Jomon', 'Yayoi', 'Kofun', 'Asuka', 'Nara', 'Heian', 'Kamakura', 'Muromachi', 'Sengoku', 'AzuchiMomoyama', 'Edo', 'Meiji', 'Taisho', 'Showa', 'Heisei'];

// LOD 遷移計測結果
// frameMs: -1 = 未計測（pending）、-2 = スキップ（連続遷移で上書き）、>= 0 = 計測完了
const FRAME_MS_PENDING = -1;
const FRAME_MS_SKIPPED = -2;

interface LODTransition {
  id: number;
  fromLevel: LODLevel;
  toLevel: LODLevel;
  stateUpdateMs: number;   // LOD状態更新にかかった時間（setState呼び出し）
  frameMs: number;         // フレーム描画にかかった時間（-1 = 未計測、-2 = スキップ）
  hapticMs: number;        // ハプティクス応答時間（-1 = 未完了/失敗）
  timestamp: number;
}

interface LODTestProps {
  width?: number;
  height?: number;
}

export function LODTest({
  width = SCREEN_WIDTH,
  height = 400
}: LODTestProps) {
  // フォント
  const font = useFont(ROBOTO_FONT, 14);
  const smallFont = useFont(ROBOTO_FONT, 10);
  const fontsLoaded = font !== null && smallFont !== null;

  // ズーム状態
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedFocalX = useSharedValue(0);

  // LOD アニメーション用 opacity (0〜1) + scale (0.95〜1.0)
  const ANIM_DURATION = 200; // ms
  const SCALE_MIN = 0.95;
  const SCALE_MAX = 1.0;

  const l1Opacity = useSharedValue(0);
  const l2Opacity = useSharedValue(0);
  const l3Opacity = useSharedValue(0);

  const l1Scale = useSharedValue(SCALE_MIN);
  const l2Scale = useSharedValue(SCALE_MIN);
  const l3Scale = useSharedValue(SCALE_MIN);

  // LOD 状態
  const currentLODRef = useRef<LODLevel>(0);
  const previousLODRef = useRef<LODLevel>(0);  // 遷移中の前LOD（フェード中の描画用）
  const [currentLOD, setCurrentLOD] = useState<LODLevel>(0);
  const [previousLOD, setPreviousLOD] = useState<LODLevel>(0);  // フェード中は前LODも描画
  const [currentZoom, setCurrentZoom] = useState(1);

  // 計測結果
  const [transitions, setTransitions] = useState<LODTransition[]>([]);
  const transitionIdRef = useRef(0);

  // タイマー競合対策: previousLOD クリア用タイマーID
  const previousLODTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Date.now 依存の統計表示を更新するための now state（500ms 毎に更新）
  const [now, setNow] = useState(Date.now());

  // アンマウント時のクリーンアップ + now 更新用 interval
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => {
      clearInterval(interval);
      // previousLODTimer のクリーンアップ（アンマウント時の setState 防止）
      if (previousLODTimerRef.current !== null) {
        clearTimeout(previousLODTimerRef.current);
        previousLODTimerRef.current = null;
      }
    };
  }, []);

  // フレーム基準の LOD 遷移計測用 SharedValue
  // lodChangeAt: LOD 変更時刻（performance.now()）、0 = 計測待ちなし
  // pendingTransitionId: 計測待ちの遷移ID
  const lodChangeAt = useSharedValue(0);
  const pendingTransitionId = useSharedValue(0);

  // 先行遷移をスキップ扱いにする（連続遷移対策）
  const markTransitionAsSkipped = useCallback((transitionId: number) => {
    setTransitions(prev => {
      const exists = prev.some(t => t.id === transitionId);
      if (!exists) return prev;
      return prev.map(t =>
        t.id === transitionId && t.frameMs === FRAME_MS_PENDING
          ? { ...t, frameMs: FRAME_MS_SKIPPED }
          : t
      );
    });
  }, []);

  // LOD 変更ハンドラー（競合防止: 状態更新を先に確定、ハプティクスは非同期追随）
  const handleLODChange = useCallback((newLOD: LODLevel, zoomLevel: number) => {
    const prevLOD = currentLODRef.current;
    if (prevLOD === newLOD) return;

    const startTime = performance.now();

    // 遷移中の前LODを記録（フェードアウト中も描画するため）
    previousLODRef.current = prevLOD;
    setPreviousLOD(prevLOD);

    // 先に状態を確定（同期的）
    currentLODRef.current = newLOD;
    setCurrentLOD(newLOD);
    setCurrentZoom(zoomLevel);

    // LOD 別 opacity + scale アニメーション（滑らかな遷移）
    l1Opacity.value = withTiming(newLOD >= 1 ? 1 : 0, { duration: ANIM_DURATION });
    l2Opacity.value = withTiming(newLOD >= 2 ? 1 : 0, { duration: ANIM_DURATION });
    l3Opacity.value = withTiming(newLOD >= 3 ? 1 : 0, { duration: ANIM_DURATION });

    l1Scale.value = withTiming(newLOD >= 1 ? SCALE_MAX : SCALE_MIN, { duration: ANIM_DURATION });
    l2Scale.value = withTiming(newLOD >= 2 ? SCALE_MAX : SCALE_MIN, { duration: ANIM_DURATION });
    l3Scale.value = withTiming(newLOD >= 3 ? SCALE_MAX : SCALE_MIN, { duration: ANIM_DURATION });

    // タイマー競合対策: 古いタイマーをキャンセルしてから新しいタイマーを設定
    if (previousLODTimerRef.current !== null) {
      clearTimeout(previousLODTimerRef.current);
    }
    previousLODTimerRef.current = setTimeout(() => {
      previousLODRef.current = newLOD;
      setPreviousLOD(newLOD);
      previousLODTimerRef.current = null;
    }, ANIM_DURATION + 50); // +50ms マージン

    const stateUpdateMs = performance.now() - startTime;

    // 遷移IDを発行（古い遷移の結果を無視するため）
    const transitionId = ++transitionIdRef.current;

    // 初期の遷移記録を追加（frameMs, hapticMsは未完了）
    const transition: LODTransition = {
      id: transitionId,
      fromLevel: prevLOD,
      toLevel: newLOD,
      stateUpdateMs,
      frameMs: FRAME_MS_PENDING, // 未計測
      hapticMs: -1, // 未完了
      timestamp: Date.now(),
    };

    setTransitions(prev => [...prev.slice(-9), transition]);

    // 連続遷移対策: 先行遷移が計測待ちならスキップ扱いにする
    if (pendingTransitionId.value > 0) {
      markTransitionAsSkipped(pendingTransitionId.value);
    }

    // フレーム計測開始（useFrameCallback で最初のフレームを検出）
    lodChangeAt.value = performance.now();
    pendingTransitionId.value = transitionId;

    // ハプティクスを非同期で発火（LOD更新をブロックしない）
    triggerLODHaptic(prevLOD, newLOD).then((hapticMs) => {
      // 該当IDが配列に存在する場合のみ更新（存在チェック方式）
      setTransitions(prev => {
        const exists = prev.some(t => t.id === transitionId);
        if (!exists) return prev;
        return prev.map(t =>
          t.id === transitionId ? { ...t, hapticMs } : t
        );
      });
    });
  // Note: l1Opacity/Scale, l2Opacity/Scale, l3Opacity/Scale, lodChangeAt, pendingTransitionId are stable SharedValue refs
  // markTransitionAsSkipped is stable (useCallback with empty deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markTransitionAsSkipped]);

  // フレーム計測用コールバック: LOD変更後の最初のフレームで frameMs を確定
  const updateFrameMs = useCallback((transitionId: number, frameMs: number) => {
    setTransitions(prev => {
      const exists = prev.some(t => t.id === transitionId);
      if (!exists) return prev;
      return prev.map(t =>
        t.id === transitionId ? { ...t, frameMs } : t
      );
    });
  }, []);

  useFrameCallback(() => {
    'worklet';
    // 計測待ちがなければスキップ
    if (lodChangeAt.value === 0) return;

    // 最初のフレームで frameMs を計測
    const frameMs = performance.now() - lodChangeAt.value;
    const transitionId = pendingTransitionId.value;

    // 計測完了: SharedValue をリセット
    lodChangeAt.value = 0;
    pendingTransitionId.value = 0;

    // JS スレッドに結果を通知
    runOnJS(updateFrameMs)(transitionId, frameMs);
  }, true);

  // ズーム変更時の LOD 計算
  useAnimatedReaction(
    () => scale.value,
    (currentScale, previousScale) => {
      'worklet';
      if (previousScale === null) return;

      const newLOD = (() => {
        if (currentScale >= LOD_THRESHOLDS.L2_L3) return 3;
        if (currentScale >= LOD_THRESHOLDS.L1_L2) return 2;
        if (currentScale >= LOD_THRESHOLDS.L0_L1) return 1;
        return 0;
      })() as LODLevel;

      const prevLOD = (() => {
        if (previousScale >= LOD_THRESHOLDS.L2_L3) return 3;
        if (previousScale >= LOD_THRESHOLDS.L1_L2) return 2;
        if (previousScale >= LOD_THRESHOLDS.L0_L1) return 1;
        return 0;
      })() as LODLevel;

      if (newLOD !== prevLOD) {
        runOnJS(handleLODChange)(newLOD, currentScale);
      }
    }
  );

  // ズーム表示更新（スロットリング）
  useAnimatedReaction(
    () => Math.round(scale.value * 10) / 10,
    (current, previous) => {
      'worklet';
      if (current !== previous && previous !== null) {
        runOnJS(setCurrentZoom)(current);
      }
    }
  );

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
      const newScale = Math.min(
        Math.max(savedScale.value * event.scale, MIN_ZOOM),
        MAX_ZOOM
      );

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

  // ジェスチャー合成
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Skia 変換行列（useDerivedValue で SharedValue を追跡）
  // Note: SharedValue を直接 transform に渡すと Skia が追跡できないため、
  // useDerivedValue で UI スレッド駆動にする
  const transform = useDerivedValue<Transforms3d>(() => [
    { translateX: translateX.value },
    { scale: scale.value },
  ]);

  // LOD 別 opacity + scale を useDerivedValue で追跡（Skia が検知可能に）
  const derivedL1Opacity = useDerivedValue(() => l1Opacity.value);
  const derivedL2Opacity = useDerivedValue(() => l2Opacity.value);
  const derivedL3Opacity = useDerivedValue(() => l3Opacity.value);

  // スケール変換用（原点基準でスケール: Group 全体に適用）
  const derivedL1Transform = useDerivedValue<Transforms3d>(() => [
    { scale: l1Scale.value },
  ]);
  const derivedL2Transform = useDerivedValue<Transforms3d>(() => [
    { scale: l2Scale.value },
  ]);
  const derivedL3Transform = useDerivedValue<Transforms3d>(() => [
    { scale: l3Scale.value },
  ]);

  // タイムラインコンテンツの幅
  const contentWidth = width * 10;

  // 時代帯の描画（L0-L3 全て、ERA_COLOR_ARRAY は tokens.ts から import）
  const renderEraBands = () => {
    const eraWidth = contentWidth / ERA_COLOR_ARRAY.length;
    return ERA_COLOR_ARRAY.map((color, index) => (
      <Rect
        key={`era-${index}`}
        x={index * eraWidth}
        y={0}
        width={eraWidth}
        height={height}
        color={color}
        opacity={0.5}
      />
    ));
  };

  // 主要イベント（L1+ で表示、opacity アニメーション対応）
  const renderMajorEvents = () => {
    const markers = [];
    const eventCount = 7;
    for (let i = 0; i < eventCount; i++) {
      const x = (contentWidth / eventCount) * i + contentWidth / eventCount / 2;
      markers.push(
        <Circle
          key={`major-${i}`}
          cx={x}
          cy={height / 2}
          r={12}
          color={COLORS.text}
          style="fill"
        />
      );
    }
    return markers;
  };

  // 中規模イベント（L2+ で表示、opacity アニメーション対応）
  const renderMediumEvents = () => {
    const markers = [];
    for (let i = 0; i < 21; i++) {
      const x = (contentWidth / 21) * i + 50;
      const y = height / 2 + (i % 2 === 0 ? 40 : -40);
      markers.push(
        <Circle
          key={`medium-${i}`}
          cx={x}
          cy={y}
          r={8}
          color={COLORS.primary}
          style="fill"
        />
      );
    }
    return markers;
  };

  // 小イベント（L3 のみ表示、opacity アニメーション対応）
  const renderSmallEvents = () => {
    const markers = [];
    for (let i = 0; i < 50; i++) {
      const x = (contentWidth / 50) * i + 30;
      const y = height / 2 + Math.sin(i * 0.5) * 60;
      markers.push(
        <Circle
          key={`small-${i}`}
          cx={x}
          cy={y}
          r={4}
          color={COLORS.textTertiary}
          style="fill"
        />
      );
    }
    return markers;
  };

  // 時代ラベル（L2+ で表示、opacity アニメーション対応）
  const renderEraLabels = () => {
    if (!fontsLoaded || !font) return null;

    const eraWidth = contentWidth / ERA_NAMES.length;
    return ERA_NAMES.map((name, index) => (
      <Text
        key={`label-${index}`}
        x={index * eraWidth + eraWidth / 2 - 20}
        y={30}
        text={name}
        font={font}
        color={COLORS.text}
      />
    ));
  };

  // 年マーカー（L3 のみ表示、opacity アニメーション対応）
  const renderYearMarkers = () => {
    const markers = [];
    for (let i = 0; i <= 100; i++) {
      const x = (contentWidth / 100) * i;
      markers.push(
        <Line
          key={`year-${i}`}
          p1={vec(x, height - 25)}
          p2={vec(x, height - 10)}
          color={COLORS.textTertiary}
          strokeWidth={i % 10 === 0 ? 2 : 1}
        />
      );
    }
    return markers;
  };

  // LOD ラベル（L3 のみ詳細ラベル、opacity アニメーション対応）
  const renderDetailLabels = () => {
    if (!fontsLoaded || !smallFont) return null;

    const labels = [];
    for (let i = 0; i <= 10; i++) {
      const x = (contentWidth / 10) * i;
      labels.push(
        <Text
          key={`detail-${i}`}
          x={x + 2}
          y={height - 30}
          text={`${800 + i * 120}AD`}
          font={smallFont}
          color={COLORS.textSecondary}
        />
      );
    }
    return labels;
  };

  // 統計計算（State更新、Frame描画、Hapticsを分離）

  // フレーム計測完了分（frameMs >= 0）
  const completedFrames = transitions.filter(t => t.frameMs >= 0);
  const avgFrameMs = completedFrames.length > 0
    ? (completedFrames.reduce((sum, t) => sum + t.frameMs, 0) / completedFrames.length).toFixed(1)
    : '-';

  // フレーム描画が100ms以下の割合
  const frameUnder100msRate = completedFrames.length > 0
    ? ((completedFrames.filter(t => t.frameMs < 100).length / completedFrames.length) * 100).toFixed(0)
    : '-';

  // ハプティクス統計（成功/失敗を分離）- now state で定期更新
  const completedHaptics = transitions.filter(t => t.hapticMs >= 0);  // 成功分
  const failedHaptics = transitions.filter(t => t.hapticMs === -1 && t.timestamp < now - 1000);  // 1秒以上経過した失敗分

  const avgHapticMs = completedHaptics.length > 0
    ? (completedHaptics.reduce((sum, t) => sum + t.hapticMs, 0) / completedHaptics.length).toFixed(1)
    : '-';

  // ハプティクス成功率（1秒以上経過した遷移のみカウント）
  const resolvedHaptics = completedHaptics.length + failedHaptics.length;
  const hapticSuccessRate = resolvedHaptics > 0
    ? ((completedHaptics.length / resolvedHaptics) * 100).toFixed(0)
    : '-';  // 初期値は '-' 表記

  // ハプティクスが50ms以下の割合（成功分のみ）
  const hapticUnder50msRate = completedHaptics.length > 0
    ? ((completedHaptics.filter(t => t.hapticMs < 50).length / completedHaptics.length) * 100).toFixed(0)
    : '-';

  // 未計測の遷移数（frameMs が PENDING）- now state で定期更新
  // スキップ (FRAME_MS_SKIPPED) は含まない
  const pendingCount = transitions.filter(t =>
    t.frameMs === FRAME_MS_PENDING || (t.hapticMs === -1 && t.timestamp >= now - 1000)
  ).length;

  // スキップされた遷移数（連続遷移で上書きされた）
  const skippedCount = transitions.filter(t => t.frameMs === FRAME_MS_SKIPPED).length;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* LOD 情報表示 */}
      <View style={styles.infoBar}>
        <RNText style={styles.infoText}>
          Zoom: x{currentZoom.toFixed(1)}
        </RNText>
        <RNText style={[styles.infoText, styles.lodBadge]}>
          LOD: L{currentLOD}
        </RNText>
      </View>

      {/* Skia Canvas with Gestures */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.canvasContainer}>
          <Canvas style={{ width, height }}>
            <Group transform={transform}>
              {/* 背景 */}
              <Rect
                x={0}
                y={0}
                width={contentWidth}
                height={height}
                color={COLORS.bg}
              />

              {/* 時代帯 (L0+) */}
              {renderEraBands()}

              {/* タイムライン軸 */}
              <Rect
                x={0}
                y={height / 2 - 1}
                width={contentWidth}
                height={2}
                color={COLORS.primary}
              />

              {/* 主要イベント (L1+) - フェード+スケールアニメーション、条件付き描画 */}
              {(currentLOD >= 1 || previousLOD >= 1) && (
                <Group opacity={derivedL1Opacity} transform={derivedL1Transform}>
                  {renderMajorEvents()}
                </Group>
              )}

              {/* 中規模イベント + 時代ラベル (L2+) - フェード+スケールアニメーション、条件付き描画 */}
              {(currentLOD >= 2 || previousLOD >= 2) && (
                <Group opacity={derivedL2Opacity} transform={derivedL2Transform}>
                  {renderMediumEvents()}
                  {renderEraLabels()}
                </Group>
              )}

              {/* 小イベント + 年マーカー + 詳細ラベル (L3) - フェード+スケールアニメーション、条件付き描画 */}
              {(currentLOD >= 3 || previousLOD >= 3) && (
                <Group opacity={derivedL3Opacity} transform={derivedL3Transform}>
                  {renderSmallEvents()}
                  {renderYearMarkers()}
                  {renderDetailLabels()}
                </Group>
              )}
            </Group>
          </Canvas>
        </View>
      </GestureDetector>

      {/* LOD 閾値ガイド */}
      <View style={styles.lodGuide}>
        <RNText style={[styles.lodLabel, currentLOD === 0 && styles.activeLOD]}>
          L0 (x1-2)
        </RNText>
        <RNText style={[styles.lodLabel, currentLOD === 1 && styles.activeLOD]}>
          L1 (x2-10)
        </RNText>
        <RNText style={[styles.lodLabel, currentLOD === 2 && styles.activeLOD]}>
          L2 (x10-50)
        </RNText>
        <RNText style={[styles.lodLabel, currentLOD === 3 && styles.activeLOD]}>
          L3 (x50+)
        </RNText>
      </View>

      {/* 計測結果表示 */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>遷移</RNText>
          <RNText style={styles.statValue}>
            {transitions.length}回{pendingCount > 0 ? ` (${pendingCount}待)` : ''}{skippedCount > 0 ? ` (${skippedCount}Skip)` : ''}
          </RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>Frame</RNText>
          <RNText style={[styles.statValue, avgFrameMs !== '-' && parseFloat(avgFrameMs) < 100 && styles.passValue]}>
            {avgFrameMs}ms
          </RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>&lt;100ms</RNText>
          <RNText style={[styles.statValue, frameUnder100msRate !== '-' && parseFloat(frameUnder100msRate) >= 95 && styles.passValue]}>
            {frameUnder100msRate}%
          </RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>Haptic</RNText>
          <RNText style={[styles.statValue, avgHapticMs !== '-' && parseFloat(avgHapticMs) < 50 && styles.passValue]}>
            {avgHapticMs}ms
          </RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>&lt;50ms</RNText>
          <RNText style={[styles.statValue, hapticUnder50msRate !== '-' && parseFloat(hapticUnder50msRate) >= 95 && styles.passValue]}>
            {hapticUnder50msRate}%
          </RNText>
        </View>
        <View style={styles.statItem}>
          <RNText style={styles.statLabel}>成功率</RNText>
          <RNText style={[styles.statValue, hapticSuccessRate !== '-' && parseFloat(hapticSuccessRate) >= 90 && styles.passValue]}>
            {hapticSuccessRate}%
          </RNText>
        </View>
      </View>

      {/* 操作ガイド */}
      <View style={styles.guideBar}>
        <RNText style={styles.guideText}>
          Pinch to change LOD level | Target: LOD &lt; 100ms, Haptics &lt; 50ms
        </RNText>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bgSecondary,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  lodBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  lodGuide: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  lodLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  activeLOD: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: COLORS.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  passValue: {
    color: COLORS.success,
  },
  guideBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center',
  },
  guideText: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
});

export default LODTest;
