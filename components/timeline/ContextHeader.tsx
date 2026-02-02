/**
 * ContextHeader - 現在位置表示ヘッダー
 * Sprint 3: 039 Context Header
 *
 * 画面上部に現在表示中の時代・年代・在位者を常時表示。
 * LODレベルに応じて表示情報量を調整。
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

import type { Era, Reign } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineStore } from '@/stores';
import {
  pixelToYear,
  type CoordinateConfig,
} from '@/domain/timeline/coordinateSystem';
import { formatYear } from '@/utils/formatYear';
import { seirekiToWakaAsync } from '@/utils/wakaCalendar';

// =============================================================================
// Types
// =============================================================================

interface ContextHeaderProps {
  eras: Era[];
  reigns: Reign[];
}

// =============================================================================
// Constants
// =============================================================================

const HEADER_HEIGHT = 44;

// 画面幅の閾値（039仕様: オーバーフロー/省略ルール）
const SCREEN_WIDTH_SE = 320;  // iPhone SE - 和暦非表示、在位者省略可能
const SCREEN_WIDTH_MD = 375;  // iPhone 13 - 在位者省略可能

// =============================================================================
// Helper: 時代検索の最適化
// =============================================================================

/**
 * 時代を事前ソート（短い順 = より具体的な時代を優先）
 */
function useEraByYear(eras: Era[]) {
  return useMemo(() => {
    const sorted = [...eras].sort(
      (a, b) => (a.endYear - a.startYear) - (b.endYear - b.startYear)
    );
    return sorted;
  }, [eras]);
}

/**
 * 年から時代を検索（キャッシュ付き最適化版）
 * 前回の結果をキャッシュし、同じ時代内ならO(1)で返す
 */
function useFindEraByYear(sortedEras: Era[], year: number): Era | null {
  const lastEraRef = useRef<Era | null>(null);

  return useMemo(() => {
    // キャッシュヒット: 前回と同じ時代内ならそのまま返す
    const lastEra = lastEraRef.current;
    if (lastEra && year >= lastEra.startYear && year < lastEra.endYear) {
      return lastEra;
    }

    // 新規検索
    for (const era of sortedEras) {
      if (year >= era.startYear && year < era.endYear) {
        lastEraRef.current = era;
        return era;
      }
    }

    lastEraRef.current = null;
    return null;
  }, [sortedEras, year]);
}

/**
 * 色のコントラスト判定（堅牢化版）
 * 6桁Hex以外はデフォルト色にフォールバック
 */
function getContrastColor(bgColor: string | null, defaultColor: string): string {
  if (!bgColor || !bgColor.startsWith('#')) {
    return defaultColor;
  }

  const hex = bgColor.slice(1);

  // 6桁Hexのみ対応
  if (hex.length !== 6) {
    return defaultColor;
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // NaNチェック
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return defaultColor;
  }

  // 輝度計算（ITU-R BT.709）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1A1A1A' : '#FFFFFF';
}

// =============================================================================
// Component
// =============================================================================

