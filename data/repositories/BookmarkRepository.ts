/**
 * Bookmark Repository - ブックマークデータアクセス
 * Sprint 1: 012 Database Schema & API
 */

import type { Bookmark, BookmarkRow, BookmarkTargetType } from '@/types/database';

import { getDatabase } from '../database';

/**
 * Row → Entity 変換
 */
function parseBookmarkRow(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    targetType: row.targetType as BookmarkTargetType,
    targetId: row.targetId,
    createdAt: row.createdAt,
    note: row.note,
  };
}

/**
 * 全ブックマークを取得
 */
export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BookmarkRow>(
    'SELECT * FROM bookmark ORDER BY createdAt DESC'
  );
  return rows.map(parseBookmarkRow);
}

/**
 * 種別でブックマークを取得
 */
export async function getBookmarksByType(targetType: BookmarkTargetType): Promise<Bookmark[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<BookmarkRow>(
    'SELECT * FROM bookmark WHERE targetType = ? ORDER BY createdAt DESC',
    targetType
  );
  return rows.map(parseBookmarkRow);
}

/**
 * ID でブックマークを取得
 */
export async function getBookmarkById(id: string): Promise<Bookmark | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BookmarkRow>(
    'SELECT * FROM bookmark WHERE id = ?',
    id
  );
  return row ? parseBookmarkRow(row) : null;
}

/**
 * ターゲットでブックマークを取得
 */
export async function getBookmarkByTarget(
  targetType: BookmarkTargetType,
  targetId: string
): Promise<Bookmark | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BookmarkRow>(
    'SELECT * FROM bookmark WHERE targetType = ? AND targetId = ?',
    targetType,
    targetId
  );
  return row ? parseBookmarkRow(row) : null;
}

/**
 * ブックマークが存在するか確認
 */
export async function isBookmarked(
  targetType: BookmarkTargetType,
  targetId: string
): Promise<boolean> {
  const bookmark = await getBookmarkByTarget(targetType, targetId);
  return bookmark !== null;
}

/**
 * ブックマークを追加
 */
export async function addBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO bookmark (id, targetType, targetId, createdAt, note)
     VALUES (?, ?, ?, ?, ?)`,
    bookmark.id,
    bookmark.targetType,
    bookmark.targetId,
    bookmark.createdAt,
    bookmark.note
  );
}

/**
 * ブックマークを削除
 */
export async function removeBookmark(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bookmark WHERE id = ?', id);
}

/**
 * ターゲットでブックマークを削除
 */
export async function removeBookmarkByTarget(
  targetType: BookmarkTargetType,
  targetId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM bookmark WHERE targetType = ? AND targetId = ?',
    targetType,
    targetId
  );
}

/**
 * ブックマークのメモを更新
 */
export async function updateBookmarkNote(id: string, note: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE bookmark SET note = ? WHERE id = ?', note, id);
}

/**
 * ブックマークの件数を取得
 */
export async function getBookmarkCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM bookmark'
  );
  return result?.count ?? 0;
}
