/**
 * Screenshot Caption Generator - スクリーンショット共有用キャプション生成
 * Sprint 3: 035 Screenshot Sharing
 */

import type { Era, HistoricalEvent } from '@/types/database';
import { useTimelineStore } from '@/stores/timelineStore';
import { getVisibleYearRange, extractYearFromDate } from '@/domain/timeline/coordinateSystem';

/**
 * スクリーンショット共有用のキャプションを生成
 * @param eras - 全時代データ
 * @param events - 全イベントデータ
 * @param screenWidth - 画面幅（px）
 * @returns キャプション文字列
 */
export function generateCaption(
  eras: Era[],
  events: HistoricalEvent[],
  screenWidth: number
): string {
  const { scrollX, zoomLevel } = useTimelineStore.getState();

  // 既存ユーティリティで可視範囲を計算
  const { startYear, endYear } = getVisibleYearRange({
    screenWidth,
    screenHeight: 0, // 未使用
    zoomLevel,
    scrollX,
  });

  const centerYear = Math.floor((startYear + endYear) / 2);

  // 可視時代を取得（中心年を含む時代を優先）
  const visibleEras = eras.filter(
    (era) => era.endYear >= startYear && era.startYear <= endYear
  );
  const primaryEra = visibleEras.find(
    (era) => centerYear >= era.startYear && centerYear <= era.endYear
  ) ?? visibleEras[0];
  const eraName = primaryEra?.name ?? '';

  // 可視イベント数
  const visibleEventCount = events.filter((e) => {
    const year = extractYearFromDate(e.startDate);
    return year >= startYear && year <= endYear;
  }).length;

  // 年号表示のフォーマット（紀元前対応）
  const yearDisplay = centerYear < 0 ? `紀元前${Math.abs(centerYear)}年` : `${centerYear}年`;

  return `📅 ${yearDisplay} ${eraName} - ${visibleEventCount}件のイベント\n\n#JidaiScope で日本史を学ぼう！`;
}
