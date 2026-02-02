# 038-ext: Selection Sync UX（Sprint 3）

## 概要

**目的:** 時代選択の即時フィードバックと詳細遷移UXを改善し、トップバー（EraPickerBar）とメインタイムライン間の選択状態を同期する

**スコープ:**

- タップ即時ハイライト + 再タップ解除
- 長押しで時代詳細画面へ遷移
- トップバー・メインキャンバス両方に対応
- 初回ユーザーへの発見性補助

**成功基準:**

- [x] 時代チップタップで即座にハイライトされる
- [x] 同じ時代を再タップすると選択解除される
- [x] 長押し（500ms）で時代詳細画面へ遷移する
- [x] TimelineCanvas上の時代レーンでも長押しが機能する
- [x] 初回のみ長押しヒントが表示される

---

## ユーザーストーリー

```
As a ユーザー
I want to 時代をタップしたら即座に選択状態が反映されてほしい
So that 操作が正しく認識されたことを視覚的に確認できる
```

```
As a ユーザー
I want to 時代を長押しで詳細を見たい
So that タイムラインから離れずに時代の詳細情報にアクセスできる
```

---

## 受け入れ条件

| #   | 条件                                                       | 検証方法       |
| --- | ---------------------------------------------------------- | -------------- |
| 1   | 時代チップタップで即座にハイライトされる                   | UI確認         |
| 2   | 別の時代をタップすると新しい時代が選択される（旧選択解除） | UI確認         |
| 3   | 選択中の時代を再タップすると選択解除される                 | UI確認         |
| 4   | 選択解除後、画面中央の時代が自動ハイライトされる           | スクロールテスト |
| 5   | EraChipRowで長押し（500ms）すると時代詳細画面へ遷移        | 実機テスト     |
| 6   | TimelineCanvasの時代レーンで長押しすると詳細画面へ遷移     | 実機テスト     |
| 7   | 長押し時に触覚フィードバック（medium）が発生する           | 実機テスト     |
| 8   | 初回のみ長押しヒントが4秒間表示される                      | 初回起動テスト |
| 9   | VoiceOverで「長押しで詳細表示」のヒントが読み上げられる    | a11yテスト     |
| 10  | パン/ピンチ操作中は長押しがキャンセルされる                | ジェスチャーテスト |

---

## 依存関係

| 種類             | 詳細                                                |
| ---------------- | --------------------------------------------------- |
| ✓ 入力依存       | 038 (EraPickerBar), 020 (TimelineCanvas)            |
| ✗ コード依存     | timelineStore (selectedEraId, selectEra)            |
| ✗ 他チケット依存 | Era詳細画面 `/era/[id].tsx` ✅ 実装済み              |
| ✓ 出力依存       | なし                                                |

---

## 設計

### 1. 選択モデル

**概念分離:**

| 概念           | 変数            | 更新タイミング          | 用途                     |
| -------------- | --------------- | ----------------------- | ------------------------ |
| ユーザー選択   | `selectedEraId` | タップ時のみ            | ハイライト表示（優先）   |
| 画面中央の時代 | `focusedEraId`  | スクロール時（ローカル） | フォールバックハイライト |

**表示ロジック:**

```typescript
const highlightedEraId = selectedEraId ?? focusedEraId;
```

### 2. 再タップ解除ロジック

```typescript
// stores/timelineStore.ts
// 注: store作成時に (set, get) を受け取る署名に変更必要
// create<TimelineState>()((set, get) => ({ ... }))

selectEra: (eraId: string | null) => {
  const current = get().selectedEraId;

  // 同じ時代を再タップ → 選択解除
  if (eraId === current) {
    set({ selectedEraId: null });
    return;
  }

  // 別の時代をタップ → 新しい選択
  set({ selectedEraId: eraId });
}
```

**実装済み:** `stores/timelineStore.ts` で `subscribeWithSelector((set, get) => ...)` に変更済み。

**挙動まとめ:**

