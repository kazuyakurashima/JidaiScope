/**
 * Onboarding Screen - 初回起動時のオンボーディング
 * Sprint 1: 011 Navigation Architecture
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  const handleComplete = () => {
    // TODO: AsyncStorageにオンボーディング完了フラグを保存
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Ionicons name="time" size={80} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text, fontSize: typography.size['4xl'], marginTop: spacing[6] }]}>
          JidaiScope
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing[2] }]}>
          日本史タイムライン
        </Text>
        <Text style={[styles.description, { color: colors.textTertiary, marginTop: spacing[4] }]}>
          真比率タイムラインで日本の歴史を探索
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: spacing[10] }]}>
        <Pressable
          onPress={handleComplete}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.bg }]}>はじめる</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
