# 001: Tech Validation & PoC（Sprint 0）

## 概要

**目的:** Expo + React Native Skia の技術的実現可能性を検証し、MVP の技術基盤を確立する

**重点検証項目:**

- Skia + Expo SDK 51+ の互換性
- ピンチズームで 60fps 達成可能性
- LOD（Level of Detail）切替の滑らかさ
- **幕末〜明治の密集描画検証（最重要リスク項目）**
- ハプティクス + Gesture のシームレス統合

**成功基準:**

- ✅ すべてのPoC動作確認
- ✅ 60fps達成
- ✅ 密集区間で描画破綻なし
- ✅ 技術選定を確定 → Sprint 1 へ進行可

---

## ユーザーストーリー

```
As a エンジニア
I want to 技術的な懸念事項を早期に解決する
So that 開発リスクを最小化し、Sprint 1 を迅速に開始できる
```

---

## 受け入れ条件

| #   | 条件                                                         | 検証方法                         | 担当 |
| --- | ------------------------------------------------------------ | -------------------------------- | ---- |
| 1   | Skia + Expo SDK 51+ で基本的な Canvas 描画ができる           | サンプル図形描画 + console出力   | -    |
| 2   | ピンチジェスチャーで 60fps を維持できる                      | Xcode Performance Monitor で計測 | -    |
| 3   | LOD L0→L1→L2→L3 の段階的切替が滑らか（カクツキなし）         | 目視確認 + Frame inspection      | -    |
| 4   | 幕末〜明治（1850-1920年）の 50件/10年 密集データで可読性維持 | 実データで描画テスト             | -    |
| 5   | ハプティクス（Light/Medium impact）が Gesture トリガーと連携 | Device/Simulator で動作確認      | -    |
| 6   | 技術選定ドキュメント完成 → Sprint 1 Go/No-Go 判定            | チームレビュー                   | -    |

---

## 依存関係

| 種類             | 詳細                   |
| ---------------- | ---------------------- |
| ✓ 入力依存       | PRD v2.1（要件定義書） |
| ✗ コード依存     | なし（PoC段階）        |
| ✗ 他チケット依存 | なし                   |

---

## Todo リスト

### Phase 1: Skia基本検証

- [ ] Expo SDK 51+ の Skia サンプル取得
- [ ] 基本図形（円、線、テキスト）描画テスト
- [ ] Canvas コンテナ実装
- [ ] デバイス/シミュレーターで動作確認

### Phase 2: ピンチズーム検証

- [ ] react-native-gesture-handler integration
- [ ] ピンチジェスチャー認識実装
- [ ] スケール計算ロジック（min/max zoom）
- [ ] Animated 値とのバインド
- [ ] **60fps 計測（Xcode Instruments）**
- [ ] ボトルネック特定（UI スレッド vs JS スレッド）

### Phase 3: LOD切替検証

- [ ] LOD ルール定義（L0〜L3 の閾値）
- [ ] 表示情報の動的フィルタリング
- [ ] 段階的フェード/スケールアニメーション
- [ ] Level 切替時のフレーム計測
- [ ] 目視テスト（カクツキ判定）

### Phase 4: 密集描画検証（**最重要**）

- [ ] 幕末〜明治のダミーデータ（50件/10年）生成
- [ ] 本描画での情報密集テスト
  - [ ] イベントマーカー重複時の処理
  - [ ] テキストレイアウト衝突検出
  - [ ] 可読性維持（最小フォントサイズ）
- [ ] 描画破綻発生時の対応案検討
  - [ ] Log/Focus モード前倒し案
  - [ ] 時間軸スケール非線形化案
  - [ ] 情報量削減案

### Phase 5: ハプティクス統合

- [ ] expo-haptics デバイス対応確認
- [ ] Light/Medium impact の実装
- [ ] Gesture トリガーとの同期
- [ ] デバイス上での実感テスト

### Phase 6: ドキュメント＆ Go/No-Go判定

- [ ] 技術検証レポート作成
- [ ] 問題・対応策ドキュメント化
- [ ] Sprint 1 go/no-go 判定
- [ ] チーム内レビュー

---

## 実装ガイドライン

### Skia 統合のポイント

```typescript
// Skia サンプル構造
import { Skia, Canvas } from '@shopify/react-native-skia';

const paint = Skia.Paint();
paint.setColor(Skia.Color('red'));

<Canvas
  style={{ flex: 1 }}
  onDraw={({ canvas, info }) => {
    // 描画処理
    canvas.drawCircle(cx, cy, radius, paint);
  }}
/>
```

### ジェスチャー + スケーリング

```typescript
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

const pinch = Gesture.Pinch()
  .onUpdate(({ scale }) => {
    // scale に応じた Canvas スケーリング
    workletScale.value = scale;
  })
  .onEnd(({ velocity }) => {
    // 慣性スクロール実装
  });
```

### ハプティクス トリガー

```typescript
import * as Haptics from "expo-haptics";

// LOD Level 切替時
if (prevLOD !== currentLOD) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Selection);
}
```

---

## テスト項目

### 環境別テスト

| デバイス       | 目標FPS | テスト項目                    |
| -------------- | ------- | ----------------------------- |
| iPhone 14+     | 60fps   | 幕末〜明治密集+ズーム同時操作 |
| iPhone 12      | 55fps+  | 同上（ボトルネック特定）      |
| Simulator (M1) | 60fps   | 描画ロジック確認              |

### チェックリスト

- [ ] ピンチズーム時：**フレーム落ち < 5%**
- [ ] LOD切替時：**ラグ < 100ms**
- [ ] 密集描画時：**テキスト重複なし**、**最小フォント 10px**
- [ ] ハプティクス：**Gesture 直後 < 50ms で反応**

---

## リスク・対応

| リスク                    | 発生確率 | 対応                           |
| ------------------------- | -------- | ------------------------------ |
| Skia が Expo で動作しない | 低       | 代替: Canvas API / SVG         |
| 60fps 達成不可            | 中       | バーチャライズ、描画範囲最適化 |
| 密集描画で破綻            | 高       | v1.1 で Log/Focus モード前倒し |
| ハプティクス遅延          | 低       | デバウンス、別スレッド実行     |

---

## Sprint 0 スケジュール

| 日          | 項目                           | 目標              |
| ----------- | ------------------------------ | ----------------- |
| **Day 1**   | Skia 基本 + ピンチズーム       | POC 動作確認      |
| **Day 2**   | LOD 切替、ハプティクス         | 全項目動作        |
| **Day 3**   | 密集描画テスト（重点）         | 破綻有無判定      |
| **Day 4-5** | ドキュメント、ボトルネック対応 | Sprint 1 go/no-go |

---

## 成果物

### コード

```
app/
└── _layout.tsx (PoC: Canvas + Gesture 統合)

components/
└── poc/
    ├── SkiaCanvas.tsx
    ├── PinchGestureHandler.tsx
    ├── LODManager.tsx
    └── DensityTestComponent.tsx
```

### ドキュメント

```
docs/
└── 001-tech-validation-report.md
    ├─ 各項目の結果
    ├─ パフォーマンス数値
    ├─ 改善案・対応策
    └─ Sprint 1 Go/No-Go 判定
```

---

## 次のステップ

- ✅ Tech Validation 完了 → 001-tech-validation-report.md 確認
- 🚀 Sprint 1 開始 → チケット 010 (Database Setup) 開始
- 📋 チケット 030 (Timeline Core) は報告書の知見を活用

---

**作成日:** 2025-01-25
**優先度:** P0 - Critical
**推定工数:** 5d
**ステータス:** Not Started
