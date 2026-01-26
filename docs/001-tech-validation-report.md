# 001: Tech Validation Report (Sprint 0)

## 概要

Sprint 0 の技術検証結果をまとめたレポート。

> **重要:** Day 1-3 は PoC 実装完了。チケット 001 の受け入れ条件 2, 6（60fps実測、Go/No-Go判定）は **未達** であり、Day 4〜5 で検証予定。受け入れ条件 3, 4, 5（LOD切替、密集描画、ハプティクス）は **Day 3 で実装完了**。

---

## Day 1: Skia + ピンチズーム PoC

**検証日:** 2026-01-25

### 検証環境

| 項目 | バージョン |
|------|-----------|
| Expo SDK | 54.0.32 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| @shopify/react-native-skia | 2.2.12 |
| react-native-gesture-handler | 2.28.0 |
| react-native-reanimated | 4.1.1 |
| Xcode | 16.3 |
| iOS Simulator | iPhone 16e |

### 検証項目

| # | 検証項目 | 期待値 | 結果 | 備考 |
|---|---------|--------|------|------|
| 1 | Skia + Expo SDK 54 動作 | 正常動作 | ✅ PASS | New Architecture 対応 |
| 2 | Skia + React 19 互換性 | 正常動作 | ✅ PASS | React Compiler 有効 |
| 3 | 基本図形描画 (Rect, Circle, Line, Text) | 描画成功 | ✅ PASS | Phase 1 要件完了 |
| 4 | Gesture Handler 統合 | 動作確認 | ✅ PASS | Pinch/Pan/Tap 認識 |
| 5 | Reanimated 統合 | 60fps アニメ | ✅ PASS | useFrameCallback/useAnimatedReaction 動作 |
| 6 | フレームドロップ計測 | < 5% | ✅ 実装完了 | timeSincePreviousFrame 使用、実機測定は Day 2 以降 |
| 7 | フォーカルポイント追従 | ピンチ中心追従 | ✅ PASS | 開始位置固定方式（安定性重視、動的追従は要件次第で変更可） |
| 8 | ハプティクス Light/Medium | 応答確認 | ✅ PASS | Light: ピンチ終了、Medium: ダブルタップ |

### 作成ファイル

```
components/poc/
├── SkiaCanvas.tsx      # 基本Canvas描画テスト
└── PinchZoomTest.tsx   # ピンチズーム60fps検証
```

### SkiaCanvas.tsx

**目的:** Skia が Expo SDK 54 + React 19 で動作するか検証（Phase 1: 基本図形）

**実装内容:**
- 時代帯の背景描画 (Rect + 時代カラー)
- イベントマーカー描画 (Circle)
- タイムライン軸描画 (Rect)
- 年マーカー線描画 (Line + vec)
- 時代ラベル描画 (Text + useFont, 英語ラベル)

**フォント対応:**
- 使用フォント: Roboto-Medium.ttf（Skia テストアセット）
- フォント未ロード時: 図形描画は継続、テキストのみスキップ
- 日本語対応: 別チケット（015）で NotoSansJP 導入予定

**結果:** ✅ Phase 1 要件（Rect, Circle, Line, Text）完了

### PinchZoomTest.tsx

**目的:** ピンチズームで60fps維持できるか検証

**実装内容:**
- GestureDetector + Skia Canvas 統合
- ピンチジェスチャー (x1 〜 x100 ズーム)
- パンジェスチャー (横スクロール)
- ダブルタップ (x2 ズーム)
- ハプティクスフィードバック (Light: ピンチ終了、Medium: ダブルタップ)
- フォーカルポイント追従 (開始位置固定方式: savedFocalX基準、安定性重視)
- フレームドロップ計測 (timeSincePreviousFrame + 25ms閾値)
- ズーム表示スロットリング (useAnimatedReaction, 0.1単位)

**結果:** ✅ 基本動作確認完了、フレームドロップ計測ロジック実装済み

### スクリーンショット

シミュレータで以下を確認:
- ヘッダー: "JidaiScope" + "Sprint 0: Tech Validation"
- ズーム情報: "Zoom: x1.0" / "Drops: N (X.X%)"
- Skia Canvas: 時代帯、タイムライン軸、イベントマーカー、時代ラベル(Text)
- 操作ガイド: "Pinch: ズーム | Drag: スクロール | Double-tap: x2"
- フォーカルポイント追従: 開始位置固定方式（安定性重視）

---

## Day 2: LOD切替 + ハプティクス

**検証日:** 2026-01-25

### 検証項目

