/**
 * searchService.ts - 統合検索サービス
 * Sprint 3: 030 Search Feature
 *
 * 検索タイプ:
 * - 西暦「1868」→ 該当年のイベント・人物
 * - 和暦「明治元年」→ 西暦変換して検索
 * - 人物名「織田信長」→ 人物と関連イベント
 * - 事件名「本能寺」→ イベントと関連人物
 */

import type { HistoricalEvent, Person } from '@/types/database';
import {
  searchEventsByName,
  getEventsByYear,
  getEventsByYearRange,
  getEventsByPersonIds,
} from '@/data/repositories/EventRepository';
import {
  searchPersonsByName,
  getPersonsByYear,
  getPersonsByIds,
} from '@/data/repositories/PersonRepository';
import {
  extractYearFromQuery,
  isValidYear,
  getEraYearRange,
  MODERN_ERAS,
} from '@/utils/wakaCalendar';
import { extractYearFromDate } from '@/domain/timeline/coordinateSystem';

// =============================================================================
// Types
// =============================================================================

export type SearchResultType = 'event' | 'person' | 'year';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  /** ジャンプ先の年（タイムライン連携用） */
  year: number;
  data: HistoricalEvent | Person | null;
}

export interface SearchResult {
  items: SearchResultItem[];
  query: string;
  totalCount: number;
  searchType: 'year' | 'name' | 'mixed';
  /** サジェスト（ゼロ結果時用） */
  suggestions: string[];
}

// =============================================================================
// Constants
// =============================================================================

/** 検索結果の最大件数 */
export const MAX_RESULTS = 50;

/** 年検索時の最大イベント数 */
const MAX_YEAR_EVENTS = 30;

/** 年検索時の最大人物数 */
const MAX_YEAR_PERSONS = 20;

/** 関連データの最大取得数 */
const MAX_RELATED_ITEMS = 10;

/** 最小検索文字数 */
export const MIN_QUERY_LENGTH = 2;

// =============================================================================
// Search Functions
// =============================================================================

/**
 * 統合検索を実行
 * @param query 検索クエリ
 * @returns 検索結果
 */
export async function search(query: string): Promise<SearchResult> {
  const trimmed = query.trim();

  // 最小文字数チェック
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return {
      items: [],
      query: trimmed,
      totalCount: 0,
      searchType: 'mixed',
      suggestions: [],
    };
  }

  // 年検索を試行
  const year = extractYearFromQuery(trimmed);
  if (year !== null && isValidYear(year)) {
    return searchByYear(year, trimmed);
  }

  // 元号名のみの場合（例: "明治"）
  const eraRange = getEraYearRange(trimmed);
  if (eraRange) {
    return searchByEraRange(eraRange.start, eraRange.end, trimmed);
  }

  // 名前検索
  return searchByName(trimmed);
}

/**
 * 年で検索
 */
async function searchByYear(year: number, query: string): Promise<SearchResult> {
  const [events, persons] = await Promise.all([
    getEventsByYear(year),
    getPersonsByYear(year),
  ]);

  const items: SearchResultItem[] = [];

  // イベント結果
  events.slice(0, MAX_YEAR_EVENTS).forEach((event) => {
    const eventYear = extractYearFromDate(event.startDate);
    items.push({
      id: event.id,
      type: 'event',
      title: event.title,
      subtitle: formatEventSubtitle(event, eventYear),
      year: eventYear,
      data: event,
    });
  });

  // 人物結果
  persons.slice(0, MAX_YEAR_PERSONS).forEach((person) => {
    const personYear = person.birthYear ?? person.activeStartYear ?? year;
    items.push({
      id: person.id,
      type: 'person',
      title: person.name,
      subtitle: formatPersonSubtitle(person),
      year: personYear,
      data: person,
    });
  });

  return {
    items: items.slice(0, MAX_RESULTS),
    query,
    totalCount: events.length + persons.length,
    searchType: 'year',
    suggestions: items.length === 0 ? getSearchSuggestions(query) : [],
  };
}

/**
 * 時代範囲で検索
 */
async function searchByEraRange(
  startYear: number,
  endYear: number,
  query: string
): Promise<SearchResult> {
  const events = await getEventsByYearRange(startYear, endYear);

  const items: SearchResultItem[] = events
    .slice(0, MAX_RESULTS)
    .map((event) => {
      const eventYear = extractYearFromDate(event.startDate);
      return {
        id: event.id,
        type: 'event' as const,
        title: event.title,
        subtitle: formatEventSubtitle(event, eventYear),
        year: eventYear,
        data: event,
      };
    });

  return {
    items,
    query,
    totalCount: events.length,
    searchType: 'year',
    suggestions: items.length === 0 ? getSearchSuggestions(query) : [],
  };
}

/**
 * 名前で検索（関連データ取得付き）
 */
