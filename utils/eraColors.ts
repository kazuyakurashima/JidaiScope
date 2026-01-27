/**
 * Era Colors Utility - 時代別カラー取得
 * Sprint 1: 015 Design Tokens
 */

import { ERA_COLORS, type EraId } from '@/constants/tokens';

const FALLBACK_COLOR = '#A0AEC0';

/**
 * 時代IDからカラーを取得
 * @param eraId 時代ID（jomon, yayoi, etc.）
 * @returns カラーコード
 */
export function getEraColor(eraId: string): string {
  if (eraId in ERA_COLORS) {
    return ERA_COLORS[eraId as EraId];
  }
  return FALLBACK_COLOR;
}

/**
 * 時代カラーを半透明で取得（背景用）
 * @param eraId 時代ID
 * @param opacity 透明度（0-1、範囲外は自動クランプ）
 * @returns rgba カラー文字列
 */
export function getEraColorWithOpacity(eraId: string, opacity: number): string {
  const hex = getEraColor(eraId);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // opacity を 0-1 の範囲にクランプ
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
}

/**
 * 全時代のカラーリストを取得
 */
export function getAllEraColors(): Array<{ id: EraId; color: string }> {
  return (Object.entries(ERA_COLORS) as Array<[EraId, string]>).map(
    ([id, color]) => ({ id, color })
  );
}

/**
 * 時代IDが有効かどうかを判定
 */
export function isValidEraId(eraId: string): eraId is EraId {
  return eraId in ERA_COLORS;
}
