/**
 * Wareki Repository - 元号マスターデータアクセス
 * Sprint 3: 030 Search Feature / 036 Year Ruler
 *
 * 全時代の元号データ（大化645年〜令和）を管理
 * DB を Single Source of Truth (SSOT) として使用
 */

import { getDatabase } from '../database';

// =============================================================================
// Types
// =============================================================================

export interface WarekiEra {
  id: number;
  /** 元号名 */
  name: string;
  /** よみがな */
  reading: string | null;
  /** 開始年（西暦） */
  startYear: number;
  /** 終了年（西暦）- null は現在進行中 */
  endYear: number | null;
  /** 時代区分（飛鳥, 奈良, 平安, 等） */
  period: string | null;
  /** 同一年内の順序（大きいほど後の元号、南北朝は北朝が大） */
  sequence: number;
}

interface WarekiEraRow {
  id: number;
  name: string;
  reading: string | null;
  startYear: number;
  endYear: number | null;
  period: string | null;
  sequence: number | null;
}

// =============================================================================
// Repository Functions
// =============================================================================

/**
 * Row → Entity 変換
 */
function parseWarekiRow(row: WarekiEraRow): WarekiEra {
  return {
    id: row.id,
    name: row.name,
    reading: row.reading,
    startYear: row.startYear,
    endYear: row.endYear,
    period: row.period,
    sequence: row.sequence ?? 0,
  };
}

/**
 * 全元号を取得（開始年順）
 */
export async function getAllWarekiEras(): Promise<WarekiEra[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WarekiEraRow>(
    'SELECT * FROM wareki_eras ORDER BY startYear ASC'
  );
  return rows.map(parseWarekiRow);
}

/**
 * 元号名で検索
 */
export async function getWarekiByName(name: string): Promise<WarekiEra | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WarekiEraRow>(
    'SELECT * FROM wareki_eras WHERE name = ?',
    name
  );
  return row ? parseWarekiRow(row) : null;
}

/**
 * 西暦から該当する元号を取得
 *
 * 同一年に複数元号が存在する場合（例: 749年の天平感宝→天平勝宝）は、
 * sequence が大きい元号（＝年内で後の元号）を返す。
 *
 * 南北朝時代（1336-1392）は北朝の元号を優先する（正統とされる系譜）。
 * sequence: 南朝=0, 北朝=1 で定義されているため北朝が選択される。
 *
 * 制約: 年単位の判定のため、年内改元のある年は後の元号が返される。
 *       日付精度が必要な場合は getWarekiByDate を使用（未実装）。
 */
export async function getWarekiByYear(year: number): Promise<WarekiEra | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<WarekiEraRow>(
    `SELECT * FROM wareki_eras
     WHERE startYear <= ? AND (endYear IS NULL OR endYear >= ?)
     ORDER BY startYear DESC, sequence DESC LIMIT 1`,
    year,
    year
  );
  return row ? parseWarekiRow(row) : null;
}

/**
 * 時代区分で元号を取得
 */
export async function getWarekiByPeriod(period: string): Promise<WarekiEra[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WarekiEraRow>(
    'SELECT * FROM wareki_eras WHERE period = ? ORDER BY startYear ASC',
    period
  );
  return rows.map(parseWarekiRow);
}

/**
 * 元号名で部分一致検索
 */
export async function searchWarekiByName(query: string): Promise<WarekiEra[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WarekiEraRow>(
    'SELECT * FROM wareki_eras WHERE name LIKE ? ORDER BY startYear ASC',
    `%${query}%`
  );
  return rows.map(parseWarekiRow);
}

/**
 * 元号データを挿入
 */
export async function insertWarekiEra(era: Omit<WarekiEra, 'id'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO wareki_eras (name, reading, startYear, endYear, period, sequence)
     VALUES (?, ?, ?, ?, ?, ?)`,
    era.name,
    era.reading,
    era.startYear,
    era.endYear,
    era.period,
    era.sequence ?? 0
  );
}

/**
 * 複数の元号データを一括挿入
 */
export async function insertWarekiEras(eras: Omit<WarekiEra, 'id'>[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const era of eras) {
      await db.runAsync(
        `INSERT OR REPLACE INTO wareki_eras (name, reading, startYear, endYear, period, sequence)
         VALUES (?, ?, ?, ?, ?, ?)`,
        era.name,
        era.reading,
        era.startYear,
        era.endYear,
        era.period,
        era.sequence ?? 0
      );
    }
  });
}

/**
 * 元号の件数を取得
 */
export async function getWarekiCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM wareki_eras'
  );
  return result?.count ?? 0;
}

/**
 * 元号データが存在するか確認
 */
export async function hasWarekiData(): Promise<boolean> {
  const count = await getWarekiCount();
  return count > 0;
}
