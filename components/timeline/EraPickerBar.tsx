/**
 * Era Picker Bar - 時代ジャンプナビゲーション
 * Sprint 3: 038 EraPickerBar Redesign
 *
 * 2層構造:
 * - 上段: 可変幅チップ行（時代名の長さに応じた幅）
 * - 下段: 真比率ミニマップ（現在位置インジケーター）
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

import type { Era } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineStore } from '@/stores/timelineStore';
import {
  TIMELINE_START_YEAR,
  getPixelsPerYear,
  clampScrollX,
} from '@/domain/timeline/coordinateSystem';
import { triggerHaptic } from '@/utils/haptics';
import { EraChipRow } from './EraChipRow';
import { MiniMap } from './MiniMap';

// =============================================================================
// Types
// =============================================================================

interface EraPickerBarProps {
  /** 表示する時代一覧（startYear順にソート済み） */
  eras: Era[];
}

// =============================================================================
// Constants
// =============================================================================

/** ジャンプアニメーション時間（ms） */
const JUMP_ANIMATION_DURATION = 400;

// =============================================================================
// Component
// =============================================================================

export function EraPickerBar({ eras }: EraPickerBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();

  // Timeline store
  const scrollX = useTimelineStore((s) => s.scrollX);
  const zoomLevel = useTimelineStore((s) => s.zoomLevel);
  const setScroll = useTimelineStore((s) => s.setScroll);

  // Animation ref
  const animationRef = useRef<number | null>(null);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Get current time (with fallback for RN environment differences)
  const getNow = useCallback(() => {
    return globalThis.performance?.now?.() ?? Date.now();
  }, []);

  // 現在の時代を計算（画面中央の年を含む時代）
  // 重複時代（例: 室町 1336-1573 & 戦国 1467-1590）の場合、
  // 最も短い時代（より具体的な時代）を優先
  const currentEraId = useMemo(() => {
    const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
    const centerPixelX = screenWidth / 2;
    const yearOffset = (centerPixelX - scrollX) / pixelsPerYear;
    const centerYear = yearOffset + TIMELINE_START_YEAR;

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
  }, [eras, scrollX, zoomLevel, screenWidth]);

  // 時代タップ時のジャンプ処理（スムーズアニメーション）
  const handleEraPress = useCallback(
    (era: Era) => {
      void triggerHaptic('selection');

      // Cancel any ongoing animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
      const targetScrollX = -((era.startYear - TIMELINE_START_YEAR) * pixelsPerYear);
      const clampedTarget = clampScrollX(targetScrollX, screenWidth, zoomLevel);

      // If already at target, do nothing
      if (Math.abs(scrollX - clampedTarget) < 1) {
        return;
      }

      // Animate
      const startScrollX = scrollX;
      const startTime = getNow();

      const animate = () => {
        const elapsed = getNow() - startTime;
        const progress = Math.min(elapsed / JUMP_ANIMATION_DURATION, 1);

        // Ease-out cubic: 1 - (1 - t)^3
        const eased = 1 - Math.pow(1 - progress, 3);

        const newScrollX = startScrollX + (clampedTarget - startScrollX) * eased;
        setScroll(newScrollX);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [screenWidth, zoomLevel, scrollX, setScroll, getNow]
  );

  // ミニマップタップ時のジャンプ処理（スムーズアニメーション）
  const handlePositionPress = useCallback(
    (targetYear: number) => {
      void triggerHaptic('light');

      // Cancel any ongoing animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
      // 画面中央に対象年を配置
      const targetScrollX = -((targetYear - TIMELINE_START_YEAR) * pixelsPerYear) + screenWidth / 2;
      const clampedTarget = clampScrollX(targetScrollX, screenWidth, zoomLevel);

      // If already at target, do nothing
      if (Math.abs(scrollX - clampedTarget) < 1) {
        return;
      }

      // Animate
      const startScrollX = scrollX;
      const startTime = getNow();

      const animate = () => {
        const elapsed = getNow() - startTime;
        const progress = Math.min(elapsed / JUMP_ANIMATION_DURATION, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const newScrollX = startScrollX + (clampedTarget - startScrollX) * eased;
        setScroll(newScrollX);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [screenWidth, zoomLevel, scrollX, setScroll, getNow]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
      {/* 可変幅チップ行 */}
      <EraChipRow
        eras={eras}
        currentEraId={currentEraId}
        onEraPress={handleEraPress}
      />

      {/* セパレーター（誤タップ防止） */}
      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* 真比率ミニマップ */}
      <MiniMap
        eras={eras}
        scrollX={scrollX}
        zoomLevel={zoomLevel}
        screenWidth={screenWidth}
        onPositionPress={handlePositionPress}
      />
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  separator: {
    height: 4,
    opacity: 0.3,
  },
});
