/**
 * Design Tokens - UIデザインシステムの基盤
 * Sprint 1: 015 Design Tokens
 */

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
} as const;

export type EraId = keyof typeof ERA_COLORS;

// ERA_COLORS を配列形式で取得（PoC コンポーネント用）
export const ERA_COLOR_ARRAY = Object.values(ERA_COLORS);

// =============================================================================
// Category Colors（イベントカテゴリ色）
// =============================================================================
export const CATEGORY_COLORS = {
  political: '#FF6B6B',   // 政治
  cultural: '#4ECDC4',    // 文化
  military: '#FFE66D',    // 軍事
  economic: '#95E1D3',    // 経済
  social: '#DDA0DD',      // 社会
} as const;

export type CategoryId = keyof typeof CATEGORY_COLORS;

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
    base: 'Hiragino Sans',
    mono: 'Courier New',
  },
} as const;

// =============================================================================
// Spacing（8px Grid System）
// Base unit: 4px, Grid unit: 8px
// 主要な値は8pxの倍数に整合
// =============================================================================
export const SPACING = {
  0: 0,
  1: 4,    // 0.5x grid (fine adjustment)
  2: 8,    // 1x grid
  3: 12,   // 1.5x grid
  4: 16,   // 2x grid
  6: 24,   // 3x grid
  8: 32,   // 4x grid
  10: 40,  // 5x grid
  12: 48,  // 6x grid
  16: 64,  // 8x grid
  20: 80,  // 10x grid
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
// UI States（Loading / Error / Empty）
// =============================================================================
export const UI_STATES = {
  loading: {
    spinnerSize: 32,
    spinnerColor: 'primary' as ColorKey,
    overlayOpacity: 0.7,
    skeletonColor: {
      dark: '#2D3748',
      light: '#E2E8F0',
    },
  },
  error: {
    iconSize: 48,
    iconColor: 'error' as ColorKey,
    titleSize: 'lg' as keyof typeof TYPOGRAPHY.size,
    messageSize: 'base' as keyof typeof TYPOGRAPHY.size,
    retryButtonVariant: 'secondary' as const,
  },
  empty: {
    iconSize: 64,
    iconColor: 'textTertiary' as ColorKey,
    titleSize: 'lg' as keyof typeof TYPOGRAPHY.size,
    messageSize: 'base' as keyof typeof TYPOGRAPHY.size,
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

// =============================================================================
// Export Types
// =============================================================================
export type Typography = typeof TYPOGRAPHY;
export type Spacing = typeof SPACING;
export type Radius = typeof RADIUS;
export type Duration = typeof DURATION;
export type ZIndex = typeof Z_INDEX;
export type UIStates = typeof UI_STATES;
