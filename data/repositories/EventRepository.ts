/**
 * Event Repository - イベントデータアクセス
 * Sprint 1: 012 Database Schema & API
 */

import type {
  EventRow,
  EventSource,
  EventTag,
  HistoricalEvent,
  ImportanceLevel,
} from '@/types/database';

import { getDatabase } from '../database';

/**
 * Row → Entity 変換
 */
function parseEventRow(row: EventRow): HistoricalEvent {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    summary: row.summary,
    tags: JSON.parse(row.tags || '[]') as EventTag[],
    importanceLevel: row.importanceLevel as ImportanceLevel,
    eraId: row.eraId,
    source: row.source ? (JSON.parse(row.source) as EventSource) : null,
    relatedPersonIds: JSON.parse(row.relatedPersonIds || '[]') as string[],
    relatedEventIds: JSON.parse(row.relatedEventIds || '[]') as string[],
  };
}

/**
 * 指定年のイベントを取得
 */
export async function getEventsByYear(year: number): Promise<HistoricalEvent[]> {
  const db = await getDatabase();
  const yearStr = String(year);
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE substr(startDate, 1, 4) <= ?
     AND (endDate IS NULL OR substr(endDate, 1, 4) >= ?)
     ORDER BY startDate ASC`,
    yearStr,
    yearStr
  );
  return rows.map(parseEventRow);
}

/**
 * 指定年範囲に重なるイベントを取得
 * Note: 範囲開始前に始まって範囲内に継続するイベントも含む
 */
export async function getEventsByYearRange(
  startYear: number,
  endYear: number
): Promise<HistoricalEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE CAST(substr(startDate, 1, 4) AS INTEGER) <= ?
     AND CAST(substr(COALESCE(endDate, startDate), 1, 4) AS INTEGER) >= ?
     ORDER BY startDate ASC`,
    endYear,
    startYear
  );
  return rows.map(parseEventRow);
}

/**
 * 時代でイベントを取得
 */
export async function getEventsByEra(eraId: string): Promise<HistoricalEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EventRow>(
    'SELECT * FROM event WHERE eraId = ? ORDER BY startDate ASC',
    eraId
  );
  return rows.map(parseEventRow);
}

/**
 * ID でイベントを取得
 */
export async function getEventById(id: string): Promise<HistoricalEvent | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EventRow>(
    'SELECT * FROM event WHERE id = ?',
    id
  );
  return row ? parseEventRow(row) : null;
}

/**
 * 名前でイベントを検索
 */
export async function searchEventsByName(keyword: string): Promise<HistoricalEvent[]> {
  const db = await getDatabase();
  const searchTerm = `%${keyword}%`;
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE title LIKE ?
     ORDER BY importanceLevel DESC, startDate ASC
     LIMIT 100`,
    searchTerm
  );
  return rows.map(parseEventRow);
}

/**
 * 重要度でイベントを取得
 */
export async function getEventsByImportance(
  minLevel: ImportanceLevel
): Promise<HistoricalEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EventRow>(
    'SELECT * FROM event WHERE importanceLevel >= ? ORDER BY startDate ASC',
    minLevel
  );
  return rows.map(parseEventRow);
}

/**
 * イベントを挿入
 */
export async function insertEvent(event: HistoricalEvent): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO event
     (id, title, startDate, endDate, summary, tags, importanceLevel, eraId, source, relatedPersonIds, relatedEventIds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    event.id,
    event.title,
    event.startDate,
    event.endDate,
    event.summary,
    JSON.stringify(event.tags),
    event.importanceLevel,
    event.eraId,
    event.source ? JSON.stringify(event.source) : null,
    JSON.stringify(event.relatedPersonIds),
    JSON.stringify(event.relatedEventIds)
  );
}

/**
 * 複数のイベントを一括挿入
 */
export async function insertEvents(events: HistoricalEvent[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const event of events) {
      await db.runAsync(
        `INSERT OR REPLACE INTO event
         (id, title, startDate, endDate, summary, tags, importanceLevel, eraId, source, relatedPersonIds, relatedEventIds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        event.id,
        event.title,
        event.startDate,
        event.endDate,
        event.summary,
        JSON.stringify(event.tags),
        event.importanceLevel,
        event.eraId,
        event.source ? JSON.stringify(event.source) : null,
        JSON.stringify(event.relatedPersonIds),
        JSON.stringify(event.relatedEventIds)
      );
    }
  });
}

/**
 * イベントの件数を取得
 */
export async function getEventCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM event'
  );
  return result?.count ?? 0;
}

/**
 * 関連イベントを取得
 */
export async function getRelatedEvents(eventId: string): Promise<HistoricalEvent[]> {
  const event = await getEventById(eventId);
  if (!event || event.relatedEventIds.length === 0) {
    return [];
  }

  const db = await getDatabase();
  const placeholders = event.relatedEventIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event WHERE id IN (${placeholders}) ORDER BY startDate ASC`,
    ...event.relatedEventIds
  );
  return rows.map(parseEventRow);
}
