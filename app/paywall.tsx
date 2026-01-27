/**
 * Paywall Screen - Pro版購入モーダル
 * Sprint 1: 011 Navigation Architecture
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function PaywallScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Ionicons name="star" size={64} color={colors.secondary} />
        <Text style={[styles.title, { color: colors.text, fontSize: typography.size['3xl'], marginTop: spacing[4] }]}>
          JidaiScope Pro
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing[2] }]}>
          全機能をアンロック
        </Text>

        <View style={[styles.features, { marginTop: spacing[8] }]}>
          <FeatureItem icon="layers" text="全レイヤー表示" colors={colors} />
          <FeatureItem icon="people" text="人物レイヤー" colors={colors} />
          <FeatureItem icon="bookmark" text="無制限ブックマーク" colors={colors} />
        </View>

        <Text style={[styles.placeholder, { color: colors.textTertiary, marginTop: spacing[8] }]}>
          Sprint 4で実装予定
        </Text>
      </View>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: { text: string; primary: string };
}

function FeatureItem({ icon, text, colors }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 8,
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
    fontSize: 16,
  },
  features: {
    width: '100%',
    maxWidth: 280,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  placeholder: {
    fontSize: 14,
  },
});
