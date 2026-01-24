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

- [ ] SettingsStore に hapticsEnabled フラグ追加
- [ ] AsyncStorage で persistence 設定
- [ ] 既定値 true（デフォルト ON）

### Phase 2: Haptics ユーティリティ実装

- [ ] utils/haptics.ts 作成
- [ ] triggerLightHaptic(), triggerMediumHaptic(), triggerSelectionHaptic() 実装
- [ ] 設定確認ロジック（hapticsEnabled チェック）
- [ ] エラーハンドリング（デバイス非対応時）

### Phase 3: タイムライン画面への統合

- [ ] Pinch Zoom 開始/終了時 → triggerLightHaptic()
- [ ] Double-Tap → triggerMediumHaptic()
- [ ] Event タップ → triggerMediumHaptic()
- [ ] Era picker タップ → triggerSelectionHaptic()

### Phase 4: 検索結果への統合

- [ ] Search result item タップ → triggerMediumHaptic()

### Phase 5: 設定画面との連携（040 チケット対応）

- [ ] Settings screen に haptics トグル追加
- [ ] トグル切り替え → useSettingsStore.setHapticsEnabled()
- [ ] リアルタイム反映

### Phase 6: テスト・最適化

- [ ] バッテリー消費量測定（< 1% target）
- [ ] iOS/Android 比較テスト
- [ ] デバイス非対応時の fallback 動作確認

---

## ハプティクス マッピング表

| 操作                 | 強度      | Haptics API         | 実装場所       | チケット |
| -------------------- | --------- | ------------------- | -------------- | -------- |
| Pinch 開始           | Light     | impactAsync(Light)  | ZoomGesture    | 021      |
| Pinch 終了           | Light     | impactAsync(Light)  | ZoomGesture    | 021      |
| Double-Tap           | Medium    | impactAsync(Medium) | ZoomGesture    | 021      |
| Event タップ         | Medium    | impactAsync(Medium) | TimelineCanvas | 020      |
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
├── TimelineCanvas.tsx          # Event タップ haptics
├── EraPickerBar.tsx            # Era picker haptics
└── SearchResultItem.tsx        # Search result haptics

hooks/
└── useZoomGesture.ts           # Pinch/DoubleTap haptics
```

---

## テスト項目

| テスト項目    | 手順                     | 期待値           |
| ------------- | ------------------------ | ---------------- |
| Pinch 開始    | 2指でピンチイン開始      | 軽いバイブ感知   |
| Pinch 終了    | 指を離す                 | 軽いバイブ感知   |
| Double-Tap    | 2回素早くタップ          | 中程度バイブ感知 |
| Event タップ  | Event マーカーをタップ   | 中程度バイブ     |
| Era picker    | Era 帯をタップ           | 選択系バイブ     |
| 設定 ON → OFF | Settings で OFF 切り替え | バイブ停止       |
| 設定 OFF → ON | Settings で ON 切り替え  | バイブ再開       |
| バッテリー    | 30分連続使用             | < 1% 消費        |

---

**作成日:** 2025-01-25
**優先度:** P2
**推定工数:** 1d
**ステータス:** Not Started
**ブロッカー:** 014 (Settings store)