| 操作                    | 結果                              |
| ----------------------- | --------------------------------- |
| 時代Aをタップ           | A選択                             |
| 時代Bをタップ           | B選択（A自動解除）                |
| 選択中のBを再タップ     | 選択解除（null）                  |
| 選択解除後、スクロール  | focusedEraIdでハイライト          |

### 3. 長押し詳細遷移

**EraChipRow:**

```typescript
interface EraChipRowProps {
  eras: Era[];
  highlightedEraId: string | null;
  onEraPress: (era: Era) => void;
  onEraLongPress: (era: Era) => void;  // 新規追加
}

<Pressable
  onPress={() => onEraPress(era)}
  onLongPress={() => onEraLongPress(era)}
  delayLongPress={500}
  accessibilityHint="タップで選択、長押しで詳細表示"
>

// 注: React NativeのPressableは長押し後にonPressを発火しない仕様
// （delayLongPressを超えるとonLongPressのみ発火、onPressは抑制される）
// 参照: https://reactnative.dev/docs/pressable
```

**TimelineCanvas:**

```typescript
const longPressGesture = Gesture.LongPress()
  .minDuration(500)           // EraChipRowと統一（500ms）
  .onEnd((e) => {             // onStart ではなく onEnd で発火
    'worklet';
    runOnJS(handleLongPress)(e.x, e.y);
  });

// ジェスチャー競合解決（3層構造）
// 1. Exclusive: 長押し成功 → タップ抑制
const tapAndLongPress = Gesture.Exclusive(longPressGesture, tapGestures);

// 2. Race: タップ/長押し vs パン/ピンチ
//    パン開始（~150ms）で長押しはキャンセルされる
const composedGesture = Gesture.Race(
  tapAndLongPress,
  Gesture.Simultaneous(panGesture, pinchGesture)
);
```

**ジェスチャー競合ルール:**
- `Gesture.Exclusive`: 長押し成功時にタップを抑制（二重発火防止）
- `Gesture.Race`: パン/ピンチ開始で長押しを確実にキャンセル
- 長押し閾値500msはパン開始（~150ms）より十分長いため、意図しない長押し発火を防止

### 4. 発見性（初回ヒント）

```typescript
// EraPickerBar.tsx
// onboardingStore で永続化状態を管理
const initialized = useIsOnboardingInitialized();
const longPressHintShown = useLongPressHintShown();

useEffect(() => {
  // 初期化レース対策: AsyncStorage読み込み完了まで待機
  if (!initialized) return;
  if (longPressHintShown) return;

  // 1秒後に表示開始、4秒間表示後に自動消失
  const showTimer = setTimeout(() => setShowHint(true), 1000);
  const hideTimer = setTimeout(() => {
    setShowHint(false);
    markLongPressHintShown(); // AsyncStorageに永続化
  }, 5000);

  return () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
  };
}, [initialized, longPressHintShown]);
```

**初期化レース対策:**
- `checkCompleted()`完了前に`longPressHintShown=false`のままヒントが表示される問題を防止
- `useIsOnboardingInitialized()`で初期化完了を待機してからヒント表示判定

---

## 実装ガイドライン

### Phase 1: 選択同期（重大指摘対応）

1. `stores/timelineStore.ts` - `selectEra` に再タップ解除ロジック追加
2. `components/timeline/EraPickerBar.tsx` - 既存の即時フィードバックを維持

### Phase 2: 長押し詳細（EraChipRow）

1. `components/timeline/EraChipRow.tsx` - `onEraLongPress` props追加
2. `components/timeline/EraPickerBar.tsx` - `handleEraLongPress` ハンドラ追加
3. 初回ヒントUI追加

### Phase 3: 長押し詳細（TimelineCanvas）

1. `components/timeline/TimelineCanvas.tsx` - 長押しジェスチャー追加
2. `components/timeline/hitDetection.ts` - `getEraAtPoint` 確認・拡張
3. ジェスチャー競合設定

