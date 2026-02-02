/**
 * formatYear.ts - 年代フォーマットユーティリティ
 * Sprint 3: 036 Year Ruler & Era Labels
 *
 * 紀元前表記: MVP では BC 表記（Skia の Roboto フォントが日本語非対応のため）
 * TODO: Sprint 4 で日本語フォント対応後に「紀元前」に変更
 */

/**
 * 年をフォーマット
 * 負の年は「BC ○○」
 */
export function formatYear(year: number): string {
  if (year < 0) {
    return `BC ${Math.abs(year)}`;
  }
  return `${year}`;
}

/**
 * 年を短い形式でフォーマット
 * 負の年は「BC ○○」
 * TimelineCanvas の Year Ruler 向け（Roboto フォント使用）
 */
export function formatYearShort(year: number): string {
  if (year < 0) {
    return `BC ${Math.abs(year)}`;
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
