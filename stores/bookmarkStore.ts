/**
 * Bookmark Store - ブックマーク管理（AsyncStorage同期）
 * Sprint 1: 014 State Management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookmarkState } from '@/types/store';
import { MAX_BOOKMARKS } from '@/types/store';

const STORAGE_KEY = '@jidaiscope/bookmarks';

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  // Initial State
  bookmarks: [],
  isLoaded: false,

  // Actions
  loadBookmarks: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        set({ bookmarks: parsed, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('[bookmarkStore] Failed to load bookmarks:', error);
      set({ isLoaded: true });
    }
  },

  addBookmark: async (id) => {
    const state = get();
    if (state.bookmarks.includes(id)) return;

    // 最大件数チェック
    const updated = [...state.bookmarks, id].slice(-MAX_BOOKMARKS);

    set({ bookmarks: updated });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[bookmarkStore] Failed to save bookmark:', error);
    }
  },

  removeBookmark: async (id) => {
    const state = get();
    const updated = state.bookmarks.filter((bid) => bid !== id);

    set({ bookmarks: updated });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[bookmarkStore] Failed to remove bookmark:', error);
    }
  },

  isBookmarked: (id) => {
    return get().bookmarks.includes(id);
  },

  clearAll: async () => {
    set({ bookmarks: [] });

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[bookmarkStore] Failed to clear bookmarks:', error);
    }
  },
}));

// =============================================================================
// Selectors
// =============================================================================

export const selectBookmarks = (state: BookmarkState) => state.bookmarks;
export const selectBookmarkCount = (state: BookmarkState) => state.bookmarks.length;
export const selectIsBookmarksLoaded = (state: BookmarkState) => state.isLoaded;