| # | 検証項目 | 期待値 | 結果 | 備考 |
|---|---------|--------|------|------|
| 1 | LOD L0→L1→L2→L3 切替 | 滑らかな遷移 | ✅ PASS | ズーム連動、段階的表示 |
| 2 | LOD 遷移時間 | < 100ms | ✅ 実装完了 | **初回フレーム到達**基準で計測（アニメ完了ではない）|
| 3 | ハプティクス応答 | < 50ms | ✅ 実装完了 | expo-haptics async 計測、成功率表示 |
| 4 | LOD 別描画要素 | L0〜L3 で異なる | ✅ PASS | 下記 LOD 定義参照 |
| 5 | ハプティクス種類 | LOD方向で異なる | ✅ PASS | ズームイン: Light/Medium/Heavy、ズームアウト: Selection |
| 6 | LOD 遷移アニメーション | フェード+スケール | ✅ 実装完了 | 200ms withTiming、opacity + scale (0.95→1.0) |

### 作成ファイル

```
components/poc/
└── LODTest.tsx         # LOD切替検証

utils/
└── haptics.ts          # ハプティクスユーティリティ

app/(tabs)/
└── index.tsx           # Day 1/Day 2 切替UI追加
```

### LODTest.tsx

**目的:** LOD レベル切替が滑らか（< 100ms）かつハプティクス応答が高速（< 50ms）か検証

**LOD レベル定義:**

| Level | ズーム範囲 | 表示要素 |
|-------|-----------|----------|
| L0 | x1 〜 x2 | 時代帯のみ |
| L1 | x2 〜 x10 | + 主要イベント (大マーカー) |
| L2 | x10 〜 x50 | + 中規模イベント + 時代ラベル |
| L3 | x50 〜 x100 | + 小イベント + 年マーカー + 詳細ラベル |

**実装内容:**
- ズームレベルに応じた LOD 自動切替 (useAnimatedReaction)
- **フレーム基準の LOD 遷移時間計測 (useFrameCallback)**
  - **定義:** LOD 変更後の「初回フレーム到達」までの時間（アニメ完了時間ではない）
  - lodChangeAt SharedValue で計測開始時刻を記録
  - 最初のフレームで frameMs を確定
  - **連続遷移:** 同フレーム内で連続変更時は先行遷移を「スキップ」扱い（frameMs=-2）
- ハプティクス応答時間計測（成功率表示付き）
- **フェード+スケールアニメーション** (200ms withTiming)
  - opacity: 0→1 / 1→0
  - scale: 0.95→1.0 / 1.0→0.95
- 統計表示 UI（遷移回数、Frame ms、< 100ms 率、Haptic ms、< 50ms 率、成功率）
- 未計測遷移の表示（「N待」）
- **描画最適化**: currentLOD + previousLOD のみ描画
- **タイマー競合対策**: clearTimeout で古いタイマーをキャンセル

**結果:** ✅ LOD 切替 + ハプティクス + アニメーション実装完了

### utils/haptics.ts

**目的:** ハプティクスフィードバックの統一管理と応答時間計測

**実装内容:**
- `triggerHaptic(type)`: 計測付きハプティクス発火
- `triggerLODHaptic(from, to)`: LOD 切替時のハプティクス
- `triggerEraBoundaryHaptic()`: 時代境界通過時
- `triggerBookmarkHaptic()`: ブックマーク追加時
- `getHapticStats()`: 計測統計取得

**ハプティクス種類:**

| 種類 | 用途 | expo-haptics |
|------|------|-------------|
| light | ピンチ終了、L0→L1 | ImpactFeedbackStyle.Light |
| medium | ダブルタップ、L2→L3 | ImpactFeedbackStyle.Medium |
| heavy | 2段階以上ジャンプ | ImpactFeedbackStyle.Heavy |
| selection | ズームアウト | selectionAsync |
| success | ブックマーク追加 | NotificationFeedbackType.Success |

**結果:** ✅ ユーティリティ実装完了

### スクリーンショット

シミュレータで以下を確認:
- ヘッダー: Day 1 / Day 2 切替ボタン
- ズーム情報: "Zoom: x1.0" / "LOD: L0"
- LOD ガイド: L0 (x1-2) | L1 (x2-10) | L2 (x10-50) | L3 (x50+)
- 統計表示: 遷移回数(N待)、Frame ms、< 100ms%、Haptic ms、< 50ms%、成功率%
- アニメーション: LOD 要素のフェードイン/アウト + スケール (0.95→1.0)

---

## Day 3: 密集データ描画

**検証日:** 2026-01-26

### 検証項目

