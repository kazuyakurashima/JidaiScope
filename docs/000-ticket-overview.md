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
| Sprint 3 | 030-043  | 検索・詳細・共有・UI完成 |
| Sprint 4 | 040, 050-055 | 設定・品質・リリース |
| v1.5+    | 041-046  | 課金・世界史連携   |

---

## 全体スケジュール

| Sprint       | 期間     | 目標                   | チケット                                           |
| ------------ | -------- | ---------------------- | -------------------------------------------------- |
| **Sprint 0** | Week 1   | 技術検証               | 001                                                |
| **Sprint 1** | Week 2-3 | 基盤構築               | 010, 011, 012, 013, 014, 015, 016                  |
| **Sprint 2** | Week 3-4 | タイムラインコア       | 020, 021, 022, 023, 024, 025                       |
| **Sprint 3** | Week 4-6 | 検索・詳細・UI完成     | 030-035 ✅, 036 🔄, 037→038, 038 ✅, 038-ext ✅, 039 ✅, 024-ext ✅, 043 ✅ |
| **Sprint 4** | Week 6-7 | 設定・品質・リリース   | 040, 050, 052, 053, 054, 055                       |
| **v1.5+**    | Post-MVP | 課金・世界史連携       | 041, 042, 044 (中国), 045 (米), 046 (英)           |

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
│   ├─ 013: Historical Data Preparation (012完了後に並行可)
│   │   ├─ 800件イベント, 300人物, 典拠100件
│   │   └─ ※ 012でスキーマ確定後、他チケットと並行でデータ投入可
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
│   │   ├─ MVP: 全機能開放（v1.5で制限導入）
│   │   └─ [依存] 020, 014
│   │
│   └─ 025: Haptics Feedback
│       ├─ 時代境界通過
│       ├─ LOD切替
│       └─ [依存] 020, 022
│
├─ [Sprint 3: 検索・詳細・UI完成] ━━━━━━━━━━━━━
│   │
│   ├─ 030: Search Feature ✅
│   │   ├─ 西暦/和暦/名称検索
│   │   ├─ 和暦対応: 全時代（大化〜令和）
│   │   ├─ インクリメンタルサーチ
│   │   └─ [依存] 012, 014, 020
│   │
│   ├─ 031: Event Detail Screen ✅
│   │   ├─ イベントカード UI
│   │   ├─ 関連人物・事件リンク
│   │   └─ [依存] 012, 020, 011
│   │
│   ├─ 032: Person Detail Screen ✅
│   │   ├─ 人物カード UI
│   │   └─ [依存] 012, 031
│   │
│   ├─ 033: Source/典拠 Display ✅
│   │   ├─ SourceBadge UI
│   │   └─ [依存] 013, 031
│   │
│   ├─ 034: Bookmarks Feature ✅
│   │   ├─ ローカル保存
│   │   └─ [依存] 012, 014
│   │
│   ├─ 035: Screenshot Sharing ✅
│   │   └─ [依存] 020
│   │
│   ├─ 036: Year Ruler & Era Labels
│   │   ├─ 年代目盛り（LOD連動）
│   │   ├─ 全時代和暦対応
│   │   └─ [依存] 020, 022
│   │
│   ├─ 037: EraPickerBar Sync → 038に統合
│   │
│   ├─ 038: EraPickerBar Redesign ✅
│   │   ├─ 可変幅チップナビゲーション
│   │   ├─ 真比率ミニマップ
│   │   ├─ 037の自動スクロール機能を統合
│   │   └─ [依存] 023, 037
│   │
│   ├─ 038-ext: Selection Sync UX ✅
│   │   ├─ タップ即時ハイライト + 再タップ解除
│   │   ├─ 長押しで時代詳細画面へ遷移
│   │   └─ [依存] 038
│   │
│   ├─ 039: Context Header ✅
│   │   ├─ 現在位置情報の常時表示
│   │   ├─ 時代名/年代/天皇・将軍
│   │   ├─ LOD連動で表示情報増減
│   │   └─ [依存] 020, 022, 024
│   │
│   ├─ 024-ext: 天皇将軍LOD連動強化 【024拡張】
│   │   ├─ L0: 非表示
│   │   ├─ L1: マイルストーンのみ
│   │   ├─ L2: 帯表示（名前なし）
│   │   ├─ L3: 帯+名前
│   │   └─ [依存] 024
│   │
│   └─ 043: Onboarding Flow 【Sprint 4から移動】
│       ├─ 3ステップチュートリアル
│       ├─ ジェスチャーデモ
│       └─ [依存] 020, 021, 023
│
├─ [Sprint 4: 設定・品質・リリース] ━━━━━━━━━━━━
│   │
│   ├─ 040: Settings Screen
│   │   ├─ レイヤー表示切替
│   │   ├─ ハプティクス設定
│   │   ├─ テーマ設定
│   │   └─ [依存] 014, 024, 025
│   │
│   ├─ 050: E2E Test Setup
│   │   ├─ Detox環境構築
│   │   └─ [依存] 全機能実装後
│   │
│   ├─ 052: Accessibility
│   │   └─ [依存] 015
│   │
│   ├─ 053: Analytics
│   │   └─ [依存] 014
│   │
│   ├─ 054: Privacy & Terms
│   │   └─ [依存] なし
│   │
│   └─ 055: TestFlight & ASO
│       └─ [依存] 全チケット完了
│
├─ [v1.5+: 課金・世界史連携] ━━━━━━━━━━━━━━━
│   │
│   ├─ 041: IAP Billing
│   │   ├─ StoreKit 2統合
│   │   ├─ 購入・復元フロー
│   │   └─ [依存] 014
│   │
│   ├─ 042: Paywall Screen
│   │   ├─ Pro案内UI
│   │   └─ [依存] 041
│   │
│   └─ 044: 中国王朝連携 【新規・Pro限定】
│       ├─ 王朝バー追加
│       ├─ EraPickerBar 2段化
│       └─ [依存] 038, 041
│
└─ [v1.5+: 追加世界史連携]
    │
    ├─ 045: アメリカ史連携 【Pro限定】
    │   └─ [依存] 044
    │
    └─ 046: イギリス史連携 【Pro限定】
        └─ [依存] 044
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
| 024 | Layer Management | レイヤー表示（MVP全開放）          | **P0** | 2d       | 020, 014          |
| 025 | Haptics Feedback | ハプティクス統合                   | **P1** | 1d       | 020, 022          |

