# 070: Layer Management - レイヤー表示制御（Sprint 1）

## 概要

**目的:** タイムライン上に複数の情報レイヤー（時代、事件、天皇、将軍、人物）を重ね表示し、ユーザーが表示/非表示を切り替えられるようにする

**スコープ:**

- 5つのレイヤー定義（時代、主要事件、天皇、将軍、人物）
- Free/Pro での表示制限
- Settings 画面でのレイヤー切り替え UI
- 状態を settingsStore で管理

**成功基準:**

- ✅ 5レイヤー実装完了
- ✅ Free：天皇10代、将軍5代、人物20人まで
- ✅ Pro：全表示
- ✅ Settings で ON/OFF 切り替え可能

---

## ユーザーストーリー

```
As a ユーザー
I want to 将軍レイヤーを非表示にして、時代とイベントだけ見たい
So that 情報をシンプルに整理して学習できる
```

---

## 受け入れ条件

| #   | 条件                                           | 検証方法         | 担当 |
| --- | ---------------------------------------------- | ---------------- | ---- |
| 1   | 時代、主要事件レイヤーは常時表示               | ビジュアル確認   | -    |
| 2   | Free ユーザー：天皇10代のみ表示                | Pro 購入前に確認 | -    |
| 3   | Pro ユーザー：全天皇 126代表示                 | Pro 購入後に確認 | -    |
| 4   | Settings → Layer Toggle → 即座に反映           | リアルタイム確認 | -    |
| 5   | 非表示レイヤーは描画スキップ（パフォーマンス） | 描画負荷計測     | -    |

---

## 依存関係

| 種類             | 詳細                                                   |
| ---------------- | ------------------------------------------------------ |
| ✓ 入力依存       | 030 (Timeline Core), 020 (State Management), 150 (IAP) |
| ✗ コード依存     | TimelineCanvas の描画処理に組み込まれる                |
| ✗ 他チケット依存 | なし                                                   |
| ✓ 出力依存       | 140 (Settings)：レイヤー切り替えUI                     |

---

## Todo リスト

### Phase 1: レイヤー定義

- [ ] Layer type 定義
  ```typescript
  type LayerType = "era" | "events" | "emperor" | "shogun" | "person";
  ```
- [ ] 各レイヤーのメタデータ（色、表示ルール）

### Phase 2: 表示制限ロジック

- [ ] Free 制限
  - [ ] 天皇：最初の 10 代のみ
  - [ ] 将軍：鎌倉/室町/江戸から各 2 代ずつ？
  - [ ] 人物：20 人ランダム選抜？
- [ ] Pro 解放ロジック
  - [ ] iapStore.isPro チェック → フルレイヤー表示

### Phase 3: settingsStore 統合

- [ ] visibleLayers: Record<LayerType, boolean>
- [ ] toggleLayer(type: LayerType): void

### Phase 4: TimelineCanvas 描画 調整

- [ ] drawReigns 関数に visibleLayers チェック追加
- [ ] visibleLayers[type] = false → 描画スキップ

### Phase 5: Settings UI（チケット 140 と連携）

- [ ] Layer Toggle スイッチ作成
- [ ] Pro 限定レイヤーに ProBadge 表示

---

## 実装ガイドライン

```typescript
// types/layer.ts
export type LayerType = "era" | "events" | "emperor" | "shogun" | "person";

export interface LayerConfig {
  id: LayerType;
  name: string;
  color: string;
  requiredPro: boolean;
  visible: boolean;
}

// stores/settingsStore.ts (拡張)
interface SettingsState {
  visibleLayers: Record<LayerType, boolean>;
  toggleLayer: (type: LayerType) => void;
}

// components/timeline/drawReigns.ts
function drawReigns(canvas, { visibleLayers, ...props }) {
  if (!visibleLayers.emperor && !visibleLayers.shogun) return;

  for (const reign of reigns) {
    if (reign.officeType === "emperor" && !visibleLayers.emperor) continue;
    if (reign.officeType.includes("shogun") && !visibleLayers.shogun) continue;

    // 描画処理
  }
}

// Data filtering for Free users
function filterReignsByPro(reigns: Reign[], isPro: boolean): Reign[] {
  if (isPro) return reigns;

  // Free: 各時代から代表的な将軍のみ
  const filtered = reigns.filter((r) => {
    if (r.officeType === "emperor") return r.ordinal <= 10;
    // shogun は複数時代から選抜
    return r.ordinal <= 2;
  });
  return filtered;
}
```

---

## ファイル構成

```
types/
└── layer.ts                    # Layer型定義

components/
└── timeline/
    ├── drawReigns.ts          # レイヤー描画（visibleLayers チェック）
    └── LayerToggle.tsx        # UI コンポーネント

stores/
└── settingsStore.ts           # visibleLayers 管理
```

---

## テスト項目

- [ ] Free ユーザー：天皇 10代のみ表示
- [ ] Pro ユーザー：全天皇表示
- [ ] レイヤー OFF → 即座に画面から消える
- [ ] パフォーマンス：非表示レイヤーの描画なし

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 2d
**ステータス:** Not Started
**ブロッカー:** 030, 020, 150 完了