export function ContextHeader({ eras, reigns }: ContextHeaderProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { colors } = useTheme();

  const scrollX = useTimelineStore((s) => s.scrollX);
  const zoomLevel = useTimelineStore((s) => s.zoomLevel);
  const lodLevel = useTimelineStore((s) => s.lodLevel);

  // 和暦の状態（非同期取得）
  const [wareki, setWareki] = useState<string | null>(null);
  const lastCenterYearRef = useRef<number | null>(null);
  const warekiRequestIdRef = useRef(0); // キャンセル用

  // 事前ソート済み時代リスト
  const sortedEras = useEraByYear(eras);

  // 画面中央の年を計算
  const centerYear = useMemo(() => {
    const config: CoordinateConfig = {
      screenWidth,
      screenHeight,
      zoomLevel,
      scrollX,
    };
    const centerPixelX = screenWidth / 2;
    return Math.round(pixelToYear(centerPixelX, config));
  }, [scrollX, zoomLevel, screenWidth, screenHeight]);

  // 現在の時代を特定（キャッシュ付き）
  const currentEra = useFindEraByYear(sortedEras, centerYear);

  // 現在の天皇を特定
  const currentEmperor = useMemo(() => {
    return reigns.find(
      (r) =>
        r.officeType === 'emperor' &&
        centerYear >= r.startYear &&
        centerYear < r.endYear
    );
  }, [reigns, centerYear]);

  // 現在の将軍を特定
  const currentShogun = useMemo(() => {
    return reigns.find(
      (r) =>
        r.officeType === 'shogun' &&
        centerYear >= r.startYear &&
        centerYear < r.endYear
    );
  }, [reigns, centerYear]);

  // L3: 和暦を非同期で取得（全時代対応）
  useEffect(() => {
    if (lodLevel >= 3 && centerYear > 0) {
      // 同じ年なら再計算しない
      if (lastCenterYearRef.current === centerYear) return;
      lastCenterYearRef.current = centerYear;

      // リクエストIDでキャンセル管理
      const requestId = ++warekiRequestIdRef.current;

      // 非同期で和暦を取得（全時代対応）
      seirekiToWakaAsync(centerYear).then((result) => {
        // 最新のリクエストのみ適用
        if (requestId === warekiRequestIdRef.current) {
          setWareki(result);
        }
      });
    } else {
      setWareki(null);
      lastCenterYearRef.current = null;
    }
  }, [lodLevel, centerYear]);

  // 画面幅に応じた表示制御（039仕様: オーバーフロー/省略ルール）
  // 省略優先度: 在位者 > 和暦 > 年代 > 時代名（時代名は常に表示）
  const isSmallScreen = screenWidth <= SCREEN_WIDTH_SE;  // <=320: 在位者省略、和暦非表示
  const isMediumScreen = screenWidth <= SCREEN_WIDTH_MD; // <=375: 在位者省略可能

  // LODに応じた年表示
  const yearDisplay = useMemo(() => {
    if (lodLevel < 1) return null;

    if (lodLevel >= 3) {
      // L3: 正確な年 + 和暦（320px以下は和暦非表示）
      const yearText = formatYear(centerYear);
      if (wareki && !isSmallScreen) {
        return `${yearText}（${wareki}）`;
      }
      return yearText;
    }

    // L1-L2: 100年単位に丸める
    const roundedYear = Math.round(centerYear / 100) * 100;
    return `${formatYear(roundedYear)}頃`;
  }, [lodLevel, centerYear, wareki, isSmallScreen]);

  // L2: 代表者表示（天皇優先、なければ将軍）
  // L3: 天皇と将軍の両方
  const reignDisplay = useMemo(() => {
    if (lodLevel < 2) return null;

    // 狭い画面では在位者を表示しない
    if (isSmallScreen) return null;

    const parts: string[] = [];

    if (lodLevel >= 3) {
      // L3: 両方表示
      if (currentEmperor?.name) {
        parts.push(`👑${currentEmperor.name}`);
      }
      if (currentShogun?.name) {
        parts.push(`⚔${currentShogun.name}`);
      }
    } else {
      // L2: 代表1名（天皇優先、なければ将軍）
      if (currentEmperor?.name) {
        parts.push(`👑${currentEmperor.name}`);
      } else if (currentShogun?.name) {
        parts.push(`⚔${currentShogun.name}`);
      }
    }

    return parts.length > 0 ? parts.join(' ') : null;
  }, [lodLevel, currentEmperor, currentShogun, isSmallScreen]);

  // 時代名のテキストカラー（コントラスト確保・堅牢化）
  const eraTextColor = useMemo(() => {
    return getContrastColor(currentEra?.color ?? null, colors.text);
  }, [currentEra?.color, colors.text]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
      {/* 時代名カード（視覚的強調・最優先で表示） */}
      <View
        style={[
          styles.eraCard,
          { backgroundColor: currentEra?.color ?? colors.primary }
        ]}
      >
        <Text style={styles.eraIcon}>🏯</Text>
        <Text style={[styles.eraName, { color: eraTextColor }]} numberOfLines={1}>
          {currentEra?.name ?? '不明'}
        </Text>
      </View>

      {/* 年代（L1以上、時代名の次に優先） */}
      {yearDisplay && (
        <>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Text
            style={[styles.yearText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {yearDisplay}
          </Text>
        </>
      )}

      {/* 天皇・将軍（L2以上、省略優先度最低） */}
      {reignDisplay && (
        <>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Text
            style={[styles.reignText, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {reignDisplay}
          </Text>
        </>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // 時代名カード（視覚的強調・縮小しない）
  eraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 120,
    flexShrink: 0,
    // 微細なシャドウで浮き上がり効果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  eraIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  eraName: {
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
  },
  yearText: {
    fontSize: 13,
    flexShrink: 1,
    minWidth: 50,
  },
  reignText: {
    fontSize: 13,
    flex: 1,
  },
});
