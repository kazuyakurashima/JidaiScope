/**
 * Database Connection - SQLite 接続管理
 * Sprint 1: 012 Database Schema & API
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'jidaiscope.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * データベース接続を取得（シングルトン）
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  return dbInstance;
}

/**
 * データベース接続をクローズ
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

/**
 * データベースをリセット（開発・テスト用）
 */
export async function resetDatabase(): Promise<void> {
  await closeDatabase();
  await SQLite.deleteDatabaseAsync(DB_NAME);
  dbInstance = null;
}

export { DB_NAME };
