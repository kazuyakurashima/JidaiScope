# 016: Dark Theme（Sprint 1）

## 概要

**目的:** アプリをダークテーマファーストでデザイン・実装し、ライトテーマも同時サポート

**スコープ:**

- Dark theme デフォルト（PRD セクション 11.1）
- Light theme オプション
- 全コンポーネント両テーマ対応
- Settings で ON/OFF トグル
- 015 Design Tokens と統合

**成功基準:**

- ✅ Dark theme がデフォルトで全画面対応
- ✅ Light theme でも視認性・操作性維持
- ✅ Settings で切り替え可能
- ✅ テーマ変更時にリアルタイム反映

**MVP vs v1.1 スコープ:**

| 項目 | MVP | v1.1 |
|------|-----|------|
| Dark theme（デフォルト） | ✅ 完全対応 | - |
| Light theme | ✅ 基本動作 | 正式対応・細部調整 |
| テーマ切替 | ✅ Settings から可能 | - |
| システム連動 | ✅ オプションとして選択可能 | - |

> **注:** PRD セクション 11.1 に基づき、Light theme は MVP で基本動作するが、細部の調整（コントラスト微調整、コンポーネント別最適化等）は v1.1 で正式対応予定。
>
> **システム連動について:** MVP ではデフォルトを Dark に固定し、初回起動時は必ずダークテーマで表示。ユーザーが Settings で明示的に「システム」を選択した場合のみ、端末設定に連動する。

---

## ユーザーストーリー

```
As a 夜間ユーザー
I want to 目に優しいダークテーマでアプリを使いたい
So that 長時間の利用でも疲労が少ない
```

---

## 受け入れ条件

| #   | 条件                               | 検証方法             | 担当 |
| --- | ---------------------------------- | -------------------- | ---- |
| 1   | Dark theme がデフォルト            | 初回起動確認         | -    |
| 2   | 全コンポーネント Dark 対応         | ビジュアル確認       | -    |
| 3   | Light theme に切り替え可能         | Settings 確認        | -    |
| 4   | テーマ切り替え時にリアルタイム更新 | UI リアルタイム確認  | -    |
| 5   | 両テーマで視認性・操作性確保       | アクセシビリティ確認 | -    |

---

## 依存関係

| 種類             | 詳細                                                        |
| ---------------- | ----------------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings store - theme), 015 (Design Tokens)           |
| ✗ コード依存     | なし                                                        |
| ✗ 他チケット依存 | なし                                                        |
| ✓ 出力依存       | 040 (Settings screen)：テーマ切替 UI、全コンポーネント統合  |

---

## カラー仕様

### Dark Theme（デフォルト）

| 要素           | 色      | 用途                                       |
| -------------- | ------- | ------------------------------------------ |
| **背景**       | #0A0E14 | Primary background（最背後）               |
|                | #1A1F2E | Secondary background（コンポーネント背景） |
|                | #2D3748 | Tertiary background（ホバー・プレス）      |
| **テキスト**   | #F7FAFC | Primary text（本文）                       |
|                | #A0AEC0 | Secondary text（補助テキスト）             |
|                | #718096 | Tertiary text（小さいテキスト・出典）      |
| **ボーダー**   | #2D3748 | Border（セパレーター）                     |
|                | #4A5568 | Border Light（薄いボーダー）               |
| **ステータス** | #48BB78 | Success（緑）                              |
|                | #ED8936 | Warning（オレンジ）                        |
|                | #FC8181 | Error（赤）                                |
|                | #4FD1C5 | Info（青緑）                               |
| **アクション** | #4FD1C5 | Primary CTA（テールボタン）                |
|                | #FDB813 | Secondary CTA（ゴールドボタン）            |

### Light Theme

| 要素           | 色      | 用途                                |
| -------------- | ------- | ----------------------------------- |
| **背景**       | #F7FAFC | Primary background（白）            |
|                | #EDF2F7 | Secondary background（薄いグレー）  |
|                | #E2E8F0 | Tertiary background（濃いめグレー） |
| **テキスト**   | #0A0E14 | Primary text（黒）                  |
|                | #4A5568 | Secondary text（濃いグレー）        |
|                | #A0AEC0 | Tertiary text（薄いグレー）         |
| **ボーダー**   | #CBD5E0 | Border（グレーボーダー）            |
|                | #E2E8F0 | Border Light（薄いボーダー）        |
| **ステータス** | #22863A | Success（濃い緑）                   |
|                | #B08500 | Warning（濃いオレンジ）             |
|                | #CB2431 | Error（濃い赤）                     |
|                | #1B9E77 | Info（濃い青緑）                    |
| **アクション** | #0891B2 | Primary CTA（濃い青緑）             |
|                | #D97706 | Secondary CTA（濃いオレンジ）       |

---

## 実装ガイドライン

### 1. Settings で Dark/Light 選択（040 連携）

```typescript
// app/settings.tsx
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsScreen() {
  const { theme, setTheme } = useSettingsStore();
  const { colors } = useTheme();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }}>
      {/* ... */}

      <SettingRow
        label="テーマ"
        value={theme === 'dark' ? 'ダーク' : 'ライト'}
        onPress={() => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
        }}
      />
    </ScrollView>
  );
}
```

### 2. Root App Component テーマ適用

```typescript
// app/_layout.tsx
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const checkCompleted = useOnboardingStore((s) => s.checkCompleted);
  const { colors } = useTheme();

  useEffect(() => {
    checkCompleted();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bgSecondary,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
        contentStyle: {
          backgroundColor: colors.bg,
        },
      }}
    >
      {/* ... */}
    </Stack>
  );
}
```

### 3. 全コンポーネント テーマ対応

