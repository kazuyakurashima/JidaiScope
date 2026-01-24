# 010: Build Environment Setup（Sprint 1）

## 概要

**目的:** EAS Build、環境変数、CI/CD基盤を整備し、開発・テスト・本番ビルドをスムーズに行える環境を構築

**スコープ:**

- EAS Build プロファイル設定（development/preview/production）
- 環境変数管理（.env, app.config.js）
- Bundle ID / Package Name 設定
- iOS/Android 証明書・キーストア準備
- GitHub Actions 基本設定（オプション）

**成功基準:**

- ✅ `eas build --profile development` が成功
- ✅ `eas build --profile preview` が成功
- ✅ 環境変数が正しく読み込まれる
- ✅ iOS Simulator / Android Emulator で動作確認

---

## ユーザーストーリー

```
As a 開発者
I want to ビルド環境を整備したい
So that 開発・テスト・リリースビルドを効率的に行える
```

---

## 受け入れ条件

| #   | 条件                                        | 検証方法                      | 担当 |
| --- | ------------------------------------------- | ----------------------------- | ---- |
| 1   | eas.json に3プロファイル定義                | ファイル確認                  | -    |
| 2   | development ビルドが成功                    | `eas build --profile development` | -    |
| 3   | preview ビルドが成功                        | `eas build --profile preview` | -    |
| 4   | 環境変数が app.config.js で参照可能         | console.log で確認            | -    |
| 5   | Bundle ID: com.jidaiscope.app               | Xcode / app.json 確認         | -    |

---

## 依存関係

| 種類             | 詳細                                |
| ---------------- | ----------------------------------- |
| ✓ 入力依存       | 001 Tech Validation 完了            |
| ✗ コード依存     | なし                                |
| ✗ 他チケット依存 | なし                                |
| ✓ 出力依存       | 011 (Navigation) は 010 完了後開始  |

---

## Todo リスト

### Phase 1: EAS セットアップ

- [ ] `npx eas-cli@latest login`
- [ ] `npx eas-cli@latest build:configure`
- [ ] eas.json 作成・編集

### Phase 2: プロファイル設定

- [ ] development プロファイル（シミュレーター用）
- [ ] preview プロファイル（TestFlight/内部テスト用）
- [ ] production プロファイル（App Store/Play Store用）

### Phase 3: 環境変数

- [ ] .env.development / .env.preview / .env.production 作成
- [ ] app.config.js で環境変数読み込み
- [ ] .gitignore に .env* 追加

### Phase 4: 証明書・キーストア

- [ ] iOS: Apple Developer 登録確認
- [ ] iOS: Provisioning Profile / Certificate 準備
- [ ] Android: Keystore 生成 / 管理

### Phase 5: 動作確認

- [ ] development ビルド実行・テスト
- [ ] preview ビルド実行・テスト

---

## 実装ガイドライン

### eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### app.config.js（環境変数対応）

```javascript
export default ({ config }) => {
  const ENV = process.env.APP_ENV || 'development';

  return {
    ...config,
    name: ENV === 'production' ? 'JidaiScope' : `JidaiScope (${ENV})`,
    slug: 'JidaiScope',
    version: '1.0.0',
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.jidaiscope.app',
    },
    android: {
      ...config.android,
      package: 'com.jidaiscope.app',
    },
    extra: {
      eas: {
        projectId: 'your-project-id',
      },
      appEnv: ENV,
    },
  };
};
```

### .env.development

```
APP_ENV=development
API_URL=http://localhost:3000
```

---

## ファイル構成

```
/
├── eas.json                 # EAS Build 設定
├── app.config.js            # Expo 設定（環境変数対応）
├── .env.development         # 開発環境変数
├── .env.preview             # プレビュー環境変数
├── .env.production          # 本番環境変数
└── .gitignore               # .env* を除外
```

---

## テスト項目

- [ ] `eas build --profile development --platform ios` 成功
- [ ] `eas build --profile development --platform android` 成功
- [ ] 環境変数が正しく読み込まれる
- [ ] Bundle ID / Package Name が正しい

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 0.5d
**ステータス:** Not Started
**ブロッカー:** 001 完了
