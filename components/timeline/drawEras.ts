/**
 * Draw Eras - 時代背景帯の描画ロジック
 * Sprint 2: 020 Timeline Core
 */

import { Skia, SkCanvas, SkFont } from '@shopify/react-native-skia';

import type { Era } from '@/types/database';
import {
  yearToPixel,
  isYearRangeVisible,
  type CoordinateConfig,
} from '@/domain/timeline/coordinateSystem';
import {
  ERA_BAND_TOP_RATIO,
  ERA_BAND_BOTTOM_RATIO,
  ERA_LABEL_Y_RATIO,
  MAX_VISIBLE_LABELS,
} from '@/domain/timeline/constants';
import { ERA_COLORS } from '@/constants/tokens';

// =============================================================================
// Types
// =============================================================================

export interface DrawErasConfig extends CoordinateConfig {
  /** 描画対象の時代データ */
  eras: Era[];
  /** ラベル描画用フォント（nullの場合はラベル省略） */
  font: SkFont | null;
  /** テキスト色 */
  textColor: string;
}

// =============================================================================
// Era Color Mapping
// =============================================================================

const ERA_COLOR_MAP: Record<string, string> = {
  jomon: ERA_COLORS.jomon,
  yayoi: ERA_COLORS.yayoi,
  kofun: ERA_COLORS.kofun,
  asuka: ERA_COLORS.asuka,
  nara: ERA_COLORS.nara,
  heian: ERA_COLORS.heian,
  kamakura: ERA_COLORS.kamakura,
  muromachi: ERA_COLORS.muromachi,
  sengoku: ERA_COLORS.sengoku,
  azuchi_momoyama: ERA_COLORS.azuchiMomoyama,
  edo: ERA_COLORS.edo,
  meiji: ERA_COLORS.meiji,
  taisho: ERA_COLORS.taisho,
  showa: ERA_COLORS.showa,
  heisei: ERA_COLORS.heisei,
};

/**
 * 時代IDから色を取得
 */
function getEraColor(eraId: string, dbColor: string | null): string {
  // DB に保存された color を優先、なければマッピングから取得
  if (dbColor) return dbColor;
  return ERA_COLOR_MAP[eraId] ?? '#4A5568';
}

// =============================================================================
// Drawing Functions
// =============================================================================

/**
 * 時代背景帯を描画
 */
export function drawEras(canvas: SkCanvas, config: DrawErasConfig): void {
  const { eras, screenHeight, font, textColor } = config;

  // 背景帯のY範囲
  const bandTop = screenHeight * ERA_BAND_TOP_RATIO;
  const bandBottom = screenHeight * ERA_BAND_BOTTOM_RATIO;
  const bandHeight = bandBottom - bandTop;

  // ラベルのY位置
  const labelY = screenHeight * ERA_LABEL_Y_RATIO;

  // 描画したラベル数をカウント
  let labelCount = 0;

  for (const era of eras) {
    // 可視範囲チェック
    if (!isYearRangeVisible(era.startYear, era.endYear, config)) {
      continue;
    }

    // 座標計算
    const startX = yearToPixel(era.startYear, config);
    const endX = yearToPixel(era.endYear, config);
    const width = endX - startX;

    // 幅が極端に小さい場合はスキップ（パフォーマンス）
    if (width < 1) continue;

    // 背景帯を描画
    const bandPaint = Skia.Paint();
    bandPaint.setColor(Skia.Color(getEraColor(era.id, era.color)));
    bandPaint.setAlphaf(0.4);

    canvas.drawRect(
      Skia.XYWHRect(startX, bandTop, width, bandHeight),
      bandPaint
    );

    // 時代境界線を描画
    const borderPaint = Skia.Paint();
    borderPaint.setColor(Skia.Color(getEraColor(era.id, era.color)));
    borderPaint.setAlphaf(0.7);
    borderPaint.setStrokeWidth(1);

    canvas.drawLine(startX, bandTop, startX, bandBottom, borderPaint);

    // ラベル描画（フォントがある場合のみ、最大数制限）
    if (font && labelCount < MAX_VISIBLE_LABELS && width > 30) {
      const labelPaint = Skia.Paint();
      labelPaint.setColor(Skia.Color(textColor));

      // 中央揃え
      const textWidth = font.measureText(era.name).width;
      const labelX = startX + (width - textWidth) / 2;

      // 画面内に収まる場合のみ描画
      if (labelX > 0 && labelX < config.screenWidth) {
        canvas.drawText(era.name, labelX, labelY, labelPaint, font);
        labelCount++;
      }
    }
  }
}

/**
 * 時代境界線のみを描画（軽量版）
 */
export function drawEraBoundaries(canvas: SkCanvas, config: Omit<DrawErasConfig, 'font' | 'textColor'>): void {
  const { eras, screenHeight } = config;

  const bandTop = screenHeight * ERA_BAND_TOP_RATIO;
  const bandBottom = screenHeight * ERA_BAND_BOTTOM_RATIO;

  const linePaint = Skia.Paint();
  linePaint.setColor(Skia.Color('#4A5568'));
  linePaint.setAlphaf(0.5);
  linePaint.setStrokeWidth(1);

  for (const era of eras) {
    if (!isYearRangeVisible(era.startYear, era.endYear, config)) {
      continue;
    }

    const startX = yearToPixel(era.startYear, config);
    canvas.drawLine(startX, bandTop, startX, bandBottom, linePaint);
  }
}

// =============================================================================
// Export
// =============================================================================

export { getEraColor };
