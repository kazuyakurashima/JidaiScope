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
  subscribeWithSelector((set) => ({
    ...DEFAULT_TIMELINE_STATE,

    setZoom: (level: number) => set({ zoomLevel: level }),
    setScroll: (x: number) => set({ scrollX: x }),
    setLOD: (level: LODLevel) => set({ lodLevel: level }),
    selectEra: (eraId: string | null) => set({ selectedEraId: eraId }),
    reset: () => set({ ...DEFAULT_TIMELINE_STATE }),
  })),
);
