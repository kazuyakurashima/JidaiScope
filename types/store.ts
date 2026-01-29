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

export interface CachedSearchResult {
  items: Array<{
    id: string;
    type: 'event' | 'person' | 'year';
    title: string;
    subtitle: string;
    year: number;
  }>;
  totalCount: number;
  suggestions: string[];
  timestamp: number;
}

export interface SearchState {
  searchHistory: string[];
  searchResults: Record<string, CachedSearchResult>;
  currentKeyword: string;

  search: (keyword: string) => void;
  clearHistory: () => void;
  cacheResults: (keyword: string, result: CachedSearchResult) => void;
  getCachedResult: (keyword: string) => CachedSearchResult | null;
  /** キャッシュヒット時に履歴順を更新（直近順を維持） */
  touchHistory: (keyword: string) => void;
}

export interface BookmarkWithTitle {
  id: string;
  targetType: 'event' | 'person';
  targetId: string;
  title: string;
  createdAt: string;
}

export interface BookmarkState {
  bookmarks: BookmarkWithTitle[];
  isLoaded: boolean;

  loadBookmarks: () => Promise<void>;
  addBookmark: (targetType: 'event' | 'person', targetId: string, title: string) => Promise<void>;
  removeBookmark: (targetType: 'event' | 'person', targetId: string) => Promise<void>;
  isBookmarked: (targetType: 'event' | 'person', targetId: string) => boolean;
  searchBookmarks: (query: string) => BookmarkWithTitle[];
  /** 詳細画面訪問時にアクセス順を更新（最近アクセスキャッシュ用） */
  touchAccess: (targetType: 'event' | 'person', targetId: string) => Promise<void>;
}

export interface AppState {
  proUnlocked: boolean;
  setProUnlocked: (unlocked: boolean) => void;
  dbReady: boolean;
  setDbReady: (ready: boolean) => void;
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
