/**
 * SkiaCanvas.tsx - Sprint 0 Day 1 PoC
 *
 * 検証項目:
 * 1. Skia が Expo SDK 54 + React 19 で動作するか
 * 2. 基本的な図形描画（rect, circle, text）
 * 3. 時代帯の背景描画パターン
 */

import { Canvas, Rect, Circle, Text, useFont, Group } from '@shopify/react-native-skia';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 時代カラー（PRD セクション 11.2）
const ERA_COLORS = {
  jomon: '#8B7355',      // 縄文
  yayoi: '#D4A574',      // 弥生
  kofun: '#B8860B',      // 古墳
  asuka: '#CD853F',      // 飛鳥
  nara: '#DAA520',       // 奈良
  heian: '#9370DB',      // 平安
  kamakura: '#4682B4',   // 鎌倉
  muromachi: '#2E8B57',  // 室町
  sengoku: '#DC143C',    // 戦国
  azuchi: '#FF8C00',     // 安土桃山
  edo: '#4169E1',        // 江戸
  meiji: '#228B22',      // 明治
  taisho: '#9932CC',     // 大正
  showa: '#1E90FF',      // 昭和
  heisei: '#FF69B4',     // 平成
  reiwa: '#00CED1',      // 令和
};

// テスト用の時代データ
const TEST_ERAS = [
  { name: '縄文', color: ERA_COLORS.jomon, width: 100 },
  { name: '弥生', color: ERA_COLORS.yayoi, width: 80 },
  { name: '古墳', color: ERA_COLORS.kofun, width: 60 },
  { name: '飛鳥', color: ERA_COLORS.asuka, width: 40 },
  { name: '奈良', color: ERA_COLORS.nara, width: 30 },
  { name: '平安', color: ERA_COLORS.heian, width: 70 },
  { name: '鎌倉', color: ERA_COLORS.kamakura, width: 40 },
  { name: '室町', color: ERA_COLORS.muromachi, width: 50 },
  { name: '江戸', color: ERA_COLORS.edo, width: 80 },
  { name: '明治', color: ERA_COLORS.meiji, width: 30 },
];

interface SkiaCanvasProps {
  width?: number;
  height?: number;
}

export function SkiaCanvas({
  width = SCREEN_WIDTH,
  height = 300
}: SkiaCanvasProps) {
  // 時代帯の描画
  const renderEraBands = () => {
    let x = 0;
    return TEST_ERAS.map((era, index) => {
      const rect = (
        <Rect
          key={`era-${index}`}
          x={x}
          y={0}
          width={era.width}
          height={height}
          color={era.color}
          opacity={0.6}
        />
      );
      x += era.width;
      return rect;
    });
  };

  // イベントマーカーの描画テスト
  const renderEventMarkers = () => {
    const markers = [];
    for (let i = 0; i < 20; i++) {
      markers.push(
        <Circle
          key={`marker-${i}`}
          cx={50 + i * 30}
          cy={height / 2}
          r={8}
          color="#F7FAFC"
          style="fill"
        />
      );
    }
    return markers;
  };

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Group>
          {/* 背景 */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            color="#0A0E14"
          />

          {/* 時代帯 */}
          {renderEraBands()}

          {/* イベントマーカー */}
          {renderEventMarkers()}

          {/* 中央線（タイムライン軸） */}
          <Rect
            x={0}
            y={height / 2 - 1}
            width={width}
            height={2}
            color="#4FD1C5"
            opacity={0.8}
          />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A0E14',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default SkiaCanvas;
