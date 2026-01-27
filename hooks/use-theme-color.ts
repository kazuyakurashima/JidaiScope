/**
 * useThemeColor Hook - Design Tokensへのブリッジ
 *
 * Note: このファイルは互換性のために残されています。
 * 新しいコードでは @/hooks/useTheme を使用してください。
 */

import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const themeMode = useSettingsStore((s) => s.theme);
  const systemColorScheme = useColorScheme();

  // テーマ解決: settingsStore の設定を優先、system の場合はデバイス設定を使用
  const resolvedTheme: 'dark' | 'light' =
    themeMode === 'system'
      ? systemColorScheme === 'light'
        ? 'light'
        : 'dark'
      : themeMode;

  const colorFromProps = props[resolvedTheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[resolvedTheme][colorName];
  }
}
