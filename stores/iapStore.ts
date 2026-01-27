/**
 * IAP Store - 課金状態管理
 * Sprint 1: 014 State Management
 * Note: Sprint 1では stub 実装、Sprint 4 (041 IAP) で実際の課金ロジックと連携
 */

import { create } from "zustand";

import type { IapState, PurchaseStatus } from "@/types/store";

export const useIapStore = create<IapState>((set) => ({
  purchaseStatus: "none",
  isProcessing: false,

  setPurchaseStatus: (status: PurchaseStatus) => set({ purchaseStatus: status }),

  setProcessing: (processing: boolean) => set({ isProcessing: processing }),

  resetPurchase: () => set({ purchaseStatus: "none", isProcessing: false }),
}));

/**
 * 購入済みかどうかを判定するセレクター
 */
export const useIsPurchased = () =>
  useIapStore((s) => s.purchaseStatus === "purchased" || s.purchaseStatus === "restored");
