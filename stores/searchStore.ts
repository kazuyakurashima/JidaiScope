import { create } from "zustand";

import type { CachedSearchResult, SearchState } from "@/types/store";

const MAX_HISTORY = 50;
const MAX_CACHE = 50;
/** キャッシュ有効期限（5分） */
const CACHE_TTL_MS = 5 * 60 * 1000;

const normalizeKeyword = (keyword: string): string => keyword.trim().toLowerCase();

const updateHistory = (history: string[], keyword: string): string[] => {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return history;
  const next = [normalized, ...history.filter((item) => item !== normalized)];
  return next.slice(0, MAX_HISTORY);
};

const pruneCache = (
  results: Record<string, CachedSearchResult>,
  history: string[],
): Record<string, CachedSearchResult> => {
  const keys = Object.keys(results);
  if (keys.length <= MAX_CACHE) return results;

  const allowed = new Set(history.slice(0, MAX_CACHE));
  const pruned: Record<string, CachedSearchResult> = {};
  for (const key of keys) {
    if (allowed.has(key)) {
      pruned[key] = results[key];
    }
  }
  return pruned;
};

export const useSearchStore = create<SearchState>((set, get) => ({
  searchHistory: [],
  searchResults: {},
  currentKeyword: "",

  search: (keyword: string) => {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) {
      set({ currentKeyword: "" });
      return;
    }
    set((state) => ({
      currentKeyword: normalized,
      searchHistory: updateHistory(state.searchHistory, normalized),
    }));
  },

  clearHistory: () => set({ searchHistory: [] }),

  cacheResults: (keyword: string, result: CachedSearchResult) => {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return;
    set((state) => {
      const nextHistory = updateHistory(state.searchHistory, normalized);
      const nextResults = {
        ...state.searchResults,
        [normalized]: result,
      };
      return {
        currentKeyword: normalized,
        searchHistory: nextHistory,
        searchResults: pruneCache(nextResults, nextHistory),
      };
    });
  },

  getCachedResult: (keyword: string): CachedSearchResult | null => {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return null;

    const cached = get().searchResults[normalized];
    if (!cached) return null;

    // キャッシュ有効期限チェック
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      return null;
    }

    return cached;
  },

  touchHistory: (keyword: string) => {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return;
    set((state) => ({
      currentKeyword: normalized,
      searchHistory: updateHistory(state.searchHistory, normalized),
    }));
  },
}));
