import { create } from "zustand";

import type { AppState } from "@/types/store";

export const useAppStore = create<AppState>((set) => ({
  // MVP (v1.0): 全機能無料開放。v1.5 で IAP 実装後に制限導入。
  proUnlocked: true,
  setProUnlocked: (unlocked: boolean) => set({ proUnlocked: unlocked }),
  // DB初期化完了フラグ
  dbReady: false,
  setDbReady: (ready: boolean) => set({ dbReady: ready }),
}));

export const useIsPro = () => useAppStore((state) => state.proUnlocked);
export const useIsDbReady = () => useAppStore((state) => state.dbReady);
