# 021: Zoom Manager（Sprint 2）

## 概要

**目的:** ピンチズーム・ダブルタップ・Era Picker による段階的ズーム操作を一元管理

**スコープ:**

- ズームレベル計算・制限
- 年→ピクセル変換
- スムーズなズームアニメーション（Reanimated）
- 慣性ズーム対応
- ズーム値のレンジ制限（min/max）

**成功基準:**

- ✅ ピンチズーム：1倍〜500倍スムーズ対応
- ✅ ダブルタップ：x2段階ズーム
- ✅ ズーム中も 60fps 維持
- ✅ ズーム値変更時に LODManager へ通知

---

## ユーザーストーリー

```
As a ユーザー
I want to 直感的にズーム操作して時代を詳しく見たい
So that 全体から部分へスムーズに遷移できる
```

---

## 受け入れ条件

| #   | 条件                                          | 検証方法           | 担当 |
| --- | --------------------------------------------- | ------------------ | ---- |
| 1   | 最小ズーム（1倍）で全体タイムライン表示       | ビジュアル確認     | -    |
| 2   | 最大ズーム（500倍）で月単位表示               | 同上               | -    |
| 3   | ピンチジェスチャー → スムーズズーム           | 目視・フレーム計測 | -    |
| 4   | ダブルタップ → x2ズーム段階                   | 5回繰り返して検証  | -    |
| 5   | ズーム中に 60fps 維持                         | Xcode Instruments  | -    |
| 6   | ズーム値変更 → useTimelineStore 更新 → UI反映 | Redux DevTools     | -    |

---

## 依存関係

| 種類             | 詳細                                        |
| ---------------- | ------------------------------------------- |
| ✓ 入力依存       | 020 (Timeline Core), 014 (State Management) |
| ✗ コード依存     | 022 (LOD Manager)へ notify                  |
| ✗ 他チケット依存 | なし                                        |
| ✓ 出力依存       | 022, 023, 025 (すべてズーム値に依存)        |

---

## Todo リスト

### Phase 1: ズーム値計算ロジック

- [ ] ズームレベル → pixelsPerYear 変換関数
  ```
  pixelsPerYear = basePixelsPerYear * zoomLevel
  basePixelsPerYear = 0.1 (1年 = 0.1px at zoom=1)
  ```
- [ ] 総時間幅の計算（-10000年〜2025年 = 12025年）
- [ ] min/max ズーム値決定
  - min: 全体が画面内
  - max: 月単位（1/12年）が見える = 144倍のズーム
- [ ] スムーズなズーム計算（指数関数的）

### Phase 2: React Native Reanimated 統合

- [ ] Gesture.Pinch() 統合
  - [ ] onUpdate で zoomLevel 更新
  - [ ] Shared Value（scale）を useTimelineStore に反映
- [ ] ダブルタップジェスチャー
  - [ ] 現在の zoomLevel を x2 に変更
  - [ ] アニメーション付き

### Phase 3: スクロール位置の保持

- [ ] ズーム中心を基準にした位置調整
  - [ ] ピンチ中心点（focal point）を基準に計算
  - [ ] ズーム後もその位置が同じ画面位置に来るよう調整
- [ ] Scroll値を useTimelineStore.scrollX に反映

### Phase 4: LOD通知メカニズム

- [ ] ズーム値 → LOD Level 変換
  - [ ] L0: x1〜x2
  - [ ] L1: x2〜x10
  - [ ] L2: x10〜x50
  - [ ] L3: x50以上
- [ ] Level 変更時に setLOD(newLevel) コール
- [ ] 022 (LOD Manager) へ通知

### Phase 5: テスト＆最適化

- [ ] ズーム値の平滑化（遅延を避ける）
- [ ] メモリリーク確認（Animated listener のクリーンアップ）

---

## 実装ガイドライン

```typescript
// domain/timeline/zoomManager.ts
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useTimelineStore } from "@/stores/timelineStore";

const MIN_ZOOM = 1;
const MAX_ZOOM = 500;
const BASE_PIXELS_PER_YEAR = 0.1;
const TOTAL_YEARS = 12025; // -10000 to 2025

export function useZoomManager() {
  const { zoomLevel, setZoom, setLOD } = useTimelineStore();
  const sharedZoom = useSharedValue(zoomLevel);

  const pinchGesture = Gesture.Pinch()
    .onUpdate(({ scale }) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * scale));
      sharedZoom.value = newZoom;
    })
    .onEnd(({ scale }) => {
      const finalZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, zoomLevel * scale),
      );
      setZoom(finalZoom);
      updateLOD(finalZoom);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const newZoom = Math.min(MAX_ZOOM, zoomLevel * 2);
      setZoom(newZoom);
      updateLOD(newZoom);
    });

  function updateLOD(zoom: number) {
    if (zoom < 2) setLOD(0);
    else if (zoom < 10) setLOD(1);
    else if (zoom < 50) setLOD(2);
    else setLOD(3);
  }

  function pixelsPerYear(zoom: number): number {
    return BASE_PIXELS_PER_YEAR * zoom;
  }

  return {
    pinchGesture,
    doubleTap,
    pixelsPerYear: pixelsPerYear(zoomLevel),
    sharedZoom,
  };
}
```

---

## ファイル構成

```
domain/
└── timeline/
    ├── zoomManager.ts          # ズーム計算・Gesture統合
    ├── constants.ts            # MIN/MAX, BASE値
    └── types.ts                # ZoomState型
```

---

## テスト項目

- [ ] x1→x500ズーム：スムーズなアニメーション
- [ ] ピンチ + スクロール同時操作：フレーム落ちなし
- [ ] ズーム値 → LOD変換：正確性確認
- [ ] メモリ：Gesture リスナー適切に削除

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 020 完了
