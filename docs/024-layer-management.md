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
**更新日:** 2026-01-31
**優先度:** P0
**推定工数:** 2d + 1d (024-ext)
**ステータス:** Done (Phase 1-4 実装完了、Phase 5 は 040 で実装予定)
**ブロッカー:** 020, 014 完了 ✓

---

## 024-ext: 天皇将軍LOD連動強化（Sprint 3 拡張）

> **追加日:** 2026-01-31
> **優先度:** P1
> **推定工数:** 1d

### 概要

LODレベルに応じて天皇・将軍の表示を段階的に開示し、ズームに応じた情報密度を最適化する。

### 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|----------|
| 1 | L0: 天皇・将軍レイヤー非表示 | LOD切替テスト |
| 2 | L1: マイルストーン天皇・将軍のみピン表示（名前付き） | UI確認 |
| 3 | L2: 全員の在位期間バー表示（名前なし） | UI確認 |
| 4 | L3: 在位期間バー + 名前表示 | UI確認 |
| 5 | LOD切替時のスムーズなフェードアニメーション（イベントマーカーと統一） | 実機テスト |
| 6 | アニメーション: opacity 1→0.5→1, scale 1→0.95→1 (200ms) | 実機テスト |

### LOD連動ルール

| LOD | 天皇 | 将軍 | 表示方法 |
|-----|------|------|---------|
| L0 | なし | なし | 情報過多防止 |
| L1 | マイルストーンのみ | マイルストーンのみ | ピンマーカー + 名前 |
| L2 | 帯表示（名前なし） | 帯表示（名前なし） | 色付きバー |
| L3 | 帯 + 名前 | 帯 + 名前 | 完全表示 |

### マイルストーン定義

```typescript
// domain/timeline/milestones.ts（新規）

export const MILESTONE_EMPERORS = [
  { id: 'jinmu', name: '神武', year: -660, description: '初代天皇' },
  { id: 'suiko', name: '推古', year: 593, description: '初の女帝' },
  { id: 'shomu', name: '聖武', year: 724, description: '東大寺建立' },
  { id: 'kanmu', name: '桓武', year: 781, description: '平安遷都' },
  { id: 'godaigo', name: '後醍醐', year: 1318, description: '建武の新政' },
  { id: 'meiji', name: '明治', year: 1868, description: '明治維新' },
  { id: 'showa', name: '昭和', year: 1926, description: '激動の昭和' },
];

export const MILESTONE_SHOGUNS = [
  { id: 'yoritomo', name: '源頼朝', year: 1185, description: '鎌倉幕府' },
  { id: 'takauji', name: '足利尊氏', year: 1336, description: '室町幕府' },
  { id: 'yoshimitsu', name: '足利義満', year: 1368, description: '金閣寺' },
  { id: 'ieyasu', name: '徳川家康', year: 1603, description: '江戸幕府' },
  { id: 'yoshimune', name: '徳川吉宗', year: 1716, description: '享保の改革' },
  { id: 'yoshinobu', name: '徳川慶喜', year: 1867, description: '大政奉還' },
];
```

### 実装ガイドライン

```typescript
// TimelineCanvas.tsx 内

// LODに基づく表示制御
const shouldShowReigns = lodLevel >= 1;
const showReignLabels = lodLevel >= 3;
const showOnlyMilestones = lodLevel === 1;

// マイルストーンフィルタ
const displayReigns = useMemo(() => {
  if (lodLevel === 0) return [];
  if (lodLevel === 1) {
    // マイルストーンのみ
    const milestoneIds = new Set([
      ...MILESTONE_EMPERORS.map(e => e.id),
      ...MILESTONE_SHOGUNS.map(s => s.id),
    ]);
    return visibleReigns.filter(r => milestoneIds.has(r.id));
  }
  // L2-L3: 全員表示
  return visibleReigns;
}, [lodLevel, visibleReigns]);
```

### LOD切替アニメーション（v4.1追加 - イベントマーカーと統一）

```typescript
// 統一アニメーション設定
const LOD_TRANSITION = {
  phase1Duration: 80,  // フェードアウト + スケールダウン
  phase2Duration: 120, // フェードイン + スケールアップ
  opacityMin: 0.5,
  scaleMin: 0.95,
};

// 天皇・将軍帯にも同じアニメーションを適用
const [reignOpacity, setReignOpacity] = useState(1);
const [reignScale, setReignScale] = useState(1);

// LOD変更検出 → イベントマーカーと同時にアニメーション
useEffect(() => {
  if (prevLodForAnimation.current !== lodLevel) {
    // Phase 1: フェードアウト + スケールダウン (80ms)
    animateValue(1, LOD_TRANSITION.opacityMin, LOD_TRANSITION.phase1Duration, setReignOpacity, () => {
      // Phase 2: フェードイン (120ms)
      animateValue(LOD_TRANSITION.opacityMin, 1, LOD_TRANSITION.phase2Duration, setReignOpacity);
    });

    animateValue(1, LOD_TRANSITION.scaleMin, LOD_TRANSITION.phase1Duration, setReignScale, () => {
      animateValue(LOD_TRANSITION.scaleMin, 1, LOD_TRANSITION.phase2Duration, setReignScale);
    });
  }
}, [lodLevel]);

// Skia Group に適用
<Group
  opacity={reignOpacity}
  transform={[{ scale: reignScale }]}
  origin={vec(screenWidth / 2, axisY)}
>
  {/* 天皇・将軍帯の描画 */}
</Group>
```

**設計意図:**
- イベントマーカーと天皇・将軍帯で異なるアニメーションは視覚的に不調和
- 統一されたトランジションでプロフェッショナルな印象を与える

### Todo リスト（024-ext）

- [ ] `domain/timeline/milestones.ts` 新規作成
- [ ] `TimelineCanvas.tsx` LOD連動ロジック追加
- [ ] L0: 天皇・将軍非表示
- [ ] L1: マイルストーンピン表示
- [ ] L2: 全員帯表示（名前なし）
- [ ] L3: 帯 + 名前
- [ ] LOD切替アニメーション（イベントマーカーと統一）
  - [ ] reignOpacity / reignScale state追加
  - [ ] useEffect でLOD変化検出
  - [ ] animateValue() でフェード+スケールアニメーション
  - [ ] Skia Groupにopacity/transform適用
- [ ] テスト: 各LODでの表示確認
- [ ] テスト: イベントマーカーとのアニメーション同期確認

---

## 変更履歴（024-ext）

### v4.1 (2026-01-31)
- LOD切替アニメーションをイベントマーカーと統一
- 受け入れ条件 #6 追加（アニメーション仕様明記）
- 実装ガイドラインにアニメーションコード追加
