/**
 * Settings Screen - 設定モーダル
 * Sprint 1: 011 Navigation Architecture
 * Sprint 1: 016 Dark Theme
 * Sprint 4: 040 Settings Screen
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useMemo, useCallback } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSearchStore } from '@/stores/searchStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { triggerHaptic } from '@/utils/haptics';
import type { ThemeMode, LayerType } from '@/types/store';

// アプリバージョン
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// テーマオプション定義
const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'dark', label: 'ダーク', icon: 'moon' },
  { value: 'light', label: 'ライト', icon: 'sunny' },
  { value: 'system', label: 'システム', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const { theme, setTheme, hapticEnabled, toggleHaptic, visibleLayers, toggleLayer } = useSettingsStore();
  const clearSearchHistory = useSearchStore((s) => s.clearHistory);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  // レイヤートグルハンドラー
  const handleToggleLayer = useCallback(async (type: LayerType) => {
    await triggerHaptic('light');
    await toggleLayer(type);
  }, [toggleLayer]);

  // 検索履歴クリア
  const handleClearSearchHistory = useCallback(async () => {
    Alert.alert(
      '検索履歴をクリア',
      '検索履歴とキャッシュをクリアしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'クリア',
          style: 'destructive',
          onPress: async () => {
            await triggerHaptic('medium');
            clearSearchHistory();
            Alert.alert('完了', '検索履歴をクリアしました');
          },
        },
      ]
    );
  }, [clearSearchHistory]);

  // オンボーディングリセット
  const handleResetOnboarding = useCallback(async () => {
    Alert.alert(
      'オンボーディングをリセット',
      '次回起動時にチュートリアルが再表示されます',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            await triggerHaptic('medium');
            await resetOnboarding();
            Alert.alert('完了', 'オンボーディングをリセットしました');
          },
        },
      ]
    );
  }, [resetOnboarding]);

  // 外部リンクを開く
  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

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
    rowChevron: {
      marginLeft: spacing[2],
    },
    dangerText: {
      color: colors.error,
    },
    debugSection: {
      marginTop: spacing[4],
    },
    debugSectionTitle: {
      color: colors.textTertiary,
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      marginBottom: spacing[2],
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
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

        {/* レイヤー設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>レイヤー表示</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.row} onPress={() => handleToggleLayer('emperor')}>
              <View style={styles.rowLabel}>
                <Ionicons name="person" size={20} color={colors.text} />
                <Text style={styles.rowText}>天皇</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  visibleLayers.emperor ? styles.toggleActive : styles.toggleInactive,
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    visibleLayers.emperor ? styles.toggleKnobActive : styles.toggleKnobInactive,
                  ]}
                />
              </View>
            </Pressable>
            <Pressable style={[styles.row, styles.rowLast]} onPress={() => handleToggleLayer('shogun')}>
              <View style={styles.rowLabel}>
                <Ionicons name="shield" size={20} color={colors.text} />
                <Text style={styles.rowText}>将軍</Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  visibleLayers.shogun ? styles.toggleActive : styles.toggleInactive,
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    visibleLayers.shogun ? styles.toggleKnobActive : styles.toggleKnobInactive,
                  ]}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 情報・法務セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>情報</Text>
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <Ionicons name="information-circle-outline" size={20} color={colors.text} />
                <Text style={styles.rowText}>バージョン</Text>
              </View>
              <Text style={styles.rowValue}>{APP_VERSION}</Text>
            </View>
            <Pressable
              style={styles.row}
              onPress={() => openLink('https://jidaiscope.app/privacy')}
            >
              <View style={styles.rowLabel}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
                <Text style={styles.rowText}>プライバシーポリシー</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={styles.rowChevron} />
            </Pressable>
            <Pressable
              style={[styles.row, styles.rowLast]}
              onPress={() => openLink('https://jidaiscope.app/terms')}
            >
              <View style={styles.rowLabel}>
                <Ionicons name="document-text-outline" size={20} color={colors.text} />
                <Text style={styles.rowText}>利用規約</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={styles.rowChevron} />
            </Pressable>
          </View>
        </View>

        {/* データ管理セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          <View style={styles.sectionContent}>
            <Pressable style={[styles.row, styles.rowLast]} onPress={handleClearSearchHistory}>
              <View style={styles.rowLabel}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.rowText, styles.dangerText]}>検索履歴をクリア</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={styles.rowChevron} />
            </Pressable>
          </View>
        </View>

        {/* デバッグセクション */}
        <View style={[styles.section, styles.debugSection]}>
          <Text style={styles.debugSectionTitle}>デバッグ</Text>
          <View style={styles.sectionContent}>
            <Pressable style={[styles.row, styles.rowLast]} onPress={handleResetOnboarding}>
              <View style={styles.rowLabel}>
                <Ionicons name="refresh-outline" size={20} color={colors.text} />
                <Text style={styles.rowText}>オンボーディングをリセット</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={styles.rowChevron} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>JidaiScope</Text>
        <Text style={styles.footerVersion}>v{APP_VERSION}</Text>
      </View>
    </View>
  );
}
