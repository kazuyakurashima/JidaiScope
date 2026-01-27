import { create } from "zustand";

import type { AppState } from "@/types/store";

export const useAppStore = create<AppState>((set) => ({
  // Sprint 1 stub: default false, Sprint 4 will connect to IAP.
  proUnlocked: false,
  setProUnlocked: (unlocked: boolean) => set({ proUnlocked: unlocked }),
  // DB初期化完了フラグ
  dbReady: false,
  setDbReady: (ready: boolean) => set({ dbReady: ready }),
}));

export const useIsPro = () => useAppStore((state) => state.proUnlocked);
export const useIsDbReady = () => useAppStore((state) => state.dbReady);
