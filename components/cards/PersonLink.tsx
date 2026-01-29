/**
 * PersonLink - 人物リンクコンポーネント
 * Sprint 3: 031 Event Detail Screen
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Person } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';

// =============================================================================
// Component
// =============================================================================

interface PersonLinkProps {
  person: Person;
  onPress: () => void;
}

export function PersonLink({ person, onPress }: PersonLinkProps) {
  const { colors, spacing, radius } = useTheme();

  // 活動期間を表示
  const periodText = person.birthYear
    ? `${person.birthYear}〜${person.deathYear ?? ''}`
    : person.activeStartYear
      ? `活動: ${person.activeStartYear}〜${person.activeEndYear ?? ''}`
      : '';

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
        <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
        <View style={[styles.info, { marginLeft: spacing[3] }]}>
          <Text style={[styles.name, { color: colors.text }]}>{person.name}</Text>
          {periodText ? (
            <Text style={[styles.period, { color: colors.textTertiary }]}>{periodText}</Text>
          ) : null}
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
  name: {
    fontSize: 15,
    fontWeight: '500',
  },
  period: {
    fontSize: 12,
    marginTop: 2,
  },
});
