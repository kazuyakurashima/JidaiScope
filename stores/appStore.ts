/**
 * App Store - Pro状態管理（Sprint 1: Stub実装）
 * Sprint 1: 014 State Management
 *
 * 注意: Sprint 4 (041 IAP) で実際の課金ロジックと連携予定
 * 現時点では stub として proUnlocked を手動で切り替え可能
 */

import { create } from 'zustand';
import type { AppState } from '@/types/store';

export const useAppStore = create<AppState>((set) => ({
  // Initial State
  // Sprint 1: デフォルト false（Free ユーザー）
  // 開発時は true にして Pro 機能をテスト可能
  proUnlocked: false,
  isInitialized: false,

  // Actions
  setProUnlocked: (unlocked) => set({ proUnlocked: unlocked }),

  initialize: async () => {
    // Sprint 1: 即座に初期化完了
    // Sprint 4: ここで SecureStore から購入状態を復元
    set({ isInitialized: true });
  },
}));

// =============================================================================
// Hooks（便利なショートカット）
// =============================================================================

/**
 * Pro ユーザーかどうかを判定
 * @returns true if Pro unlocked
 */
export function useIsPro(): boolean {
  return useAppStore((state) => state.proUnlocked);
}

/**
 * Pro 機能へのアクセスをチェック
 * @param requirePro Pro が必要かどうか
 * @returns アクセス可能なら true
 */
export function useCanAccess(requirePro: boolean): boolean {
  const isPro = useIsPro();
  return !requirePro || isPro;
}

// =============================================================================
// Selectors
// =============================================================================

export const selectProUnlocked = (state: AppState) => state.proUnlocked;
export const selectIsInitialized = (state: AppState) => state.isInitialized;
