/**
 * Store Types - 全Zustandストアの型定義
 * Sprint 1: 014 State Management
 */

// =============================================================================
// LOD (Level of Detail)
// =============================================================================
export type LODLevel = 0 | 1 | 2 | 3;

// =============================================================================
// Timeline Store
// =============================================================================
export interface TimelineState {
  // State
  zoomLevel: number;
  scrollX: number;
  lodLevel: LODLevel;
  selectedEraId: string | null;

  // Actions
  setZoom: (level: number) => void;
  setScroll: (x: number) => void;
  setLOD: (level: LODLevel) => void;
  selectEra: (eraId: string | null) => void;
  reset: () => void;
}

// =============================================================================
// Search Store
// =============================================================================
export interface SearchResult {
  id: string;
  type: 'event' | 'person' | 'era';
  title: string;
  year?: number;
}

export interface SearchState {
  // State
  searchHistory: string[];
  searchResults: SearchResult[];
  currentKeyword: string;
  isSearching: boolean;

  // Actions
  setKeyword: (keyword: string) => void;
  setResults: (results: SearchResult[]) => void;
  addToHistory: (keyword: string) => void;
  clearHistory: () => void;
  clearResults: () => void;
}

// =============================================================================
// Bookmark Store
// =============================================================================
export interface BookmarkState {
  // State
  bookmarks: string[];
  isLoaded: boolean;

  // Actions
  loadBookmarks: () => Promise<void>;
  addBookmark: (id: string) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  isBookmarked: (id: string) => boolean;
  clearAll: () => Promise<void>;
}

// =============================================================================
// App Store (Pro State Stub)
// =============================================================================
export interface AppState {
  // State
  proUnlocked: boolean;
  isInitialized: boolean;

  // Actions
  setProUnlocked: (unlocked: boolean) => void;
  initialize: () => Promise<void>;
}

// =============================================================================
// Settings Store
// =============================================================================
export type ThemeMode = 'light' | 'dark' | 'system';

export interface LayerVisibility {
  era: boolean;        // 時代レイヤー（常時表示）
  majorEvents: boolean; // 主要事件レイヤー（常時表示）
  emperor: boolean;    // 天皇レイヤー（Pro制限）
  shogun: boolean;     // 将軍レイヤー（Pro制限）
  persons: boolean;    // 人物レイヤー（Pro制限）
}

export interface SettingsState {
  // State
  hapticEnabled: boolean;
  theme: ThemeMode;
  visibleLayers: LayerVisibility;
  isLoaded: boolean;

  // Actions
  toggleHaptic: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  loadSettings: () => Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================
export const MAX_BOOKMARKS = 100;
export const MAX_SEARCH_HISTORY = 20;
export const MAX_SEARCH_RESULTS_CACHE = 50;

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  era: true,
  majorEvents: true,
  emperor: false,
  shogun: false,
  persons: false,
};
