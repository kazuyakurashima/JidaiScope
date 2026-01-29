/**
 * Bookmark Store - ブックマーク管理（SQLite + AsyncStorage キャッシュ）
 * Sprint 3: 034 Bookmarks Feature
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { BookmarkState, BookmarkWithTitle } from '@/types/store';
import {
  getAllBookmarks,
  addBookmark as addBookmarkToDb,
  removeBookmarkByTarget,
  getBookmarkByTarget,
} from '@/data/repositories/BookmarkRepository';
import { getEventById } from '@/data/repositories/EventRepository';
import { getPersonById } from '@/data/repositories/PersonRepository';

// =============================================================================
// Constants
// =============================================================================

const RECENT_CACHE_KEY = 'recent_bookmarks';
const MAX_RECENT_CACHE = 10;

// =============================================================================
// Utils
// =============================================================================

/**
 * 簡易UUID生成
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 最近のブックマークをAsyncStorageから取得
 */
async function getRecentCache(): Promise<BookmarkWithTitle[]> {
  try {
    const cached = await AsyncStorage.getItem(RECENT_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

/**
 * 最近のブックマークをAsyncStorageに保存（最大10件）
 */
async function setRecentCache(bookmarks: BookmarkWithTitle[]): Promise<void> {
  try {
    const recent = bookmarks.slice(0, MAX_RECENT_CACHE);
    await AsyncStorage.setItem(RECENT_CACHE_KEY, JSON.stringify(recent));
  } catch {
    // キャッシュ保存失敗は無視
  }
}

/**
 * ブックマークにタイトルを付与して取得
 * - DB の title があればそれを使用
 * - なければ event/person から取得
 */
async function loadBookmarksWithTitles(): Promise<BookmarkWithTitle[]> {
  const bookmarks = await getAllBookmarks();
  const results: BookmarkWithTitle[] = [];

  // Promise.all で並列化（N+1 改善）
  const titlePromises = bookmarks
    .filter((b) => b.targetType !== 'era')
    .map(async (bookmark) => {
      // DB に title があればそれを使用
      if (bookmark.title) {
        return {
          id: bookmark.id,
          targetType: bookmark.targetType as 'event' | 'person',
          targetId: bookmark.targetId,
          title: bookmark.title,
          createdAt: bookmark.createdAt,
        };
      }

      // なければ event/person から取得
      let title = '不明';
      if (bookmark.targetType === 'event') {
        const event = await getEventById(bookmark.targetId);
        title = event?.title ?? '不明なイベント';
      } else if (bookmark.targetType === 'person') {
        const person = await getPersonById(bookmark.targetId);
        title = person?.name ?? '不明な人物';
      }

      return {
        id: bookmark.id,
        targetType: bookmark.targetType as 'event' | 'person',
        targetId: bookmark.targetId,
        title,
        createdAt: bookmark.createdAt,
      };
    });

  const resolvedBookmarks = await Promise.all(titlePromises);
  results.push(...resolvedBookmarks);

  return results;
}

// =============================================================================
// Store
// =============================================================================

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  isLoaded: false,

  loadBookmarks: async () => {
    try {
      // まず AsyncStorage キャッシュから素早く表示
      const cached = await getRecentCache();
      if (cached.length > 0) {
        set({ bookmarks: cached, isLoaded: true });
      }

      // SQLite から完全なリストを取得
      const bookmarks = await loadBookmarksWithTitles();
      set({ bookmarks, isLoaded: true });

      // キャッシュ更新
      await setRecentCache(bookmarks);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      set({ bookmarks: [], isLoaded: true });
    }
  },

  addBookmark: async (targetType, targetId, title) => {
    try {
      // Check if already bookmarked in DB
      const existing = await getBookmarkByTarget(targetType, targetId);
      if (existing) return;

      // Check if already in store (dedupe)
      const { bookmarks } = get();
      if (bookmarks.some((b) => b.targetType === targetType && b.targetId === targetId)) {
        return;
      }

      const id = generateUUID();
      const createdAt = new Date().toISOString();

      // Add to database with title
      await addBookmarkToDb({
        id,
        targetType,
        targetId,
        title,
        createdAt,
        note: null,
      });

      // Update store (set の関数形式で最新 state から重複除外)
      const newBookmark: BookmarkWithTitle = {
        id,
        targetType,
        targetId,
        title,
        createdAt,
      };
      set((state) => {
        const filteredBookmarks = state.bookmarks.filter(
          (b) => !(b.targetType === targetType && b.targetId === targetId)
        );
        return { bookmarks: [newBookmark, ...filteredBookmarks] };
      });

      // キャッシュ更新
      await setRecentCache(get().bookmarks);
    } catch (error) {
      console.error('Failed to add bookmark:', error);
    }
  },

  removeBookmark: async (targetType, targetId) => {
    try {
      // Remove from database
      await removeBookmarkByTarget(targetType, targetId);

      // Update store
      const newBookmarks = get().bookmarks.filter(
        (b) => !(b.targetType === targetType && b.targetId === targetId)
      );
      set({ bookmarks: newBookmarks });

      // キャッシュ更新
      await setRecentCache(newBookmarks);
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  },

  isBookmarked: (targetType, targetId) => {
    const { bookmarks } = get();
    return bookmarks.some(
      (b) => b.targetType === targetType && b.targetId === targetId
    );
  },

  searchBookmarks: (query) => {
    const { bookmarks } = get();
    // 2文字未満は空配列を返す
    if (query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return bookmarks.filter((b) =>
      b.title.toLowerCase().includes(lowerQuery)
    );
  },

  touchAccess: async (targetType, targetId) => {
    try {
      const { bookmarks } = get();
      const index = bookmarks.findIndex(
        (b) => b.targetType === targetType && b.targetId === targetId
      );

      // ブックマークされていない場合は何もしない
      if (index === -1) return;

      // 既に先頭ならキャッシュ更新のみ
      if (index === 0) {
        await setRecentCache(bookmarks);
        return;
      }

      // アクセスした項目を先頭に移動
      const accessed = bookmarks[index];
      const reordered = [
        accessed,
        ...bookmarks.slice(0, index),
        ...bookmarks.slice(index + 1),
      ];

      // ストア更新はしない（表示順は createdAt 順のまま）
      // キャッシュのみアクセス順で更新
      await setRecentCache(reordered);
    } catch (error) {
      console.error('Failed to touch access:', error);
    }
  },
}));
