/**
 * useTimelineData - タイムライン用データ取得フック
 * Sprint 2: 020 Timeline Core
 */

import { useEffect, useState } from 'react';

import { getDatabase } from '@/data/database';
import type { Era, EraRow, HistoricalEvent, EventRow, EventTag, ImportanceLevel, EventSource, Reign, OfficeType } from '@/types/database';
import { useAppStore } from '@/stores';

// =============================================================================
// Types
// =============================================================================

interface TimelineData {
  eras: Era[];
  events: HistoricalEvent[];
  reigns: Reign[];
  isLoading: boolean;
  error: Error | null;
}

// ReignRow with person name joined (from SQL query)
interface ReignWithNameRow {
  id: string;
  personId: string;
  officeType: string;
  startYear: number;
  endYear: number;
  ordinal: number | null;
  personName: string;
}

// =============================================================================
// Row to Entity Converters
// =============================================================================

function convertEraRow(row: EraRow): Era {
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

function convertEventRow(row: EventRow): HistoricalEvent {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    summary: row.summary,
    tags: JSON.parse(row.tags) as EventTag[],
    importanceLevel: row.importanceLevel as ImportanceLevel,
    eraId: row.eraId,
    source: row.source ? JSON.parse(row.source) as EventSource : null,
    relatedPersonIds: JSON.parse(row.relatedPersonIds) as string[],
    relatedEventIds: JSON.parse(row.relatedEventIds) as string[],
  };
}

function convertReignRow(row: ReignWithNameRow): Reign {
  return {
    id: row.id,
    personId: row.personId,
    officeType: row.officeType as OfficeType,
    startYear: row.startYear,
    endYear: row.endYear,
    ordinal: row.ordinal,
    // personName is added as extension for display
    name: row.personName,
  };
}

// Extended Reign type with name for display
declare module '@/types/database' {
  interface Reign {
    name?: string;
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * タイムライン表示用のデータを取得するフック
 * - DB Ready になるまで待機
 * - eras と events を一括取得
 */
export function useTimelineData(): TimelineData {
  const [eras, setEras] = useState<Era[]>([]);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [reigns, setReigns] = useState<Reign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const dbReady = useAppStore((s) => s.dbReady);

  useEffect(() => {
    if (!dbReady) {
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const db = await getDatabase();

        // 時代データ取得（startYear 順）
        const eraRows = await db.getAllAsync<EraRow>(
          'SELECT * FROM era ORDER BY startYear ASC'
        );

        // イベントデータ取得（startDate 順）
        const eventRows = await db.getAllAsync<EventRow>(
          'SELECT * FROM event ORDER BY startDate ASC'
        );

        // 在位データ取得（人物名をJOIN、startYear 順）
        const reignRows = await db.getAllAsync<ReignWithNameRow>(
          `SELECT r.*, p.name as personName
           FROM reign r
           LEFT JOIN person p ON r.personId = p.id
           ORDER BY r.startYear ASC`
        );

        setEras(eraRows.map(convertEraRow));
        setEvents(eventRows.map(convertEventRow));
        setReigns(reignRows.map(convertReignRow));
      } catch (err) {
        console.error('[useTimelineData] Failed to fetch data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch timeline data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dbReady]);

  return { eras, events, reigns, isLoading, error };
}

export default useTimelineData;
