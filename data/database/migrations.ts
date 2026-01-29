/**
 * Database Migrations - テーブル作成・マイグレーション
 * Sprint 1: 012 Database Schema & API
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from './connection';

const CURRENT_VERSION = 2;

/**
 * マイグレーション定義
 */
const migrations: Record<number, string[]> = {
  1: [
    // Era テーブル
    `CREATE TABLE IF NOT EXISTS era (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameEn TEXT,
      startYear INTEGER NOT NULL,
      endYear INTEGER NOT NULL,
      parentEraId TEXT,
      color TEXT,
      FOREIGN KEY (parentEraId) REFERENCES era(id)
    )`,

    // Event テーブル
    `CREATE TABLE IF NOT EXISTS event (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      summary TEXT,
      tags TEXT DEFAULT '[]',
      importanceLevel INTEGER DEFAULT 1,
      eraId TEXT NOT NULL,
      source TEXT,
      relatedPersonIds TEXT DEFAULT '[]',
      relatedEventIds TEXT DEFAULT '[]',
      FOREIGN KEY (eraId) REFERENCES era(id)
    )`,

    // Person テーブル
    `CREATE TABLE IF NOT EXISTS person (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameReading TEXT,
      birthYear INTEGER,
      deathYear INTEGER,
      activeStartYear INTEGER,
      activeEndYear INTEGER,
      summary TEXT,
      roles TEXT DEFAULT '[]',
      importanceLevel INTEGER DEFAULT 1
    )`,

    // Reign テーブル
    `CREATE TABLE IF NOT EXISTS reign (
      id TEXT PRIMARY KEY,
      personId TEXT NOT NULL,
      officeType TEXT NOT NULL,
      startYear INTEGER NOT NULL,
      endYear INTEGER NOT NULL,
      ordinal INTEGER,
      FOREIGN KEY (personId) REFERENCES person(id)
    )`,

    // Bookmark テーブル
    `CREATE TABLE IF NOT EXISTS bookmark (
      id TEXT PRIMARY KEY,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      note TEXT
    )`,

    // インデックス作成
    `CREATE INDEX IF NOT EXISTS idx_era_year ON era(startYear, endYear)`,
    `CREATE INDEX IF NOT EXISTS idx_event_startDate ON event(startDate)`,
    `CREATE INDEX IF NOT EXISTS idx_event_eraId ON event(eraId)`,
    `CREATE INDEX IF NOT EXISTS idx_event_title ON event(title)`,
    `CREATE INDEX IF NOT EXISTS idx_event_importance ON event(importanceLevel)`,
    `CREATE INDEX IF NOT EXISTS idx_person_name ON person(name)`,
    `CREATE INDEX IF NOT EXISTS idx_person_year ON person(birthYear, deathYear)`,
    `CREATE INDEX IF NOT EXISTS idx_person_active ON person(activeStartYear, activeEndYear)`,
    `CREATE INDEX IF NOT EXISTS idx_reign_year ON reign(startYear, endYear)`,
    `CREATE INDEX IF NOT EXISTS idx_reign_office ON reign(officeType)`,
    `CREATE INDEX IF NOT EXISTS idx_reign_person ON reign(personId)`,
    `CREATE INDEX IF NOT EXISTS idx_bookmark_target ON bookmark(targetType, targetId)`,

    // バージョン管理テーブル
    `CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY,
      appliedAt TEXT NOT NULL
    )`,
  ],

  // Version 2: Bookmark テーブルに title 追加 + UNIQUE 制約
  2: [
    // title 列を追加
    `ALTER TABLE bookmark ADD COLUMN title TEXT`,

    // 既存の bookmark テーブルを一時テーブルにリネーム
    `ALTER TABLE bookmark RENAME TO bookmark_old`,

    // 新しい bookmark テーブルを UNIQUE 制約付きで作成
    `CREATE TABLE bookmark (
      id TEXT PRIMARY KEY,
      targetType TEXT NOT NULL,
      targetId TEXT NOT NULL,
      title TEXT,
      createdAt TEXT NOT NULL,
      note TEXT,
      UNIQUE(targetType, targetId)
    )`,

    // データを移行
    `INSERT OR IGNORE INTO bookmark (id, targetType, targetId, title, createdAt, note)
     SELECT id, targetType, targetId, title, createdAt, note FROM bookmark_old`,

    // 古いテーブルを削除
    `DROP TABLE bookmark_old`,

    // インデックス再作成
    `CREATE INDEX IF NOT EXISTS idx_bookmark_target ON bookmark(targetType, targetId)`,
  ],
};

/**
 * 現在のデータベースバージョンを取得
 */
async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM db_version'
    );
    return result?.version ?? 0;
  } catch {
    // テーブルが存在しない場合
    return 0;
  }
}

/**
 * マイグレーションを実行
 */
export async function runMigrations(): Promise<void> {
  const db = await getDatabase();
  const currentVersion = await getCurrentVersion(db);

  if (currentVersion >= CURRENT_VERSION) {
    return;
  }

  for (let version = currentVersion + 1; version <= CURRENT_VERSION; version++) {
    const statements = migrations[version];
    if (!statements) continue;

    await db.withTransactionAsync(async () => {
      for (const sql of statements) {
        await db.execAsync(sql);
      }

      // バージョン記録
      await db.runAsync(
        'INSERT INTO db_version (version, appliedAt) VALUES (?, ?)',
        version,
        new Date().toISOString()
      );
    });
  }
}

/**
 * データベースを初期化（マイグレーション実行）
 */
export async function initializeDatabase(): Promise<void> {
  await runMigrations();
}

/**
 * テーブルが存在するか確認
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    tableName
  );
  return result !== null;
}

export { CURRENT_VERSION };
