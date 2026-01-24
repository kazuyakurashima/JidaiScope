# 055: TestFlight & ASO（Sprint 5）

## 概要

**目的:** iOS TestFlight ベータテスト + App Store Optimization（ASO）を実施し、リリース前の品質確認と App Store での発見性向上

**スコープ:**

- TestFlight ベータテスト（iOS）
- Google Play 内部テスト（Android）
- App Store メタデータ最適化（スクリーンショット、説明）
- キーワード・カテゴリ設定
- レーティング・レビュー対策

**成功基準:**

- ✅ TestFlight ベータテスト開始
- ✅ 50+ ベータテスター確保
- ✅ フィードバック収集・改善
- ✅ App Store メタデータ完成
- ✅ キーワード SEO 対策完了

---

## ユーザーストーリー

```
As a プロダクト マネージャー
I want to リリース前にベータテストで品質確認したい
So that 本番リリースで高い完成度を保つ
```

---

## 受け入れ条件

| #   | 条件                        | 検証方法                        | 担当 |
| --- | --------------------------- | ------------------------------- | ---- |
| 1   | TestFlight ベータテスト開始 | App Store Connect 確認          | -    |
| 2   | 50+ ベータテスター登録      | ユーザー数確認                  | -    |
| 3   | フィードバック収集システム  | TestFlight 内フィードバック確認 | -    |
| 4   | App Store メタデータ完成    | App Store Connect 確認          | -    |
| 5   | キーワード・説明文 SEO 対策 | Keyword Tool 検証               | -    |

---

## 依存関係

| 種類             | 詳細                                  |
| ---------------- | ------------------------------------- |
| ✓ 入力依存       | 010 (Build Environment), 全チケット完了 |
| ✗ コード依存     | なし                                  |
| ✗ 他チケット依存 | なし                                  |

---

## TestFlight 設定

### ベータテスター募集

```
【対象】
- 教育関係者（高校日本史教師）
- 日本史愛好家
- UX テスター

【募集方法】
- Twitter/Instagram での告知
- 教育系 Discord コミュニティ
- メーリングリスト

【目標】50-100 名
```

### TestFlight フィードバック

```typescript
// 主要フィードバック項目
interface BetaFeedback {
  userId: string;
  dateTime: string;
  rating: 1 | 2 | 3 | 4 | 5;
  category: "bug" | "feature" | "ui" | "performance" | "other";
  message: string;
}
```

---

## App Store メタデータ

### アイコン & スクリーンショット

```
【App Icon】
- 1024×1024px
- 角丸なし（自動処理）
- 背景色: #0A0E14（Dark theme）

【スクリーンショット】（6 枚推奨）
1. Timeline Canvas（全体表示）
2. Zoom & LOD（拡大機能）
3. Era Picker（時代選択）
4. Event Detail（詳細画面）
5. Search & Filter（検索）
6. Pro Features（Pro 推奨）

【プレビュー ビデオ】
- 15-30 秒
- ナレーション + 字幕（日本語）
```

### 説明文

```
【日本語】
JidaiScope - 日本史を時間軸で理解

タイムラインで過去12,000年の日本史を探索します。

✨ 特徴:
• 1,200+ のイベント・人物をインタラクティブに表示
• ピンチズームで年間レベルから月間レベルへ
• Emperor・Shogun・Person レイヤーで全層表示
• 出典付き教科書準拠の情報
• ブックマーク・検索機能
• Dark/Light テーマ

📚 学習対象:
高校日本史、大学共通テスト対策、教室での授業支援

💡 使い方:
1. タイムラインをスワイプ
2. ピンチズームで時代を探索
3. イベント・人物をタップして詳細確認
4. ブックマークで重要な出来事を保存

🎓 教育機関向け:
学校の授業・LHRで活用可能

【英語】
JidaiScope - Understand Japanese History on a Timeline

Explore 12,000 years of Japanese history with an interactive timeline.

Features:
• 1,200+ events and historical figures
• Pinch-to-zoom from yearly to monthly views
• Interactive layers (Emperors, Shoguns, Notable Figures)
• Citation-backed educational content
• Bookmarks & search functionality
• Dark/Light theme support

...
```

### キーワード & カテゴリ

```
【カテゴリ】
- Primary: Education
- Secondary: Reference

【キーワード】（30 字以内 × 5）
- 日本史, 教科書, タイムライン
- Japanese history, timeline, education
- 歴史学習, 受験対策
- 明治維新, 戦国時代
- 天皇, 将軍, 歴史人物

【検索キーワード対策】
- 「日本史 勉強」→ タイムライン + 教科書
- 「共通テスト 日本史」→ 受験対策
- 「高校 日本史」→ 学校教育
```

---

## リリース前チェックリスト

### ビルド & テスト

- [ ] `npm run build:ios` 成功
- [ ] `npm run build:android` 成功
- [ ] 本番ビルドでの性能テスト（60fps 確認）
- [ ] ネットワーク環境で重い処理テスト

### App Store Connect 設定

- [ ] App Icon 1024×1024px アップロード
- [ ] スクリーンショット 6 枚完成
- [ ] プレビュー ビデオ作成（オプション）
- [ ] 説明文（日本語・英語）入力
- [ ] キーワード 5 個設定
- [ ] カテゴリ・コンテンツレーティング設定
- [ ] プライバシーポリシー・利用規約 URL 設定

### Google Play 設定

- [ ] 同上（Android 向け）
- [ ] グラフィック資産（FeatureGraphic など）
- [ ] リリースノート作成

### 法務・コンプライアンス

- [ ] プライバシーポリシー最終確認（054）
- [ ] 利用規約最終確認（054）
- [ ] App Store コンテンツレーティング回答
- [ ] GDPR/CCPA 対応確認

---

## Todo リスト

### Phase 1: TestFlight 設定（iOS）

- [ ] App Store Connect で TestFlight アプリ作成
- [ ] 内部テスター登録
- [ ] 外部テスター募集用リンク作成

### Phase 2: Google Play 内部テスト（Android）

- [ ] Google Play Console で内部テスト有効化
- [ ] テスター登録

### Phase 3: ベータテスター募集

- [ ] SNS 告知文作成
- [ ] 募集開始（2-4 週間）
- [ ] フィードバック回収

### Phase 4: App Store メタデータ作成

- [ ] スクリーンショット 6 枚作成
- [ ] 説明文（日本語・英語）完成
- [ ] キーワード 5 個決定

### Phase 5: リリース準備

- [ ] チェックリスト項目を全て確認
- [ ] 本番ビルド最終テスト

### Phase 6: リリース審査提出

- [ ] App Store 審査提出
- [ ] Google Play 審査提出
- [ ] 審査結果待機・対応

---

**作成日:** 2026-01-25
**優先度:** P1
**推定工数:** 3d
**ステータス:** Not Started
**ブロッカー:** 全チケット完了