**Sprint 2 合計: 10.5d**

---

### **Sprint 3: 検索・詳細・UI完成（Week 4-6）**

| #   | チケット             | 説明                             | 優先度 | 推定工数 | 依存              | 状態 |
| --- | -------------------- | -------------------------------- | ------ | -------- | ----------------- | ---- |
| 030 | Search Feature       | 西暦/和暦(全時代)/名称検索       | **P0** | 2d       | 012, 014, 020     | ✅   |
| 031 | Event Detail Screen  | イベント詳細画面                 | **P0** | 1.5d     | 012, 020, 011     | ✅   |
| 032 | Person Detail Screen | 人物詳細画面                     | **P0** | 1.5d     | 012, 031          | ✅   |
| 033 | Source Display       | 典拠表示（100件）                | **P1** | 1d       | 013, 031          | ✅   |
| 034 | Bookmarks Feature    | ブックマーク保存・管理           | **P1** | 1d       | 012, 014          | ✅   |
| 035 | Screenshot Share     | タイムラインキャプチャ・共有     | **P1** | 1d       | 020               | ✅   |
| 036 | Year Ruler & Era Labels | 年代目盛り・全時代和暦対応    | **P0** | 1.5d     | 020, 022          | 実機テスト残 |
| 037 | EraPickerBar Sync    | → 038に統合                      | -      | -        | -                 | 統合 |
| 038 | EraPickerBar Redesign | 可変幅 + ミニマップ + 自動スクロール | **P0** | 1.5d | 023              | ✅   |
| 039 | Context Header       | 現在位置情報の常時表示           | **P1** | 1d       | 020, 022, 024     | ✅   |
| 038-ext | Selection Sync UX | 選択同期 + 長押し詳細遷移        | **P1** | 1d       | 038, 020          | ✅   |
| 024-ext | 天皇将軍LOD連動強化 | LODに応じた段階的表示          | **P1** | 1d       | 024               | ✅   |
| 043 | Onboarding Flow      | ジェスチャーチュートリアル       | **P0** | 1.5d     | 020, 021, 023     | ✅   |

