/**
 * Person Detail Screen - 人物詳細
 * Sprint 1: 011 Navigation Architecture
 */

import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text, fontSize: typography.size['2xl'] }]}>
        人物詳細
      </Text>
      <Text style={[styles.id, { color: colors.primary, marginTop: spacing[2] }]}>
        ID: {id}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing[4] }]}>
        Sprint 2で実装予定
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
  },
  id: {
    fontSize: 16,
    fontFamily: 'Courier New',
  },
  subtitle: {
    fontSize: 14,
  },
});
