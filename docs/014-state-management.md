# 014: State Management - Zustand Store（Sprint 1）

## 概要

**目的:** Zustand を使用して、アプリ全体の状態管理を一元化・最適化する

**スコープ:**

- timelineStore（ズーム、スクロール位置、LOD）
- searchStore（検索履歴、検索結果キャッシュ）
- bookmarkStore（ブックマーク一覧、ローカルストレージ同期）
- appStore（Pro 状態スタブ、アプリ全体状態）← **Sprint 1 で stub 実装、Sprint 4 で IAP 連携**
- settingsStore（ハプティクス、テーマ、レイヤー設定）

**成功基準:**

- ✅ 全ストア実装完了
- ✅ 状態更新が < 16ms（60fps維持）
- ✅ ローカルストレージとの同期自動化
- ✅ 型安全（TypeScript strict）

---

## ユーザーストーリー

```
As a React/React Native 開発者
I want to 複雑な状態管理を簡潔に実装したい
So that コンポーネント間の状態共有がスムーズで保守性が高まる
```

---

## 受け入れ条件

| #   | 条件                                       | 検証方法                       | 担当 |
| --- | ------------------------------------------ | ------------------------------ | ---- |
| 1   | 5 つのストアが完成し、アクセス可能         | import { useTimelineStore } 等 | -    |
| ★   | appStore の proUnlocked stub が動作        | useAppStore().proUnlocked 確認 | -    |
| 2   | 状態更新が UI 遅延なし（< 1フレーム）      | React DevTools Profiler        | -    |
| 3   | bookmarkStore が AsyncStorage と双方向同期 | デバイス再起動後も保持         | -    |
| 4   | iapStore が購入状態を正しく管理            | Free/Pro 表示の切り替え確認    | -    |
| 5   | 型定義が完全（any 使用なし）               | TypeScript strict チェック     | -    |

---

## 依存関係

| 種類             | 詳細                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| ✗ 入力依存       | なし                                                                                            |
| ✗ コード依存     | なし                                                                                            |
| ✗ 他チケット依存 | なし                                                                                            |
| ✓ 出力依存       | 020 (Timeline), 024 (Layer), 030 (Search), 034 (Bookmarks) 等（全画面がストア依存）|
| ⓘ 拡張予定       | 041 (IAP, Sprint 4) で appStore を拡張し、実際の課金ロジックを追加 |

---

## Todo リスト

### Phase 1: Store 構造設計

- [ ] timelineStore
  - [ ] State: { zoomLevel, scrollX, lodLevel, selectedEraId }
  - [ ] Actions: { setZoom, scroll, updateLOD, selectEra }
- [ ] searchStore
  - [ ] State: { searchHistory, searchResults, currentKeyword }
  - [ ] Actions: { search, clearHistory, cacheResults }
- [ ] bookmarkStore
  - [ ] State: { bookmarks (id[], max 100) }
  - [ ] Actions: { addBookmark, removeBookmark, getBookmarks }
- [ ] appStore **← Sprint 1 で stub 実装**
  - [ ] State: { proUnlocked: boolean }（デフォルト false、Sprint 4 で IAP 連携）
  - [ ] Actions: { setProUnlocked }
  - [ ] **注意:** Sprint 4 (041 IAP) で実際の課金連携を実装。Sprint 1 では stub のみ
- [ ] settingsStore
  - [ ] State: { hapticEnabled, theme, visibleLayers }
  - [ ] Actions: { toggleHaptic, setTheme, toggleLayer }

### Phase 2: 実装

- [ ] stores/timelineStore.ts 実装
- [ ] stores/searchStore.ts 実装
- [ ] stores/bookmarkStore.ts 実装
- [ ] stores/appStore.ts 実装 **← Pro stub**
- [ ] stores/settingsStore.ts 実装

### Phase 3: ローカルストレージ連携

- [ ] bookmarkStore ↔ AsyncStorage 自動同期
- [ ] settingsStore ↔ AsyncStorage 自動同期
- [ ] appStore は Sprint 1 では stub のみ（SecureStore 連携は Sprint 4 で 041 IAP 実装時）

### Phase 4: 型定義

- [ ] types/Store.ts
  - [ ] TimelineState, SearchState, BookmarkState, AppState, SettingsState

### Phase 5: テスト

- [ ] 単一ストア操作テスト
- [ ] ストア間連携テスト
- [ ] AsyncStorage 同期テスト

---

## 実装ガイドライン

### Zustand ストア パターン

