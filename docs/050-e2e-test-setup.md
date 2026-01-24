# 050: E2E Test Setup（Sprint 5）

## 概要

**目的:** Detox を使用した E2E テスト環境を構築し、主要ユーザーフローの自動テストを実装

**スコープ:**

- Detox 環境セットアップ
- iOS / Android テスト設定
- 主要フローのテストケース作成
- CI/CD 統合準備

**成功基準:**

- ✅ Detox テストが iOS Simulator で実行可能
- ✅ 主要フロー 5件以上のテストケース作成
- ✅ テスト成功率 100%（初期実装時）

---

## ユーザーストーリー

```
As a 開発者
I want to E2E テストで主要機能を自動検証したい
So that リグレッションを防ぎ、リリース品質を担保できる
```

---

## 受け入れ条件

| #   | 条件                                    | 検証方法                      | 担当 |
| --- | --------------------------------------- | ----------------------------- | ---- |
| 1   | Detox が正常にインストール・設定        | `detox test` 実行             | -    |
| 2   | iOS Simulator でテスト実行可能          | テスト実行・結果確認          | -    |
| 3   | 主要フロー 5件のテストケース            | テストファイル確認            | -    |
| 4   | 全テストケースがパス                    | CI 実行結果                   | -    |

---

## 依存関係

| 種類             | 詳細                                |
| ---------------- | ----------------------------------- |
| ✓ 入力依存       | 全機能実装完了                      |
| ✗ コード依存     | detox, jest                         |
| ✗ 他チケット依存 | 020, 030, 031, 041 等の機能完了     |

---

## Todo リスト

### Phase 1: Detox セットアップ

- [ ] Detox インストール
  ```bash
  npm install --save-dev detox
  npm install --save-dev jest
  ```
- [ ] .detoxrc.js 設定
- [ ] iOS ビルド設定
- [ ] Android ビルド設定（オプション）

### Phase 2: テスト環境構築

- [ ] e2e/ ディレクトリ作成
- [ ] jest.config.js (E2E用)
- [ ] テストユーティリティ作成

### Phase 3: テストケース作成

- [ ] TC-01: アプリ起動・タイムライン表示
- [ ] TC-02: Era Picker で時代ジャンプ
- [ ] TC-03: 検索 → 結果表示 → 詳細画面
- [ ] TC-04: ブックマーク追加・削除
- [ ] TC-05: 設定画面表示・テーマ切替

### Phase 4: CI 統合準備

- [ ] GitHub Actions ワークフロー作成（オプション）
- [ ] テスト実行スクリプト

---

## 実装ガイドライン

### Detox 設定

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    $0: 'jest',
    args: {
      config: 'e2e/jest.config.js',
      _: ['e2e'],
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/JidaiScope.app',
      build: 'xcodebuild -workspace ios/JidaiScope.xcworkspace -scheme JidaiScope -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
  },
};
```

### テストケース例

```typescript
// e2e/timeline.test.ts
import { device, element, by, expect } from 'detox';

describe('Timeline', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('TC-01: should display timeline on launch', async () => {
    await expect(element(by.id('timeline-canvas'))).toBeVisible();
  });

  it('TC-02: should jump to era when tapping era picker', async () => {
    await element(by.id('era-picker-edo')).tap();
    await expect(element(by.text('江戸時代'))).toBeVisible();
  });
});
```

```typescript
// e2e/search.test.ts
describe('Search', () => {
  it('TC-03: should show search results and navigate to detail', async () => {
    // 検索タブへ移動
    await element(by.id('tab-search')).tap();

    // 検索入力
    await element(by.id('search-input')).typeText('明治維新');

    // 結果表示確認
    await expect(element(by.id('search-result-0'))).toBeVisible();

    // 詳細画面遷移
    await element(by.id('search-result-0')).tap();
    await expect(element(by.id('event-detail-screen'))).toBeVisible();
  });
});
```

```typescript
// e2e/bookmarks.test.ts
describe('Bookmarks', () => {
  it('TC-04: should add and remove bookmark', async () => {
    // イベント詳細画面へ
    await element(by.id('event-marker-0')).tap();

    // ブックマーク追加
    await element(by.id('bookmark-button')).tap();
    await expect(element(by.id('bookmark-button-active'))).toBeVisible();

    // ブックマークタブで確認
    await element(by.id('back-button')).tap();
    await element(by.id('tab-bookmarks')).tap();
    await expect(element(by.id('bookmark-item-0'))).toBeVisible();

    // 削除
    await element(by.id('bookmark-item-0')).longPress();
    await element(by.text('削除')).tap();
    await expect(element(by.id('empty-bookmarks'))).toBeVisible();
  });
});
```

---

## ファイル構成

```
e2e/
├── jest.config.js
├── timeline.test.ts
├── search.test.ts
├── bookmarks.test.ts
├── settings.test.ts
└── utils/
    └── testHelpers.ts

.detoxrc.js
```

---

## テストケース一覧

| ID    | テストケース                         | 優先度 |
| ----- | ------------------------------------ | ------ |
| TC-01 | アプリ起動・タイムライン表示         | P0     |
| TC-02 | Era Picker で時代ジャンプ            | P0     |
| TC-03 | 検索 → 結果 → 詳細画面               | P0     |
| TC-04 | ブックマーク追加・削除               | P1     |
| TC-05 | 設定画面・テーマ切替                 | P1     |
| TC-06 | Paywall 表示（Pro機能タップ時）      | P1     |
| TC-07 | オンボーディング完了フロー           | P2     |

---

## 注意事項

### Expo との互換性

- Expo managed workflow では Detox の設定に注意が必要
- Development Build を使用してネイティブテスト実行

### CI 実行時間

- E2E テストは実行時間が長いため、PR マージ前のみ実行推奨
- Unit テストは常時実行

---

**作成日:** 2025-01-25
**優先度:** P1
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 全機能実装完了
