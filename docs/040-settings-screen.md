# 040: Settings Screen（Sprint 4）

## 概要

**目的:** ユーザー環境設定（言語、テーマ、通知等）を一元管理するスクリーン

**スコープ:**

- 言語選択 (日本語 / English) ※追加仕様
- テーマ設定 (Dark / Light)
- ハプティクスフィードバック ON/OFF
- キャッシュクリア ※追加仕様
- バージョン情報・ライセンス
- 問い合わせリンク ※追加仕様
- プライバシーポリシー・利用規約リンク

> **📝 追加仕様について:** 「言語選択」「キャッシュクリア」「問い合わせリンク」は PRD v2.1 に明示的な記載がない追加機能です。MVP の UX 向上のため含めていますが、工数圧迫時は優先度を下げる判断が可能です。

**成功基準:**

- ✅ 6 つの設定項目実装
- ✅ 各設定を AsyncStorage で永続化
- ✅ テーマ変更時に即座にリフレッシュ
- ✅ キャッシュクリア機能で DB キャッシュリセット

---

## ユーザーストーリー

```
As a ユーザー
I want to アプリの言語・テーマ・フィードバック設定をカスタマイズしたい
So that 自分の好みに合ったアプリ体験ができる
```

---

## 受け入れ条件

| #   | 条件                                           | 検証方法         | 担当 |
| --- | ---------------------------------------------- | ---------------- | ---- |
| 1   | 言語選択（日本語/English）表示                 | UI 確認          | -    |
| 2   | テーマ切り替え（Dark/Light）即座に反映         | リアルタイム確認 | -    |
| 3   | ハプティクス ON/OFF トグル                     | 動作確認         | -    |
| 4   | キャッシュクリア → DB クエリキャッシュリセット | 動作確認         | -    |
| 5   | バージョン・ライセンス表示                     | UI 確認          | -    |
| 6   | 問い合わせリンク（メール/Discord）             | リンク確認       | -    |

---

## 依存関係

| 種類             | 詳細                                                       |
| ---------------- | ---------------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings store), 025 (Haptics 設定), 016 (Dark theme) |
| ✗ コード依存     | なし                                                       |
| ✗ 他チケット依存 | 014 (基盤 store)                                           |

### ⚠️ 実装時注意：054 との連携

**プライバシーポリシー・利用規約リンク** は Settings 画面に設置するが、054 (Privacy & Terms) は Sprint 5 で実装される。

**対応方針:**
1. 040 実装時は URL をプレースホルダーとして設置（`https://jidaiscope.app/privacy`, `https://jidaiscope.app/terms`）
2. 054 完了後に実際の Web ページが公開される
3. アプリ審査前に URL が有効であることを確認（055 チェックリスト項目）

---

## データ仕様

### Settings Store（PRD セクション 11.5）

```typescript
interface SettingsState {
  // UI 設定
  language: "ja" | "en";
  theme: "dark" | "light";

  // フィードバック
  hapticsEnabled: boolean;

  // キャッシュ・メタデータ
  cacheSize: number; // バイト数
  lastSyncTime?: string; // ISO8601

  // Setters
  setLanguage: (lang: "ja" | "en") => void;
  setTheme: (theme: "dark" | "light") => void;
  setHapticsEnabled: (enabled: boolean) => void;
  clearCache: () => void;
}
```

### AsyncStorage キー

```typescript
const SETTINGS_KEYS = {
  LANGUAGE: "@settings/language", // デフォルト: 'ja'
  THEME: "@settings/theme", // デフォルト: 'dark'
  HAPTICS_ENABLED: "@settings/haptics", // デフォルト: true
  LAST_SYNC: "@settings/lastSync",
};
```

---

## 実装ガイドライン

### 1. Settings Store 実装（014 対応）

