/**
 * Design Tokens - UIデザインシステムの基盤
 * Sprint 1: 015 Design Tokens
 */

import type { ThemeMode } from '@/types/store';

// =============================================================================
// Era Colors（15時代専用色）
// =============================================================================
export const ERA_COLORS = {
  jomon: '#8B7355',        // 縄文
  yayoi: '#D4A574',        // 弥生
  kofun: '#A0826D',        // 古墳
  asuka: '#9B59B6',        // 飛鳥
  nara: '#E67E22',         // 奈良
  heian: '#C0392B',        // 平安
  kamakura: '#2E86AB',     // 鎌倉
  muromachi: '#3A5C6E',    // 室町
  sengoku: '#8E44AD',      // 戦国
  azuchiMomoyama: '#D35400', // 安土桃山
  edo: '#16A085',          // 江戸
  meiji: '#2980B9',        // 明治
  taisho: '#8E44AD',       // 大正
  showa: '#C0392B',        // 昭和
  heisei: '#27AE60',       // 平成
  reiwa: '#3498DB',        // 令和
} as const;

export type EraId = keyof typeof ERA_COLORS;

// =============================================================================
// Colors Interface
// =============================================================================
export interface Colors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  primary: string;
  secondary: string;
  accent: string;
  overlay: string;
}

export type ColorKey = keyof Colors;

// =============================================================================
// UI Colors - Dark Theme
// =============================================================================
const COLORS_DARK: Colors = {
  // 背景
  bg: '#0A0E14',
  bgSecondary: '#1A1F2E',
  bgTertiary: '#2D3748',

  // テキスト
  text: '#F7FAFC',
  textSecondary: '#A0AEC0',
  textTertiary: '#718096',

  // ボーダー
  border: '#2D3748',
  borderLight: '#4A5568',

  // ステータス
  success: '#48BB78',
  warning: '#ED8936',
  error: '#FC8181',
  info: '#4FD1C5',

  // アクション
  primary: '#4FD1C5',
  secondary: '#FDB813',
  accent: '#63B3ED',

  // オーバーレイ
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// =============================================================================
// UI Colors - Light Theme
// =============================================================================
const COLORS_LIGHT: Colors = {
  // 背景
  bg: '#F7FAFC',
  bgSecondary: '#EDF2F7',
  bgTertiary: '#E2E8F0',

  // テキスト
  text: '#0A0E14',
  textSecondary: '#4A5568',
  textTertiary: '#A0AEC0',

  // ボーダー
  border: '#CBD5E0',
  borderLight: '#E2E8F0',

  // ステータス
  success: '#22863A',
  warning: '#B08500',
  error: '#CB2431',
  info: '#1B9E77',

  // アクション
  primary: '#0891B2',
  secondary: '#D97706',
  accent: '#2563EB',

  // オーバーレイ
  overlay: 'rgba(255, 255, 255, 0.7)',
};

// =============================================================================
// Typography
// =============================================================================
export const TYPOGRAPHY = {
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },
  weight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  family: {
    base: 'System',
    mono: 'Courier New',
  },
} as const;

// =============================================================================
// Spacing（8px Grid）
// =============================================================================
export const SPACING = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// =============================================================================
// Border Radius
// =============================================================================
export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// =============================================================================
// Duration（Animation）
// =============================================================================
export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 1000,
} as const;

// =============================================================================
// Z-Index
// =============================================================================
export const Z_INDEX = {
  base: 0,
  elevated: 10,
  dropdown: 100,
  sticky: 200,
  modal: 1000,
  popover: 1100,
  notification: 1200,
  tooltip: 1300,
} as const;

// =============================================================================
// UI States
// =============================================================================
export const UI_STATES = {
  loading: {
    spinnerSize: 32,
    overlayOpacity: 0.7,
  },
  error: {
    iconSize: 48,
  },
  empty: {
    iconSize: 64,
    illustrationMaxWidth: 200,
  },
} as const;

// =============================================================================
// Skeleton（Loading Placeholder）
// =============================================================================
export const SKELETON = {
  borderRadius: 4,
  shimmerDuration: 1500,
  colors: {
    dark: {
      base: '#2D3748',
      highlight: '#4A5568',
    },
    light: {
      base: '#E2E8F0',
      highlight: '#EDF2F7',
    },
  },
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * テーマに応じたカラーパレットを取得
 */
export function getColors(theme: 'dark' | 'light') {
  return theme === 'dark' ? COLORS_DARK : COLORS_LIGHT;
}

/**
 * ThemeModeからactualテーマを解決（system対応）
 * Note: systemの場合はデバイスの設定に依存するが、
 *       現時点ではdarkをデフォルトとする
 */
export function resolveTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme === 'system') {
    // TODO: Appearance.getColorScheme() で実際のシステム設定を取得
    return 'dark';
  }
  return theme;
}

// =============================================================================
// Export Types
// =============================================================================
export type Typography = typeof TYPOGRAPHY;
export type Spacing = typeof SPACING;
export type Radius = typeof RADIUS;
export type Duration = typeof DURATION;
export type ZIndex = typeof Z_INDEX;
