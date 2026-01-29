# 037: EraPickerBar Sync Enhancement（Sprint 3）

## 概要

**目的:** EraPickerBar とメインキャンバスの視覚的な連動を強化し、現在位置の把握を容易にする

**スコープ:**
- タップ時の時代ハイライト強調（既存 `selectedEraId` 活用）
- **時代変化時**の EraPickerBar 自動スクロール（ピクセル単位の追従ではなく、時代境界を跨いだ時のみ）
- Source of Truth の明確化（`store.scrollX` を唯一のソースとする）

**成功基準:**
- [ ] EraPickerBar タップ時、選択した時代が明確にハイライトされる
- [ ] メインキャンバスで時代が変わると、EraPickerBar がその時代を中央に表示するようスクロールする
- [ ] 現在表示中の時代が EraPickerBar 上で常に視認できる

---

## ユーザーストーリー

```
As a ユーザー
I want to EraPickerBar とメインキャンバスが連動してほしい
So that 現在どの時代を見ているか直感的に把握できる
```

---

## 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|----------|
| 1 | EraPickerBar タップ → `store.selectedEraId` が更新される | store確認 |
| 2 | 選択時代が背景色 + ボーダーで強調表示される | UI確認 |
| 3 | メインキャンバスで**時代が変わった時**、EraPickerBar が自動スクロール（同一時代内のスクロールでは追従しない） | 実機テスト |
| 4 | 現在時代が EraPickerBar の中央付近に表示される | UI確認 |
| 5 | ジャンプアニメーション中も選択状態が維持される | 実機テスト |
| 6 | 同期ループが発生しない（store.scrollX が唯一のソース） | デバッグログ確認 |

---

## 依存関係

| 種類 | 詳細 |
|------|------|
| ✓ 入力依存 | 023 (Era Picker) |
| ✗ コード依存 | なし |
| ✗ 他チケット依存 | なし |

---

## アーキテクチャ設計

### Source of Truth 方針

```
┌─────────────────────────────────────────────────────────────┐
│                      store.scrollX                          │
│                   (Single Source of Truth)                  │
└─────────────────────────────────────────────────────────────┘
        ↑                                      ↓
        │ setScroll()                          │ scrollX から導出
        │                                      │
┌───────┴───────┐                    ┌─────────┴─────────┐
│ TimelineCanvas │                    │   currentEraId    │
│   (Gesture)    │                    │  (useMemo で計算)  │
└───────────────┘                    └─────────┬─────────┘
        ↑                                      │
        │                                      │ 変化時のみ useEffect
        │                                      ↓
        │                            ┌─────────┴─────────┐
        │                            │   EraPickerBar    │
        │                            │  (Auto-scroll)    │
        │                            └─────────┬─────────┘
        │                                      │ タップ時のみ
        │                                      ↓
        └──────────────── setScroll() ────────┘
```

> **ポイント:** EraPickerBar は `scrollX` を直接監視せず、`currentEraId`（scrollX から useMemo で導出）の**変化時のみ**自動スクロールをトリガーする。これにより高頻度更新を回避。

**ルール:**
1. `store.scrollX` が唯一の真実
2. TimelineCanvas のジェスチャー → `setScroll()` で store 更新
3. EraPickerBar タップ → `setScroll()` で store 更新
4. EraPickerBar は `currentEraId`（scrollX から導出）の**変化時のみ**自動スクロール（scrollX 直監視ではない）
5. EraPickerBar の ScrollView は `scrollEnabled={false}`（ユーザー操作不可）

---

## 実装ガイドライン

### 1. selectedEraId 活用（既存 store）

```typescript
// stores/timelineStore.ts（既存）
interface TimelineState {
  selectedEraId: string | null;
  selectEra: (eraId: string | null) => void;
}
```

```typescript
// EraPickerBar.tsx - Store 購読の追加（既存の scrollX, zoomLevel, setScroll に追加）

// 追加する store 購読
const selectedEraId = useTimelineStore((s) => s.selectedEraId);
const selectEra = useTimelineStore((s) => s.selectEra);

// 既存の jumpToEra を修正（onPress から呼び出し）
const handleEraPress = useCallback((era: Era) => {
  selectEra(era.id);  // 選択状態を設定
  jumpToEra(era);     // スクロール実行（既存関数）
}, [selectEra, jumpToEra]);

// Pressable の onPress を修正
<Pressable onPress={() => handleEraPress(era)} ...>
```

### 2. EraPickerBar 自動スクロール

**パフォーマンス考慮:**
- `scrollX` は高頻度で変化する（60fps）ため、直接監視するとジッターや遅延の原因になる
- **トリガーは `currentEraId` の変化時のみ**（低頻度）に限定する
- これにより、時代が切り替わった時だけ EraPickerBar がスクロールする

```typescript
// EraPickerBar.tsx - ヘルパー関数

/**
 * 指定インデックスの時代の左端オフセットを計算
 * @param eraIndex 時代のインデックス
 * @param eraWidths 時代の幅配列 { era, width }[]
 * @returns 左端からのオフセット（px）
 */
function calculateEraOffset(
  eraIndex: number,
  eraWidths: Array<{ era: Era; width: number }>
): number {
  let offset = 0;
  for (let i = 0; i < eraIndex; i++) {
    offset += eraWidths[i].width;
  }
  // 時代の中央を返す
  return offset + eraWidths[eraIndex].width / 2;
}
```

