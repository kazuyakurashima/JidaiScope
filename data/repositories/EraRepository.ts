/**
 * Era Repository - 時代データアクセス
 * Sprint 1: 012 Database Schema & API
 */

import type { Era, EraRow } from '@/types/database';

import { getDatabase } from '../database';

/**
 * Row → Entity 変換
 */
function parseEraRow(row: EraRow): Era {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.nameEn,
    startYear: row.startYear,
    endYear: row.endYear,
    parentEraId: row.parentEraId,
    color: row.color,
  };
}

/**
 * 全時代を取得
 */
export async function getAllEras(): Promise<Era[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EraRow>(
    'SELECT * FROM era ORDER BY startYear ASC'
  );
  return rows.map(parseEraRow);
}

/**
 * 指定年の時代を取得
 * Note: endYear は inclusive（終端年を含む）
 */
export async function getEraByYear(year: number): Promise<Era | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EraRow>(
    'SELECT * FROM era WHERE startYear <= ? AND endYear >= ? ORDER BY startYear DESC LIMIT 1',
    year,
    year
  );
  return row ? parseEraRow(row) : null;
}

/**
 * ID で時代を取得
 */
export async function getEraById(id: string): Promise<Era | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EraRow>(
    'SELECT * FROM era WHERE id = ?',
    id
  );
  return row ? parseEraRow(row) : null;
}

/**
 * 親時代の子時代を取得
 */
export async function getChildEras(parentEraId: string): Promise<Era[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EraRow>(
    'SELECT * FROM era WHERE parentEraId = ? ORDER BY startYear ASC',
    parentEraId
  );
  return rows.map(parseEraRow);
}

/**
 * 時代を挿入
 */
export async function insertEra(era: Era): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO era (id, name, nameEn, startYear, endYear, parentEraId, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    era.id,
    era.name,
    era.nameEn,
    era.startYear,
    era.endYear,
    era.parentEraId,
    era.color
  );
}

/**
 * 複数の時代を一括挿入
 */
export async function insertEras(eras: Era[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const era of eras) {
      await db.runAsync(
        `INSERT OR REPLACE INTO era (id, name, nameEn, startYear, endYear, parentEraId, color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        era.id,
        era.name,
        era.nameEn,
        era.startYear,
        era.endYear,
        era.parentEraId,
        era.color
      );
    }
  });
}

/**
 * 時代の件数を取得
 */
export async function getEraCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM era'
  );
  return result?.count ?? 0;
}
