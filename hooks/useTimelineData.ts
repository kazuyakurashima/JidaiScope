/**
 * useTimelineData - タイムライン用データ取得フック
 * Sprint 2: 020 Timeline Core
 */

import { useEffect, useState } from 'react';

import { getDatabase } from '@/data/database';
import type { Era, EraRow, HistoricalEvent, EventRow, EventTag, ImportanceLevel, EventSource } from '@/types/database';
import { useAppStore } from '@/stores';

// =============================================================================
// Types
// =============================================================================

interface TimelineData {
  eras: Era[];
  events: HistoricalEvent[];
  isLoading: boolean;
  error: Error | null;
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

        setEras(eraRows.map(convertEraRow));
        setEvents(eventRows.map(convertEventRow));
      } catch (err) {
        console.error('[useTimelineData] Failed to fetch data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch timeline data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dbReady]);

  return { eras, events, isLoading, error };
}

export default useTimelineData;
