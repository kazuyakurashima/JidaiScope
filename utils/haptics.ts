/**
 * haptics.ts - Sprint 0 Day 2 PoC
 *
 * 検証項目:
 * - ハプティクス応答時間 < 50ms
 * - Light/Medium/Heavy impact の使い分け
 * - LOD 切替時の触覚フィードバック
 */

import * as Haptics from 'expo-haptics';

// ハプティクスの種類
export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

// LOD レベル定義
export type LODLevel = 0 | 1 | 2 | 3;

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
 * @returns 発火にかかった時間（ms）、失敗時は -1
 *
 * Note: シミュレータや非対応端末では失敗する可能性があるため、
 * try/catch で例外を吸収し、LOD 更新をブロックしない
 */
export async function triggerHaptic(type: HapticType): Promise<number> {
  const startTime = performance.now();
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

  const endTime = performance.now();
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
 * - L0 → L1: Light（ズームイン開始）
 * - L1 → L2: Medium（詳細表示開始）
 * - L2 → L3: Heavy（最大詳細）
 * - 逆方向: Selection（軽い触感）
 */
export async function triggerLODHaptic(
  fromLevel: LODLevel,
  toLevel: LODLevel
): Promise<number> {
  // ズームイン（詳細化）
  if (toLevel > fromLevel) {
    const diff = toLevel - fromLevel;
    if (diff >= 2) {
      // 2段階以上のジャンプ
      return triggerHaptic('heavy');
    } else if (toLevel === 3) {
      // L3 到達
      return triggerHaptic('medium');
    } else {
      return triggerHaptic('light');
    }
  }

  // ズームアウト（広域化）
  if (toLevel < fromLevel) {
    return triggerHaptic('selection');
  }

  // 変化なし
  return 0;
}

/**
 * 時代境界通過時のハプティクス
 */
export async function triggerEraBoundaryHaptic(): Promise<number> {
  return triggerHaptic('medium');
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