**Sprint 3 合計: 12.5d（2名並行で約1週間）**

---

### **Sprint 4: 設定・品質・リリース（Week 6-7）**

| #   | チケット          | 説明                          | 優先度 | 推定工数 | 依存          | 状態 |
| --- | ----------------- | ----------------------------- | ------ | -------- | ------------- | ---- |
| 040 | Settings Screen   | 全設定画面                    | **P1** | 1.5d     | 014, 024, 025 | ✅   |
| 050 | E2E Test Setup    | Detox環境、主要フローテスト   | **P1** | 1.5d     | 全機能        | -    |
| 052 | Accessibility     | WCAG 2.1 AA対応               | **P0** | 2d       | 015           | -    |
| 053 | Analytics         | イベント計測                  | **P1** | 1.5d     | 014           | -    |
| 054 | Privacy & Terms   | プライバシーポリシー・利用規約| **P0** | 2d       | -             | -    |
| 055 | TestFlight & ASO  | ベータテスト・ASO             | **P0** | 3d       | 全チケット    | -    |

**Sprint 4 合計: 11.5d（2名並行で約1週間）**

---

### **v1.5+: 課金・世界史連携（Post-MVP）**

| #   | チケット          | 説明                          | 優先度 | 推定工数 | 依存       |
| --- | ----------------- | ----------------------------- | ------ | -------- | ---------- |
| 041 | IAP Billing       | StoreKit 2、購入・復元        | **P0** | 3d       | 014        |
| 042 | Paywall Screen    | Paywall UI                    | **P0** | 1d       | 041        |
| 044 | 中国王朝連携      | 王朝バー、EraPickerBar 2段化  | **P1** | 3d       | 038, 041   |
| 045 | アメリカ史連携    | 大統領・主要イベント          | **P2** | 2d       | 044        |
| 046 | イギリス史連携    | 王朝・主要イベント            | **P2** | 2d       | 044        |

**v1.5 合計: 11d**

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

Week 4-5 (Sprint 3 前半):
├─ 開発者A: 030 → 031 → 032 ✅
├─ 開発者B: 033 → 034 → 035 ✅
└─ 開発者C: バグ修正 ✅

Week 5-6 (Sprint 3 後半):
├─ 開発者A: 036 (Year Ruler) → 038 (EraPickerBar Redesign)
├─ 開発者B: 039 (Context Header) → 024-ext (天皇将軍LOD連動)
└─ 開発者C: 043 (Onboarding) → バグ修正

Week 6-7 (Sprint 4):
├─ 開発者A: 040 → 052 → 055
├─ 開発者B: 053 → 050
└─ 開発者C: 054 → バグ修正・最終調整
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
| Sprint 3 | 12.5d    | 6-7d              | 8d           |
| Sprint 4 | 11.5d    | 6d                | 7d           |
| **合計** | **50d**  | **28-31d**        | **35d**      |

**推奨開発期間: 7週間（バッファ込み）**

---

## パフォーマンス基準

- フレームレート: **60fps（主要デバイス）**
- 起動時間: **2秒以内**
- メモリ: **200MB以下**
- 検索レスポンス: **100ms以内**

---

## オフライン対応

- すべてのコア機能（タイムライン、検索、ブックマーク、オンボーディング）はオフライン動作必須
- **オンライン必須の機能:**
  - Analytics送信（053: ローカルキャッシュ後にバックグラウンド送信、送信失敗時はリトライ）
  - IAP購入/復元（v1.5 で実装、App Store接続必須）

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

### **Sprint 3: 検索・詳細・UI完成**

- [x] [030-search-feature.md](030-search-feature.md) - Search Feature ✅
- [x] [031-event-detail-screen.md](031-event-detail-screen.md) - Event Detail ✅
- [x] [032-person-detail-screen.md](032-person-detail-screen.md) - Person Detail ✅
- [x] [033-source-display.md](033-source-display.md) - Source Display ✅
- [x] [034-bookmarks-feature.md](034-bookmarks-feature.md) - Bookmarks ✅
- [x] [035-screenshot-sharing.md](035-screenshot-sharing.md) - Screenshot Sharing ✅
- [ ] [036-year-ruler-era-labels.md](036-year-ruler-era-labels.md) - Year Ruler & Era Labels（実機テスト残）
- [x] [037-era-picker-sync.md](037-era-picker-sync.md) - EraPickerBar Sync → 038に統合
- [x] [038-era-picker-redesign.md](038-era-picker-redesign.md) - EraPickerBar Redesign ✅
- [x] [039-context-header.md](039-context-header.md) - Context Header ✅
- [x] [038-ext-selection-sync.md](038-ext-selection-sync.md) - 038-ext: Selection Sync UX ✅
- [x] [024-layer-management.md](024-layer-management.md) - 024-ext: 天皇将軍LOD連動強化 ✅
- [x] [043-onboarding-flow.md](043-onboarding-flow.md) - Onboarding ✅

