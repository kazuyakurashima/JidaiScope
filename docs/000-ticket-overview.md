# チケット・オーバービュー（000）

## プロジェクト構成

**コードネーム：ChronosEdge（クロノス・エッジ）**

日本史全時代を真比率タイムラインで表現し、ピンチズームで探索できるiOSアプリ。

---

## ナンバリング体系

| Sprint   | 番号範囲 | 概要               |
| -------- | -------- | ------------------ |
| Sprint 0 | 001-009  | 技術検証           |
| Sprint 1 | 010-019  | 基盤構築           |
| Sprint 2 | 020-029  | タイムラインコア   |
| Sprint 3 | 030-039  | 検索・詳細・共有 |
| Sprint 4 | 040-049  | 課金・設定         |
| Sprint 5 | 050-059  | 品質・リリース     |

---

## 全体スケジュール

| Sprint       | 期間     | 目標               | チケット                              |
| ------------ | -------- | ------------------ | ------------------------------------- |
| **Sprint 0** | Week 1   | 技術検証           | 001                                   |
| **Sprint 1** | Week 2-3 | 基盤構築           | 010, 011, 012, 013, 014, 015, 016     |
| **Sprint 2** | Week 3-4 | タイムラインコア   | 020, 021, 022, 023, 024, 025          |
| **Sprint 3** | Week 4-5 | 検索・詳細・共有     | 030, 031, 032, 033, 034, 035, 036, 037 |
| **Sprint 4** | Week 5-6 | 課金・設定         | 040, 041, 042, 043                    |
| **Sprint 5** | Week 6-7 | 品質・リリース     | 050, 052, 053, 054, 055               |

---

## 依存関係図（マインドマップ表現）

