/**
 * formatYear.ts - 年代フォーマットユーティリティ
 * Sprint 3: 036 Year Ruler & Era Labels
 *
 * 紀元前表記を統一するためのヘルパー関数
 */

/**
 * 年を「○○年」形式でフォーマット
 * 負の年は「紀元前○○年」
 */
export function formatYear(year: number): string {
  if (year < 0) {
    return `紀元前${Math.abs(year)}年`;
  }
  return `${year}年`;
}

/**
 * 年を「○○」形式でフォーマット（「年」なし）
 * 負の年は「紀元前○○」
 * EraPickerBar などスペースが限られる箇所向け
 */
export function formatYearShort(year: number): string {
  if (year < 0) {
    return `紀元前${Math.abs(year)}`;
  }
  return `${year}`;
}

/**
 * 年範囲を「○○年 - ○○年」形式でフォーマット
 * app/era/[id].tsx のヘッダー表示用
 */
export function formatYearRange(startYear: number, endYear: number): string {
  return `${formatYear(startYear)} - ${formatYear(endYear)}`;
}

/**
 * 年範囲を短い形式でフォーマット（「年」なし）
 */
export function formatYearRangeShort(startYear: number, endYear: number): string {
  return `${formatYearShort(startYear)} - ${formatYearShort(endYear)}`;
}