### **Sprint 4: 設定・品質・リリース**

- [x] [040-settings-screen.md](040-settings-screen.md) - Settings ✅
- [ ] [050-e2e-test-setup.md](050-e2e-test-setup.md) - E2E Test Setup
- [ ] [052-accessibility.md](052-accessibility.md) - Accessibility
- [ ] [053-analytics.md](053-analytics.md) - Analytics
- [ ] [054-privacy-terms.md](054-privacy-terms.md) - Privacy & Terms
- [ ] [055-testflight-aso.md](055-testflight-aso.md) - TestFlight & ASO

### **v1.5+: 課金・世界史連携（Post-MVP）**

- [ ] [041-iap-billing.md](041-iap-billing.md) - IAP Billing
- [ ] [042-paywall-screen.md](042-paywall-screen.md) - Paywall Screen
- [ ] [044-china-dynasty.md](044-china-dynasty.md) - 中国王朝連携 **【新規】**
- [ ] [045-usa-history.md](045-usa-history.md) - アメリカ史連携 **【新規】**
- [ ] [046-uk-history.md](046-uk-history.md) - イギリス史連携 **【新規】**

---

## Sprint 進捗サマリー

| Sprint | チケット | ステータス | 更新日 |
|--------|----------|------------|--------|
| Sprint 0 | 001 Tech Validation | ✅ 完了 | 2025-01-24 |
| Sprint 1 | 010-016 基盤構築 (全7件) | ✅ 完了 | 2025-01-26 |
| Sprint 2 | 020-025 タイムラインコア (全6件) | ✅ 完了 | 2025-01-28 |
| Sprint 3 | 030-043 検索・詳細・UI完成 (11/12件) | 🔄 進行中 | 2026-02-02 |
| Sprint 4 | 040, 050-055 設定・品質・リリース | 🔄 進行中 | 2026-02-02 |
| v1.5+ | 041-046 課金・世界史連携 | 📋 計画済 | - |

> **Sprint 3 完了:**
> - 030-035 検索・詳細・共有 ✅
> - 038 EraPickerBar Redesign ✅
> - 038-ext Selection Sync UX ✅
> - 039 Context Header ✅
> - 024-ext 天皇将軍LOD連動強化 ✅
> - 043 Onboarding Flow ✅
>
> **Sprint 3 残作業:**
> - 036 Year Ruler & Era Labels（実機テスト残）
>
> **Sprint 4 進行中:**
> - 040 Settings Screen ✅（レイヤー設定、プライバシー/利用規約リンク、デバッグ機能）

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

## UI 画面レイアウトガイドライン

### 画面構成と高さ配分（iPhone 13/14 基準: 844px）

```
┌────────────────────────────────────┐
│ Safe Area (47px)                   │
├────────────────────────────────────┤
│ 039 ContextHeader (44px)           │ ← 時代・年代・天皇・将軍
├────────────────────────────────────┤
│ 038 EraPickerBar                   │
│   - ChipRow (60px)                 │ ← 時代チップ（44px + padding）
│   - Separator (4px)                │
│   - MiniMap (8px)                  │ ← 真比率ミニマップ
│   計: 72px                         │
├────────────────────────────────────┤
│                                    │
│ 020 TimelineCanvas                 │ ← メインコンテンツ
│   - 036 Year Ruler（Canvas内）     │   年代ルーラーはCanvas内に描画
│                                    │
│ 残り: ~600px                       │
│                                    │
├────────────────────────────────────┤
│ TabBar (83px)                      │
└────────────────────────────────────┘
```

### 設計原則

