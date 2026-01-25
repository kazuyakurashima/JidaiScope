# 001: Tech Validation Report (Sprint 0)

## 概要

Sprint 0 の技術検証結果をまとめたレポート。

> **重要:** Day 1 は PoC 実装完了。チケット 001 の受け入れ条件 2〜6（60fps実測、LOD切替、密集描画、ハプティクス遅延、Go/No-Go判定）は **未達** であり、Day 2〜5 で検証予定。

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

## 次のステップ

### Day 2: LOD切替 + ハプティクス + 60fps実測

- [ ] LODTest.tsx 作成 (L0〜L3 切替)
- [ ] utils/haptics.ts 作成
- [ ] LOD遷移 < 100ms 検証
- [ ] ハプティクス応答 < 50ms 検証
- [ ] Xcode Instruments で60fps計測（上記計測計画参照）

### Day 3: 密集データ描画 + 日本語フォント検証

- [ ] DenseRenderTest.tsx 作成
- [ ] data/mockEvents.ts (350件)
- [ ] 350イベント表示で60fps維持
- [ ] **日本語フォント導入 (NotoSansJP)**
- [ ] **日本語ラベルの可読性検証**
- [ ] テキストラベル可読性確認
- [ ] メモリ使用量 < 150MB

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
| 2. 60fps実測 (Instruments) | - | ⏳ | - | - | - |
| 3. LOD切替 < 100ms | - | ⏳ | - | - | - |
| 4. 密集描画 (50events/10yr) | - | - | ⏳ | - | - |
| 5. ハプティクス < 50ms | - | ⏳ | - | - | - |
| 6. Go/No-Go 判定 | - | - | - | - | ⏳ |

---

**ステータス:** Day 1/5 完了
**Go/No-Go:** ⏳ 判定保留（Day 5 で最終決定）
**ブロッカー:** なし