```typescript
// EraPickerBar.tsx - Refs
const scrollViewRef = useRef<ScrollView>(null);
const prevEraIdRef = useRef<string | null>(null);

// currentEraId の変更を監視して自動スクロール（低頻度トリガー）
// scrollX の変化ごとではなく、時代が切り替わった時のみ発火
useEffect(() => {
  if (!scrollViewRef.current) return;
  if (currentEraId === prevEraIdRef.current) return; // 同じ時代なら何もしない
  prevEraIdRef.current = currentEraId;

  // 現在の時代の位置を計算
  const eraIndex = eras.findIndex(e => e.id === currentEraId);
  if (eraIndex < 0) return;

  // その時代が中央に来るようにスクロール
  const targetOffset = calculateEraOffset(eraIndex, eraWidths);

  // スクロール位置をクランプ（0 〜 maxOffset）
  const totalBarWidth = eraWidths.reduce((sum, w) => sum + w.width, 0);
  const maxOffset = Math.max(0, totalBarWidth - screenWidth);
  const clampedOffset = Math.max(0, Math.min(maxOffset, targetOffset - screenWidth / 2));

  scrollViewRef.current.scrollTo({
    x: clampedOffset,
    animated: true,
  });
}, [currentEraId, eras, eraWidths, screenWidth]); // scrollX は依存に含めない
```

### 3. ハイライト強調スタイル

```typescript
// 選択状態と現在時代の両方を考慮
const isSelected = era.id === selectedEraId;
const isCurrent = era.id === currentEraId;

const eraStyle = {
  backgroundColor: isSelected || isCurrent ? eraColor : 'transparent',
  borderColor: eraColor,
  borderWidth: isSelected ? 3 : 1,  // 選択時は太いボーダー
  opacity: isSelected ? 1 : isCurrent ? 0.9 : 0.7,
};
```

### 4. スクロール無効化

**設計意図:**
- `scrollEnabled={false}` により、ユーザーが直接 EraPickerBar をスクロールすることを**意図的に**禁止
- **理由:**
  1. **Single Source of Truth:** メインキャンバスの `scrollX` が唯一の真実。EraPickerBar が独自にスクロールすると状態の不整合が発生
  2. **操作の一貫性:** ユーザーはメインキャンバスをスクロールすることで時代を移動。EraPickerBar はそれを反映するだけの「表示専用」UI
  3. **競合回避:** 両方のコンポーネントがスクロール可能だと、同期ループや意図しない挙動の原因になる
- **時代への直接ジャンプ:** ユーザーは EraPickerBar 内の時代をタップすることでジャンプ可能。手動スクロールの代わりにタップ操作を使用

```tsx
<ScrollView
  ref={scrollViewRef}
  horizontal
  scrollEnabled={false}  // ユーザー操作を無効化（設計意図は上記参照）
  showsHorizontalScrollIndicator={false}
>
```

---

## Todo リスト

### Phase 1: Store 購読追加
- [ ] `selectedEraId` を store から購読
- [ ] `selectEra` アクションを store から購読
- [ ] `handleEraPress` コールバックを作成（`selectEra` + `jumpToEra`）
- [ ] `Pressable` の `onPress` を `handleEraPress` に変更

### Phase 2: タップ時ハイライト
- [ ] 選択状態（`isSelected`）と現在時代（`isCurrent`）のスタイル適用
- [ ] 太ボーダー + opacity で視覚的に区別
- [ ] アニメーション完了後に `selectEra(null)` でリセット（オプション）

### Phase 3: 自動スクロール
- [ ] `scrollViewRef` を追加
- [ ] `calculateEraOffset` ヘルパー関数を追加
- [ ] `scrollEnabled={false}` に変更
- [ ] `useEffect` で `currentEraId` を監視（`scrollX` は監視しない）
- [ ] スクロール位置のクランプ処理（0 〜 maxOffset）
- [ ] 現在時代が中央に来るよう `scrollTo` 実行

### Phase 4: テスト
- [ ] タップ → ハイライト表示確認
- [ ] メインキャンバススクロール → EraPickerBar 連動確認
- [ ] 同期ループなし確認（コンソールログ）
- [ ] パフォーマンス確認（60fps 維持）

---

## ファイル構成

```
components/timeline/
└── EraPickerBar.tsx         # 自動スクロール + ハイライト強化

stores/
└── timelineStore.ts         # selectedEraId（既存、変更なし）
```

---

## リスク・考慮事項

- **パフォーマンス:** `scrollX` の変化は高頻度（60fps）のため、**トリガーを `currentEraId` の変化時のみに限定**することでジッターを回避
- **競合回避:** EraPickerBar の ScrollView を `scrollEnabled={false}` にすることで、ユーザー操作による競合を完全回避
- **UX への影響:** 手動スクロールの代わりにタップによるジャンプ操作を提供。これは「EraPickerBar は表示専用、メインキャンバスが操作対象」という明確な役割分担を実現するための設計判断

---

**作成日:** 2025-01-30
**優先度:** P2
**推定工数:** 0.5d
**ステータス:** Pending
**ブロッカー:** 023 (Era Picker)
