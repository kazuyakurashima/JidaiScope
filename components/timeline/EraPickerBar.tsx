/**
 * Era Picker Bar - 時代ジャンプナビゲーション
 * Sprint 2: 023 Era Picker
 *
 * 時代を横並びに表示し、タップで該当時代へジャンプするUI。
 * 各時代の幅は期間に比例（真比率）。
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import type { Era } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineStore } from '@/stores/timelineStore';
import {
  TIMELINE_START_YEAR,
  TOTAL_YEARS,
  getPixelsPerYear,
  clampScrollX,
  getMinScrollX,
} from '@/domain/timeline/coordinateSystem';
import { triggerHaptic } from '@/utils/haptics';

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

/** バーの最小幅（px）- 短い時代でも最低限の幅を確保 */
const MIN_ERA_WIDTH = 40;

/** ジャンプアニメーション時間（ms） */
const JUMP_ANIMATION_DURATION = 400;

/** Era Picker の高さ */
const PICKER_HEIGHT = 48;

// =============================================================================
// Component
// =============================================================================

export function EraPickerBar({ eras }: EraPickerBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, typography } = useTheme();

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

  // Calculate which era is currently visible (center of screen)
  // For overlapping eras (e.g., Muromachi 1336-1573 & Sengoku 1467-1590),
  // select the one with the shortest duration (more specific era)
  const currentEraId = useMemo(() => {
    const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
    // Center of screen's year
    const centerPixelX = screenWidth / 2;
    const yearOffset = (centerPixelX - scrollX) / pixelsPerYear;
    const centerYear = yearOffset + TIMELINE_START_YEAR;

    // Find all eras containing this year
    const matchingEras = eras.filter(
      (e) => centerYear >= e.startYear && centerYear < e.endYear
    );

    if (matchingEras.length === 0) {
      return null;
    }

    // Sort by duration (shortest first) to prioritize more specific eras
    matchingEras.sort(
      (a, b) => (a.endYear - a.startYear) - (b.endYear - b.startYear)
    );

    return matchingEras[0].id;
  }, [eras, scrollX, zoomLevel, screenWidth]);

  // Jump to era with animation
  const jumpToEra = useCallback(
    (era: Era) => {
      // Trigger haptic feedback (fire-and-forget, don't await)
      void triggerHaptic('selection');

      // Cancel any ongoing animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);

      // Calculate target scrollX to position era's start at left edge with some padding
      const targetYear = era.startYear;
      const targetScrollX = -((targetYear - TIMELINE_START_YEAR) * pixelsPerYear);

      // Clamp to valid scroll bounds
      const clampedTarget = clampScrollX(targetScrollX, screenWidth, zoomLevel);
      const minScrollX = getMinScrollX(screenWidth, zoomLevel);

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
        setScroll(Math.max(minScrollX, Math.min(0, newScrollX)));

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

  // Calculate era widths based on duration proportion
  const eraWidths = useMemo(() => {
    // Calculate total width for the bar (use screen width as reference)
    // We use a fixed reference width rather than zoom-dependent width
    const totalBarWidth = screenWidth * 2; // Allow horizontal scrolling

    return eras.map((era) => {
      const duration = era.endYear - era.startYear;
      const proportion = duration / TOTAL_YEARS;
      const width = Math.max(MIN_ERA_WIDTH, proportion * totalBarWidth);
      return { era, width };
    });
  }, [eras, screenWidth]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSecondary,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {eraWidths.map(({ era, width }) => {
          const isCurrentEra = era.id === currentEraId;
          const eraColor = era.color ?? colors.primary;

          return (
            <Pressable
              key={era.id}
              onPress={() => jumpToEra(era)}
              style={({ pressed }) => [
                styles.eraItem,
                {
                  width,
                  backgroundColor: isCurrentEra ? eraColor : 'transparent',
                  borderColor: eraColor,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.eraName,
                  {
                    color: isCurrentEra ? colors.bg : colors.text,
                    fontSize: typography.size.xs,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {era.name}
              </Text>
              <Text
                style={[
                  styles.eraYears,
                  {
                    color: isCurrentEra ? colors.bg : colors.textTertiary,
                    fontSize: 9, // Smaller than xs (10)
                  },
                ]}
                numberOfLines={1}
              >
                {formatYear(era.startYear)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * 年号を表示用にフォーマット
 * 負の年は「BC xxxx」形式に
 */
function formatYear(year: number): string {
  if (year < 0) {
    return `BC ${Math.abs(year)}`;
  }
  return `${year}`;
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    borderBottomWidth: 1,
  },
  scrollContent: {
    alignItems: 'stretch',
  },
  eraItem: {
    height: PICKER_HEIGHT - 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 0,
    marginRight: -1, // Overlap borders
  },
  eraName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  eraYears: {
    marginTop: 2,
    textAlign: 'center',
  },
});
