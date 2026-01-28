# 025: Haptics Feedback（Sprint 2）

## 概要

**目的:** PRD に定義されたハプティクスフィードバック（時代境界、LOD トランジション、年→月デフォルト OFF）を実装

**スコープ:**

- 時代境界通過時: Light impact（デフォルト ON）
- LOD レベル変更時: Selection feedback（デフォルト ON）
- 年→月カレンダーデフォルト OFF（ユーザー有効化時のみ）
- Event/Era タップ: Light impact
- 全操作で設定画面 ON/OFF トグル可能

**成功基準:**

- ✅ 時代境界・LOD トランジションで触覚フィードバック実装
- ✅ iOS/Android で統一動作
- ✅ 設定画面で ON/OFF トグル可能
- ✅ バッテリー消費 < 1%

---

## ユーザーストーリー

```
As a ユーザー
I want to スワイプ・タップなどの操作で触覚フィードバックを感じたい
So that アプリの反応が明確に分かり、操作感がより自然になる
```

---

## 受け入れ条件

| #   | 条件                                  | 検証方法          | 担当 |
| --- | ------------------------------------- | ----------------- | ---- |
| 1   | 時代境界通過時に Light impact         | 実機テスト（iOS） | -    |
| 2   | LOD レベル変更時に Selection feedback | 実機テスト（iOS） | -    |
| 3   | Event/Era タップ時に Light impact     | 実機テスト        | -    |
| 4   | 設定画面で haptics トグル可能         | UI テスト         | -    |
| 5   | 年→月カレンダー OFF（デフォルト）     | 設定確認          | -    |
| 6   | iOS/Android 共存                      | 両デバイステスト  | -    |

---

## 依存関係

| 種類             | 詳細                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings store で haptics 設定), 020 (Timeline canvas), 021 (Zoom gesture), 022 (LOD Manager) |
| ✗ コード依存     | expo-haptics パッケージ                                                                       |
| ✗ 他チケット依存 | なし                                                                                          |
| ✓ 出力依存       | 040 (Settings screen)：ON/OFF トグル UI                                                       |

---

## 技術仕様

### 使用ライブラリ

```typescript
import * as Haptics from "expo-haptics";
```

**対応プラットフォーム:**

- iOS: iPhone 6s 以降（Taptic Engine）
- Android: Pie (29) 以降（VibratorService）

### ハプティクス強度レベル

| レベル        | 用途                     | Haptics API                                               |
| ------------- | ------------------------ | --------------------------------------------------------- |
| **Light**     | Pinch 開始/終了          | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`  |
| **Medium**    | Double-Tap, Event タップ | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` |
| **Heavy**     | - (予約)                 | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)`  |
| **Selection** | Era picker 選択          | `Haptics.selectionAsync()`                                |

---

## 実装ガイドライン

### 1. Haptics 設定ストア追加（014 チケット対応）

```typescript
// stores/settingsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hapticsEnabled: true, // デフォルト ON
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
```

### 2. Haptics ユーティリティ関数

```typescript
// utils/haptics.ts
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "@/stores/settingsStore";

export async function triggerLightHaptic() {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (hapticsEnabled) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export async function triggerMediumHaptic() {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (hapticsEnabled) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export async function triggerSelectionHaptic() {
  const { hapticsEnabled } = useSettingsStore.getState();
  if (hapticsEnabled) {
    await Haptics.selectionAsync();
  }
}
```

### 3. Pinch Zoom への統合（021 チケット対応）

```typescript
// hooks/useZoomGesture.ts
import { triggerLightHaptic } from "@/utils/haptics";

export function useZoomGesture() {
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      // Zoom 処理
      workletScale.value = e.scale * baseScale.value;
    })
    .onStart(async () => {
      // Pinch 開始時に軽いバイブ
      triggerLightHaptic();
    })
    .onEnd(async () => {
      // Pinch 終了時に軽いバイブ
      triggerLightHaptic();
    });

  return Gesture.Exclusive(pinch, doubleTap);
}
```

### 4. Double-Tap への統合

```typescript
// hooks/useZoomGesture.ts (続き)
const doubleTap = Gesture.Tap()
  .numberOfTaps(2)
  .onEnd(async () => {
    // 2倍ズーム実行
    triggerMediumHaptic();
    workletScale.value = withSpring(baseScale.value * 2);
  });
```

### 5. Event タップ（020 Timeline Canvas）

```typescript
// components/TimelineCanvas.tsx
import { triggerMediumHaptic } from '@/utils/haptics';

export function TimelineCanvas() {
  const handleEventTap = async (eventId: string) => {
    await triggerMediumHaptic();

    // Event detail 画面に遷移
    router.push(`/event/${eventId}`);
  };

  return (
    <Canvas
      onDraw={(canvas) => {
        // ... 描画処理
        drawEvents(canvas, visibleEvents, handleEventTap);
      }}
    />
  );
}
```

### 6. Era Picker タップ

```typescript
// components/EraPickerBar.tsx
import { triggerSelectionHaptic } from '@/utils/haptics';