```
ChronosEdge MVP
│
├─ [Sprint 0: 技術検証] ━━━━━━━━━━━━━━━━━━━━━
│   │
│   └─ 001: Tech Validation & PoC
│       ├─ Skia + Expo互換性
│       ├─ ピンチズーム60fps
│       ├─ LOD滑らかさ
│       ├─ 幕末〜明治密集描画
│       └─ ハプティクス統合
│
├─ [Sprint 1: 基盤構築] ━━━━━━━━━━━━━━━━━━━━━
│   │
│   ├─ 010: Build Environment Setup
│   │   └─ EAS Build, 環境変数, CI/CD準備
│   │
│   ├─ 011: Navigation Architecture
│   │   └─ expo-router設定, Stack/Tab構成, Deep Link
│   │
│   ├─ 012: Database Schema & API
│   │   └─ SQLite, テーブル定義, Repository層
│   │
│   ├─ 013: Historical Data Preparation (並行可)
│   │   └─ 800件イベント, 300人物, 典拠100件
│   │
│   ├─ 014: State Management (Zustand)
│   │   ├─ timelineStore
│   │   ├─ searchStore
│   │   ├─ bookmarkStore
│   │   ├─ settingsStore
│   │   └─ appStore (Pro状態スタブ含む)
│   │
│   ├─ 015: Design Tokens
│   │   ├─ カラー、タイポ、スペーシング
│   │   └─ Loading/Error/Empty状態
│   │
│   └─ 016: Dark Theme
│       └─ ダークテーマ実装、テーマ切替
│
├─ [Sprint 2: タイムラインコア] ━━━━━━━━━━━━━━
│   │
│   ├─ 020: Timeline Core (TimelineCanvas)
│   │   ├─ Skia描画基本
│   │   ├─ 時代背景帯
│   │   ├─ イベントマーカー
│   │   ├─ 長押しプレビュー
│   │   └─ [依存] 012, 014, 015
│   │
│   ├─ 021: Zoom Manager
│   │   ├─ ピンチズーム
│   │   ├─ ダブルタップズーム (x2)
│   │   └─ [依存] 020
│   │
│   ├─ 022: LOD Manager (Level of Detail)
│   │   ├─ L0〜L3 切替ロジック
│   │   └─ [依存] 020, 021
│   │
│   ├─ 023: Era Picker
│   │   ├─ 時代選択UI
│   │   ├─ ジャンプアニメーション
│   │   └─ [依存] 020, 021
│   │
│   ├─ 024: Layer Management
│   │   ├─ 時代レイヤー（常時）
│   │   ├─ 主要事件レイヤー（常時）
│   │   ├─ 天皇/将軍/人物レイヤー
│   │   ├─ Free/Pro制限 (014のスタブ使用)
│   │   └─ [依存] 020, 014
│   │
│   └─ 025: Haptics Feedback
│       ├─ 時代境界通過
│       ├─ LOD切替
│       └─ [依存] 020, 022
│
├─ [Sprint 3: 検索・詳細・共有] ━━━━━━━━━━━━━
│   │
│   ├─ 030: Search Feature
│   │   ├─ 西暦/和暦/名称検索
│   │   ├─ 和暦対応: 明治〜令和 (MVP)
│   │   ├─ インクリメンタルサーチ
│   │   └─ [依存] 012, 014, 020
│   │
│   ├─ 031: Event Detail Screen
│   │   ├─ イベントカード UI
│   │   ├─ 関連人物・事件リンク
│   │   └─ [依存] 012, 020, 011
│   │
│   ├─ 032: Person Detail Screen
│   │   ├─ 人物カード UI
│   │   └─ [依存] 012, 031
│   │
│   ├─ 033: Source/典拠 Display
│   │   ├─ SourceBadge UI
│   │   └─ [依存] 013, 031
│   │
│   ├─ 034: Bookmarks Feature
│   │   ├─ ローカル保存
│   │   └─ [依存] 012, 014
│   │
│   └─ 035: Screenshot Sharing ← PRD FR-10 (MVP)
│       └─ [依存] 020
│
├─ [Sprint 4: 課金・設定] ━━━━━━━━━━━━━━━━━━
│   │
│   ├─ 040: Settings Screen
│   │   ├─ レイヤー表示切替
│   │   ├─ ハプティクス設定
│   │   ├─ テーマ設定
│   │   └─ [依存] 014, 024, 025
│   │
│   ├─ 041: IAP Billing
│   │   ├─ StoreKit 2統合
│   │   ├─ 購入・復元フロー
│   │   ├─ Pro状態を014に反映
│   │   └─ [依存] 014
│   │
│   ├─ 042: Paywall Screen
│   │   ├─ Pro案内UI
│   │   └─ [依存] 041
│   │
│   └─ 043: Onboarding Flow
│       ├─ 3ステップチュートリアル
│       └─ [依存] 020, 021, 023
│
└─ [Sprint 5: 品質・リリース] ━━━━━━━━━━━━━━━
    │
    ├─ 050: E2E Test Setup
    │   ├─ Detox環境構築
    │   ├─ 主要フロー自動テスト
    │   └─ [依存] 全機能実装後
    │
    ├─ 052: Accessibility
    │   ├─ WCAG 2.1 AA対応
    │   └─ [依存] 015
    │
    ├─ 053: Analytics
    │   └─ [依存] 014
    │
    ├─ 054: Privacy & Terms
    │   └─ [依存] なし
    │
    └─ 055: TestFlight & ASO
        └─ [依存] 全チケット完了
```

---

## チケット一覧（実装順序）

### **Sprint 0: 技術検証（Week 1）**

| #   | チケット              | 説明                                | 優先度 | 推定工数 | 依存 |
| --- | --------------------- | ----------------------------------- | ------ | -------- | ---- |
| 001 | Tech Validation & PoC | Skia/Expo互換性、幕末〜明治密集検証 | **P0** | 5d       | -    |

---

### **Sprint 1: 基盤構築（Week 2-3）**

| #   | チケット                    | 説明                                 | 優先度 | 推定工数 | 依存     |
| --- | --------------------------- | ------------------------------------ | ------ | -------- | -------- |
| 010 | Build Environment Setup     | EAS Build設定、環境変数、CI/CD準備   | **P0** | 0.5d     | 001      |
| 011 | Navigation Architecture     | expo-router、Stack/Tab、Deep Link    | **P0** | 1d       | 010      |
| 012 | Database Schema & API       | SQLiteスキーマ、Repository層         | **P0** | 1.5d     | 001      |
| 013 | Historical Data Preparation | 800件イベント、300人物、100典拠準備  | **P0** | 3d       | 012      |
| 014 | State Management            | Zustand全Store + Pro状態スタブ       | **P0** | 2d       | -        |
| 015 | Design Tokens               | カラー、タイポ、状態デザイン         | **P0** | 1.5d     | -        |
| 016 | Dark Theme                  | ダークテーマ実装、テーマ切替         | **P0** | 1d       | 015      |

