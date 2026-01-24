# 015: Design Tokens（Sprint 1）

## 概要

**目的:** UIデザインシステムの基盤となるカラー、タイポグラフィ、スペーシングなどの Design Tokens を一元管理

**スコープ:**

- Color tokens（15 era 専用色 + UI 色）
- Typography tokens（フォント サイズ、ウェイト、行高）
- Spacing tokens（8px グリッド）
- Duration tokens（アニメーション時間）
- Z-index tokens（レイヤー順）

**成功基準:**

- ✅ 全 UI コンポーネントで tokens 使用
- ✅ 一元管理で色変更時に全体同期
- ✅ Dark/Light テーマで自動切り替え
- ✅ Figma との同期可能な構造

---

## ユーザーストーリー

```
As a デザイナー・開発者
I want to Design Tokens を一元管理したい
So that テーマ変更時に全 UI が統一性を保つ
```

---

## 受け入れ条件

| #   | 条件                                 | 検証方法        | 担当 |
| --- | ------------------------------------ | --------------- | ---- |
| 1   | 15 era 専用色が定義される            | token 確認      | -    |
| 2   | UI 基本色（背景、テキスト等）定義    | token 確認      | -    |
| 3   | Dark/Light 2 テーマの token 切り替え | useTheme() 確認 | -    |
| 4   | 全コンポーネントが tokens 参照       | grep でチェック | -    |
| 5   | TypeScript 型安全性確保              | コンパイル確認  | -    |

---

## 依存関係

| 種類             | 詳細                                                |
| ---------------- | --------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings store - theme), 016 (Dark theme 実装) |
| ✗ コード依存     | なし                                                |
| ✗ 他チケット依存 | 全コンポーネント（統合対象）                        |

---

## Design Token 仕様

### Color Tokens（PRD セクション 11.2）

#### Era 専用色（15 era）

```typescript
const ERA_COLORS = {
  jomon: "#8B7355", // 縄文
  yayoi: "#D4A574", // 弥生
  kofun: "#A0826D", // 古墳
  asuka: "#9B59B6", // 飛鳥
  nara: "#E67E22", // 奈良
  heian: "#C0392B", // 平安
  kamakura: "#2E86AB", // 鎌倉
  muromachi: "#3A5C6E", // 室町
  sengoku: "#8E44AD", // 戦国
  azuchiMomoyama: "#D35400", // 安土桃山
  edo: "#16A085", // 江戸
  meiji: "#2980B9", // 明治
  taisho: "#8E44AD", // 大正
  showa: "#C0392B", // 昭和
  heisei: "#27AE60", // 平成
};
```

#### UI 色（Dark Theme）

```typescript
const COLORS_DARK = {
  // 背景
  bg: "#0A0E14", // --bg-primary: Black
  bgSecondary: "#1A1F2E", // --bg-secondary: Charcoal
  bgTertiary: "#2D3748", // --bg-tertiary: Dark Gray

  // テキスト
  text: "#F7FAFC", // --text-primary: White
  textSecondary: "#A0AEC0", // --text-secondary: Light Gray
  textTertiary: "#718096", // --text-tertiary: Medium Gray

  // ボーダー
  border: "#2D3748", // --border: Dark Gray
  borderLight: "#4A5568", // --border-light: Medium Gray

  // ステータス
  success: "#48BB78", // Green
  warning: "#ED8936", // Orange
  error: "#FC8181", // Red
  info: "#4FD1C5", // Teal

  // アクション
  primary: "#4FD1C5", // Teal - Primary CTA
  secondary: "#FDB813", // Gold - Secondary CTA
  accent: "#63B3ED", // Blue - Accent
};
```

#### UI 色（Light Theme）

```typescript
const COLORS_LIGHT = {
  // 背景
  bg: "#F7FAFC", // White
  bgSecondary: "#EDF2F7", // Light Gray
  bgTertiary: "#E2E8F0", // Medium Gray

  // テキスト
  text: "#0A0E14", // Black
  textSecondary: "#4A5568", // Dark Gray
  textTertiary: "#A0AEC0", // Light Gray

  // ボーダー
  border: "#CBD5E0", // Light Gray
  borderLight: "#E2E8F0", // Very Light Gray

  // ステータス
  success: "#22863A", // Dark Green
  warning: "#B08500", // Dark Orange
  error: "#CB2431", // Dark Red
  info: "#1B9E77", // Dark Teal

  // アクション
  primary: "#0891B2", // Dark Teal
  secondary: "#D97706", // Dark Gold
  accent: "#2563EB", // Dark Blue
};
```

### Typography Tokens

```typescript
const TYPOGRAPHY = {
  // Sizes
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    "2xl": 20,
    "3xl": 24,
    "4xl": 28,
    "5xl": 32,
  },

  // Weights
  weight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Family
  family: {
    base: "Hiragino Sans", // iOS デフォルト
    mono: "Courier New",
  },
};
```

