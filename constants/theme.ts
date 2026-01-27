/**
 * Theme Constants - Design Tokensへのブリッジ
 *
 * Note: このファイルは互換性のために残されています。
 * 新しいコードでは @/constants/tokens と @/hooks/useTheme を使用してください。
 */

import { Platform } from 'react-native';

import { getColors, TYPOGRAPHY } from './tokens';

// 旧フォーマットとの互換性のためのColors export
export const Colors = {
  light: {
    text: getColors('light').text,
    background: getColors('light').bg,
    tint: getColors('light').primary,
    icon: getColors('light').textSecondary,
    tabIconDefault: getColors('light').textTertiary,
    tabIconSelected: getColors('light').primary,
  },
  dark: {
    text: getColors('dark').text,
    background: getColors('dark').bg,
    tint: getColors('dark').primary,
    icon: getColors('dark').textSecondary,
    tabIconDefault: getColors('dark').textTertiary,
    tabIconSelected: getColors('dark').primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: TYPOGRAPHY.family.base,
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: TYPOGRAPHY.family.mono,
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
