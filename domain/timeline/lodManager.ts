/**
 * LOD Manager - Level of Detail 管理
 * Sprint 2: 022 LOD Manager
 *
 * ズームレベルに応じて表示情報の粒度を動的に変更し、情報過多を回避する。
 *
 * LODレベル定義:
 * - L0 (全体俯瞰): 1 ≤ zoom < 2  → 時代名のみ、イベントなし
 * - L1 (時代概要): 2 ≤ zoom < 10 → 主要イベント（importance >= 2）
 * - L2 (詳細表示): 10 ≤ zoom < 50 → 全イベント（importance >= 1）
 * - L3 (最大詳細): 50 ≤ zoom → 全イベント + ラベル表示
 */

import type { HistoricalEvent } from '@/types/database';
import type { LODLevel } from '@/types/store';
import { extractYearFromDate } from './coordinateSystem';

// =============================================================================
// LOD Configuration
// =============================================================================

export interface LODConfig {
  /** LODレベル */
  level: LODLevel;
  /** 表示対象の最小重要度（Infinity = イベント非表示） */
  minImportance: number;
  /** イベントラベル表示するか */
  showEventLabels: boolean;
  /** マーカー半径乗数 */
  markerRadiusMultiplier: number;
  /** 時代ラベルフォントサイズ */
  eraLabelFontSize: number;
  /** イベントラベルフォントサイズ */
  eventLabelFontSize: number;
  /** 最大表示イベント数 */
  maxVisibleEvents: number;
}

/**
 * LODレベル別設定
 *
 * L0: 全体俯瞰 - 時代名のみ表示、イベントマーカーなし
 * L1: 時代概要 - 主要イベント（importance >= 2）のみ表示
 * L2: 詳細表示 - 全イベント表示、ラベルなし
 * L3: 最大詳細 - 全イベント + ラベル表示
 */
export const LOD_CONFIGS: Record<LODLevel, LODConfig> = {
  0: {
    level: 0,
    minImportance: Infinity, // イベント非表示
    showEventLabels: false,
    markerRadiusMultiplier: 0.6,
    eraLabelFontSize: 14,
    eventLabelFontSize: 0,
    maxVisibleEvents: 0,
  },
  1: {
    level: 1,
    minImportance: 2, // importance >= 2（重要・最重要）
    showEventLabels: false,
    markerRadiusMultiplier: 0.8,
    eraLabelFontSize: 12,
    eventLabelFontSize: 10,
    maxVisibleEvents: 100,
  },
  2: {
    level: 2,
    minImportance: 1, // importance >= 1（通常以上）
    showEventLabels: false,
    markerRadiusMultiplier: 1.0,
    eraLabelFontSize: 12,
    eventLabelFontSize: 10,
    maxVisibleEvents: 300,
  },
  3: {
    level: 3,
    minImportance: 0, // 全て表示
    showEventLabels: true,
    markerRadiusMultiplier: 1.2,
    eraLabelFontSize: 12,
    eventLabelFontSize: 11,
    maxVisibleEvents: 500,
  },
};

// =============================================================================
// Filtering Functions
// =============================================================================

/**
 * LODレベルに基づいてイベントを重要度でフィルタリング
 *
 * 注意: この関数は重要度フィルタのみ適用。
 * 表示上限は可視範囲フィルタ後に applyEventLimit() で適用すること。
 *
 * @param events - 全イベント配列
 * @param lodLevel - 現在のLODレベル
 * @returns 重要度でフィルタリングされたイベント配列
 */
export function filterEventsByLOD(
  events: HistoricalEvent[],
  lodLevel: LODLevel
): HistoricalEvent[] {
  const config = LOD_CONFIGS[lodLevel];

  // L0: イベント非表示
  if (config.minImportance === Infinity) {
    return [];
  }

  // 重要度でフィルタリング（上限は適用しない）
  return events.filter(
    (event) => event.importanceLevel >= config.minImportance
  );
}

/**
 * 可視範囲内のイベントに対して表示上限を適用
 *
 * 使用順序:
 * 1. filterEventsByLOD() で重要度フィルタ
 * 2. filterDensePeriodEvents() で密集期間フィルタ
 * 3. 可視範囲フィルタ（isYearVisible）
 * 4. applyEventLimit() で上限適用 ← ここ
 *
 * @param events - 可視範囲内のイベント配列
 * @param lodLevel - 現在のLODレベル
 * @returns 上限適用後のイベント配列
 */
export function applyEventLimit(
  events: HistoricalEvent[],
  lodLevel: LODLevel
): HistoricalEvent[] {
  const config = LOD_CONFIGS[lodLevel];
  return events.slice(0, config.maxVisibleEvents);
}

/**
 * LODレベルに基づいてマーカー半径を計算
 *
 * @param baseRadius - 基本半径
 * @param importanceLevel - イベント重要度
 * @param lodLevel - 現在のLODレベル
 * @returns 調整後の半径
 */
export function getMarkerRadiusByLOD(
  baseRadius: number,
  importanceLevel: number,
  lodLevel: LODLevel
): number {
  const config = LOD_CONFIGS[lodLevel];

  // 重要度による乗数（0=0.6, 1=0.8, 2=1.0, 3=1.4）
  const importanceMultiplier: Record<number, number> = {
    0: 0.6,
    1: 0.8,
    2: 1.0,
    3: 1.4,
  };

  const impMult = importanceMultiplier[importanceLevel] ?? 1.0;

  return baseRadius * impMult * config.markerRadiusMultiplier;
}

/**
 * LODレベルに基づいてラベル表示可否を判定
 *
 * @param lodLevel - 現在のLODレベル
 * @returns ラベル表示するか
 */
export function shouldShowEventLabels(lodLevel: LODLevel): boolean {
  return LOD_CONFIGS[lodLevel].showEventLabels;
}

/**
 * LOD設定を取得
 *
 * @param lodLevel - LODレベル
 * @returns LOD設定
 */
export function getLODConfig(lodLevel: LODLevel): LODConfig {
  return LOD_CONFIGS[lodLevel];
}

// =============================================================================
// Dense Period Handling (幕末〜明治対応)
// =============================================================================

/** 密集期間の定義 */
const DENSE_PERIODS = [
  { startYear: 1850, endYear: 1920, maxEventsPerDecade: 30 },
];

/**
 * 密集期間かどうかを判定
 *
 * @param year - 年
 * @returns 密集期間ならtrue
 */
export function isDensePeriod(year: number): boolean {
  return DENSE_PERIODS.some(
    (period) => year >= period.startYear && year <= period.endYear
  );
}

/**
 * 密集期間でのイベント間引き処理
 * 高ズームレベル以外では重要度の高いイベントのみ表示
 *
 * @param events - イベント配列
 * @param lodLevel - LODレベル
 * @returns 間引き後のイベント配列
 */
export function filterDensePeriodEvents(
  events: HistoricalEvent[],
  lodLevel: LODLevel
): HistoricalEvent[] {
  // L3（最大詳細）では間引きしない
  if (lodLevel >= 3) {
    return events;
  }

  // L1/L2 では密集期間のイベントを重要度でさらにフィルタ
  return events.filter((event) => {
    // 密集期間外はそのまま通過
    const year = extractYearFromDate(event.startDate);
    if (!isDensePeriod(year)) {
      return true;
    }

    // 密集期間内は重要度を1段階厳しくする
    const config = LOD_CONFIGS[lodLevel];
    return event.importanceLevel >= config.minImportance + 1;
  });
}
