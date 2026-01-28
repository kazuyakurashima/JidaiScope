/**
 * Hit Detection - タップ検出ロジック
 * Sprint 2: 020 Timeline Core
 */

import type { HistoricalEvent, Era } from '@/types/database';
import {
  yearToPixel,
  extractYearFromDate,
  type CoordinateConfig,
} from '@/domain/timeline/coordinateSystem';
import {
  TIMELINE_AXIS_Y_RATIO,
  EVENT_HIT_RADIUS,
  ERA_BAND_TOP_RATIO,
  ERA_BAND_BOTTOM_RATIO,
} from '@/domain/timeline/constants';

// =============================================================================
// Types
// =============================================================================

export interface HitTestResult {
  type: 'event' | 'era' | 'none';
  id: string | null;
  data: HistoricalEvent | Era | null;
}

export interface HitTestConfig extends CoordinateConfig {
  events: HistoricalEvent[];
  eras: Era[];
}

// =============================================================================
// Hit Detection Functions
// =============================================================================

/**
 * タップ位置にあるイベントを検索
 * @param touchX - タッチX座標（px）
 * @param touchY - タッチY座標（px）
 * @param config - ヒットテスト設定
 * @returns 見つかったイベント（なければnull）
 */
export function getEventAtPoint(
  touchX: number,
  touchY: number,
  config: HitTestConfig
): HistoricalEvent | null {
  const { events, screenHeight } = config;
  const axisY = screenHeight * TIMELINE_AXIS_Y_RATIO;

  // Y座標がタイムライン軸付近でない場合はスキップ
  if (Math.abs(touchY - axisY) > EVENT_HIT_RADIUS * 2) {
    return null;
  }

  // 最も近いイベントを探す
  let closestEvent: HistoricalEvent | null = null;
  let closestDistance = EVENT_HIT_RADIUS;

  for (const event of events) {
    const year = extractYearFromDate(event.startDate);
    const eventX = yearToPixel(year, config);

    // 距離計算
    const distance = Math.abs(touchX - eventX);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestEvent = event;
    }
  }

  return closestEvent;
}

/**
 * タップ位置にある時代を検索
 * @param touchX - タッチX座標（px）
 * @param touchY - タッチY座標（px）
 * @param config - ヒットテスト設定
 * @returns 見つかった時代（なければnull）
 */
export function getEraAtPoint(
  touchX: number,
  touchY: number,
  config: HitTestConfig
): Era | null {
  const { eras, screenHeight } = config;

  // 時代帯のY範囲
  const bandTop = screenHeight * ERA_BAND_TOP_RATIO;
  const bandBottom = screenHeight * ERA_BAND_BOTTOM_RATIO;

  // Y座標が時代帯の範囲外ならスキップ
  if (touchY < bandTop || touchY > bandBottom) {
    return null;
  }

  for (const era of eras) {
    const startX = yearToPixel(era.startYear, config);
    const endX = yearToPixel(era.endYear, config);

    if (touchX >= startX && touchX <= endX) {
      return era;
    }
  }

  return null;
}

/**
 * 統合ヒットテスト（イベント優先）
 * @param touchX - タッチX座標（px）
 * @param touchY - タッチY座標（px）
 * @param config - ヒットテスト設定
 * @returns ヒットテスト結果
 */
export function hitTest(
  touchX: number,
  touchY: number,
  config: HitTestConfig
): HitTestResult {
  // イベントを優先的にチェック
  const event = getEventAtPoint(touchX, touchY, config);
  if (event) {
    return {
      type: 'event',
      id: event.id,
      data: event,
    };
  }

  // 次に時代をチェック
  const era = getEraAtPoint(touchX, touchY, config);
  if (era) {
    return {
      type: 'era',
      id: era.id,
      data: era,
    };
  }

  // 何もヒットしなかった
  return {
    type: 'none',
    id: null,
    data: null,
  };
}

/**
 * 時代境界通過を検出
 * @param previousScrollX - 前回のスクロール位置
 * @param currentScrollX - 現在のスクロール位置
 * @param config - 座標設定
 * @returns 通過した時代境界（なければnull）
 */
export function detectEraBoundaryCrossing(
  previousScrollX: number,
  currentScrollX: number,
  eras: Era[],
  screenWidth: number,
  zoomLevel: number
): Era | null {
  const config: CoordinateConfig = {
    screenWidth,
    screenHeight: 0, // Y座標は不要
    zoomLevel,
    scrollX: 0,
  };

  // 画面中央のX座標で境界チェック
  const centerX = screenWidth / 2;

  for (const era of eras) {
    // 時代の開始X座標を両方のスクロール位置で計算
    const prevConfig = { ...config, scrollX: previousScrollX };
    const currConfig = { ...config, scrollX: currentScrollX };

    const prevBoundaryX = yearToPixel(era.startYear, prevConfig);
    const currBoundaryX = yearToPixel(era.startYear, currConfig);

    // 画面中央が境界を通過したかチェック
    const prevSide = centerX - prevBoundaryX;
    const currSide = centerX - currBoundaryX;

    // 符号が変わった場合、境界を通過した
    if (prevSide * currSide < 0) {
      return era;
    }
  }

  return null;
}

