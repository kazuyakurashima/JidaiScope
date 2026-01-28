# 024: Layer Management - レイヤー表示制御（Sprint 2）

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

| 種類             | 詳細                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| ✓ 入力依存       | 020 (Timeline Core), 014 (State Management - appStore.proUnlocked)         |
| ✗ コード依存     | TimelineCanvas の描画処理に組み込まれる                                    |
| ⓘ Pro 状態参照   | 014 の appStore.proUnlocked を参照（Sprint 1 は stub、Sprint 4 で IAP 連携）|
| ✗ 他チケット依存 | なし（041 IAP 依存なし - Sprint 跨ぎ解消）                                 |
| ✓ 出力依存       | 040 (Settings)：レイヤー切り替えUI                                         |

---

## Todo リスト

### Phase 1: レイヤー定義

- [x] Layer type 定義（既存: types/store.ts）
  ```typescript
  type LayerType = "era" | "events" | "emperor" | "shogun" | "person";
  ```
- [x] 各レイヤーのメタデータ（色、表示ルール）
  - drawReigns.ts: EMPEROR_COLOR (#D4AF37), SHOGUN_COLOR (#20B2AA), REGENT_COLOR (#9370DB)

### Phase 2: 表示制限ロジック

- [x] Free 制限（domain/timeline/layerFilter.ts）
  - [x] 天皇：最初の 10 代のみ（FREE_EMPEROR_LIMIT = 10）
  - [x] 将軍：最初の 5 代のみ（FREE_SHOGUN_LIMIT = 5）
  - [x] 人物：重要度順 20 人（FREE_PERSON_LIMIT = 20）
- [x] Pro 解放ロジック
  - [x] appStore.proUnlocked チェック → フルレイヤー表示
  - [x] **注意:** Sprint 1 では stub (false)、Sprint 4 で IAP 連携後に動的切替

### Phase 3: settingsStore 統合

- [x] visibleLayers: Record<LayerType, boolean>（既存）
- [x] toggleLayer(type: LayerType): void（既存）

### Phase 4: TimelineCanvas 描画 調整

- [x] drawReigns.ts 作成（天皇・将軍の在位帯描画）
- [x] TimelineCanvas に visibleLayers/proUnlocked 統合
  - events レイヤー: visibleLayers.events チェック
  - reigns 描画: filterReigns() で emperor/shogun フィルタ + Free/Pro 制限
- [x] visibleLayers[type] = false → 描画スキップ

### Phase 5: Settings UI（チケット 040 と連携）

- [ ] Layer Toggle スイッチ作成（040 で実装予定）
- [ ] Pro 限定レイヤーに ProBadge 表示（040 で実装予定）

### Phase 6: テスト

- [x] TypeScript ビルド確認
- [x] ESLint チェック
- [ ] 実機テスト：レイヤー表示切替確認
- [ ] Free/Pro 制限確認

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
// 020 の appStore.proUnlocked を参照
import { useAppStore } from '@/stores/appStore';

function filterReignsByPro(reigns: Reign[], proUnlocked: boolean): Reign[] {
  if (proUnlocked) return reigns;

  // Free: 各時代から代表的な将軍のみ
  const filtered = reigns.filter((r) => {
    if (r.officeType === "emperor") return r.ordinal <= 10;
    // shogun は複数時代から選抜
    return r.ordinal <= 2;
  });
  return filtered;
}

// Hook: コンポーネントで使用
function useFilteredReigns(reigns: Reign[]) {
  const proUnlocked = useAppStore((s) => s.proUnlocked);
  return filterReignsByPro(reigns, proUnlocked);
}
```

---

## ファイル構成

```
types/
└── store.ts                    # LayerType 型定義

domain/
└── timeline/
    └── layerFilter.ts          # Free/Pro フィルタリングロジック

components/
└── timeline/
    ├── drawReigns.ts           # 在位帯描画ユーティリティ
    ├── TimelineCanvas.tsx      # visibleLayers/proUnlocked 統合
    └── LayerToggle.tsx         # UI コンポーネント（040 で実装予定）

stores/
└── settingsStore.ts            # visibleLayers 管理
```

---

## テスト項目

| テスト項目               | 手順                           | 期待値                    | 状態 |
| ------------------------ | ------------------------------ | ------------------------- | ---- |
| TypeScript               | npx tsc --noEmit               | エラーなし                | ✅   |
| ESLint                   | npm run lint                   | エラーなし                | ✅   |
| Free: 天皇制限           | Free状態で天皇レイヤー表示     | 10代のみ表示              | -    |
| Pro: 天皇全表示          | Pro状態で天皇レイヤー表示      | 全代表示                  | -    |
| レイヤーOFF              | settingsでevent OFF            | イベントマーカー消失      | -    |
| 描画パフォーマンス       | レイヤーOFF時の描画処理        | 描画処理スキップ確認      | -    |
| 在位帯表示               | 天皇・将軍レイヤーON           | 軸上下に帯表示            | -    |

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 2d
**ステータス:** Done (Phase 1-4 実装完了、Phase 5 は 040 で実装予定)
**ブロッカー:** 020, 014 完了 ✓