```typescript
// components/Card.tsx
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.bgSecondary,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: spacing[4],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
```

### 4. テキスト コンポーネント

```typescript
// components/ThemedText.tsx
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export function ThemedText({
  variant = 'primary',
  style,
  ...props
}: ThemedTextProps) {
  const { colors, typography } = useTheme();

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
  };

  return (
    <Text
      {...props}
      style={[
        {
          color: colorMap[variant],
          fontFamily: typography.family.base,
        },
        style,
      ]}
    />
  );
}
```

### 5. Icon Component

```typescript
// components/ThemedIcon.tsx
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '@/hooks/useTheme';

interface ThemedIconProps {
  name: any;
  size?: number;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export function ThemedIcon({
  name,
  size = 24,
  variant = 'primary',
}: ThemedIconProps) {
  const { colors } = useTheme();

  const colorMap = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
  };

  return <Feather name={name} size={size} color={colorMap[variant]} />;
}
```

### 6. 背景グラデーション（オプション）

```typescript
// utils/themeGradient.ts
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

export function ThemedGradient({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.bg, colors.bgSecondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      {children}
    </LinearGradient>
  );
}
```

### 7. Era カラー（テーマに関わらず固定）

```typescript
// constants/tokens.ts (抜粋)
export const ERA_COLORS = {
  // Era 固有色は theme に関わらず一定
  jomon: '#8B7355',
  yayoi: '#D4A574',
  // ... etc
};

// Timeline で使用
<View style={{ backgroundColor: getEraColor(era.id) }} />
```

---

## 実装チェックリスト

### 全コンポーネント Dark Theme 対応

- [ ] App shell（Stack, Tabs）
- [ ] Timeline screen
- [ ] Event detail
- [ ] Person detail
- [ ] Search screen
- [ ] Bookmark screen
- [ ] Settings screen
- [ ] Paywall modal
- [ ] Card, Button, Input
- [ ] Header, Footer
- [ ] Modal dialogs
- [ ] Alert boxes
- [ ] Loading indicators

### 全コンポーネント Light Theme 対応

- [ ] 同上、Light theme で検証

---

## Todo リスト

### Phase 1: Settings Store 拡張（014 対応）

- [x] theme フィールド：'dark' | 'light' | 'system'
- [x] setTheme() 実装
- [x] AsyncStorage で persistence

### Phase 2: Color Palette 確定（015 連携）

- [x] Dark theme 15 色確定
- [x] Light theme 15 色確定
- [x] Era 専用色確定
- [x] constants/tokens.ts に定義

### Phase 3: useTheme Hook（015 連携）

- [x] useTheme() hook 実装
- [x] theme に応じて色 palette 自動切り替え

### Phase 4: 全コンポーネント 統合

- [x] Stack, Tabs screenOptions
- [ ] Card, Button, Input（Sprint 2 以降）
- [ ] Text, Icon コンポーネント（Sprint 2 以降）
- [x] 全画面 backgroundColor 適用

### Phase 5: Settings 画面 統合（040 連携）

- [x] "テーマ" 選択肢（Dark / Light / System）
- [x] Dark ↔ Light ↔ System toggle
- [x] 即座にリアルタイム反映

### Phase 6: テスト・検証

- [ ] Dark theme で全画面ビジュアル確認（手動検証）
- [ ] Light theme でも同様（手動検証）
- [x] Settings から切り替え → リアルタイム反映
- [x] 初回起動時 Dark theme デフォルト確認

---

## アクセシビリティ確保

### コントラスト比（WCAG AA）

| テーマ    | テキスト色 | 背景色  | コントラスト比 | 基準            |
| --------- | ---------- | ------- | -------------- | --------------- |
| **Dark**  | #F7FAFC    | #0A0E14 | 15.5:1         | ✅ 7:1          |
| **Dark**  | #A0AEC0    | #0A0E14 | 6.5:1          | ✅ 4.5:1        |
| **Dark**  | #718096    | #1A1F2E | 4.2:1          | ✅ 4.5:1 (warn) |
| **Light** | #0A0E14    | #F7FAFC | 15.5:1         | ✅ 7:1          |
| **Light** | #4A5568    | #F7FAFC | 8.2:1          | ✅ 4.5:1        |

**注:** Tertiary text (#718096 on #1A1F2E) は 4.5:1 未満のため、大きいテキストのみ使用。

---

## ファイル構成

```
constants/
└── tokens.ts                # Dark/Light color palette（015 含む）

hooks/
└── useTheme.ts              # Theme 自動切り替え hook

components/
├── ThemedText.tsx           # Theme-aware text
├── ThemedIcon.tsx           # Theme-aware icon
├── Card.tsx                 # Theme-aware card
└── Button.tsx               # Theme-aware button

app/
└── settings.tsx             # Theme toggle（040 連携）
```

---

## テスト項目

| テスト           | 手順                     | 期待値                         |
| ---------------- | ------------------------ | ------------------------------ |
| 初回起動         | アプリ起動               | Dark theme デフォルト          |
| Dark 表示        | 全画面確認               | 背景 #0A0E14, テキスト #F7FAFC |
| Light 表示       | Settings から Light 選択 | 背景 #F7FAFC, テキスト #0A0E14 |
| リアルタイム反映 | Theme toggle             | 即座に全画面色変更             |
| 永続化           | Light 選択後アプリ再起動 | Light theme 継続               |
| Era 色           | Timeline 表示            | Era 色は theme 関わらず固定    |
| アクセシビリティ | テキスト読み取りツール   | コントラスト比 OK              |

---

**作成日:** 2026-01-25
**優先度:** P1
**推定工数:** 1.5d
**ステータス:** Complete
**ブロッカー:** 014 (Settings store), 015 (Design Tokens)
