/**
 * Era Chip Row - 可変幅時代チップ行
 * Sprint 3: 038 EraPickerBar Redesign
 *
 * 時代名の長さに応じた可変幅チップを横スクロールで表示。
 * 時代変化時に自動スクロール（037統合）。
 */

import { useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';

import type { Era } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';

// =============================================================================
// Types
// =============================================================================

interface EraChipRowProps {
  eras: Era[];
  currentEraId: string | null;
  onEraPress: (era: Era) => void;
}

// =============================================================================
// Constants
// =============================================================================

/** チップの最小幅（px）- 038仕様に準拠 */
const MIN_CHIP_WIDTH = 60;

/** チップの高さ（Apple HIG準拠: 最小タップターゲット44px） */
const CHIP_HEIGHT = 44;

/** 時代名の短縮マッピング（長い時代名用） */
const ERA_SHORT_NAMES: Record<string, string> = {
  安土桃山: '安土',
};

/** 時代の表示名を取得（短縮名があれば使用） */
function getEraDisplayName(name: string): string {
  return ERA_SHORT_NAMES[name] ?? name;
}

// =============================================================================
// Component
// =============================================================================

export function EraChipRow({ eras, currentEraId, onEraPress }: EraChipRowProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const prevEraIdRef = useRef<string | null>(null);
  const chipLayoutsRef = useRef<Map<string, { x: number; width: number }>>(new Map());

  // チップのレイアウト情報を記録
  const handleChipLayout = (eraId: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    chipLayoutsRef.current.set(eraId, { x, width });
  };

  // 時代変化時の自動スクロール（037の機能を統合）
  useEffect(() => {
    if (!scrollViewRef.current) return;
    if (currentEraId === prevEraIdRef.current) return;
    prevEraIdRef.current = currentEraId;

    if (!currentEraId) return;

    // レイアウト情報から該当チップの位置を取得
    const chipLayout = chipLayoutsRef.current.get(currentEraId);
    if (chipLayout) {
      scrollViewRef.current.scrollTo({
        x: Math.max(0, chipLayout.x - 100), // 少し余裕を持たせる
        animated: true,
      });
    } else {
      // フォールバック: インデックスベースで概算
      const eraIndex = eras.findIndex((e) => e.id === currentEraId);
      if (eraIndex >= 0) {
        // 概算: 平均幅60px + gap 6px
        const estimatedOffset = eraIndex * 66;
        scrollViewRef.current.scrollTo({
          x: Math.max(0, estimatedOffset - 100),
          animated: true,
        });
      }
    }
  }, [currentEraId, eras]);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipContainer}
    >
      {eras.map((era) => {
        const isCurrent = era.id === currentEraId;
        const eraColor = era.color ?? colors.primary;

        return (
          <Pressable
            key={era.id}
            onPress={() => onEraPress(era)}
            onLayout={(event) => handleChipLayout(era.id, event)}
            accessibilityRole="button"
            accessibilityLabel={`${era.name}時代`}
            accessibilityHint="タップしてこの時代にジャンプ"
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isCurrent ? eraColor : 'transparent',
                borderColor: eraColor,
                opacity: pressed ? 0.7 : 1,
              },
              // 現在時代の強調（シャドウ + 微細スケール）
              isCurrent && {
                shadowColor: eraColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 4,
                transform: [{ scale: 1.05 }],
              },
            ]}
          >
            {/* 時代名（短縮名対応） */}
            <Text
              style={[
                styles.chipText,
                { color: isCurrent ? colors.bg : colors.text },
              ]}
            >
              {getEraDisplayName(era.name)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  chipContainer: {
    paddingHorizontal: 8,
    gap: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chip: {
    minWidth: MIN_CHIP_WIDTH,
    height: CHIP_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 22,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