async function searchByName(query: string): Promise<SearchResult> {
  // 直接マッチする人物とイベントを取得
  const [directEvents, directPersons] = await Promise.all([
    searchEventsByName(query),
    searchPersonsByName(query),
  ]);

  const items: SearchResultItem[] = [];
  const addedIds = new Set<string>();

  // 人物を追加し、関連イベントも取得
  const personIds = directPersons.map((p) => p.id);
  const relatedEvents = personIds.length > 0
    ? await getEventsByPersonIds(personIds.slice(0, 5))
    : [];

  // 人物を先に追加
  directPersons.forEach((person) => {
    if (addedIds.has(person.id)) return;
    addedIds.add(person.id);

    const personYear = person.birthYear ?? person.activeStartYear ?? 0;
    items.push({
      id: person.id,
      type: 'person',
      title: person.name,
      subtitle: formatPersonSubtitle(person),
      year: personYear,
      data: person,
    });
  });

  // 直接マッチしたイベントを追加
  directEvents.forEach((event) => {
    if (addedIds.has(event.id)) return;
    addedIds.add(event.id);

    const eventYear = extractYearFromDate(event.startDate);
    items.push({
      id: event.id,
      type: 'event',
      title: event.title,
      subtitle: formatEventSubtitle(event, eventYear),
      year: eventYear,
      data: event,
    });
  });

  // 人物に関連するイベントを追加（重複排除）
  relatedEvents.slice(0, MAX_RELATED_ITEMS).forEach((event) => {
    if (addedIds.has(event.id)) return;
    addedIds.add(event.id);

    const eventYear = extractYearFromDate(event.startDate);
    items.push({
      id: event.id,
      type: 'event',
      title: event.title,
      subtitle: `${formatEventSubtitle(event, eventYear)} [関連]`,
      year: eventYear,
      data: event,
    });
  });

  // イベントに関連する人物を取得して追加
  const relatedPersonIds = directEvents
    .flatMap((e) => e.relatedPersonIds)
    .filter((id) => !addedIds.has(id));

  if (relatedPersonIds.length > 0) {
    const uniquePersonIds = [...new Set(relatedPersonIds)].slice(0, MAX_RELATED_ITEMS);
    const relatedPersons = await getPersonsByIds(uniquePersonIds);

    relatedPersons.forEach((person) => {
      if (addedIds.has(person.id)) return;
      addedIds.add(person.id);

      const personYear = person.birthYear ?? person.activeStartYear ?? 0;
      items.push({
        id: person.id,
        type: 'person',
        title: person.name,
        subtitle: `${formatPersonSubtitle(person)} [関連]`,
        year: personYear,
        data: person,
      });
    });
  }

  // totalCount は重複排除後の実際のアイテム数（items.length）を使用
  return {
    items: items.slice(0, MAX_RESULTS),
    query,
    totalCount: items.length,
    searchType: 'name',
    suggestions: items.length === 0 ? getSearchSuggestions(query) : [],
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * イベントのサブタイトルをフォーマット
 */
function formatEventSubtitle(event: HistoricalEvent, year: number): string {
  const yearStr = formatYear(year);
  const tag = event.tags[0] ?? '';
  return tag ? `${yearStr} - ${tag}` : yearStr;
}

/**
 * 人物のサブタイトルをフォーマット
 */
function formatPersonSubtitle(person: Person): string {
  const lifespan = formatLifespan(person);
  const role = person.roles[0] ?? '';
  return role ? `${lifespan} - ${role}` : lifespan;
}

/**
 * 人物の生没年をフォーマット
 */
function formatLifespan(person: Person): string {
  const birth = person.birthYear;
  const death = person.deathYear;

  if (birth && death) {
    return `${formatYear(birth)}-${formatYear(death)}`;
  }
  if (birth) {
    return `${formatYear(birth)}-`;
  }
  if (death) {
    return `-${formatYear(death)}`;
  }
  return '';
}

/**
 * 年を表示用にフォーマット（BC対応）
 */
function formatYear(year: number): string {
  if (year < 0) {
    return `BC${Math.abs(year)}年`;
  }
  return `${year}年`;
}

/**
 * 検索サジェストを取得
 */
export function getSearchSuggestions(partialQuery: string): string[] {
  const suggestions: string[] = [];
  const query = partialQuery.trim().toLowerCase();

  // 元号サジェスト
  for (const era of MODERN_ERAS) {
    if (era.name.toLowerCase().includes(query) || era.reading.includes(query)) {
      suggestions.push(`${era.name}元年`);
    }
  }

  // 一般的な検索キーワードサジェスト
  const commonKeywords = [
    '本能寺の変',
    '関ヶ原の戦い',
    '大政奉還',
    '明治維新',
    '織田信長',
    '徳川家康',
    '坂本龍馬',
    '源頼朝',
    '聖徳太子',
  ];

  commonKeywords.forEach((keyword) => {
    if (keyword.toLowerCase().includes(query) && !suggestions.includes(keyword)) {
      suggestions.push(keyword);
    }
  });

  // 数字が含まれる場合は年号サジェスト
  const numMatch = query.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 2100) {
      suggestions.push(`${num}年`);
    }
  }

  return suggestions.slice(0, 5);
}

// =============================================================================
// Export
// =============================================================================

export default {
  search,
  getSearchSuggestions,
  MIN_QUERY_LENGTH,
  MAX_RESULTS,
};
