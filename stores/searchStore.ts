/**
 * Search Store - 検索履歴・結果キャッシュ管理
 * Sprint 1: 014 State Management
 */

import { create } from 'zustand';
import type { SearchState, SearchResult } from '@/types/store';
import { MAX_SEARCH_HISTORY, MAX_SEARCH_RESULTS_CACHE } from '@/types/store';

export const useSearchStore = create<SearchState>((set, get) => ({
  // Initial State
  searchHistory: [],
  searchResults: [],
  currentKeyword: '',
  isSearching: false,

  // Actions
  setKeyword: (keyword) => set({ currentKeyword: keyword }),

  setResults: (results) => {
    // 最大件数を超えないようにトリム
    const trimmedResults = results.slice(0, MAX_SEARCH_RESULTS_CACHE);
    set({
      searchResults: trimmedResults,
      isSearching: false,
    });
  },

  addToHistory: (keyword) => {
    if (!keyword.trim()) return;

    set((state) => {
      // 重複を除去して先頭に追加
      const filtered = state.searchHistory.filter((k) => k !== keyword);
      const updated = [keyword, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      return { searchHistory: updated };
    });
  },

  clearHistory: () => set({ searchHistory: [] }),

  clearResults: () =>
    set({
      searchResults: [],
      currentKeyword: '',
      isSearching: false,
    }),
}));

// =============================================================================
// Selectors
// =============================================================================

export const selectSearchResults = (state: SearchState) => state.searchResults;
export const selectSearchHistory = (state: SearchState) => state.searchHistory;
export const selectCurrentKeyword = (state: SearchState) => state.currentKeyword;
export const selectIsSearching = (state: SearchState) => state.isSearching;
