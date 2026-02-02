/**
 * MiniMap - 真比率ミニマップ
 * Sprint 3: 038 EraPickerBar Redesign
 *
 * タイムライン全体を真比率で表示し、現在位置インジケーターを表示。
 * タップで該当位置へジャンプ。
 */

import { Pressable, StyleSheet, View } from "react-native";

import { TIMELINE_START_YEAR, TOTAL_YEARS } from "@/domain/timeline/constants";
import { useTheme } from "@/hooks/useTheme";
import type { Era } from "@/types/database";

// =============================================================================
// Types
// =============================================================================

interface MiniMapProps {
  eras: Era[];
  scrollX: number;
  zoomLevel: number;
  screenWidth: number;
  onPositionPress: (year: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

/** ミニマップの高さ（px） */
const MINIMAP_HEIGHT = 8;

/** タップ精度向上のための hitSlop（上下18px追加で合計44px） */
const MINIMAP_HIT_SLOP = { top: 18, bottom: 18, left: 0, right: 0 };

// =============================================================================
// Component
// =============================================================================

export function MiniMap({
  eras,
  scrollX,
  zoomLevel,
  screenWidth,
  onPositionPress,
}: MiniMapProps) {
  const { colors } = useTheme();

  // 現在表示範囲を計算
  const visibleRatio = 1 / zoomLevel;
  const scrollRatio =
    zoomLevel > 1 ? -scrollX / (screenWidth * (zoomLevel - 1)) : 0;
  const indicatorWidth = Math.max(4, screenWidth * visibleRatio);
  const indicatorX = scrollRatio * (screenWidth - indicatorWidth);

  const handlePress = (event: { nativeEvent: { locationX: number } }) => {
    const tapX = event.nativeEvent.locationX;
    const tapRatio = tapX / screenWidth;
    const targetYear = TIMELINE_START_YEAR + TOTAL_YEARS * tapRatio;
    onPositionPress(targetYear);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, { backgroundColor: colors.bgSecondary }]}
      hitSlop={MINIMAP_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel="タイムラインミニマップ"
      accessibilityHint="タップして任意の位置にジャンプ"
    >
      {/* 時代背景（真比率） */}
      {eras.map((era) => {
        const startRatio = (era.startYear - TIMELINE_START_YEAR) / TOTAL_YEARS;
        const endRatio = (era.endYear - TIMELINE_START_YEAR) / TOTAL_YEARS;
        const width = (endRatio - startRatio) * screenWidth;
        const left = startRatio * screenWidth;

        // 幅が1px未満の時代は描画をスキップ（パフォーマンス）
        if (width < 1) return null;

        return (
          <View
            key={era.id}
            style={[
              styles.eraSegment,
              {
                left,
                width: Math.max(1, width),
                backgroundColor: era.color ?? colors.primary,
              },
            ]}
          />
        );
      })}

      {/* 現在位置インジケーター */}
      <View
        style={[
          styles.indicator,
          {
            left: Math.max(
              0,
              Math.min(screenWidth - indicatorWidth, indicatorX),
            ),
            width: indicatorWidth,
          },
        ]}
      />
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    height: MINIMAP_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  eraSegment: {
    position: "absolute",
    top: 0,
    height: MINIMAP_HEIGHT,
    opacity: 0.8,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: MINIMAP_HEIGHT,
    backgroundColor: "#FFFFFF",
    opacity: 0.8,
    borderRadius: 2,
  },
});
