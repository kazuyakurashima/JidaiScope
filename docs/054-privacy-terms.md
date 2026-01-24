# 054: Privacy & Terms（Sprint 5）

## 概要

**目的:** プライバシーポリシー・利用規約を整備し、法的コンプライアンスを確保

**スコープ:**

- プライバシーポリシー（日本語・英語）
- 利用規約（日本語・英語）
- GDPR / CCPA 対応
- 個人情報保護方針
- データ削除機能

**成功基準:**

- ✅ プライバシーポリシー作成・公開
- ✅ 利用規約作成・公開
- ✅ アプリ内リンク設置
- ✅ GDPR オプトアウト機能実装
- ✅ 法務レビュー完了

---

## ユーザーストーリー

```
As a ユーザー
I want to アプリがどう個人情報を取り扱うか確認したい
So that 安心して使用できる
```

---

## 受け入れ条件

| #   | 条件                     | 検証方法          | 担当 |
| --- | ------------------------ | ----------------- | ---- |
| 1   | プライバシーポリシー公開 | Web サイト確認    | -    |
| 2   | 利用規約公開             | Web サイト確認    | -    |
| 3   | アプリ内にリンク設置     | Settings 確認     | -    |
| 4   | GDPR オプトアウト機能    | Settings 確認     | -    |
| 5   | 法務レビュー完了         | Document チェック | -    |

---

## 依存関係

| 種類             | 詳細                  |
| ---------------- | --------------------- |
| ✓ 入力依存       | 040 (Settings screen) |
| ✗ コード依存     | なし                  |
| ✗ 他チケット依存 | なし                  |

---

## 文書構成

### 1. プライバシーポリシー（要点）

- **個人情報の収集:** デバイスID, OS バージョン, 言語設定, ユーザープロパティ（Pro/Free など）
- **個人情報の使用:** アナリティクス（行動分析）、App Store/Google Play への報告
- **個人情報の保護:** 暗号化、セキュアストレージ
- **GDPR/CCPA:** オプトアウト機能、データ削除リクエスト対応
- **第三者共有:** 外部サービス（Amplitude, Firebase）への共有
- **お問い合わせ:** support@jidaiscope.app

### 2. 利用規約（要点）

- **利用許可:** 個人・教育用途のみ
- **禁止事項:** 商用利用、情報抽出、サーバー攻撃
- **知的財産:** コンテンツ（イベント・人物・出典）の著作権
- **免責事項:** 情報の正確性について責任を負わない
- **変更権:** ポリシー変更時に通知
- **準拠法:** 日本国法

---

## 実装ガイドライン

### 1. Settings 画面にリンク追加（040 連携）

```typescript
// app/settings.tsx
import * as Linking from 'expo-linking';

<SettingsSection title="サポート">
  <SettingRow
    label="プライバシーポリシー"
    value="開く"
    onPress={() => {
      Linking.openURL('https://jidaiscope.app/privacy');
    }}
  />

  <SettingRow
    label="利用規約"
    value="開く"
    onPress={() => {
      Linking.openURL('https://jidaiscope.app/terms');
    }}
  />
</SettingsSection>
```

### 2. GDPR オプトアウト（Settings 画面）

```typescript
// stores/settingsStore.ts
interface SettingsState {
  analyticsOptIn: boolean;
  setAnalyticsOptIn: (optIn: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      analyticsOptIn: true,
      setAnalyticsOptIn: (optIn) => {
        set({ analyticsOptIn: optIn });
        // Analytics disable
        if (!optIn) {
          useAnalyticsStore.getState().disableTracking();
        }
      },
    }),
    { name: "settings-store" },
  ),
);
```

### 3. Settings UI

```typescript
// app/settings.tsx
<SettingsSection title="プライバシー">
  <SettingToggle
    label="アナリティクスに参加"
    value={analyticsOptIn}
    onValueChange={setAnalyticsOptIn}
  />
  <Text style={styles.hint}>
    あなたの操作データを匿名で収集し、アプリ改善に使用します
  </Text>
</SettingsSection>
```

### 4. データ削除リクエスト

```typescript
// utils/dataReset.ts
export async function initiateDataDeletion() {
  // 1. ローカルデータ削除
  await AsyncStorage.clear();

  // 2. SecureStore データ削除
  await SecureStore.deleteItemAsync("receipt");

  // 3. SQLite データベースリセット
  const db = await openDatabaseAsync("jidaiscope.db");
  await db.execAsync("DELETE FROM bookmark; DELETE FROM settings;");

  // 4. サーバー側リクエスト（v1.1）
  // await deleteUserDataServer();

  // 5. アナリティクス無効化
  useSettingsStore.getState().setAnalyticsOptIn(false);
}
```

---

## Todo リスト

### Phase 1: プライバシーポリシー作成

- [ ] 日本語版ドラフト作成
- [ ] 英語版翻訳
- [ ] 法務レビュー

### Phase 2: 利用規約作成

- [ ] 日本語版ドラフト作成
- [ ] 英語版翻訳
- [ ] 法務レビュー

### Phase 3: Web サイト公開

- [ ] privacy ページ公開
- [ ] terms ページ公開
- [ ] SSL 証明書確認

### Phase 4: アプリ内統合

- [ ] Settings 画面にリンク追加（040 連携）
- [ ] GDPR オプトアウト UI 実装
- [ ] データ削除機能実装

### Phase 5: テスト

- [ ] 各リンク動作確認
- [ ] オプトアウト後にアナリティクス停止確認
- [ ] データ削除動作確認

---

**作成日:** 2026-01-25
**優先度:** P1
**推定工数:** 2d
**ステータス:** Not Started
**ブロッカー:** なし
