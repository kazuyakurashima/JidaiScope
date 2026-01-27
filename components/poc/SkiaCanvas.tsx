/**
 * SkiaCanvas.tsx - Sprint 0 Day 1 PoC
 *
 * 検証項目:
 * 1. Skia が Expo SDK 54 + React 19 で動作するか
 * 2. 基本的な図形描画（rect, circle, line, text）
 * 3. 時代帯の背景描画パターン
 *
 * Note: 日本語フォント対応は別チケット（015: Design Tokens）で実装予定
 * 現時点では英語ラベルでテキスト描画検証を行う
 */

import { Canvas, Rect, Circle, Group, Text, useFont, Line, vec } from '@shopify/react-native-skia';
import { View, Dimensions } from 'react-native';
import { useMemo } from 'react';

import { ERA_COLORS } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

// Roboto フォント（ローカルアセット、相対パスでMetro解決の安定性を確保）
// Note: 本番では NotoSansJP などの日本語フォントを assets/fonts に配置
const ROBOTO_FONT = require('../../assets/fonts/Roboto-Medium.ttf');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// テスト用の時代データ（英語ラベル: PoC用、日本語フォント未導入のため）
// Note: ERA_COLORS は tokens.ts から import（15時代、reiwa なし）
const TEST_ERAS = [
  { name: 'Jomon', color: ERA_COLORS.jomon, width: 100 },
  { name: 'Yayoi', color: ERA_COLORS.yayoi, width: 80 },
  { name: 'Kofun', color: ERA_COLORS.kofun, width: 60 },
  { name: 'Asuka', color: ERA_COLORS.asuka, width: 40 },
  { name: 'Nara', color: ERA_COLORS.nara, width: 30 },
  { name: 'Heian', color: ERA_COLORS.heian, width: 70 },
  { name: 'Kamakura', color: ERA_COLORS.kamakura, width: 40 },
  { name: 'Muromachi', color: ERA_COLORS.muromachi, width: 50 },
  { name: 'Edo', color: ERA_COLORS.edo, width: 80 },
  { name: 'Meiji', color: ERA_COLORS.meiji, width: 30 },
];

interface SkiaCanvasProps {
  width?: number;
  height?: number;
}

export function SkiaCanvas({
  width = SCREEN_WIDTH,
  height = 300
}: SkiaCanvasProps) {
  // テーマから色とトークンを取得（動的テーマ対応）
  const { colors, radius } = useTheme();

  // 動的スタイル（テーマ変更時に再計算）
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.bg,
      borderRadius: radius.md,
      overflow: 'hidden' as const,
    },
  }), [colors, radius]);

  // フォント読み込み（Roboto: Skiaテストアセット）
  // Note: フォント未ロードでも図形描画は継続、テキストのみスキップ
  const font = useFont(ROBOTO_FONT, 14);
  const labelFont = useFont(ROBOTO_FONT, 12);

  // フォントロード状態（テキスト描画の条件分岐用）
  const fontsLoaded = font !== null && labelFont !== null;

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
          color={colors.text}
          style="fill"
        />
      );
    }
    return markers;
  };

  // 時代ラベルの描画（テキスト検証）- フォント未ロード時はスキップ
  const renderEraLabels = () => {
    if (!fontsLoaded || !labelFont) return null;

    let x = 0;
    return TEST_ERAS.map((era, index) => {
      const labelX = x + era.width / 2 - 15;
      const label = (
        <Text
          key={`label-${index}`}
          x={labelX}
          y={height - 20}
          text={era.name}
          font={labelFont}
          color={colors.text}
        />
      );
      x += era.width;
      return label;
    });
  };

  // 年マーカー線の描画（Line検証）
  const renderYearLines = () => {
    const lines = [];
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      lines.push(
        <Line
          key={`line-${i}`}
          p1={vec(x, height - 30)}
          p2={vec(x, height - 15)}
          color={colors.textTertiary}
          strokeWidth={1}
        />
      );
    }
    return lines;
  };

  return (
    <View style={dynamicStyles.container}>
      <Canvas style={{ width, height }}>
        <Group>
          {/* 背景 */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            color={colors.bg}
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
            color={colors.primary}
            opacity={0.8}
          />

          {/* 年マーカー線（Line検証） */}
          {renderYearLines()}

          {/* 時代ラベル（Text検証）- フォント未ロード時はスキップ */}
          {renderEraLabels()}

          {/* テスト用ヘッダーテキスト - フォント未ロード時はスキップ */}
          {fontsLoaded && font && (
            <Text
              x={10}
              y={20}
              text="Phase 1: Rect / Circle / Line / Text"
              font={font}
              color={colors.primary}
            />
          )}
        </Group>
      </Canvas>
    </View>
  );
}

export default SkiaCanvas;
