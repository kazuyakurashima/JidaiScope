/**
 * Reign Repository - 在位・治世データアクセス
 * Sprint 1: 012 Database Schema & API
 */

import type { OfficeType, Reign, ReignRow } from '@/types/database';

import { getDatabase } from '../database';

/**
 * Row → Entity 変換
 */
function parseReignRow(row: ReignRow): Reign {
  return {
    id: row.id,
    personId: row.personId,
    officeType: row.officeType as OfficeType,
    startYear: row.startYear,
    endYear: row.endYear,
    ordinal: row.ordinal,
  };
}

/**
 * 指定年の在位を取得
 */
export async function getReignsByYear(year: number): Promise<Reign[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReignRow>(
    `SELECT * FROM reign
     WHERE startYear <= ? AND endYear >= ?
     ORDER BY officeType ASC, startYear ASC`,
    year,
    year
  );
  return rows.map(parseReignRow);
}

/**
 * 指定年の天皇を取得
 */
export async function getEmperorAtYear(year: number): Promise<Reign | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReignRow>(
    `SELECT * FROM reign
     WHERE officeType = 'emperor'
     AND startYear <= ? AND endYear >= ?
     LIMIT 1`,
    year,
    year
  );
  return row ? parseReignRow(row) : null;
}

/**
 * 指定年の将軍を取得
 */
export async function getShogunAtYear(year: number): Promise<Reign | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReignRow>(
    `SELECT * FROM reign
     WHERE officeType = 'shogun'
     AND startYear <= ? AND endYear >= ?
     LIMIT 1`,
    year,
    year
  );
  return row ? parseReignRow(row) : null;
}

/**
 * 指定年範囲の在位を取得
 */
export async function getReignsByYearRange(
  startYear: number,
  endYear: number
): Promise<Reign[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReignRow>(
    `SELECT * FROM reign
     WHERE startYear <= ? AND endYear >= ?
     ORDER BY officeType ASC, startYear ASC`,
    endYear,
    startYear
  );
  return rows.map(parseReignRow);
}

/**
 * 役職種別で在位を取得
 */
export async function getReignsByOfficeType(officeType: OfficeType): Promise<Reign[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReignRow>(
    `SELECT * FROM reign
     WHERE officeType = ?
     ORDER BY startYear ASC`,
    officeType
  );
  return rows.map(parseReignRow);
}

/**
 * 人物の在位を取得
 */
export async function getReignsByPerson(personId: string): Promise<Reign[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReignRow>(
    `SELECT * FROM reign
     WHERE personId = ?
     ORDER BY startYear ASC`,
    personId
  );
  return rows.map(parseReignRow);
}

/**
 * ID で在位を取得
 */
export async function getReignById(id: string): Promise<Reign | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReignRow>(
    'SELECT * FROM reign WHERE id = ?',
    id
  );
  return row ? parseReignRow(row) : null;
}

/**
 * 在位を挿入
 */
export async function insertReign(reign: Reign): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO reign
     (id, personId, officeType, startYear, endYear, ordinal)
     VALUES (?, ?, ?, ?, ?, ?)`,
    reign.id,
    reign.personId,
    reign.officeType,
    reign.startYear,
    reign.endYear,
    reign.ordinal
  );
}

/**
 * 複数の在位を一括挿入
 */
export async function insertReigns(reigns: Reign[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const reign of reigns) {
      await db.runAsync(
        `INSERT OR REPLACE INTO reign
         (id, personId, officeType, startYear, endYear, ordinal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        reign.id,
        reign.personId,
        reign.officeType,
        reign.startYear,
        reign.endYear,
        reign.ordinal
      );
    }
  });
}

/**
 * 在位の件数を取得
 */
export async function getReignCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reign'
  );
  return result?.count ?? 0;
}
