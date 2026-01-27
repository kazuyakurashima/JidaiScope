/**
 * PinchZoomTest.tsx - Sprint 0 Day 1 PoC
 *
 * 検証項目:
 * 1. ピンチズームで60fps維持 (iPhone 12+)
 * 2. フレームドロップ < 5%
 * 3. ズーム範囲: x1 〜 x100
 * 4. フォーカルポイント追従
 */

import { Canvas, Rect, Circle, Group } from '@shopify/react-native-skia';
import { View, Dimensions, Text as RNText } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useDerivedValue,
  withSpring,
  runOnJS,
  useFrameCallback,
  useAnimatedReaction,
} from 'react-native-reanimated';
import type { Transforms3d } from '@shopify/react-native-skia';
import { useState, useCallback, useEffect, useMemo } from 'react';
import * as Haptics from 'expo-haptics';

import { ERA_COLOR_ARRAY } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ズーム制限
const MIN_ZOOM = 1;
const MAX_ZOOM = 100;

// フレームドロップ閾値 (16.67ms * 1.5 = 25ms 以上でドロップ判定)
const FRAME_DROP_THRESHOLD_MS = 25;

interface PinchZoomTestProps {
  width?: number;
  height?: number;
}

export function PinchZoomTest({
  width = SCREEN_WIDTH,
  height = 400
}: PinchZoomTestProps) {
  // テーマから色とトークンを取得（動的テーマ対応）
  const { colors, spacing, typography } = useTheme();

  // 動的スタイル（テーマ変更時に再計算）
  const dynamicStyles = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.bg },
    infoBar: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      backgroundColor: colors.bgSecondary,
    },
    infoText: {
      color: colors.text,
      fontSize: typography.size.base,
      fontFamily: typography.family.mono,
    },
    canvasContainer: { flex: 1, overflow: 'hidden' as const },
    guideBar: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: colors.bgSecondary,
      alignItems: 'center' as const,
    },
    guideText: {
      color: colors.textTertiary,
      fontSize: typography.size.sm,
    },
  }), [colors, spacing, typography]);

  // 状態管理 (Reanimated shared values for 60fps)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedFocalX = useSharedValue(0);

  // フレームドロップ計測用 shared values
  const frameDrops = useSharedValue(0);
  const totalFrames = useSharedValue(0);

  // UI表示用の状態
  const [currentZoom, setCurrentZoom] = useState(1);
  const [frameStats, setFrameStats] = useState({ drops: 0, total: 0, rate: '0.0' });

  // フレームコールバックでドロップ検出（timeSincePreviousFrame使用）
  useFrameCallback((frameInfo) => {
    'worklet';
    // timeSincePreviousFrame: 前フレームからの経過時間(ms)、初回はnull
    const delta = frameInfo.timeSincePreviousFrame;

    // nullチェック + 初回フレームはスキップ（異常値除外）
    if (delta !== null && delta > 0 && delta < 1000) {
      totalFrames.value++;

      // 25ms以上（60fpsの1.5倍）ならドロップとみなす
      if (delta > FRAME_DROP_THRESHOLD_MS) {
        frameDrops.value++;
      }
    }
  }, true);

  // フレーム統計を定期的にUI更新（1秒毎）
  // Note: shared values (frameDrops, totalFrames) は安定参照のため依存配列に含めない
  useEffect(() => {
    const interval = setInterval(() => {
      const drops = frameDrops.value;
      const total = totalFrames.value;
      const rate = total > 0 ? ((drops / total) * 100).toFixed(1) : '0.0';
      setFrameStats({ drops, total, rate });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ズーム表示更新（スロットリング: 0.1単位で変化時のみ）
  useAnimatedReaction(
    () => Math.round(scale.value * 10) / 10,
    (current, previous) => {
      'worklet';
      if (current !== previous && previous !== null) {
        runOnJS(setCurrentZoom)(current);
      }
    }
  );

  // ハプティクスフィードバック（Light: ピンチ終了、Medium: ダブルタップ）
  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerMediumHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ピンチジェスチャー（フォーカルポイント: 開始位置固定方式）
  // 仕様: ジェスチャー開始時のfocalXを基準に、累積的なスケール変化を計算
  // - 開始位置固定: ピンチ中に指が移動しても、最初のfocalXを原点として維持
  // - 安定性重視: フレーム間の誤差蓄積を防ぎ、予測可能なズーム動作を実現
  // Note: 動的追従（指の移動に追従）が必要な場合は event.focalX を使用する方式に変更可能
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

      // フォーカルポイント追従: ジェスチャー開始時のfocalXを基準にスケーリング
      // scaleDiff = newScale / savedScale（開始時基準、誤差蓄積なし）
      const scaleDiff = newScale / savedScale.value;
      const focalPoint = savedFocalX.value;

      // 開始時のtranslateXを基準に変換量を計算（安定性重視）
      translateX.value = savedTranslateX.value - (focalPoint - savedTranslateX.value) * (scaleDiff - 1);

      scale.value = newScale;
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      runOnJS(triggerLightHaptic)();
    });

  // パンジェスチャー（横スクロール）
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

  // ダブルタップで2倍ズーム（Medium haptic）
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      const newScale = scale.value < 2 ? 2 : 1;
      scale.value = withSpring(newScale, {
        damping: 15,
        stiffness: 150,
      });
      savedScale.value = newScale;
      runOnJS(triggerMediumHaptic)();
    });

  // ジェスチャー合成
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // Skia 変換行列（useDerivedValue で SharedValue を追跡）
  // Note: SharedValue を直接 transform に渡すと Skia が追跡できないため、
  // useDerivedValue で UI スレッド駆動にする
  const transform = useDerivedValue<Transforms3d>(() => [
    { translateX: translateX.value },
    { scale: scale.value },
  ]);

  // タイムラインコンテンツの幅（ズームに応じて変化）
  const contentWidth = width * 10; // 基本幅 x 10

  // 時代帯の描画（ERA_COLOR_ARRAY は tokens.ts から import）
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

  // イベントマーカーの描画（密度テスト）
  const renderEventMarkers = () => {
    const markers = [];
    const eventCount = 100; // 100個のマーカー

    for (let i = 0; i < eventCount; i++) {
      const x = (contentWidth / eventCount) * i + 20;
      const y = height / 2 + (Math.sin(i * 0.5) * 50);
      const radius = 6 + (i % 3) * 2; // 重要度に応じたサイズ

      markers.push(
        <Circle
          key={`marker-${i}`}
          cx={x}
          cy={y}
          r={radius}
          color={colors.text}
          style="fill"
        />
      );
    }
    return markers;
  };

  // 年マーカーの描画
  const renderYearMarkers = () => {
    const markers = [];
    const yearCount = 50;

    for (let i = 0; i <= yearCount; i++) {
      const x = (contentWidth / yearCount) * i;

      markers.push(
        <Rect
          key={`year-${i}`}
          x={x}
          y={height - 20}
          width={1}
          height={10}
          color={colors.textTertiary}
        />
      );
    }
    return markers;
  };

  return (
    <GestureHandlerRootView style={dynamicStyles.container}>
      {/* ズーム情報表示 */}
      <View style={dynamicStyles.infoBar}>
        <RNText style={dynamicStyles.infoText}>
          Zoom: x{currentZoom.toFixed(1)}
        </RNText>
        <RNText style={dynamicStyles.infoText}>
          Drops: {frameStats.drops} ({frameStats.rate}%)
        </RNText>
      </View>

      {/* Skia Canvas with Gestures */}
      <GestureDetector gesture={composedGesture}>
        <View style={dynamicStyles.canvasContainer}>
          <Canvas style={{ width, height }}>
            <Group transform={transform}>
              {/* 背景 */}
              <Rect
                x={0}
                y={0}
                width={contentWidth}
                height={height}
                color={colors.bg}
              />

              {/* 時代帯 */}
              {renderEraBands()}

              {/* タイムライン軸 */}
              <Rect
                x={0}
                y={height / 2 - 1}
                width={contentWidth}
                height={2}
                color={colors.primary}
              />

              {/* イベントマーカー */}
              {renderEventMarkers()}

              {/* 年マーカー */}
              {renderYearMarkers()}
            </Group>
          </Canvas>
        </View>
      </GestureDetector>

      {/* 操作ガイド */}
      <View style={dynamicStyles.guideBar}>
        <RNText style={dynamicStyles.guideText}>
          Pinch: ズーム | Drag: スクロール | Double-tap: x2
        </RNText>
      </View>
    </GestureHandlerRootView>
  );
}

export default PinchZoomTest;
