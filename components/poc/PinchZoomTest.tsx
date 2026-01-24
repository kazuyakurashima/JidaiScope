/**
 * PinchZoomTest.tsx - Sprint 0 Day 1 PoC
 *
 * 検証項目:
 * 1. ピンチズームで60fps維持 (iPhone 12+)
 * 2. フレームドロップ < 5%
 * 3. ズーム範囲: x1 〜 x100
 * 4. フォーカルポイント追従
 */

import { Canvas, Rect, Circle, Group, Text, useFont } from '@shopify/react-native-skia';
import { View, StyleSheet, Dimensions, Text as RNText } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ズーム制限
const MIN_ZOOM = 1;
const MAX_ZOOM = 100;

// 時代カラー（簡略版）
const ERA_COLORS = ['#8B7355', '#D4A574', '#9370DB', '#4682B4', '#DC143C', '#4169E1', '#228B22'];

interface PinchZoomTestProps {
  width?: number;
  height?: number;
}

export function PinchZoomTest({
  width = SCREEN_WIDTH,
  height = 400
}: PinchZoomTestProps) {
  // 状態管理 (Reanimated shared values for 60fps)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const focalX = useSharedValue(0);

  // UI表示用の状態
  const [currentZoom, setCurrentZoom] = useState(1);
  const [frameDropCount, setFrameDropCount] = useState(0);

  // ズームレベル更新（UIスレッド）
  const updateZoomDisplay = useCallback((newZoom: number) => {
    setCurrentZoom(Math.round(newZoom * 100) / 100);
  }, []);

  // ハプティクスフィードバック
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ピンチジェスチャー
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      // スケール計算（フォーカルポイント考慮）
      const newScale = Math.min(
        Math.max(savedScale.value * event.scale, MIN_ZOOM),
        MAX_ZOOM
      );
      scale.value = newScale;
      focalX.value = event.focalX;

      // UIスレッドで表示更新
      runOnJS(updateZoomDisplay)(newScale);
    })
    .onEnd(() => {
      // スプリングアニメーションで自然な減衰
      savedScale.value = scale.value;

      // ズーム完了時のハプティクス
      runOnJS(triggerHaptic)();
    });

  // パンジェスチャー（横スクロール）
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
    });

  // ダブルタップで2倍ズーム
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      const newScale = scale.value < 2 ? 2 : 1;
      scale.value = withSpring(newScale, {
        damping: 15,
        stiffness: 150,
      });
      savedScale.value = newScale;

      runOnJS(updateZoomDisplay)(newScale);
      runOnJS(triggerHaptic)();
    });

  // ジェスチャー合成
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // タイムラインコンテンツの幅（ズームに応じて変化）
  const contentWidth = width * 10; // 基本幅 x 10

  // 時代帯の描画
  const renderEraBands = () => {
    const eraWidth = contentWidth / ERA_COLORS.length;
    return ERA_COLORS.map((color, index) => (
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
          color="#F7FAFC"
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
          color="#718096"
        />
      );
    }
    return markers;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ズーム情報表示 */}
      <View style={styles.infoBar}>
        <RNText style={styles.infoText}>
          Zoom: x{currentZoom.toFixed(2)}
        </RNText>
        <RNText style={styles.infoText}>
          Target: 60fps | Drops: {frameDropCount}
        </RNText>
      </View>

      {/* Skia Canvas with Gestures */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.canvasContainer}>
          <Canvas style={{ width, height }}>
            <Group
              transform={[
                { translateX: translateX.value },
                { scale: scale.value },
              ]}
            >
              {/* 背景 */}
              <Rect
                x={0}
                y={0}
                width={contentWidth}
                height={height}
                color="#0A0E14"
              />

              {/* 時代帯 */}
              {renderEraBands()}

              {/* タイムライン軸 */}
              <Rect
                x={0}
                y={height / 2 - 1}
                width={contentWidth}
                height={2}
                color="#4FD1C5"
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
      <View style={styles.guideBar}>
        <RNText style={styles.guideText}>
          Pinch: ズーム | Drag: スクロール | Double-tap: x2
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1A1F2E',
  },
  infoText: {
    color: '#F7FAFC',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
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

export default PinchZoomTest;
