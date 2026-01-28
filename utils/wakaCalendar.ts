/**
 * wakaCalendar.ts - 和暦⇔西暦変換ユーティリティ
 * Sprint 3: 030 Search Feature
 *
 * MVP スコープ: 明治〜令和（5元号）のみ対応
 * v1.1 で慶応以前の元号を追加予定
 */

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
// Constants - 近代元号マスター（MVP: 明治〜令和）
// =============================================================================

/**
 * 近代元号リスト（明治〜令和）
 * 注意: 元年 = 1年として計算
 */
export const MODERN_ERAS: JapaneseEra[] = [
  { name: '明治', reading: 'めいじ', startYear: 1868, endYear: 1912 },
  { name: '大正', reading: 'たいしょう', startYear: 1912, endYear: 1926 },
  { name: '昭和', reading: 'しょうわ', startYear: 1926, endYear: 1989 },
  { name: '平成', reading: 'へいせい', startYear: 1989, endYear: 2019 },
  { name: '令和', reading: 'れいわ', startYear: 2019, endYear: null },
];

/**
 * 元号名から元号情報を取得するマップ
 */
const ERA_MAP = new Map<string, JapaneseEra>(
  MODERN_ERAS.map((era) => [era.name, era])
);

// =============================================================================
// Waka → Seireki Conversion
// =============================================================================

/**
 * 和暦テキストを西暦に変換
 * @param wakaText 和暦テキスト（例: "明治元年", "令和3年"）
 * @returns 西暦年、変換不可の場合は null
 *
 * 対応パターン:
 * - "明治元年" → 1868
 * - "明治1年" → 1868
 * - "令和3年" → 2021
 * - "昭和64年" → 1989
 */
export function wakaToSeireki(wakaText: string): number | null {
  // 正規化: 全角数字を半角に、スペース削除
  const normalized = wakaText
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/\s/g, '');

  // パターン1: "元号+数字+年" (例: "明治45年")
  const numericMatch = normalized.match(/^(.+?)(\d+)年?$/);
  if (numericMatch) {
    const [, eraName, yearStr] = numericMatch;
    const era = ERA_MAP.get(eraName);
    if (era) {
      const eraYear = parseInt(yearStr, 10);
      return era.startYear + eraYear - 1;
    }
  }

  // パターン2: "元号+元年" (例: "明治元年")
  const gannenMatch = normalized.match(/^(.+?)元年$/);
  if (gannenMatch) {
    const [, eraName] = gannenMatch;
    const era = ERA_MAP.get(eraName);
    if (era) {
      return era.startYear;
    }
  }

  // パターン3: 元号名のみ（開始年を返す）
  const era = ERA_MAP.get(normalized.replace(/年$/, ''));
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

  // 元号を特定
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

// =============================================================================
// Seireki → Waka Conversion
// =============================================================================

/**
 * 西暦を和暦に変換
 * @param seirekiYear 西暦年
 * @returns 和暦テキスト（例: "明治元年", "令和3年"）、対応外の場合は null
 */
export function seirekiToWaka(seirekiYear: number): string | null {
  // 対応範囲外
  if (seirekiYear < MODERN_ERAS[0].startYear) {
    return null;
  }

  // 該当する元号を探す（新しい順に検索）
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
 * 検索クエリから年を抽出
 * @param query 検索クエリ
 * @returns 西暦年、抽出不可の場合は null
 */
export function extractYearFromQuery(query: string): number | null {
  const trimmed = query.trim();

  // 西暦（3-4桁の数字）
  if (isSeirekiFormat(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // 和暦
  const wakaYear = wakaToSeireki(trimmed);
  if (wakaYear !== null) {
    return wakaYear;
  }

  return null;
}

/**
 * 年の範囲を検証
 */
export function isValidYear(year: number): boolean {
  // タイムラインの範囲: -14000 〜 2025
  return year >= -14000 && year <= 2100;
}

/**
 * 元号の開始・終了年を取得
 */
export function getEraYearRange(eraName: string): { start: number; end: number } | null {
  const era = ERA_MAP.get(eraName);
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