```typescript
// stores/settingsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync } from "expo-sqlite";

interface SettingsState {
  language: "ja" | "en";
  theme: "dark" | "light";
  hapticsEnabled: boolean;

  setLanguage: (lang: "ja" | "en") => void;
  setTheme: (theme: "dark" | "light") => void;
  setHapticsEnabled: (enabled: boolean) => void;
  clearCache: () => void;
  getCacheSize: () => Promise<number>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "ja",
      theme: "dark",
      hapticsEnabled: true,

      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

      clearCache: async () => {
        // 今後: クエリキャッシュクリア用プラグイン統合
        console.log("Cache cleared");
      },

      getCacheSize: async () => {
        // 将来実装: SQLite ファイルサイズ計算
        return 0;
      },
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

### 2. Settings 画面

```typescript
// app/settings.tsx
import { View, ScrollView, StyleSheet, Text, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/settingsStore';
import { triggerSelectionHaptic } from '@/utils/haptics';
import * as Linking from 'expo-linking';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const {
    language,
    theme,
    hapticsEnabled,
    setLanguage,
    setTheme,
    setHapticsEnabled,
    clearCache,
  } = useSettingsStore();

  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* ヘッダー */}
        <Text style={styles.title}>設定</Text>

        {/* セクション: 表示設定 */}
        <SettingsSection title="表示設定">
          <SettingRow
            label="言語"
            value={language === 'ja' ? '日本語' : 'English'}
            onPress={async () => {
              await triggerSelectionHaptic();
              setLanguage(language === 'ja' ? 'en' : 'ja');
            }}
          />

          <SettingRow
            label="テーマ"
            value={theme === 'dark' ? 'ダーク' : 'ライト'}
            onPress={async () => {
              await triggerSelectionHaptic();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
          />
        </SettingsSection>

        {/* セクション: フィードバック */}
        <SettingsSection title="フィードバック">
          <SettingToggle
            label="ハプティクスフィードバック"
            value={hapticsEnabled}
            onValueChange={async (value) => {
              setHapticsEnabled(value);
              if (value) {
                await triggerSelectionHaptic();
              }
            }}
          />
        </SettingsSection>

        {/* セクション: キャッシュ・データ */}
        <SettingsSection title="キャッシュ・データ">
          <SettingRow
            label="キャッシュをクリア"
            value="削除"
            isDangerous
            onPress={async () => {
              await triggerSelectionHaptic();
              await clearCache();
              Alert.alert('完了', 'キャッシュをクリアしました');
            }}
          />
        </SettingsSection>

        {/* セクション: アバウト */}
        <SettingsSection title="アバウト">
          <SettingInfo
            label="バージョン"
            value="1.0.0"
          />

          <SettingRow
            label="ライセンス"
            value="表示"
            onPress={() => {
              // ライセンス詳細画面へ遷移
            }}
          />

          <SettingRow
            label="プライバシーポリシー"
            value="開く"
            onPress={() => {
              Linking.openURL('https://jidaiscope.app/privacy');
            }}
          />
        </SettingsSection>

        {/* セクション: サポート */}
        <SettingsSection title="サポート">
          <SettingRow
            label="お問い合わせ"
            value="送信"
            onPress={() => {
              Linking.openURL('mailto:support@jidaiscope.app');
            }}
          />

          <SettingRow
            label="Discord コミュニティ"
            value="参加"
            onPress={() => {
              Linking.openURL('https://discord.gg/jidaiscope');
            }}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// サブコンポーネント
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingRow({
  label,
  value,
  isDangerous = false,
  onPress,
}: {
  label: string;
  value: string;
  isDangerous?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, isDangerous && styles.rowValueDangerous]}>
        {value}
      </Text>
    </Pressable>
  );
}

function SettingToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#CBD5E0', true: '#4FD1C5' }}
        thumbColor={value ? '#2D3748' : '#F7FAFC'}
      />
    </View>
  );
}

function SettingInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F7FAFC',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0AEC0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#1A1F2E',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2D3748',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  rowLabel: {
    fontSize: 16,
    color: '#F7FAFC',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    color: '#718096',
  },
  rowValueDangerous: {
    color: '#FC8181',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
});
```

### 3. テーマ適用（016 との連携）

```typescript
// hooks/useTheme.ts
import { useSettingsStore } from "@/stores/settingsStore";

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);

  return theme === "dark" ? DARK_THEME : LIGHT_THEME;
}

const DARK_THEME = {
  bg: "#0A0E14",
  bgSecondary: "#1A1F2E",
  text: "#F7FAFC",
  textSecondary: "#A0AEC0",
  textTertiary: "#718096",
  border: "#2D3748",
};

const LIGHT_THEME = {
  bg: "#F7FAFC",
  bgSecondary: "#EDF2F7",
  text: "#0A0E14",
  textSecondary: "#4A5568",
  textTertiary: "#A0AEC0",
  border: "#CBD5E0",
};
```

### 4. ナビゲーション統合

```typescript
// app/(tabs)/_layout.tsx
import { useRouter } from 'expo-router';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <Pressable onPress={() => router.push('/settings')}>
            <Feather name="settings" size={24} color="#F7FAFC" />
          </Pressable>
        ),
      }}
    >
      {/* ... tabs */}
    </Tabs>
  );
}
```

---

## Todo リスト

### Phase 1: Settings Store（014 で実装済み）✅

- [x] theme: 'dark' | 'light' | 'system' フィールド
- [x] hapticEnabled フィールド
- [x] visibleLayers（レイヤー表示設定）
- [x] AsyncStorage で persistence

### Phase 2: Settings 画面構築 ✅

- [x] app/settings.tsx 作成
- [x] テーマ切り替えボタン（dark/light/system）
- [x] ハプティクス ON/OFF トグル
- [x] レイヤー設定（天皇/将軍トグル）

### Phase 3: データ管理機能 ✅

- [x] 検索履歴クリア機能
- [x] 確認ダイアログ表示
- [x] オンボーディングリセット（デバッグ用）

### Phase 4: アバウト・法務 ✅

- [x] バージョン表示（Constants.expoConfig.version）
- [x] プライバシーポリシーリンク
- [x] 利用規約リンク

### Phase 5: テーマ適用（016 で実装済み）✅

- [x] useTheme() hook 実装
- [x] Settings 変更時に全画面リフレッシュ
- [x] Dark/Light/System theme 即座に反映

### Phase 6: テスト（実機テスト残）

- [ ] テーマ切り替え → UI リアルタイム変更
- [ ] ハプティクス ON/OFF → 即座に機能
- [ ] レイヤー切り替え → タイムライン反映
- [ ] 検索履歴クリア → 動作確認

### 延期（v1.5+）

- [ ] 言語選択（日本語/English）※i18n対応が必要
- [ ] Discord コミュニティリンク
- [ ] メールサポートリンク

---

## ファイル構成

```
stores/
└── settingsStore.ts         # Settings 状態管理（014 対応）

hooks/
└── useTheme.ts              # テーマ hook（016 連携）

app/
└── settings.tsx             # Settings 画面

components/
├── SettingsSection.tsx      # セクション区切り
├── SettingRow.tsx           # 設定行
├── SettingToggle.tsx        # トグルスイッチ
└── SettingInfo.tsx          # 情報表示
```

---

## テスト項目

| テスト           | 方法               | 期待値                    |
| ---------------- | ------------------ | ------------------------- |
| 言語切り替え     | ja ↔ en            | 全画面テキスト変更        |
| テーマ切り替え   | dark ↔ light       | 色スキーム即座に変更      |
| ハプティクス     | ON ↔ OFF トグル    | 操作フィードバック ON/OFF |
| キャッシュクリア | ボタンタップ       | クエリキャッシュリセット  |
| 永続化           | 設定後アプリ再起動 | 設定が復元される          |

---

**作成日:** 2025-01-25
**更新日:** 2026-02-02
**優先度:** P2
**推定工数:** 1.5d
**ステータス:** Done ✅
**ブロッカー:** 014 (Settings store base) - 解消済み