export function EraPickerBar() {
  const handleEraTap = async (era: Era) => {
    await triggerSelectionHaptic();

    // Era へズーム
    animateToEra(era);
  };

  return (
    <ScrollView horizontal>
      {eras.map((era) => (
        <Pressable
          key={era.id}
          onPress={() => handleEraTap(era)}
          hitSlop={{ top: 8, bottom: 8 }}
        >
          <Text>{era.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

### 7. Search Result タップ

```typescript
// screens/SearchResultsScreen.tsx
import { triggerMediumHaptic } from '@/utils/haptics';

export function SearchResultItem({ item, onPress }) {
  const handlePress = async () => {
    await triggerMediumHaptic();
    onPress(item);
  };

  return (
    <Pressable onPress={handlePress}>
      <Text>{item.title}</Text>
    </Pressable>
  );
}
```

---

## Todo リスト

### Phase 1: Settings Store 拡張（014 と連携）

- [x] SettingsStore に hapticsEnabled フラグ追加（既存）
- [x] AsyncStorage で persistence 設定（既存）
- [x] 既定値 true（デフォルト ON）

### Phase 2: Haptics ユーティリティ実装

- [x] utils/haptics.ts 作成（Sprint 0 PoC から拡張）
- [x] triggerHaptic() で hapticEnabled チェック追加
- [x] エラーハンドリング（デバイス非対応時 try/catch）
- [x] performance.now() フォールバック追加

### Phase 3: タイムライン画面への統合

- [x] 時代境界通過 → Light impact（TimelineCanvas.tsx）
- [x] Double-Tap → Medium impact（TimelineCanvas.tsx）
- [x] LOD レベル変更 → Selection feedback（TimelineCanvas.tsx）
- [x] Era Picker タップ → Selection feedback（EraPickerBar.tsx）

### Phase 4: 検索結果への統合

- [ ] Search result item タップ → triggerMediumHaptic()（030 で実装予定）

### Phase 5: 設定画面との連携（040 チケット対応）

- [x] settingsStore.hapticEnabled フラグ存在（既存）
- [x] toggleHaptic() アクション存在（既存）
- [ ] Settings screen に haptics トグル UI 追加（040 で実装予定）

### Phase 6: テスト

- [x] TypeScript ビルド確認
- [x] ESLint チェック
- [ ] 実機テスト：ビジュアル確認
- [ ] iOS/Android 比較テスト

### Phase 7: フィードバック対応

- [x] [High] TimelineCanvas の直接 Haptics 呼び出しをユーティリティに統一
  - `triggerHaptic()` / `triggerEraBoundaryHaptic()` を使用
  - try/catch と hapticEnabled チェックを一元適用
- [x] [Medium] Era 境界の強度をチケットに合わせる
  - `triggerEraBoundaryHaptic()` を Light に変更
  - 仕様コメントを更新
- [x] [Low] LODLevel の型を共有
  - haptics.ts から LODLevel 定義を削除
  - `@/types/store` からインポート

### Phase 8: フィードバック対応（最終）

- [x] [High] HapticTab をユーティリティ経由に統一
  - `Haptics.impactAsync` を `triggerHaptic('light')` に置換
  - `settingsStore.hapticEnabled` チェックを自動適用
- [x] [Medium] LOD 仕様の明確化
  - PRD仕様通り「LOD 変更は Selection」に統一
  - `triggerLODHaptic()` を selection 固定に簡素化

---

## ハプティクス マッピング表

| 操作                 | 強度      | Haptics API         | 実装場所       | チケット |
| -------------------- | --------- | ------------------- | -------------- | -------- |
| Tab タップ           | Light     | impactAsync(Light)  | HapticTab      | 025      |
| Pinch 開始           | Light     | impactAsync(Light)  | ZoomGesture    | 021      |
| Pinch 終了           | Light     | impactAsync(Light)  | ZoomGesture    | 021      |
| Double-Tap           | Medium    | impactAsync(Medium) | TimelineCanvas | 020      |
| LOD レベル変更       | Selection | selectionAsync()    | TimelineCanvas | 022      |
| 時代境界通過         | Light     | impactAsync(Light)  | TimelineCanvas | 025      |
| Era Picker タップ    | Selection | selectionAsync()    | EraPickerBar   | 023      |
| Search Result タップ | Medium    | impactAsync(Medium) | SearchScreen   | 030      |

---

## ファイル構成

```
utils/
└── haptics.ts                  # ハプティクスユーティリティ

stores/
└── settingsStore.ts            # haptics 設定追加

components/
├── haptic-tab.tsx              # Tab bar haptics
├── timeline/
│   ├── TimelineCanvas.tsx      # Event タップ haptics
│   └── EraPickerBar.tsx        # Era picker haptics
└── SearchResultItem.tsx        # Search result haptics

hooks/
└── useZoomGesture.ts           # Pinch/DoubleTap haptics
```

---

## テスト項目

| テスト項目    | 手順                     | 期待値           | 状態 |
| ------------- | ------------------------ | ---------------- | ---- |
| TypeScript    | npx tsc --noEmit         | エラーなし       | ✅   |
| ESLint        | npm run lint             | エラーなし       | ✅   |
| Double-Tap    | 2回素早くタップ          | 中程度バイブ感知 | -    |
| LOD 変更      | ピンチズームで LOD 変更  | 選択系バイブ     | -    |
| Era picker    | Era 帯をタップ           | 選択系バイブ     | -    |
| 時代境界      | スクロールで時代を通過   | 軽いバイブ       | -    |
| 設定 ON → OFF | Settings で OFF 切り替え | バイブ停止       | -    |
| 設定 OFF → ON | Settings で ON 切り替え  | バイブ再開       | -    |

---

**作成日:** 2025-01-25
**優先度:** P2
**推定工数:** 1d
**ステータス:** Done (Phase 1-3 実装完了、Phase 4-5 は関連チケットで実装予定)
**ブロッカー:** 014 (Settings store) ✓
