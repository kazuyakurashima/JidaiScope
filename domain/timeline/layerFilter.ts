/**
 * layerFilter.ts - レイヤーフィルタリングロジック
 * Sprint 2: 024 Layer Management
 *
 * MVP (v1.0): 全機能無料開放
 * - appStore.proUnlocked = true のため、制限は発動しない
 *
 * v1.5 以降の Free/Pro 制限（現在は無効）:
 * - Free: 天皇10代、将軍5代、人物20人
 * - Pro: 全データ表示
 *
 * visibleLayers による表示/非表示制御
 */

import type { Era, HistoricalEvent, Reign, Person, OfficeType } from '@/types/database';
import type { LayerType } from '@/types/store';

// =============================================================================
// Constants - Free版の制限
// =============================================================================

/** Free版: 天皇の表示上限 */
export const FREE_EMPEROR_LIMIT = 10;

/** Free版: 将軍の表示上限 */
export const FREE_SHOGUN_LIMIT = 5;

/** Free版: 人物の表示上限 */
export const FREE_PERSON_LIMIT = 20;

// =============================================================================
// Types
// =============================================================================

export interface LayerFilterConfig {
  /** 各レイヤーの表示/非表示設定 */
  visibleLayers: Record<LayerType, boolean>;
  /** Pro版かどうか */
  proUnlocked: boolean;
}

// =============================================================================
// Era Filtering
// =============================================================================

/**
 * 時代レイヤーのフィルタリング
 * 時代レイヤーは常時表示（visibleLayersに関わらず表示）
 */
export function filterEras(
  eras: Era[],
  _config: LayerFilterConfig
): Era[] {
  // 時代レイヤーは常時表示
  return eras;
}

// =============================================================================
// Event Filtering
// =============================================================================

/**
 * イベントレイヤーのフィルタリング
 */
export function filterEvents(
  events: HistoricalEvent[],
  config: LayerFilterConfig
): HistoricalEvent[] {
  const { visibleLayers } = config;

  // イベントレイヤーが非表示の場合は空配列を返す
  if (!visibleLayers.events) {
    return [];
  }

  return events;
}

// =============================================================================
// Reign Filtering (Emperor/Shogun)
// =============================================================================

/**
 * OfficeType が天皇かどうか判定
 */
export function isEmperor(officeType: OfficeType): boolean {
  return officeType === 'emperor';
}

/**
 * OfficeType が将軍かどうか判定
 */
export function isShogun(officeType: OfficeType): boolean {
  return officeType === 'shogun';
}

/**
 * 在位データのフィルタリング
 * - visibleLayers で天皇/将軍の表示/非表示を制御
 * - Free版は制限数までのみ表示
 */
export function filterReigns(
  reigns: Reign[],
  config: LayerFilterConfig
): Reign[] {
  const { visibleLayers, proUnlocked } = config;

  // 天皇・将軍両方非表示の場合は空配列
  if (!visibleLayers.emperor && !visibleLayers.shogun) {
    return [];
  }

  // フィルタリング
  let filtered = reigns.filter((reign) => {
    if (isEmperor(reign.officeType)) {
      return visibleLayers.emperor;
    }
    if (isShogun(reign.officeType)) {
      return visibleLayers.shogun;
    }
    // その他（摂政など）は将軍に含める
    return visibleLayers.shogun;
  });

  // Free版の場合は制限を適用
  if (!proUnlocked) {
    filtered = applyReignLimits(filtered);
  }

  return filtered;
}

/**
 * Free版の在位データ制限を適用
 * - 天皇: 最初の10代（ordinal順）
 * - 将軍: 最初の5代（ordinal順）
 */
function applyReignLimits(reigns: Reign[]): Reign[] {
  // 天皇と将軍を分離
  const emperors = reigns.filter((r) => isEmperor(r.officeType));
  const shoguns = reigns.filter((r) => isShogun(r.officeType));
  const others = reigns.filter(
    (r) => !isEmperor(r.officeType) && !isShogun(r.officeType)
  );

  // ordinal順でソートして制限を適用
  const limitedEmperors = emperors
    .sort((a, b) => (a.ordinal ?? 999) - (b.ordinal ?? 999))
    .slice(0, FREE_EMPEROR_LIMIT);

  const limitedShoguns = shoguns
    .sort((a, b) => (a.ordinal ?? 999) - (b.ordinal ?? 999))
    .slice(0, FREE_SHOGUN_LIMIT);

  // その他は全て表示
  return [...limitedEmperors, ...limitedShoguns, ...others];
}

// =============================================================================
// Person Filtering
// =============================================================================

/**
 * 人物レイヤーのフィルタリング
 * - visibleLayers.person で表示/非表示
 * - Free版は20人まで
 */
export function filterPersons(
  persons: Person[],
  config: LayerFilterConfig
): Person[] {
  const { visibleLayers, proUnlocked } = config;

  // 人物レイヤーが非表示の場合は空配列
  if (!visibleLayers.person) {
    return [];
  }

  // Free版の場合は制限を適用
  if (!proUnlocked) {
    // 重要度順でソートして上位20人を表示
    return persons
      .sort((a, b) => (b.importanceLevel ?? 0) - (a.importanceLevel ?? 0))
      .slice(0, FREE_PERSON_LIMIT);
  }

  return persons;
}

// =============================================================================
// Combined Filter
// =============================================================================

export interface FilteredTimelineData {
  eras: Era[];
  events: HistoricalEvent[];
  reigns: Reign[];
  persons: Person[];
}

export interface TimelineDataInput {
  eras: Era[];
  events: HistoricalEvent[];
  reigns: Reign[];
  persons: Person[];
}

/**
 * 全データを一括フィルタリング
 */
export function filterTimelineData(
  data: TimelineDataInput,
  config: LayerFilterConfig
): FilteredTimelineData {
  return {
    eras: filterEras(data.eras, config),
    events: filterEvents(data.events, config),
    reigns: filterReigns(data.reigns, config),
    persons: filterPersons(data.persons, config),
  };
}

// =============================================================================
// Utility
// =============================================================================

/**
 * Free版での残り表示可能数を計算
 */
export function getRemainingCount(
  currentCount: number,
  layerType: 'emperor' | 'shogun' | 'person',
  proUnlocked: boolean
): { remaining: number; limit: number; isLimited: boolean } {
  if (proUnlocked) {
    return { remaining: Infinity, limit: Infinity, isLimited: false };
  }

  const limits: Record<string, number> = {
    emperor: FREE_EMPEROR_LIMIT,
    shogun: FREE_SHOGUN_LIMIT,
    person: FREE_PERSON_LIMIT,
  };

  const limit = limits[layerType] ?? 0;
  const remaining = Math.max(0, limit - currentCount);

  return {
    remaining,
    limit,
    isLimited: currentCount >= limit,
  };
}

/**
 * レイヤーが Pro 限定かどうか判定
 */
export function isProOnlyLayer(layerType: LayerType): boolean {
  // 時代とイベントは無料、天皇/将軍/人物は制限あり
  return layerType === 'emperor' || layerType === 'shogun' || layerType === 'person';
}

export default {
  filterEras,
  filterEvents,
  filterReigns,
  filterPersons,
  filterTimelineData,
  getRemainingCount,
  isProOnlyLayer,
  FREE_EMPEROR_LIMIT,
  FREE_SHOGUN_LIMIT,
  FREE_PERSON_LIMIT,
};