### Spacing Tokens（8px グリッド）

```typescript
const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};
```

### Duration Tokens（アニメーション）

```typescript
const DURATION = {
  fast: 150, // ms
  normal: 300,
  slow: 500,
};
```

### Z-Index Tokens

```typescript
const Z_INDEX = {
  base: 0,
  dropdown: 100,
  modal: 1000,
  popover: 1100,
  notification: 1200,
};
```

### UI State Tokens（Loading / Error / Empty）

```typescript
// UI 状態別のスタイル定義
const UI_STATES = {
  loading: {
    spinnerSize: 32,
    spinnerColor: "primary", // colors.primary を参照
    overlayOpacity: 0.7,
    skeletonColor: {
      dark: "#2D3748",
      light: "#E2E8F0",
    },
  },
  error: {
    iconSize: 48,
    iconColor: "error", // colors.error を参照
    titleSize: "lg", // typography.size.lg
    messageSize: "base",
    retryButtonVariant: "secondary",
  },
  empty: {
    iconSize: 64,
    iconColor: "textTertiary",
    titleSize: "lg",
    messageSize: "base",
    illustrationMaxWidth: 200,
  },
};

// 使用例: Loading Skeleton
const SKELETON = {
  borderRadius: 4,
  shimmerDuration: 1500, // ms
  colors: {
    dark: {
      base: "#2D3748",
      highlight: "#4A5568",
    },
    light: {
      base: "#E2E8F0",
      highlight: "#EDF2F7",
    },
  },
};
```

### UI State コンポーネント仕様

| 状態    | 表示要素                       | 使用場面                         |
| ------- | ------------------------------ | -------------------------------- |
| Loading | Spinner + オーバーレイ         | データ取得中、画面遷移時         |
| Loading | Skeleton プレースホルダー      | リスト、カード読み込み中         |
| Error   | エラーアイコン + メッセージ    | API エラー、ネットワークエラー   |
| Error   | Retry ボタン                   | 再試行可能なエラー               |
| Empty   | イラスト + メッセージ          | 検索結果0件、ブックマーク未登録  |
| Empty   | CTA ボタン（オプション）       | 「最初のブックマークを追加」等   |

---

## 実装ガイドライン

### 1. tokens.ts 作成

```typescript
// constants/tokens.ts
import { useSettingsStore } from "@/stores/settingsStore";

export const ERA_COLORS = {
  jomon: "#8B7355",
  yayoi: "#D4A574",
  kofun: "#A0826D",
  asuka: "#9B59B6",
  nara: "#E67E22",
  heian: "#C0392B",
  kamakura: "#2E86AB",
  muromachi: "#3A5C6E",
  sengoku: "#8E44AD",
  azuchiMomoyama: "#D35400",
  edo: "#16A085",
  meiji: "#2980B9",
  taisho: "#8E44AD",
  showa: "#C0392B",
  heisei: "#27AE60",
};

const COLORS_DARK = {
  bg: "#0A0E14",
  bgSecondary: "#1A1F2E",
  bgTertiary: "#2D3748",
  text: "#F7FAFC",
  textSecondary: "#A0AEC0",
  textTertiary: "#718096",
  border: "#2D3748",
  borderLight: "#4A5568",
  success: "#48BB78",
  warning: "#ED8936",
  error: "#FC8181",
  info: "#4FD1C5",
  primary: "#4FD1C5",
  secondary: "#FDB813",
  accent: "#63B3ED",
};

const COLORS_LIGHT = {
  bg: "#F7FAFC",
  bgSecondary: "#EDF2F7",
  bgTertiary: "#E2E8F0",
  text: "#0A0E14",
  textSecondary: "#4A5568",
  textTertiary: "#A0AEC0",
  border: "#CBD5E0",
  borderLight: "#E2E8F0",
  success: "#22863A",
  warning: "#B08500",
  error: "#CB2431",
  info: "#1B9E77",
  primary: "#0891B2",
  secondary: "#D97706",
  accent: "#2563EB",
};

export const TYPOGRAPHY = {
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    "2xl": 20,
    "3xl": 24,
    "4xl": 28,
    "5xl": 32,
  },
  weight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  family: {
    base: "Hiragino Sans",
    mono: "Courier New",
  },
};

export const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};

export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};

export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  modal: 1000,
  popover: 1100,
  notification: 1200,
};

// テーマ適用関数
export function getColors(theme: "dark" | "light") {
  return theme === "dark" ? COLORS_DARK : COLORS_LIGHT;
}

// Hook: useTokens
export function useTokens() {
  const theme = useSettingsStore((s) => s.theme);

  return {
    colors: getColors(theme),
    typography: TYPOGRAPHY,
    spacing: SPACING,
    duration: DURATION,
    zIndex: Z_INDEX,
  };
}
```