**Sprint 1 合計: 10.5d（2名並行で約1週間）**

---

### **Sprint 2: タイムラインコア（Week 3-4）**

| #   | チケット         | 説明                               | 優先度 | 推定工数 | 依存              |
| --- | ---------------- | ---------------------------------- | ------ | -------- | ----------------- |
| 020 | Timeline Core    | TimelineCanvas、Skia描画           | **P0** | 3d       | 012, 014, 015     |
| 021 | Zoom Manager     | ピンチ/ダブルタップズーム          | **P0** | 1.5d     | 020               |
| 022 | LOD Manager      | L0〜L3切替ロジック                 | **P0** | 1.5d     | 020, 021          |
| 023 | Era Picker       | 時代ジャンプUI、アニメーション     | **P0** | 1.5d     | 020, 021          |
| 024 | Layer Management | レイヤー表示、Free/Pro制限スタブ   | **P0** | 2d       | 020, 014          |
| 025 | Haptics Feedback | ハプティクス統合                   | **P1** | 1d       | 020, 022          |

**Sprint 2 合計: 10.5d**

---

### **Sprint 3: 検索・詳細・共有（Week 4-5）**

| #   | チケット             | 説明                             | 優先度 | 推定工数 | 依存              |
| --- | -------------------- | -------------------------------- | ------ | -------- | ----------------- |
| 030 | Search Feature       | 西暦/和暦(近代)/名称検索         | **P0** | 2d       | 012, 014, 020     |
| 031 | Event Detail Screen  | イベント詳細画面                 | **P0** | 1.5d     | 012, 020, 011     |
| 032 | Person Detail Screen | 人物詳細画面                     | **P0** | 1.5d     | 012, 031          |
| 033 | Source Display       | 典拠表示（100件）                | **P1** | 1d       | 013, 031          |
| 034 | Bookmarks Feature    | ブックマーク保存・管理           | **P1** | 1d       | 012, 014          |
| 035 | Screenshot Share     | タイムラインキャプチャ・共有     | **P1** | 1d       | 020               |
| 036 | Year Ruler & Era Labels | 年代目盛り・時代名ラベル改善  | **P1** | 1d       | 020, 022          |
| 037 | EraPickerBar Sync    | EraPickerBar連動強化             | **P2** | 0.5d     | 023               |

**Sprint 3 合計: 9.5d**

---

### **Sprint 4: 課金・設定（Week 5-6）**

| #   | チケット        | 説明                           | 優先度 | 推定工数 | 依存              |
| --- | --------------- | ------------------------------ | ------ | -------- | ----------------- |
| 040 | Settings Screen | 全設定画面                     | **P1** | 1.5d     | 014, 024, 025     |
| 041 | IAP Billing     | StoreKit 2、購入・復元         | **P0** | 3d       | 014               |
| 042 | Paywall Screen  | Paywall UI                     | **P0** | 1d       | 041               |
| 043 | Onboarding      | 3ステップチュートリアル        | **P1** | 1.5d     | 020, 021, 023     |

**Sprint 4 合計: 7d**

---

### **Sprint 5: 品質・リリース（Week 6-7）**

| #   | チケット          | 説明                          | 優先度 | 推定工数 | 依存       |
| --- | ----------------- | ----------------------------- | ------ | -------- | ---------- |
| 050 | E2E Test Setup    | Detox環境、主要フローテスト   | **P1** | 1.5d     | 全機能     |
| 052 | Accessibility     | WCAG 2.1 AA対応               | **P0** | 2d       | 015        |
| 053 | Analytics         | イベント計測                  | **P1** | 1.5d     | 014        |
| 054 | Privacy & Terms   | プライバシーポリシー・利用規約| **P0** | 2d       | -          |
| 055 | TestFlight & ASO  | ベータテスト・ASO             | **P0** | 3d       | 全チケット |

**Sprint 5 合計: 10d**

---

## 番号対応表（旧→新）

