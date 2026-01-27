/**
 * useTheme Hook - Design Tokens へのアクセス
 * Sprint 1: 015 Design Tokens
 */

import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  getColors,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  DURATION,
  Z_INDEX,
  UI_STATES,
  SKELETON,
  ERA_COLORS,
  type Colors,
} from '@/constants/tokens';
import type { ThemeMode } from '@/types/store';

export interface ThemeTokens {
  colors: Colors;
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  duration: typeof DURATION;
  zIndex: typeof Z_INDEX;
  uiStates: typeof UI_STATES;
  skeleton: typeof SKELETON;
  eraColors: typeof ERA_COLORS;
  isDark: boolean;
  themeMode: ThemeMode;
}

/**
 * Design Tokens を取得するフック
 * settingsStore のテーマ設定に応じて適切なカラーパレットを返す
 */
export function useTheme(): ThemeTokens {
  const themeMode = useSettingsStore((s) => s.theme);
  const systemColorScheme = useColorScheme();

  // テーマ解決: system の場合はデバイス設定を使用
  const resolvedTheme: 'dark' | 'light' =
    themeMode === 'system'
      ? systemColorScheme === 'light'
        ? 'light'
        : 'dark'
      : themeMode;

  return {
    colors: getColors(resolvedTheme),
    typography: TYPOGRAPHY,
    spacing: SPACING,
    radius: RADIUS,
    duration: DURATION,
    zIndex: Z_INDEX,
    uiStates: UI_STATES,
    skeleton: SKELETON,
    eraColors: ERA_COLORS,
    isDark: resolvedTheme === 'dark',
    themeMode,
  };
}

/**
 * 現在のテーマがダークかどうかを判定
 */
export function useIsDarkTheme(): boolean {
  const { isDark } = useTheme();
  return isDark;
}

/**
 * テーマカラーのみを取得（軽量版）
 */
export function useColors(): Colors {
  const { colors } = useTheme();
  return colors;
}

export default useTheme;
