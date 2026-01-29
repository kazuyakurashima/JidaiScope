/**
 * EventLink - イベントリンクコンポーネント
 * Sprint 3: 031 Event Detail Screen
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HistoricalEvent } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { extractYearFromDate } from '@/domain/timeline/coordinateSystem';

// =============================================================================
// Component
// =============================================================================

interface EventLinkProps {
  event: HistoricalEvent;
  onPress: () => void;
}

export function EventLink({ event, onPress }: EventLinkProps) {
  const { colors, spacing, radius } = useTheme();

  const startYear = extractYearFromDate(event.startDate);
  const endYear = event.endDate ? extractYearFromDate(event.endDate) : null;
  const yearText = endYear ? `${startYear}〜${endYear}` : `${startYear}`;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSecondary,
          borderRadius: radius.md,
          padding: spacing[3],
          marginBottom: spacing[2],
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        <View style={[styles.info, { marginLeft: spacing[3] }]}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={[styles.year, { color: colors.textTertiary }]}>{yearText}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  year: {
    fontSize: 12,
    marginTop: 2,
  },
});