| 旧番号 | 新番号 | チケット名                  |
| ------ | ------ | --------------------------- |
| 001    | 001    | Tech Validation             |
| 005    | 010    | Build Environment           |
| 015    | 011    | Navigation Architecture     |
| 010-A| 012    | Database Schema             |
| 010-B| 013    | Data Preparation            |
| 020    | 014    | State Management            |
| 180    | 015    | Design Tokens               |
| 190    | 016    | Dark Theme                  |
| 030    | 020    | Timeline Core               |
| 040    | 021    | Zoom Manager                |
| 050    | 022    | LOD Manager                 |
| 060    | 023    | Era Picker                  |
| 070    | 024    | Layer Management            |
| 120    | 025    | Haptics Feedback            |
| 080    | 030    | Search Feature              |
| 090    | 031    | Event Detail                |
| 100    | 032    | Person Detail               |
| 110    | 033    | Source Display              |
| 130    | 034    | Bookmarks                   |
| 140    | 040    | Settings Screen             |
| 150    | 041    | IAP Billing                 |
| 160    | 042    | Paywall Screen              |
| 170    | 043    | Onboarding                  |
| 245    | 050    | E2E Test Setup              |
| 200    | 035    | Screenshot Sharing          |
| 210    | 052    | Accessibility               |
| 220    | 053    | Analytics                   |
| 230    | 054    | Privacy Terms               |
| 240    | 055    | TestFlight ASO              |

---

## 並行開発ガイドライン

### 推奨並行作業パターン

```
Week 2-3 (Sprint 1):
├─ 開発者A: 010 → 012 → 013 (データ準備、時間かかる)
├─ 開発者B: 014 → 015 → 016
└─ 開発者C: 011 (完了後、020の準備)

Week 3-4 (Sprint 2):
├─ 開発者A: 020 → 021 → 022
├─ 開発者B: 023 → 024
└─ 開発者C: 025

Week 4-5 (Sprint 3):
├─ 開発者A: 030 → 031
├─ 開発者B: 032 → 033
└─ 開発者C: 034 → 035 + バグ修正

Week 5-6 (Sprint 4):
├─ 開発者A: 041 → 042
├─ 開発者B: 040 → 043
└─ (並行で 013 の残作業あれば対応)

Week 6-7 (Sprint 5):
├─ 開発者A: 052 → 055
├─ 開発者B: 053 → 050
└─ 開発者C: 054 → バグ修正
```

### チケット作業時の確認事項

各チケットファイルで以下の順序で進めてください：

```
1. 📋 概要セクション確認
2. ✅ 受け入れ条件確認
3. 🔗 依存関係確認（ブロック状態？）
4. 📝 Todo リスト確認・更新
5. 🛠️ 実装ガイドラインに従い実装
6. ✓ 各 Todo を完了マーク
7. 🧪 テスト項目クリア
8. ✅ チケット完了 → 親チケット(概要)を更新
```

---

## 工数サマリー

| Sprint   | 合計工数 | 並行開発時（2名） | バッファ込み |
| -------- | -------- | ----------------- | ------------ |
| Sprint 0 | 5d       | 5d                | 6d           |
| Sprint 1 | 10.5d    | 5-6d              | 7d           |
| Sprint 2 | 10.5d    | 5-6d              | 7d           |
| Sprint 3 | 9.5d     | 5d                | 6d           |
| Sprint 4 | 7d       | 4d                | 5d           |
| Sprint 5 | 10d      | 5d                | 6d           |
| **合計** | **52.5d**| **29-32d**        | **38d**      |

**推奨開発期間: 7週間（バッファ込み）**

---

## パフォーマンス基準

- フレームレート: **60fps（主要デバイス）**
- 起動時間: **2秒以内**
- メモリ: **200MB以下**
- 検索レスポンス: **100ms以内**

---

## オフライン対応

- すべてのコア機能（タイムライン、検索、ブックマーク）はオフライン動作必須
- 課金復元のみオンライン要求

---

## チケット進捗状況

### **Sprint 0: 技術検証**

- [x] [001-tech-validation.md](001-tech-validation.md) - Tech Validation & PoC ✅

### **Sprint 1: 基盤構築**

- [x] [010-build-environment.md](010-build-environment.md) - Build Environment Setup ✅
- [x] [011-navigation-architecture.md](011-navigation-architecture.md) - Navigation Architecture ✅
- [x] [012-database-schema.md](012-database-schema.md) - Database Schema & API ✅
- [x] [013-data-preparation.md](013-data-preparation.md) - Historical Data Preparation ✅
- [x] [014-state-management.md](014-state-management.md) - State Management ✅
- [x] [015-design-tokens.md](015-design-tokens.md) - Design Tokens ✅
- [x] [016-dark-theme.md](016-dark-theme.md) - Dark Theme ✅

