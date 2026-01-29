/**
 * TagBadge - イベントタグ表示コンポーネント
 * Sprint 3: 031 Event Detail Screen
 */

import { StyleSheet, Text, View } from 'react-native';

import type { EventTag } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';

// =============================================================================
// Tag Configuration
// =============================================================================

const TAG_CONFIG: Record<EventTag, { label: string; color: string }> = {
  politics: { label: '政治', color: '#EF5350' },
  war: { label: '戦争', color: '#FF7043' },
  culture: { label: '文化', color: '#9CCC65' },
  diplomacy: { label: '外交', color: '#26A69A' },
  economy: { label: '経済', color: '#42A5F5' },
  social: { label: '社会', color: '#AB47BC' },
};

// =============================================================================
// Component
// =============================================================================

interface TagBadgeProps {
  tag: EventTag;
}

export function TagBadge({ tag }: TagBadgeProps) {
  const { spacing, radius } = useTheme();
  const config = TAG_CONFIG[tag] ?? { label: tag, color: '#A0AEC0' };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color,
          borderRadius: radius.sm,
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
          marginRight: spacing[2],
        },
      ]}
    >
      <Text style={styles.label}>#{config.label}</Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