```typescript
// stores/timelineStore.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface TimelineState {
  zoomLevel: number;
  scrollX: number;
  lodLevel: 0 | 1 | 2 | 3;
  selectedEraId: string | null;

  setZoom: (level: number) => void;
  setScroll: (x: number) => void;
  setLOD: (level: 0 | 1 | 2 | 3) => void;
  selectEra: (eraId: string) => void;
  reset: () => void;
}

export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set) => ({
    zoomLevel: 1,
    scrollX: 0,
    lodLevel: 0,
    selectedEraId: null,

    setZoom: (level) => set({ zoomLevel: level }),
    setScroll: (x) => set({ scrollX: x }),
    setLOD: (level) => set({ lodLevel: level }),
    selectEra: (eraId) => set({ selectedEraId: eraId }),
    reset: () =>
      set({
        zoomLevel: 1,
        scrollX: 0,
        lodLevel: 0,
        selectedEraId: null,
      }),
  })),
);
```

### AsyncStorage 連携パターン

```typescript
// stores/bookmarkStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BookmarkState {
  bookmarks: string[];
  isLoaded: boolean;

  loadBookmarks: () => Promise<void>;
  addBookmark: (id: string) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set) => {
  // 初期ロード
  (async () => {
    const stored = await AsyncStorage.getItem("bookmarks");
    if (stored) {
      set({
        bookmarks: JSON.parse(stored),
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }
  })();

  return {
    bookmarks: [],
    isLoaded: false,

    loadBookmarks: async () => {
      const stored = await AsyncStorage.getItem("bookmarks");
      set({
        bookmarks: stored ? JSON.parse(stored) : [],
        isLoaded: true,
      });
    },

    addBookmark: async (id: string) => {
      set((state) => {
        const updated = [...new Set([...state.bookmarks, id])].slice(0, 100);
        AsyncStorage.setItem("bookmarks", JSON.stringify(updated));
        return { bookmarks: updated };
      });
    },

    removeBookmark: async (id: string) => {
      set((state) => {
        const updated = state.bookmarks.filter((bid) => bid !== id);
        AsyncStorage.setItem("bookmarks", JSON.stringify(updated));
        return { bookmarks: updated };
      });
    },
  };
});
```

### AppStore（Pro stub）パターン

```typescript
// stores/appStore.ts
// Sprint 1: Pro 状態の stub 実装
// Sprint 4 (041 IAP) で実際の課金ロジックと連携

import { create } from "zustand";

interface AppState {
  proUnlocked: boolean;
  setProUnlocked: (unlocked: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sprint 1: デフォルト false（Free ユーザー）
  // 開発時は true にして Pro 機能をテスト可能
  proUnlocked: false,

  setProUnlocked: (unlocked) => set({ proUnlocked: unlocked }),
}));

// 使用例: Layer 制限チェック
export function useIsPro() {
  return useAppStore((s) => s.proUnlocked);
}
```

### コンポーネント統合例

```typescript
// components/Timeline.tsx
import { useTimelineStore } from '@/stores/timelineStore';

export function Timeline() {
  const { zoomLevel, setZoom, lodLevel, setLOD } = useTimelineStore();

  return (
    <Canvas
      scale={zoomLevel}
      lodLevel={lodLevel}
      onZoomChange={setZoom}
      onLodChange={setLOD}
    />
  );
}
```

---

## ファイル構成

```
stores/
├── timelineStore.ts      # ズーム、LOD、Era選択
├── searchStore.ts        # 検索キャッシュ
├── bookmarkStore.ts      # ブックマーク（AsyncStorage同期）
├── appStore.ts           # Pro 状態 stub（Sprint 4 で IAP 連携）
└── settingsStore.ts      # ユーザー設定

types/
└── store.ts             # 全Store型定義
```

---

## テスト項目

### ストア単体テスト

- [ ] setZoom → zoomLevel 更新
- [ ] addBookmark → 最大100件までカウント
- [ ] setProUnlocked → proUnlocked フラグ変更
- [ ] toggleLayer → visibleLayers 更新

### 統合テスト

- [ ] bookmarkStore 追加 → AsyncStorage 保存 → 再起動 → 復元
- [ ] appStore proUnlocked 設定 → 各スクリーンで Pro 制限が反映

### パフォーマンステスト

- [ ] 1000回の状態更新 → フレーム落ち なし

---

## 注意事項

### メモリ効率

- bookmarks 最大 100件（容量制限）
- searchResults キャッシュ最大 50件
- timelineStore は軽量保持（参照用 ID のみ）

### AsyncStorage 容量

- bookmark JSON: 最大 ~5KB
- settings JSON: 最大 ~1KB
- 合計 < 100MB で十分

---

## 次のステップ

- ✅ 014 完了 → チケット 020 (Timeline Core) で useTimelineStore 統合
- ✅ 014 完了 → チケット 030 (Search) で useSearchStore 統合

---

**作成日:** 2025-01-25
**優先度:** P0 - Critical
**推定工数:** 1.5d
**ステータス:** Not Started
