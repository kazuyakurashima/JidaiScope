import { create } from "zustand";

import type { SearchState } from "@/types/store";

const MAX_HISTORY = 50;
const MAX_CACHE = 50;

const normalizeKeyword = (keyword: string): string => keyword.trim();

const updateHistory = (history: string[], keyword: string): string[] => {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return history;
  const next = [normalized, ...history.filter((item) => item !== normalized)];
  return next.slice(0, MAX_HISTORY);
};

const pruneCache = (
  results: Record<string, string[]>,
  history: string[],
): Record<string, string[]> => {
  const keys = Object.keys(results);
  if (keys.length <= MAX_CACHE) return results;

  const allowed = new Set(history.slice(0, MAX_CACHE));
  const pruned: Record<string, string[]> = {};
  for (const key of keys) {
    if (allowed.has(key)) {
      pruned[key] = results[key];
    }
  }
  return pruned;
};

export const useSearchStore = create<SearchState>((set) => ({
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

  cacheResults: (keyword: string, results: string[]) => {
    const normalized = normalizeKeyword(keyword);
    if (!normalized) return;
    set((state) => {
      const nextHistory = updateHistory(state.searchHistory, normalized);
      const nextResults = {
        ...state.searchResults,
        [normalized]: results,
      };
      return {
        currentKeyword: normalized,
        searchHistory: nextHistory,
        searchResults: pruneCache(nextResults, nextHistory),
      };
    });
  },
}));
