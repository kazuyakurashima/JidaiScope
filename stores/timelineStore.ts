import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { LODLevel, TimelineState } from "@/types/store";

const DEFAULT_TIMELINE_STATE: Pick<
  TimelineState,
  "zoomLevel" | "scrollX" | "lodLevel" | "selectedEraId"
> = {
  zoomLevel: 1,
  scrollX: 0,
  lodLevel: 0,
  selectedEraId: null,
};

export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set, get) => ({
    ...DEFAULT_TIMELINE_STATE,

    setZoom: (level: number) => set({ zoomLevel: level }),
    setScroll: (x: number) => set({ scrollX: x }),
    setLOD: (level: LODLevel) => set({ lodLevel: level }),
    selectEra: (eraId: string | null) => {
      const current = get().selectedEraId;
      // 同じ時代を再タップ → 選択解除
      if (eraId === current) {
        set({ selectedEraId: null });
        return;
      }
      // 別の時代をタップ → 新しい選択
      set({ selectedEraId: eraId });
    },
    reset: () => set({ ...DEFAULT_TIMELINE_STATE }),
  })),
);
