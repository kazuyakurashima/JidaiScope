/**
 * wakaCalendar.ts - 和暦⇔西暦変換ユーティリティ
 * Sprint 3: 030 Search Feature / 036 Year Ruler
 *
 * 全時代対応（大化645年〜令和）
 * - DB (wareki_eras) を Single Source of Truth (SSOT) として使用
 * - 近代元号（明治〜令和）は同期APIとしてフォールバック提供
 */

import {
  getAllWarekiEras,
  getWarekiByName,
  getWarekiByYear,
  searchWarekiByName,
  type WarekiEra,
} from '@/data/repositories';

// =============================================================================
// Types
// =============================================================================

export interface JapaneseEra {
  /** 元号名 */
  name: string;
  /** 元号名（よみがな） */
  reading: string;
  /** 開始年（西暦） */
  startYear: number;
  /** 終了年（西暦）- null は現在進行中 */
  endYear: number | null;
}

export interface WakaParseResult {
  /** 元号名 */
  eraName: string;
  /** 元号年（1年 = 元年） */
  eraYear: number;
  /** 西暦 */
  seirekiYear: number;
}

// =============================================================================
// Constants - 近代元号（同期API用フォールバック）
// =============================================================================

/**
 * 近代元号リスト（明治〜令和）
 * 同期APIのフォールバックとして使用
 */
export const MODERN_ERAS: JapaneseEra[] = [
  { name: '明治', reading: 'めいじ', startYear: 1868, endYear: 1912 },
  { name: '大正', reading: 'たいしょう', startYear: 1912, endYear: 1926 },
  { name: '昭和', reading: 'しょうわ', startYear: 1926, endYear: 1989 },
  { name: '平成', reading: 'へいせい', startYear: 1989, endYear: 2019 },
  { name: '令和', reading: 'れいわ', startYear: 2019, endYear: null },
];

const MODERN_ERA_MAP = new Map<string, JapaneseEra>(
  MODERN_ERAS.map((era) => [era.name, era])
);

// =============================================================================
// DB-based Async Functions (全時代対応)
// =============================================================================

/** 元号データキャッシュ */
let cachedEras: WarekiEra[] | null = null;
let cachedEraMap: Map<string, WarekiEra> | null = null;

/**
 * 元号キャッシュを取得（DB から）
 */
async function getEraCache(): Promise<{
  eras: WarekiEra[];
  map: Map<string, WarekiEra>;
}> {
  if (cachedEras && cachedEraMap) {
    return { eras: cachedEras, map: cachedEraMap };
  }

  try {
    cachedEras = await getAllWarekiEras();
    cachedEraMap = new Map(cachedEras.map((era) => [era.name, era]));
    return { eras: cachedEras, map: cachedEraMap };
  } catch {
    // DB 未初期化時は空を返す
    return { eras: [], map: new Map() };
  }
}

/**
 * キャッシュをクリア（データ更新時に呼び出し）
 */
export function clearWarekiCache(): void {
  cachedEras = null;
  cachedEraMap = null;
}

/**
 * 和暦テキストを西暦に変換（非同期・全時代対応）
 */
export async function wakaToSeirekiAsync(wakaText: string): Promise<number | null> {
  const { map } = await getEraCache();

  // 正規化
  const normalized = wakaText
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/\s/g, '');

  // パターン1: "元号+数字+年"
  const numericMatch = normalized.match(/^(.+?)(\d+)年?$/);
  if (numericMatch) {
    const [, eraName, yearStr] = numericMatch;
    const era = map.get(eraName);
    if (era) {
      const eraYear = parseInt(yearStr, 10);
      return era.startYear + eraYear - 1;
    }
  }

  // パターン2: "元号+元年"
  const gannenMatch = normalized.match(/^(.+?)元年$/);
  if (gannenMatch) {
    const [, eraName] = gannenMatch;
    const era = map.get(eraName);
    if (era) {
      return era.startYear;
    }
  }

  // パターン3: 元号名のみ
  const era = map.get(normalized.replace(/年$/, ''));
  if (era) {
    return era.startYear;
  }

  // フォールバック: 同期版を試す
  return wakaToSeireki(wakaText);
}

/**
 * 西暦を和暦に変換（非同期・全時代対応）
 */
export async function seirekiToWakaAsync(seirekiYear: number): Promise<string | null> {
  const era = await getWarekiByYear(seirekiYear);
  if (!era) {
    // フォールバック: 同期版を試す
    return seirekiToWaka(seirekiYear);
  }

  const eraYear = seirekiYear - era.startYear + 1;
  if (eraYear === 1) {
    return `${era.name}元年`;
  }
  return `${era.name}${eraYear}年`;
}

/**
 * 元号名から西暦範囲を取得（非同期・全時代対応）
 */
export async function getEraYearRangeAsync(
  eraName: string
): Promise<{ start: number; end: number } | null> {
  const era = await getWarekiByName(eraName);
  if (!era) {
    // フォールバック: 同期版を試す
    return getEraYearRange(eraName);
  }

  return {
    start: era.startYear,
    end: era.endYear ?? new Date().getFullYear(),
  };
}