### 2. useTheme Hook 統合（016 連携）

```typescript
// hooks/useTheme.ts
import { useTokens } from '@/constants/tokens';

export function useTheme() {
  return useTokens();
}

// 使用例
export default function MyComponent() {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.bg,
      padding: spacing[4],
    }}>
      <Text style={{
        color: colors.text,
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
      }}>
        Hello
      </Text>
    </View>
  );
}
```

### 3. コンポーネントでの使用

```typescript
// components/Button.tsx
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
}

export function Button({ onPress, label, variant = 'primary' }: ButtonProps) {
  const { colors, spacing, typography } = useTheme();

  const bgColor = variant === 'primary' ? colors.primary : colors.secondary;
  const textColor = colors.bg; // Contrast

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: bgColor,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        borderRadius: 8,
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: typography.size.base,
          fontWeight: typography.weight.semibold,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
```

### 4. Era カラー取得ユーティリティ

```typescript
// utils/eraColors.ts
import { ERA_COLORS } from '@/constants/tokens';

export function getEraColor(eraId: string): string {
  const colorMap: { [key: string]: string } = ERA_COLORS;
  return colorMap[eraId] || '#A0AEC0'; // Fallback
}

// 使用例: Timeline で era 帯の背景色
<View
  style={{
    backgroundColor: getEraColor(era.id),
  }}
/>
```

---

## Todo リスト

### Phase 1: Tokens 定義

- [ ] constants/tokens.ts 作成
- [ ] Color tokens（Era 15 色 + UI 色）定義
- [ ] Typography tokens（サイズ、ウェイト、行高）
- [ ] Spacing, Duration, Z-index tokens
- [ ] **UI State tokens（Loading / Error / Empty）定義**

### Phase 2: Hook・ユーティリティ

- [ ] useTokens() hook 実装
- [ ] useTheme() hook 統合（016 連携）
- [ ] getEraColor() ユーティリティ

### Phase 3: 全コンポーネント統合

- [ ] 既存コンポーネント全て tokens 参照に変更
- [ ] ハードコードされた色・サイズを置き換え
- [ ] StyleSheet の値を tokens から参照

### Phase 3.5: UI State コンポーネント作成

- [ ] components/ui/LoadingSpinner.tsx
- [ ] components/ui/LoadingSkeleton.tsx
- [ ] components/ui/ErrorState.tsx（アイコン + メッセージ + Retry）
- [ ] components/ui/EmptyState.tsx（イラスト + メッセージ + CTA）

### Phase 4: Dark/Light テーマ対応

- [ ] getColors(theme) で切り替え
- [ ] useSettingsStore.theme に同期
- [ ] Theme 変更時に全体リアルタイム更新

### Phase 5: Figma との同期

- [ ] tokens.json 生成スクリプト作成
- [ ] Figma Design Tokens plugin 対応（v1.1）

### Phase 6: テスト・検証

- [ ] 全コンポーネント色確認（Dark/Light）
- [ ] Typography サイズ確認
- [ ] Spacing 一貫性確認

---

## ファイル構成

```
constants/
└── tokens.ts                # 全 Design Tokens（Color, Typography, Spacing, UI States）

hooks/
└── useTheme.ts              # Token 参照 hook

utils/
└── eraColors.ts             # Era カラーマッピング

components/
└── ui/
    ├── LoadingSpinner.tsx   # ローディングスピナー
    ├── LoadingSkeleton.tsx  # スケルトンプレースホルダー
    ├── ErrorState.tsx       # エラー表示（Retry 付き）
    └── EmptyState.tsx       # 空状態表示（CTA 付き）
```

---

## テスト項目

| テスト            | 方法                  | 期待値                            |
| ----------------- | --------------------- | --------------------------------- |
| 色表示            | コンポーネント描画    | 正しい色表示（Dark/Light）        |
| Typography        | テキスト要素          | 適切なサイズ・ウェイト            |
| Spacing           | レイアウト            | 8px グリッド準拠                  |
| Theme 切り替え    | Settings から切り替え | 全体色同時に変更                  |
| Era 色            | Timeline に表示       | Era ごと色分け                    |
| LoadingSpinner    | データ取得中          | スピナー表示、正しい色            |
| LoadingSkeleton   | リスト読み込み中      | Shimmer アニメーション            |
| ErrorState        | API エラー時          | エラーアイコン + Retry ボタン     |
| EmptyState        | 検索結果 0 件         | イラスト + メッセージ表示         |

---

**作成日:** 2026-01-25
**優先度:** P1
**推定工数:** 1d
**ステータス:** Not Started
**ブロッカー:** なし（基盤）
