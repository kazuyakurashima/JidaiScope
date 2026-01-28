/**
 * haptics.ts - ハプティクスフィードバック
 * Sprint 2: 025 Haptics Feedback
 *
 * 発火タイミング:
 * - 時代境界通過: Light impact
 * - LOD レベル変更: Selection（シンプルな触感）
 * - Era Picker タップ: Selection
 * - ダブルタップズーム: Medium impact
 *
 * 設定: settingsStore.hapticEnabled で ON/OFF 制御
 */

import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/stores/settingsStore';
import type { LODLevel } from '@/types/store';

// ハプティクスの種類
export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

// 計測結果の型
export interface HapticMeasurement {
  type: HapticType;
  startTime: number;
  endTime: number;
  duration: number; // -1 = 失敗
  success: boolean;
}

// 計測ログ保存用
const measurements: HapticMeasurement[] = [];

/**
 * ハプティクス発火（計測付き）
 * @param type ハプティクスの種類
 * @returns 発火にかかった時間（ms）、失敗時は -1、無効時は 0
 *
 * Note: シミュレータや非対応端末では失敗する可能性があるため、
 * try/catch で例外を吸収し、LOD 更新をブロックしない
 */
export async function triggerHaptic(type: HapticType): Promise<number> {
  // Check if haptics is enabled in settings
  const { hapticEnabled } = useSettingsStore.getState();
  if (!hapticEnabled) {
    return 0;
  }

  const startTime = globalThis.performance?.now?.() ?? Date.now();
  let success = true;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // シミュレータや非対応端末では失敗する可能性がある
    success = false;
  }

  const endTime = globalThis.performance?.now?.() ?? Date.now();
  const duration = success ? endTime - startTime : -1;

  // 計測結果を保存
  measurements.push({
    type,
    startTime,
    endTime,
    duration,
    success,
  });

  return duration;
}

/**
 * LOD 切替時のハプティクス
 * PRD仕様: LODレベル変更時は Selection feedback（デフォルトON）
 */
export async function triggerLODHaptic(
  fromLevel: LODLevel,
  toLevel: LODLevel
): Promise<number> {
  // 変化なしの場合はスキップ
  if (fromLevel === toLevel) {
    return 0;
  }

  // LOD変更は常に Selection feedback
  return triggerHaptic('selection');
}

/**
 * 時代境界通過時のハプティクス（Light impact）
 */
export async function triggerEraBoundaryHaptic(): Promise<number> {
  return triggerHaptic('light');
}

/**
 * ブックマーク追加時のハプティクス
 */
export async function triggerBookmarkHaptic(): Promise<number> {
  return triggerHaptic('success');
}

/**
 * 計測結果の統計を取得
 */
export function getHapticStats(): {
  count: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  under50msRate: number;
  successRate: number;
} {
  if (measurements.length === 0) {
    return {
      count: 0,
      successCount: 0,
      failureCount: 0,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: 0,
      under50msRate: 0,
      successRate: 0,
    };
  }

  const successMeasurements = measurements.filter((m) => m.success);
  const successDurations = successMeasurements.map((m) => m.duration);

  if (successDurations.length === 0) {
    return {
      count: measurements.length,
      successCount: 0,
      failureCount: measurements.length,
      averageDuration: -1,
      maxDuration: -1,
      minDuration: -1,
      under50msRate: 0,
      successRate: 0,
    };
  }

  const sum = successDurations.reduce((a, b) => a + b, 0);
  const under50ms = successDurations.filter((d) => d < 50).length;

  return {
    count: measurements.length,
    successCount: successMeasurements.length,
    failureCount: measurements.length - successMeasurements.length,
    averageDuration: sum / successDurations.length,
    maxDuration: Math.max(...successDurations),
    minDuration: Math.min(...successDurations),
    under50msRate: (under50ms / successDurations.length) * 100,
    successRate: (successMeasurements.length / measurements.length) * 100,
  };
}

/**
 * 計測結果をリセット
 */
export function resetHapticStats(): void {
  measurements.length = 0;
}

/**
 * 全計測結果を取得
 */
export function getAllMeasurements(): HapticMeasurement[] {
  return [...measurements];
}

export default {
  triggerHaptic,
  triggerLODHaptic,
  triggerEraBoundaryHaptic,
  triggerBookmarkHaptic,
  getHapticStats,
  resetHapticStats,
  getAllMeasurements,
};
