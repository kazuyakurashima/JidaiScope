/**
 * Bookmarks Screen - ブックマークタブ
 * Sprint 1: 011 Navigation Architecture
 */

import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function BookmarksScreen() {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text, fontSize: typography.size['2xl'] }]}>
        ブックマーク
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing[2] }]}>
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
  subtitle: {
    fontSize: 14,
  },
});
