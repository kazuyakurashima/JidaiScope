export type LODLevel = 0 | 1 | 2 | 3;

export interface TimelineState {
  zoomLevel: number;
  scrollX: number;
  lodLevel: LODLevel;
  selectedEraId: string | null;

  setZoom: (level: number) => void;
  setScroll: (x: number) => void;
  setLOD: (level: LODLevel) => void;
  selectEra: (eraId: string | null) => void;
  reset: () => void;
}

export interface SearchState {
  searchHistory: string[];
  searchResults: Record<string, string[]>;
  currentKeyword: string;

  search: (keyword: string) => void;
  clearHistory: () => void;
  cacheResults: (keyword: string, results: string[]) => void;
}

export interface BookmarkState {
  bookmarks: string[];
  isLoaded: boolean;

  loadBookmarks: () => Promise<void>;
  addBookmark: (id: string) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  getBookmarks: () => string[];
}

export interface AppState {
  proUnlocked: boolean;
  setProUnlocked: (unlocked: boolean) => void;
}

export type PurchaseStatus = "none" | "pending" | "purchased" | "restored";

export interface IapState {
  purchaseStatus: PurchaseStatus;
  isProcessing: boolean;

  setPurchaseStatus: (status: PurchaseStatus) => void;
  setProcessing: (processing: boolean) => void;
  resetPurchase: () => void;
}

export type ThemeMode = "system" | "light" | "dark";
export type LayerType = "era" | "events" | "emperor" | "shogun" | "person";

export interface SettingsState {
  hapticEnabled: boolean;
  theme: ThemeMode;
  visibleLayers: Record<LayerType, boolean>;

  toggleHaptic: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleLayer: (type: LayerType) => Promise<void>;
}
