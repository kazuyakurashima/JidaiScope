import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type { BookmarkState } from "@/types/store";

const STORAGE_KEY = "bookmarks";
const MAX_BOOKMARKS = 100;

const sanitizeBookmarks = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && item.trim().length > 0) {
      unique.add(item);
    }
  }
  return Array.from(unique).slice(0, MAX_BOOKMARKS);
};

const loadBookmarksFromStorage = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return sanitizeBookmarks(JSON.parse(stored));
  } catch {
    return [];
  }
};

const persistBookmarks = async (bookmarks: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // Ignore persistence failures to avoid blocking UI.
  }
};

export const useBookmarkStore = create<BookmarkState>((set, get) => {
  const hydrate = async () => {
    const stored = await loadBookmarksFromStorage();
    set({ bookmarks: stored, isLoaded: true });
  };

  void hydrate();

  return {
    bookmarks: [],
    isLoaded: false,

    loadBookmarks: async () => {
      const stored = await loadBookmarksFromStorage();
      set({ bookmarks: stored, isLoaded: true });
    },

    addBookmark: async (id: string) => {
      const trimmed = id.trim();
      if (!trimmed) return;
      const next = [trimmed, ...get().bookmarks.filter((item) => item !== trimmed)].slice(
        0,
        MAX_BOOKMARKS,
      );
      set({ bookmarks: next });
      await persistBookmarks(next);
    },

    removeBookmark: async (id: string) => {
      const next = get().bookmarks.filter((item) => item !== id);
      set({ bookmarks: next });
      await persistBookmarks(next);
    },

    getBookmarks: () => get().bookmarks,
  };
});
