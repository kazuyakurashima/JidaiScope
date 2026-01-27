/**
 * Settings Screen - 設定モーダル
 * Sprint 1: 011 Navigation Architecture
 * Sprint 1: 016 Dark Theme
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ThemeMode } from '@/types/store';

// テーマオプション定義
const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'dark', label: 'ダーク', icon: 'moon' },
  { value: 'light', label: 'ライト', icon: 'sunny' },
  { value: 'system', label: 'システム', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const { theme, setTheme, hapticEnabled, toggleHaptic } = useSettingsStore();

  // 動的スタイル
  const styles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
      paddingBottom: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      color: colors.text,
      fontSize: typography.size['2xl'],
      fontWeight: typography.weight.semibold,
    },
    closeButton: {
      padding: spacing[2],
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
    },
    section: {
      marginBottom: spacing[6],
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
      marginBottom: spacing[2],
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    sectionContent: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.lg,
      overflow: 'hidden' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing[3],
    },
    rowText: {
      color: colors.text,
      fontSize: typography.size.base,
    },
    rowValue: {
      color: colors.textSecondary,
      fontSize: typography.size.base,
    },
    themeOptions: {
      flexDirection: 'row' as const,
      gap: spacing[2],
    },
    themeOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radius.md,
      gap: spacing[1],
    },
    themeOptionActive: {
      backgroundColor: colors.primary,
    },
    themeOptionInactive: {
      backgroundColor: colors.bgTertiary,
    },
    themeOptionText: {
      fontSize: typography.size.sm,
      fontWeight: typography.weight.medium,
    },
    themeOptionTextActive: {
      color: colors.bg,
    },
    themeOptionTextInactive: {
      color: colors.textTertiary,
    },
    toggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center' as const,
      paddingHorizontal: 2,
    },
    toggleActive: {
      backgroundColor: colors.primary,
    },
    toggleInactive: {
      backgroundColor: colors.bgTertiary,
    },
    toggleKnob: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.bg,
    },
    toggleKnobActive: {
      alignSelf: 'flex-end' as const,
    },
    toggleKnobInactive: {
      alignSelf: 'flex-start' as const,
    },
    footer: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
      alignItems: 'center' as const,
    },
    footerText: {
      color: colors.textTertiary,
      fontSize: typography.size.sm,
    },
    footerVersion: {
      color: colors.textTertiary,
      fontSize: typography.size.xs,
      marginTop: spacing[1],
    },
  }), [colors, typography, spacing, radius]);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* テーマセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外観</Text>
          <View style={styles.sectionContent}>
            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowLabel}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.rowText}>テーマ</Text>
              </View>
              <View style={styles.themeOptions}>
                {THEME_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.themeOption,
                      theme === option.value
                        ? styles.themeOptionActive
                        : styles.themeOptionInactive,
                    ]}
                    onPress={() => setTheme(option.value)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={14}
                      color={theme === option.value ? colors.bg : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        theme === option.value
                          ? styles.themeOptionTextActive
                          : styles.themeOptionTextInactive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* フィードバックセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>フィードバック</Text>
          <View style={styles.sectionContent}>
            <Pressable style={[styles.row, styles.rowLast]} onPress={toggleHaptic}>
              <View style={styles.rowLabel}>
                <Ionicons name="pulse" size={20} color={colors.text} />
                <Text style={styles.rowText}>ハプティクス</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  hapticEnabled ? styles.toggleActive : styles.toggleInactive,
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    hapticEnabled ? styles.toggleKnobActive : styles.toggleKnobInactive,
                  ]}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 情報セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>情報</Text>
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <Ionicons name="layers-outline" size={20} color={colors.text} />
                <Text style={styles.rowText}>レイヤー設定</Text>
              </View>
              <Text style={styles.rowValue}>Sprint 2</Text>
            </View>
            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowLabel}>
                <Ionicons name="diamond-outline" size={20} color={colors.text} />
                <Text style={styles.rowText}>Pro版</Text>
              </View>
              <Text style={styles.rowValue}>Sprint 4</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>JidaiScope</Text>
        <Text style={styles.footerVersion}>v1.0.0 (Sprint 1)</Text>
      </View>
    </View>
  );
}
