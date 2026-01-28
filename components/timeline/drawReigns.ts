/**
 * Draw Reigns - 在位期間（天皇・将軍）の描画ロジック
 * Sprint 2: 024 Layer Management
 *
 * タイムライン軸の上下に在位期間を帯状に描画:
 * - 天皇: 軸の上部（黄金色）
 * - 将軍: 軸の下部（青緑色）
 */

import { Skia, SkCanvas, SkFont } from '@shopify/react-native-skia';

import type { Reign, OfficeType } from '@/types/database';
import {
  yearToPixel,
  isYearRangeVisible,
  type CoordinateConfig,
} from '@/domain/timeline/coordinateSystem';
import { TIMELINE_AXIS_Y_RATIO } from '@/domain/timeline/constants';

// =============================================================================
// Constants
// =============================================================================

/** 天皇の在位帯色（黄金） */
export const EMPEROR_COLOR = '#D4AF37';

/** 将軍の在位帯色（青緑） */
export const SHOGUN_COLOR = '#20B2AA';

/** 摂政の在位帯色（紫） */
export const REGENT_COLOR = '#9370DB';

/** 在位帯の高さ */
const REIGN_BAND_HEIGHT = 16;

/** 在位帯の軸からのオフセット */
const REIGN_BAND_OFFSET = 8;

/** 最小描画幅（これ以下は描画スキップ） */
const MIN_REIGN_WIDTH = 2;

/** 最大描画数（パフォーマンス保護） */
const MAX_VISIBLE_REIGNS = 100;

// =============================================================================
// Types
// =============================================================================

export interface DrawReignsConfig extends CoordinateConfig {
  /** 描画対象の在位データ */
  reigns: Reign[];
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
 * OfficeType から色を取得
 */
export function getReignColor(officeType: OfficeType): string {
  switch (officeType) {
    case 'emperor':
      return EMPEROR_COLOR;
    case 'shogun':
      return SHOGUN_COLOR;
    case 'regent':
      return REGENT_COLOR;
    default:
      return SHOGUN_COLOR;
  }
}

/**
 * OfficeType が天皇かどうか判定
 */
function isEmperor(officeType: OfficeType): boolean {
  return officeType === 'emperor';
}

// =============================================================================
// Drawing Functions
// =============================================================================

/**
 * 在位期間を描画
 * - 天皇: タイムライン軸の上に配置
 * - 将軍・摂政: タイムライン軸の下に配置
 */
export function drawReigns(canvas: SkCanvas, config: DrawReignsConfig): void {
  const {
    reigns,
    screenHeight,
    font,
    textColor,
    zoomLevel,
    labelZoomThreshold = 20,
  } = config;

  // タイムライン軸のY位置
  const axisY = screenHeight * TIMELINE_AXIS_Y_RATIO;

  // 天皇の帯Y位置（軸の上）
  const emperorBandY = axisY - REIGN_BAND_OFFSET - REIGN_BAND_HEIGHT;

  // 将軍の帯Y位置（軸の下）
  const shogunBandY = axisY + REIGN_BAND_OFFSET;

  // ラベル表示判定
  const showLabels = font !== null && zoomLevel >= labelZoomThreshold;

  // 描画カウンタ
  let reignCount = 0;

  for (const reign of reigns) {
    // 描画上限チェック
    if (reignCount >= MAX_VISIBLE_REIGNS) break;

    // 可視範囲チェック
    if (!isYearRangeVisible(reign.startYear, reign.endYear, config)) continue;

    // X座標計算
    const startX = yearToPixel(reign.startYear, config);
    const endX = yearToPixel(reign.endYear, config);
    const width = endX - startX;

    // 最小幅チェック
    if (width < MIN_REIGN_WIDTH) continue;

    // Y位置決定
    const bandY = isEmperor(reign.officeType) ? emperorBandY : shogunBandY;

    // 色取得
    const color = getReignColor(reign.officeType);

    // 帯を描画
    const bandPaint = Skia.Paint();
    bandPaint.setColor(Skia.Color(color));
    bandPaint.setAntiAlias(true);

    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(startX, bandY, width, REIGN_BAND_HEIGHT),
        4, // borderRadius
        4
      ),
      bandPaint
    );

    // 境界線
    const borderPaint = Skia.Paint();
    borderPaint.setColor(Skia.Color(color));
    borderPaint.setStyle(1); // Stroke
    borderPaint.setStrokeWidth(1);
    borderPaint.setAlphaf(0.8);

    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(startX, bandY, width, REIGN_BAND_HEIGHT),
        4,
        4
      ),
      borderPaint
    );

    reignCount++;

    // ラベル描画（高ズーム時のみ）
    if (showLabels && font && width > 40) {
      // 代数ラベル（例: "第1代"）
      const ordinalLabel = reign.ordinal
        ? `${reign.ordinal}`
        : '';

      if (ordinalLabel) {
        const labelPaint = Skia.Paint();
        labelPaint.setColor(Skia.Color(textColor));

        const textWidth = font.measureText(ordinalLabel).width;

        // 帯の中央に配置（幅に収まる場合のみ）
        if (textWidth < width - 8) {
          const labelX = startX + (width - textWidth) / 2;
          const labelY = bandY + REIGN_BAND_HEIGHT / 2 + 4; // 中央揃え

          canvas.drawText(ordinalLabel, labelX, labelY, labelPaint, font);
        }
      }
    }
  }
}

/**
 * 天皇在位のみを描画
 */
export function drawEmperorReigns(
  canvas: SkCanvas,
  config: Omit<DrawReignsConfig, 'reigns'> & { reigns: Reign[] }
): void {
  const emperorReigns = config.reigns.filter((r) => isEmperor(r.officeType));
  drawReigns(canvas, { ...config, reigns: emperorReigns });
}

/**
 * 将軍在位のみを描画
 */
export function drawShogunReigns(
  canvas: SkCanvas,
  config: Omit<DrawReignsConfig, 'reigns'> & { reigns: Reign[] }
): void {
  const shogunReigns = config.reigns.filter((r) => !isEmperor(r.officeType));
  drawReigns(canvas, { ...config, reigns: shogunReigns });
}

// =============================================================================
// Export
// =============================================================================

export { REIGN_BAND_HEIGHT, REIGN_BAND_OFFSET };