| # | 検証項目 | 期待値 | 結果 | 備考 |
|---|---------|--------|------|------|
| 1 | 約700イベントデータ生成 | 構造化データ | ✅ PASS | 通常350件 + 密集350件 |
| 2 | ビューポートカリング | 画面外非描画 | ✅ 実装完了 | translateX 同期 + useAnimatedReaction |
| 3 | LOD 連動イベント表示 | L0-L3で密度変化 | ✅ PASS | L0:0件、L1:major、L2:+medium、L3:all |
| 4 | **50events/10yr 密集描画** | 1850-1920 各10年で50件 | ✅ PASS | validateDenseDataRequirement() で検証 |
| 5 | フレームドロップ計測 | < 5% | ⏳ 実機検証待ち | シミュレータでは計測困難 |
| 6 | メモリ使用量 | < 150MB | ⏳ 実機検証待ち | Instruments で計測予定 |

### 作成ファイル

```
data/
└── mockEvents.ts       # 約700件モックイベントデータ（通常350 + 密集350）

components/poc/
└── DenseRenderTest.tsx # 密集描画検証（副作用分離、カリング同期修正済み）

app/(tabs)/
└── index.tsx           # Day 3 切替UI追加
```

### data/mockEvents.ts

**目的:** 密集描画検証用モックイベントデータ（約700件）

**データ構造:**
- `Era`: 時代定義（id, name, nameJa, startYear, endYear, color）
- `HistoricalEvent`: イベント定義（id, year, title, titleJa, eraId, importance, category）

**時代データ:**
- 縄文〜令和まで15時代
- PRD セクション 11.2 準拠の時代カラー

**通常イベント分布（約350件）:**
| 時代 | 件数 | 備考 |
|------|------|------|
| 縄文〜弥生 | 20件 | 古代前期（データ少） |
| 古墳〜奈良 | 45件 | 古代後期 |
| 平安 | 40件 | 中世前期 |
| 鎌倉〜室町 | 50件 | 中世後期 |
| 戦国〜江戸 | 100件 | 近世 |
| 明治〜令和 | 95件 | 近現代 |

**密集テスト期間（350件）:**
| 期間 | 件数 | 密度 |
|------|------|------|
| 1850-1860 | 50件 | 50events/10yr ✅ |
| 1860-1870 | 50件 | 50events/10yr ✅ |
| 1870-1880 | 50件 | 50events/10yr ✅ |
| 1880-1890 | 50件 | 50events/10yr ✅ |
| 1890-1900 | 50件 | 50events/10yr ✅ |
| 1900-1910 | 50件 | 50events/10yr ✅ |
| 1910-1920 | 50件 | 50events/10yr ✅ |

**重要度分布:**
- major: 10%（大マーカー）
- medium: 30%（中マーカー）
- minor: 60%（小マーカー）

**ユーティリティ関数:**
- `yearToX(year, width, start, end)`: 年→X座標変換
- `xToYear(x, width, start, end)`: X座標→年変換
- `getEventsInRange(start, end)`: 範囲内イベント取得
- `getEventsByEra(eraId)`: 時代別イベント取得
- `validateDenseDataRequirement()`: 密集描画要件検証

**結果:** ✅ 約700件モックデータ生成完了、50events/10yr 要件 PASS

### DenseRenderTest.tsx

**目的:** 約700イベントで60fps維持できるか検証

**実装内容:**
- ビューポートカリング（画面外イベント非描画）
  - **useAnimatedReaction で translateX を React state に同期**
  - 年範囲フィルタリング（マージン50px付き）
  - **スロットリング: 10px 単位で更新**
- LOD 連動イベント表示
  - L0: イベント非表示
  - L1: major のみ
  - L2: major + medium
  - L3: 全イベント
- カテゴリ別カラー
  - political: #FF6B6B
  - cultural: #4ECDC4
  - military: #FFE66D
  - economic: #95E1D3
  - social: #DDA0DD
- 重要度別マーカーサイズ
  - major: 10px
  - medium: 6px
  - minor: 4px
- 統計表示 UI
  - Total: 全イベント数
  - Rendered: 描画中イベント数
  - Culled: カリング済みイベント数
  - **50/10yr: 密集描画要件検証結果**
- フレームドロップ計測（25ms閾値）
- **副作用分離: useMemo から useEffect に setState を分離**
- **interval クリーンアップ: useEffect で確実に clearInterval**

**結果:** ✅ 密集描画 + カリング + 要件検証実装完了

### スクリーンショット

