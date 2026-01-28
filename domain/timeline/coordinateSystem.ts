/**
 * Coordinate System - 年号 ↔ ピクセル変換ロジック
 * Sprint 2: 020 Timeline Core
 */

import {
  TIMELINE_START_YEAR,
  TIMELINE_END_YEAR,
  TOTAL_YEARS,
  RENDER_MARGIN,
} from './constants';

// =============================================================================
// Types
// =============================================================================

export interface CoordinateConfig {
  /** 画面幅（px） */
  screenWidth: number;
  /** 画面高さ（px） */
  screenHeight: number;
  /** ズームレベル（1 = 全体が画面に収まる） */
  zoomLevel: number;
  /** スクロール位置X（px, 負の値で右にスクロール） */
  scrollX: number;
}

export interface VisibleRange {
  /** 可視範囲の開始年 */
  startYear: number;
  /** 可視範囲の終了年 */
  endYear: number;
}

// =============================================================================
// Core Calculations
// =============================================================================

/**
 * ズームレベル1で全体が画面幅に収まるピクセル/年を計算
 */
export function getBasePixelsPerYear(screenWidth: number): number {
  return screenWidth / TOTAL_YEARS;
}

/**
 * 現在のズームレベルでのピクセル/年を計算
 */
export function getPixelsPerYear(screenWidth: number, zoomLevel: number): number {
  return getBasePixelsPerYear(screenWidth) * zoomLevel;
}

/**
 * タイムライン全体の幅を計算（px）
 */
export function getTotalWidth(screenWidth: number, zoomLevel: number): number {
  return getPixelsPerYear(screenWidth, zoomLevel) * TOTAL_YEARS;
}

// =============================================================================
// Year ↔ Pixel Conversion
// =============================================================================

/**
 * 年号からピクセル座標（X）を計算
 * @param year - 年号（-10000〜2025）
 * @param config - 座標設定
 * @returns ピクセル座標X
 */
export function yearToPixel(year: number, config: CoordinateConfig): number {
  const pixelsPerYear = getPixelsPerYear(config.screenWidth, config.zoomLevel);
  // 年号を0始まりのオフセットに変換
  const yearOffset = year - TIMELINE_START_YEAR;
  return yearOffset * pixelsPerYear + config.scrollX;
}

/**
 * ピクセル座標（X）から年号を計算
 * @param pixelX - ピクセル座標X
 * @param config - 座標設定
 * @returns 年号
 */
export function pixelToYear(pixelX: number, config: CoordinateConfig): number {
  const pixelsPerYear = getPixelsPerYear(config.screenWidth, config.zoomLevel);
  const yearOffset = (pixelX - config.scrollX) / pixelsPerYear;
  return yearOffset + TIMELINE_START_YEAR;
}

// =============================================================================
// Visibility Checks
// =============================================================================

/**
 * 現在の可視範囲（年）を計算
 * @param config - 座標設定
 * @returns 可視範囲の開始年・終了年
 */
export function getVisibleYearRange(config: CoordinateConfig): VisibleRange {
  const pixelsPerYear = getPixelsPerYear(config.screenWidth, config.zoomLevel);

  // 可視範囲のピクセル座標
  const visibleStartX = -RENDER_MARGIN;
  const visibleEndX = config.screenWidth + RENDER_MARGIN;

  // ピクセル座標から年号へ変換
  const startYear = pixelToYear(visibleStartX, config);
  const endYear = pixelToYear(visibleEndX, config);

  return {
    startYear: Math.max(startYear, TIMELINE_START_YEAR),
    endYear: Math.min(endYear, TIMELINE_END_YEAR),
  };
}

/**
 * 指定した年が可視範囲内かどうかを判定
 */
export function isYearVisible(year: number, config: CoordinateConfig): boolean {
  const { startYear, endYear } = getVisibleYearRange(config);
  return year >= startYear && year <= endYear;
}

/**
 * 指定した年範囲が可視範囲と重なるかどうかを判定
 */
export function isYearRangeVisible(
  rangeStart: number,
  rangeEnd: number,
  config: CoordinateConfig
): boolean {
  const { startYear, endYear } = getVisibleYearRange(config);
  // 範囲が重なるかどうか
  return rangeStart <= endYear && rangeEnd >= startYear;
}

// =============================================================================
// Scroll Bounds
// =============================================================================

/**
 * スクロールの最小値を計算（左端）
 */
export function getMinScrollX(screenWidth: number, zoomLevel: number): number {
  const totalWidth = getTotalWidth(screenWidth, zoomLevel);
  return screenWidth - totalWidth;
}

/**
 * スクロールの最大値を計算（右端）
 */
export function getMaxScrollX(): number {
  return 0;
}

/**
 * スクロール位置を有効範囲内にクランプ
 */
export function clampScrollX(
  scrollX: number,
  screenWidth: number,
  zoomLevel: number
): number {
  const minX = getMinScrollX(screenWidth, zoomLevel);
  const maxX = getMaxScrollX();
  return Math.max(minX, Math.min(maxX, scrollX));
}

// =============================================================================
// Date Parsing
// =============================================================================

/**
 * 日付文字列から年を抽出
 * @param dateStr - YYYY-MM-DD or YYYY形式
 * @returns 年号（数値）
 */
export function extractYearFromDate(dateStr: string): number {
  // "YYYY-MM-DD" または "YYYY" 形式を想定
  const year = parseInt(dateStr.substring(0, dateStr.indexOf('-') > 0 ? dateStr.indexOf('-') : undefined), 10);
  return isNaN(year) ? 0 : year;
}

// =============================================================================
// Export
// =============================================================================

export {
  TIMELINE_START_YEAR,
  TIMELINE_END_YEAR,
  TOTAL_YEARS,
};
