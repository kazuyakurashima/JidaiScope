/**
 * Draw Events - イベントマーカーの描画ロジック
 * Sprint 2: 020 Timeline Core
 */

import { Skia, SkCanvas, SkFont } from '@shopify/react-native-skia';

import type { HistoricalEvent, EventTag } from '@/types/database';
import {
  yearToPixel,
  isYearVisible,
  extractYearFromDate,
  type CoordinateConfig,
} from '@/domain/timeline/coordinateSystem';
import {
  TIMELINE_AXIS_Y_RATIO,
  EVENT_MARKER_BASE_RADIUS,
  IMPORTANCE_SIZE_MULTIPLIER,
  TAG_COLORS,
  MAX_VISIBLE_EVENTS,
  MAX_VISIBLE_LABELS,
} from '@/domain/timeline/constants';

// =============================================================================
// Types
// =============================================================================

export interface DrawEventsConfig extends CoordinateConfig {
  /** 描画対象のイベントデータ */
  events: HistoricalEvent[];
  /** ラベル描画用フォント（nullの場合はラベル省略） */
  font: SkFont | null;
  /** テキスト色 */
  textColor: string;
  /** ラベル表示するズームレベル閾値 */
  labelZoomThreshold?: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * イベントタグから色を取得
 */
function getEventColor(tags: EventTag[]): string {
  if (tags.length === 0) return TAG_COLORS.default;
  // 最初のタグの色を使用
  return TAG_COLORS[tags[0]] ?? TAG_COLORS.default;
}

/**
 * 重要度からマーカー半径を計算
 */
function getMarkerRadius(importanceLevel: number): number {
  const multiplier = IMPORTANCE_SIZE_MULTIPLIER[importanceLevel] ?? 1.0;
  return EVENT_MARKER_BASE_RADIUS * multiplier;
}

// =============================================================================
// Drawing Functions
// =============================================================================

/**
 * イベントマーカーを描画
 */
export function drawEvents(canvas: SkCanvas, config: DrawEventsConfig): void {
  const {
    events,
    screenHeight,
    font,
    textColor,
    zoomLevel,
    labelZoomThreshold = 10,
  } = config;

  // タイムライン軸のY位置
  const axisY = screenHeight * TIMELINE_AXIS_Y_RATIO;

  // 描画カウンタ
  let eventCount = 0;
  let labelCount = 0;

  // ラベル表示判定
  const showLabels = font !== null && zoomLevel >= labelZoomThreshold;

  for (const event of events) {
    // 描画上限チェック
    if (eventCount >= MAX_VISIBLE_EVENTS) break;

    // 年号を抽出
    const year = extractYearFromDate(event.startDate);

    // 可視範囲チェック
    if (!isYearVisible(year, config)) continue;

    // X座標計算
    const x = yearToPixel(year, config);

    // マーカー描画
    const radius = getMarkerRadius(event.importanceLevel);
    const color = getEventColor(event.tags);

    const markerPaint = Skia.Paint();
    markerPaint.setColor(Skia.Color(color));
    markerPaint.setAntiAlias(true);

    canvas.drawCircle(x, axisY, radius, markerPaint);

    eventCount++;

    // 期間イベントの場合は線を描画
    if (event.endDate) {
      const endYear = extractYearFromDate(event.endDate);
      const endX = yearToPixel(endYear, config);

      const linePaint = Skia.Paint();
      linePaint.setColor(Skia.Color(color));
      linePaint.setAlphaf(0.6);
      linePaint.setStrokeWidth(2);

      canvas.drawLine(x, axisY, endX, axisY, linePaint);
    }

    // ラベル描画（高ズーム時のみ）
    if (showLabels && labelCount < MAX_VISIBLE_LABELS) {
      const labelPaint = Skia.Paint();
      labelPaint.setColor(Skia.Color(textColor));

      // ラベル位置（マーカーの上）
      const labelY = axisY - radius - 8;
      const textWidth = font!.measureText(event.title).width;
      const labelX = x - textWidth / 2;

      // 画面内に収まる場合のみ描画
      if (labelX > 0 && labelX + textWidth < config.screenWidth) {
        canvas.drawText(event.title, labelX, labelY, labelPaint, font!);
        labelCount++;
      }
    }
  }
}

/**
 * イベントマーカーのみを描画（軽量版、ラベルなし）
 */
export function drawEventMarkers(
  canvas: SkCanvas,
  config: Omit<DrawEventsConfig, 'font' | 'textColor' | 'labelZoomThreshold'>
): void {
  const { events, screenHeight } = config;

  const axisY = screenHeight * TIMELINE_AXIS_Y_RATIO;
  let eventCount = 0;

  for (const event of events) {
    if (eventCount >= MAX_VISIBLE_EVENTS) break;

    const year = extractYearFromDate(event.startDate);
    if (!isYearVisible(year, config)) continue;

    const x = yearToPixel(year, config);
    const radius = getMarkerRadius(event.importanceLevel);
    const color = getEventColor(event.tags);

    const markerPaint = Skia.Paint();
    markerPaint.setColor(Skia.Color(color));
    markerPaint.setAntiAlias(true);

    canvas.drawCircle(x, axisY, radius, markerPaint);
    eventCount++;
  }
}

/**
 * タイムライン軸（中央線）を描画
 */
export function drawTimelineAxis(
  canvas: SkCanvas,
  config: CoordinateConfig,
  color: string
): void {
  const { screenWidth, screenHeight } = config;
  const axisY = screenHeight * TIMELINE_AXIS_Y_RATIO;

  const axisPaint = Skia.Paint();
  axisPaint.setColor(Skia.Color(color));
  axisPaint.setAlphaf(0.3);
  axisPaint.setStrokeWidth(2);

  canvas.drawLine(0, axisY, screenWidth, axisY, axisPaint);
}

// =============================================================================
// Export
// =============================================================================

export { getEventColor, getMarkerRadius };