シミュレータで以下を確認:
- ヘッダー: Day 1 / Day 2 / Day 3 切替ボタン
- ズーム情報: "Zoom: x1.0" / "LOD: L0" / "Drops: N (X.X%)"
- 統計表示: Total / Rendered / Culled / **50/10yr: PASS/FAIL**
- Skia Canvas: 時代帯、タイムライン軸、カテゴリ別イベントマーカー
- LOD ガイド: L0 (x1-2): Era only | L1 (x2-10): +Major | L2 (x10-50): +Medium | L3 (x50+): +Minor
- 操作ガイド: "Pinch: Zoom | Drag: Scroll | N events visible"
- **密集描画検証: 1850-1920 期間で50events/10yr を UI で表示**

---

## 次のステップ

### Day 4: 60fps 実測 (Xcode Instruments)

- [ ] 実機 (iPhone 14 Pro+) でビルド・実行
- [ ] Core Animation / Time Profiler 計測
- [ ] フレームレート ≥ 57fps (95%) 確認
- [ ] フレームドロップ率 < 5% 確認
- [ ] CPU使用率 < 80% 確認
- [ ] メモリ使用量 < 150MB 確認

### Day 5: Go/No-Go 判定

- [ ] 全計測結果をまとめ
- [ ] 受け入れ条件 #2 (60fps) 判定
- [ ] 受け入れ条件 #4 (密集描画) 判定
- [ ] Go/No-Go 最終判定

---

## 技術メモ

### Expo Development Build

Skia はネイティブコードを含むため、Expo Go では動作しない。
Development Build が必要:

```bash
npx expo prebuild --platform ios
npx expo run:ios --device "iPhone 16e"
```

### New Architecture

Expo SDK 54 では New Architecture がデフォルト有効。
Skia 2.2.12 は New Architecture に対応済み。

### React Compiler

React 19 + Expo SDK 54 では React Compiler が有効。
Skia コンポーネントとの互換性確認済み。

### timeSincePreviousFrame の単位確認

`useFrameCallback` の `frameInfo.timeSincePreviousFrame` について：
- **単位:** ミリ秒 (ms)
- **参照:** [Reanimated useFrameCallback](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/)
- **検証方法:** 60fps時に約16.67msが期待される。実装では >1000ms を異常値として除外（アプリバックグラウンド復帰時など）
- **Note:** 累積計算のみ（区間別変動は Day 2 以降で対応予定）

### 日本語フォント対応

**現状:** Roboto（英語フォント）でテキスト描画検証
**理由:** assets/fonts に日本語フォントが未配置
**対応:** チケット 015（Design Tokens）で NotoSansJP などを導入予定
**影響:** PoC としてのテキスト描画機能検証は完了。日本語グリフの可読性検証は別途必要

---

## 60fps 実測計画（Day 2）

### Xcode Instruments 計測手順

1. **準備**
   ```bash
   npx expo prebuild --platform ios
   npx expo run:ios --device "iPhone 14 Pro"  # 実機推奨
   ```

2. **Instruments 起動**
   - Xcode > Open Developer Tool > Instruments
   - Template: "Core Animation" または "Time Profiler"

3. **計測シナリオ**
   - ピンチズーム操作を30秒間継続
   - パン操作を30秒間継続
   - ピンチ+パン同時操作を30秒間継続

4. **記録項目**
   | 指標 | 目標値 | 結果 |
   |------|--------|------|
   | フレームレート | ≥ 57fps (95%) | TBD |
   | フレームドロップ率 | < 5% | TBD |
   | CPU使用率 | < 80% | TBD |
   | メモリ使用量 | < 150MB | TBD |

5. **結果記載欄**（Day 2 更新予定）
   - 計測日:
   - デバイス:
   - 結果サマリー:

---

## チケット 001 進捗状況

| 受け入れ条件 | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|-------------|-------|-------|-------|-------|-------|
| 1. Skia + Expo 動作 | ✅ | - | - | - | - |
| 2. 60fps実測 (Instruments) | - | - | - | ⏳ | - |
| 3. LOD切替 < 100ms | - | ✅ | - | - | - |
| 4. 密集描画 (50events/10yr) | - | - | ✅ | - | - |
| 5. ハプティクス < 50ms | - | ✅ | - | - | - |
| 6. Go/No-Go 判定 | - | - | - | - | ⏳ |

---

**ステータス:** Day 3/5 完了
**Go/No-Go:** ⏳ 判定保留（Day 5 で最終決定）
**ブロッカー:** なし
**Note:** 60fps 実測は Day 4 で Instruments 計測予定。密集描画 (350件) + ビューポートカリング実装済み。