### Phase 4: テスト

1. 選択/解除の動作確認
2. 長押し遷移の動作確認
3. ジェスチャー競合テスト
4. a11yテスト

---

## Todo リスト

### Phase 1: 選択同期 ✅

- [x] `timelineStore.ts`: `selectEra` 再タップ解除ロジック追加
- [x] 動作確認: タップ → 選択、再タップ → 解除

### Phase 2: 長押し（EraChipRow）✅

- [x] `EraChipRow.tsx`: `onEraLongPress` props追加
- [x] `EraPickerBar.tsx`: `onEraLongPress` パススルー追加
- [x] `EraPickerBar.tsx`: 初回ヒントUI追加（Tip表示）
- [x] 動作確認: 長押し → 詳細画面遷移

### Phase 3: 長押し（TimelineCanvas）✅

- [x] `TimelineCanvas.tsx`: 長押しジェスチャー追加（`Gesture.LongPress`）
- [x] `hitDetection.ts`: `hitTest` で時代検出
- [x] ジェスチャー競合設定（`Gesture.Exclusive`）
- [x] 動作確認: 時代レーン長押し → 詳細画面遷移

### Phase 4: テスト・仕上げ

- [ ] a11yテスト（VoiceOver）
- [ ] ジェスチャー競合テスト（パン/ピンチ中）
- [ ] 初回ヒント表示確認

---

## ファイル構成

```
stores/
├── timelineStore.ts          # selectEra 修正（再タップ解除）
├── onboardingStore.ts        # longPressHintShown 状態追加
└── index.ts                  # エクスポート更新

components/timeline/
├── EraChipRow.tsx            # onEraLongPress props追加
├── EraPickerBar.tsx          # handleEraLongPress + ヒントUI
├── TimelineCanvas.tsx        # 長押しジェスチャー + focusedEraId追加
└── hitDetection.ts           # hitTest で時代検出
```

---

## リスク・考慮事項

- **ジェスチャー競合:** パン/ピンチ操作中に長押しが誤発火しないよう、`Gesture.Race` + `Gesture.Exclusive` で制御
- **長押し時間:** 500ms統一（EraChipRow / Canvas共通）でパン開始（~150ms）より十分長く
- **発見性:** 長押しは発見されにくいため、初回ヒント必須
- **a11y:** 下記参照

### アクセシビリティ対応

**EraChipRow（React Native Pressable）:**
```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel={`${era.name}時代`}
  accessibilityHint="タップで選択、長押しで詳細表示"
  accessibilityActions={[
    { name: 'activate', label: '選択' },
    { name: 'longpress', label: '詳細を表示' },
  ]}
  onAccessibilityAction={(event) => {
    if (event.nativeEvent.actionName === 'longpress') {
      onEraLongPress(era);
    } else {
      onEraPress(era);
    }
  }}
/>
```

**TimelineCanvas（Skia）:**
- Canvas上の時代領域はVoiceOverで直接操作不可
- **代替経路:** EraPickerBarのチップから長押し操作を提供
- **将来対応:** 043 Onboardingで「トップバーから時代詳細にアクセス」をガイド

---

**作成日:** 2026-02-02
**更新日:** 2026-02-02
**優先度:** P1
**推定工数:** 1d
**ステータス:** Done ✅
**ブロッカー:** 038 ✅

---

## 変更履歴

### v1.2 (2026-02-02)

- ジェスチャー競合ルールを明確化（Exclusive + Race の3層構造）
- a11yアクセシビリティ対応仕様を追加
- TimelineCanvasのVoiceOver代替経路を明記

### v1.1 (2026-02-02)

- ファイル構成に `onboardingStore.ts` 追加
- 初期化レース対策の設計を追記
- Todoリスト進捗更新

### v1.0 (2026-02-02)

- 初版作成
- 選択同期（再タップ解除）仕様追加
- 長押し詳細遷移仕様追加
- 監査フィードバック反映（selectedEraId解除経路）
