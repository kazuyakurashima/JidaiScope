# 011: Navigation Architecture（Sprint 1）

## 概要

**目的:** expo-router を使用したアプリ全体のナビゲーション構造を設計・実装

**スコープ:**

- ファイルベースルーティング設計
- Stack / Tab ナビゲーション構成
- 画面間パラメータ受け渡し
- Deep Link 設計（将来対応準備）
- TypeScript 型安全なルーティング

**成功基準:**

- ✅ 全8画面のルーティング定義完了
- ✅ Tab ナビゲーション動作
- ✅ Stack ナビゲーション（詳細画面）動作
- ✅ パラメータ受け渡し動作
- ✅ typed routes が有効

---

## ユーザーストーリー

```
As a ユーザー
I want to 画面間をスムーズに移動したい
So that 効率的に情報を探索できる
```

---

## 受け入れ条件

| #   | 条件                                    | 検証方法                | 担当 |
| --- | --------------------------------------- | ----------------------- | ---- |
| 1   | Tab ナビゲーション（3タブ）動作         | UI 確認                 | -    |
| 2   | Timeline → Event Detail 遷移            | タップで遷移確認        | -    |
| 3   | Event Detail → Person Detail 遷移       | タップで遷移確認        | -    |
| 4   | 検索結果 → 詳細画面遷移                 | 検索後タップで確認      | -    |
| 5   | Settings Modal 表示                     | 設定アイコンタップ      | -    |
| 6   | typed routes でコンパイルエラーなし     | TypeScript 確認         | -    |

---

## 依存関係

| 種類             | 詳細                               |
| ---------------- | ---------------------------------- |
| ✓ 入力依存       | 010 Build Environment 完了         |
| ✗ コード依存     | expo-router（既にインストール済み）|
| ✗ 他チケット依存 | なし                               |
| ✓ 出力依存       | 031, 032 等の詳細画面がルーティング依存 |

---

## 画面構成（PRD セクション14準拠）

| #   | 画面名          | ルート                  | 種類   |
| --- | --------------- | ----------------------- | ------ |
| 1   | Timeline (Home) | `/(tabs)/`              | Tab    |
| 2   | Search          | `/(tabs)/search`        | Tab    |
| 3   | Bookmarks       | `/(tabs)/bookmarks`     | Tab    |
| 4   | Event Detail    | `/event/[id]`           | Stack  |
| 5   | Person Detail   | `/person/[id]`          | Stack  |
| 6   | Settings        | `/settings`             | Modal  |
| 7   | Paywall         | `/paywall`              | Modal  |
| 8   | Onboarding      | `/onboarding`           | Stack  |

---

## Todo リスト

### Phase 1: ディレクトリ構造

- [ ] app/(tabs)/_layout.tsx - Tab レイアウト
- [ ] app/(tabs)/index.tsx - Timeline
- [ ] app/(tabs)/search.tsx - Search
- [ ] app/(tabs)/bookmarks.tsx - Bookmarks
- [ ] app/event/[id].tsx - Event Detail
- [ ] app/person/[id].tsx - Person Detail
- [ ] app/settings.tsx - Settings Modal
- [ ] app/paywall.tsx - Paywall Modal
- [ ] app/onboarding/index.tsx - Onboarding

### Phase 2: Tab ナビゲーション

- [ ] 3タブ構成（Timeline, Search, Bookmarks）
- [ ] タブアイコン設定
- [ ] タブラベル設定

### Phase 3: Stack ナビゲーション

- [ ] Event Detail Stack 設定
- [ ] Person Detail Stack 設定
- [ ] ヘッダー設定（戻るボタン）

### Phase 4: Modal 設定

- [ ] Settings Modal presentation
- [ ] Paywall Modal presentation

### Phase 5: パラメータ受け渡し

- [ ] Event Detail: eventId パラメータ
- [ ] Person Detail: personId パラメータ
- [ ] useLocalSearchParams 活用

### Phase 6: Deep Link 準備

- [ ] app.json の scheme 確認
- [ ] URL パターン設計（v1.1 実装）

---

## 実装ガイドライン

### ディレクトリ構造

```
app/
├── _layout.tsx              # Root Layout
├── (tabs)/
│   ├── _layout.tsx          # Tab Layout
│   ├── index.tsx            # Timeline (Home)
│   ├── search.tsx           # Search
│   └── bookmarks.tsx        # Bookmarks
├── event/
│   └── [id].tsx             # Event Detail
├── person/
│   └── [id].tsx             # Person Detail
├── settings.tsx             # Settings (Modal)
├── paywall.tsx              # Paywall (Modal)
└── onboarding/
    └── index.tsx            # Onboarding
```

### Root Layout

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="event/[id]"
          options={{
            title: 'イベント詳細',
            headerBackTitle: '戻る',
          }}
        />
        <Stack.Screen
          name="person/[id]"
          options={{
            title: '人物詳細',
            headerBackTitle: '戻る',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            title: '設定',
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            title: 'Pro版',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
```

### Tab Layout

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4FD1C5',
        tabBarStyle: {
          backgroundColor: '#0A0E14',
          borderTopColor: '#2D3748',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'タイムライン',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '検索',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'ブックマーク',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### パラメータ受け渡し

```typescript
// app/event/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // id を使ってイベントデータを取得
  return (
    <View>
      <Text>Event ID: {id}</Text>
    </View>
  );
}

// Timeline から遷移
import { useRouter } from 'expo-router';

function TimelineScreen() {
  const router = useRouter();

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };
}
```

---

## ファイル構成

```
app/
├── _layout.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── search.tsx
│   └── bookmarks.tsx
├── event/
│   └── [id].tsx
├── person/
│   └── [id].tsx
├── settings.tsx
├── paywall.tsx
└── onboarding/
    └── index.tsx
```

---

## テスト項目

| テスト                       | 期待値                      |
| ---------------------------- | --------------------------- |
| Tab 切り替え                 | 3タブ間で正常遷移           |
| Event Detail 遷移            | パラメータ付きで遷移        |
| 戻るボタン                   | 前画面に戻る                |
| Settings Modal               | モーダル表示・閉じる        |
| Deep Link（将来）            | URL からアプリ起動          |

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 1d
**ステータス:** Not Started
**ブロッカー:** 010 完了
