/**
 * Settings Screen - 設定モーダル
 * Sprint 1: 011 Navigation Architecture
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontSize: typography.size['2xl'] }]}>
          設定
        </Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.content, { marginTop: spacing[8] }]}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sprint 2で実装予定
        </Text>
        <Text style={[styles.description, { color: colors.textTertiary, marginTop: spacing[2] }]}>
          ハプティクス、テーマ、レイヤー設定
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
  },
});
