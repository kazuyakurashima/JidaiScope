/**
 * Timeline Store - ズーム、スクロール、LOD状態管理
 * Sprint 1: 014 State Management
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TimelineState, LODLevel } from '@/types/store';

// ズーム制限
const MIN_ZOOM = 1;
const MAX_ZOOM = 100;

// LOD閾値
const LOD_THRESHOLDS = {
  L0_L1: 2,   // x2 で L1 に遷移
  L1_L2: 10,  // x10 で L2 に遷移
  L2_L3: 50,  // x50 で L3 に遷移
};

/**
 * ズームレベルからLODレベルを計算
 */
export function calculateLOD(zoom: number): LODLevel {
  if (zoom >= LOD_THRESHOLDS.L2_L3) return 3;
  if (zoom >= LOD_THRESHOLDS.L1_L2) return 2;
  if (zoom >= LOD_THRESHOLDS.L0_L1) return 1;
  return 0;
}

/**
 * Timeline Store
 * subscribeWithSelector を使用して、特定の状態変更のみを購読可能
 */
export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    zoomLevel: 1,
    scrollX: 0,
    lodLevel: 0,
    selectedEraId: null,

    // Actions
    setZoom: (level) => {
      const clampedLevel = Math.min(Math.max(level, MIN_ZOOM), MAX_ZOOM);
      const newLOD = calculateLOD(clampedLevel);
      set({
        zoomLevel: clampedLevel,
        lodLevel: newLOD,
      });
    },

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
  }))
);

// =============================================================================
// Selectors（パフォーマンス最適化用）
// =============================================================================

export const selectZoomLevel = (state: TimelineState) => state.zoomLevel;
export const selectScrollX = (state: TimelineState) => state.scrollX;
export const selectLODLevel = (state: TimelineState) => state.lodLevel;
export const selectSelectedEraId = (state: TimelineState) => state.selectedEraId;