/**
 * 元号名で検索（部分一致・非同期）
 */
export async function searchEraByNameAsync(query: string): Promise<WarekiEra[]> {
  return searchWarekiByName(query);
}

// =============================================================================
// Synchronous Functions (近代元号のみ・フォールバック用)
// =============================================================================

/**
 * 和暦テキストを西暦に変換（同期・近代元号のみ）
 */
export function wakaToSeireki(wakaText: string): number | null {
  const normalized = wakaText
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/\s/g, '');

  // パターン1: "元号+数字+年"
  const numericMatch = normalized.match(/^(.+?)(\d+)年?$/);
  if (numericMatch) {
    const [, eraName, yearStr] = numericMatch;
    const era = MODERN_ERA_MAP.get(eraName);
    if (era) {
      const eraYear = parseInt(yearStr, 10);
      return era.startYear + eraYear - 1;
    }
  }

  // パターン2: "元号+元年"
  const gannenMatch = normalized.match(/^(.+?)元年$/);
  if (gannenMatch) {
    const [, eraName] = gannenMatch;
    const era = MODERN_ERA_MAP.get(eraName);
    if (era) {
      return era.startYear;
    }
  }

  // パターン3: 元号名のみ
  const era = MODERN_ERA_MAP.get(normalized.replace(/年$/, ''));
  if (era) {
    return era.startYear;
  }

  return null;
}

/**
 * 和暦テキストをパースして詳細情報を取得
 */
export function parseWaka(wakaText: string): WakaParseResult | null {
  const seireki = wakaToSeireki(wakaText);
  if (seireki === null) return null;

  const normalized = wakaText
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/\s/g, '');

  for (const era of MODERN_ERAS) {
    if (normalized.startsWith(era.name)) {
      const eraYear = seireki - era.startYear + 1;
      return {
        eraName: era.name,
        eraYear,
        seirekiYear: seireki,
      };
    }
  }

  return null;
}

/**
 * 西暦を和暦に変換（同期・近代元号のみ）
 */
export function seirekiToWaka(seirekiYear: number): string | null {
  if (seirekiYear < MODERN_ERAS[0].startYear) {
    return null;
  }

  for (let i = MODERN_ERAS.length - 1; i >= 0; i--) {
    const era = MODERN_ERAS[i];
    if (seirekiYear >= era.startYear) {
      const eraYear = seirekiYear - era.startYear + 1;
      if (eraYear === 1) {
        return `${era.name}元年`;
      }
      return `${era.name}${eraYear}年`;
    }
  }

  return null;
}

/**
 * 西暦を和暦詳細に変換
 */
export function seirekiToWakaDetail(seirekiYear: number): WakaParseResult | null {
  const wakaText = seirekiToWaka(seirekiYear);
  if (!wakaText) return null;

  return parseWaka(wakaText);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * テキストが和暦形式かどうか判定
 */
export function isWakaFormat(text: string): boolean {
  return wakaToSeireki(text) !== null;
}

/**
 * テキストが西暦形式かどうか判定
 */
export function isSeirekiFormat(text: string): boolean {
  return /^\d{3,4}$/.test(text.trim());
}

/**
 * 検索クエリから年を抽出（非同期・全時代対応）
 */
export async function extractYearFromQueryAsync(query: string): Promise<number | null> {
  const trimmed = query.trim();

  // 西暦
  if (isSeirekiFormat(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // 和暦（全時代対応）
  return wakaToSeirekiAsync(trimmed);
}

/**
 * 検索クエリから年を抽出（同期・近代元号のみ）
 */
export function extractYearFromQuery(query: string): number | null {
  const trimmed = query.trim();

  // 西暦
  if (isSeirekiFormat(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // 和暦（近代元号のみ）
  return wakaToSeireki(trimmed);
}

/**
 * 年の範囲を検証
 */
export function isValidYear(year: number): boolean {
  return year >= -14000 && year <= 2100;
}

/**
 * 元号の開始・終了年を取得（同期・近代元号のみ）
 */
export function getEraYearRange(eraName: string): { start: number; end: number } | null {
  const era = MODERN_ERA_MAP.get(eraName);
  if (!era) return null;

  return {
    start: era.startYear,
    end: era.endYear ?? new Date().getFullYear(),
  };
}

// =============================================================================
// Export
// =============================================================================

export default {
  // Async (全時代対応)
  wakaToSeirekiAsync,
  seirekiToWakaAsync,
  getEraYearRangeAsync,
  searchEraByNameAsync,
  extractYearFromQueryAsync,
  clearWarekiCache,
  // Sync (近代元号のみ)
  wakaToSeireki,
  seirekiToWaka,
  parseWaka,
  seirekiToWakaDetail,
  isWakaFormat,
  isSeirekiFormat,
  extractYearFromQuery,
  isValidYear,
  getEraYearRange,
  MODERN_ERAS,
};