1. **ヘッダー領域の予算: 最大150px**
   - ContextHeader (44px) + EraPickerBar (72px) = 116px
   - 余裕を持たせて150pxを上限とする

2. **Year Ruler (036) は Canvas 内に描画**
   - 別コンポーネントとしてスタックしない
   - TimelineCanvas 内で Skia 描画
   - ヘッダー領域を消費しない

3. **小画面対応 (iPhone SE: 667px)**
   - ContextHeader: L0-L1 では情報を絞る
   - EraPickerBar: チップ行は横スクロール対応
   - 最小600pxのCanvas領域を確保

### コンポーネント役割分担

| コンポーネント | 責務 | 高さ |
|---------------|------|-----|
| ContextHeader | 現在位置情報（読み取り専用） | 44px |
| EraPickerBar | ナビゲーション（時代ジャンプ） | 72px |
| TimelineCanvas | メイン描画 + Year Ruler | 可変 |

---

## ステータス定義

| ステータス | 意味 |
|-----------|------|
| ✅ 完了 | 実装完了（コードマージ済み） |
| 🔄 実機テスト残 | 実装完了、実機テスト未実施（036など） |
| 進行中 | 実装中 |
| 未着手 | 未開始 |

> **Note:** 実機テストは Sprint 4 の E2E/品質フェーズでまとめて実施

---

## 注意事項

### Sprint 0 の重要性

- **幕末〜明治の密集描画** は MVP の成否を左右する最重要検証項目
- 50件/10年の密度でも可読性が維持される必要あり
- 失敗時の対応：LODルール見直し、v1.0でLog/Focusモード前倒し

### Free/Pro ロジック

- **MVP (v1.0)**: 全機能を無料で提供（IAP/Paywall は v1.5 に延期）
  - 天皇・将軍・人物レイヤーに制限なし
  - `appStore.proUnlocked` は常に `true` として動作
- **v1.5**: `041` IAP / `042` Paywall 実装後、Free/Pro 制限を導入
  - Free: 天皇10代、将軍5代、人物20人まで
  - Pro: 全表示（買い切り）
- Sprint 1 の `014` には将来の拡張に備えた Pro 状態のインターフェースを実装済み

### データ準備

- `013` は最も時間がかかる作業（3日以上）
- 他のチケットと並行して進行可能
- 品質重視（典拠100件は教育現場で重要）

---

**最終更新:** 2026-02-02
**バージョン:** 4.4

---

## 変更履歴

### v4.4 (2026-02-02)
- 040 Settings Screen 実装完了
- レイヤー表示切替（天皇/将軍）
- プライバシーポリシー/利用規約リンク
- 検索履歴クリア機能
- オンボーディングリセット（デバッグ）
- Sprint 4 開始

### v4.3 (2026-02-02)
- 043 Onboarding Flow 実装完了
- プログレッシブ開示（TipModal）実装: ブックマーク、レイヤー設定、和暦検索
- Sprint 3 進捗: 11/12件完了
- 残作業: 036 Year Ruler 実機テストのみ

### v4.2 (2026-01-31)
- **UI画面レイアウトガイドライン追加**: 036/038/039 のスタッキング問題に対応
- ヘッダー領域の高さ予算（最大150px）を明記
- Year Ruler は Canvas 内に描画する方針を明確化

### v4.1 (2026-01-31)
- 工数サマリーテーブル修正: Sprint 5 削除、Sprint 3=12.5d、Sprint 4=11.5d に更新
- v1.5+ 番号範囲を 041-044 → 041-046 に修正（045/046 含む）
- **MVP Free/Pro 方針変更**: v1.0 では全機能無料開放、v1.5 で IAP と共に制限導入
- オフライン要件の記述を明確化（Analytics はローカルキャッシュ後に送信）

### v4.0 (2026-01-31)
- Sprint 3 拡張: UI改善チケット追加（036強化, 038新規, 039新規, 024-ext）
- 043 Onboarding を Sprint 4 → Sprint 3 に移動（MVP必須）
- IAP (041, 042) を v1.5 に延期
- 世界史連携 (044-046) を v1.5+ として計画
- 検索の和暦対応を「明治〜令和」→「全時代（大化〜令和）」に拡張
- オフライン要件の記載を修正（IAP購入/復元/Analyticsはオンライン必須）
- 013 の「並行可」の記載を明確化（012完了後に並行可）