### **Sprint 2: タイムラインコア**

- [x] [020-timeline-core.md](020-timeline-core.md) - Timeline Core ✅
- [x] [021-zoom-manager.md](021-zoom-manager.md) - Zoom Manager ✅
- [x] [022-lod-manager.md](022-lod-manager.md) - LOD Manager ✅
- [x] [023-era-picker.md](023-era-picker.md) - Era Picker ✅
- [x] [024-layer-management.md](024-layer-management.md) - Layer Management ✅
- [x] [025-haptics-feedback.md](025-haptics-feedback.md) - Haptics Feedback ✅

### **Sprint 3: 検索・詳細・共有**

- [x] [030-search-feature.md](030-search-feature.md) - Search Feature ✅
- [x] [031-event-detail-screen.md](031-event-detail-screen.md) - Event Detail ✅
- [x] [032-person-detail-screen.md](032-person-detail-screen.md) - Person Detail ✅
- [x] [033-source-display.md](033-source-display.md) - Source Display ✅
- [x] [034-bookmarks-feature.md](034-bookmarks-feature.md) - Bookmarks ✅
- [x] [035-screenshot-sharing.md](035-screenshot-sharing.md) - Screenshot Sharing ✅
- [ ] [036-year-ruler-era-labels.md](036-year-ruler-era-labels.md) - Year Ruler & Era Labels
- [ ] [037-era-picker-sync.md](037-era-picker-sync.md) - EraPickerBar Sync

### **Sprint 4: 課金・設定**

- [ ] [040-settings-screen.md](040-settings-screen.md) - Settings
- [ ] [041-iap-billing.md](041-iap-billing.md) - IAP Billing
- [ ] [042-paywall-screen.md](042-paywall-screen.md) - Paywall Screen
- [ ] [043-onboarding-flow.md](043-onboarding-flow.md) - Onboarding

### **Sprint 5: 品質・リリース**

- [ ] [050-e2e-test-setup.md](050-e2e-test-setup.md) - E2E Test Setup
- [ ] [052-accessibility.md](052-accessibility.md) - Accessibility
- [ ] [053-analytics.md](053-analytics.md) - Analytics
- [ ] [054-privacy-terms.md](054-privacy-terms.md) - Privacy & Terms
- [ ] [055-testflight-aso.md](055-testflight-aso.md) - TestFlight & ASO

---

## Sprint 進捗サマリー

| Sprint | チケット | ステータス | 更新日 |
|--------|----------|------------|--------|
| Sprint 0 | 001 Tech Validation | ✅ 完了 | 2025-01-24 |
| Sprint 1 | 010-016 基盤構築 (全7件) | ✅ 完了 | 2025-01-26 |
| Sprint 2 | 020-025 タイムラインコア (全6件) | ✅ 完了 | 2025-01-28 |
| Sprint 3 | 030-037 検索・詳細・共有 (6/8件) | 🔄 進行中 | 2025-01-29 |

> **Sprint 3 残作業:** 036 Year Ruler & Era Labels, 037 EraPickerBar Sync

---

## 技術スタック

```
フレームワーク: Expo SDK 51+
描画: @shopify/react-native-skia
ジェスチャー: react-native-gesture-handler
アニメーション: react-native-reanimated
状態管理: Zustand
DB: expo-sqlite
課金: react-native-iap (StoreKit 2)
ハプティクス: expo-haptics
テスト: Jest + Detox
```

---

## 注意事項

### Sprint 0 の重要性

- **幕末〜明治の密集描画** は MVP の成否を左右する最重要検証項目
- 50件/10年の密度でも可読性が維持される必要あり
- 失敗時の対応：LODルール見直し、v1.0でLog/Focusモード前倒し

### Free/Pro ロジック

- Sprint 1 で `014` に Pro 状態のスタブ（インターフェース）を実装
- Sprint 2 で `024` はスタブを使用してレイヤー制限を実装
- Sprint 4 で `041` が実際の IAP 処理を実装し、スタブを置き換え
- **これによりSprint跨ぎの依存関係を解消**

### データ準備

- `013` は最も時間がかかる作業（3日以上）
- 他のチケットと並行して進行可能
- 品質重視（典拠100件は教育現場で重要）

---

**最終更新:** 2025-01-29
**バージョン:** 3.1
