# 038: EraPickerBar Redesign（Sprint 3）

## 概要

**目的:** EraPickerBarのナビゲーション性を改善し、全時代へのアクセスを均等化する

**スコープ:**

- 可変幅チップナビゲーション（時代名の長さに応じた幅、真比率から変更）
- 真比率ミニマップ（現在位置インジケーター）
- 037 EraPickerBar Sync の機能を統合（自動スクロール）
- 将来の世界史連携に備えた設計

**成功基準:**

- [x] 全ての時代名が読み取れる形で表示される（長い時代名は短縮可: 安土桃山→安土）
- [x] ミニマップで真比率と現在位置が視覚化される
- [x] 時代変化時に自動スクロールが動作する
- [ ] パフォーマンス: 60fps維持

---

## ユーザーストーリー

```
As a ユーザー
I want to 全ての時代に均等にアクセスしたい
So that 短い時代（安土桃山、大正など）も見つけやすい
```

---

## 受け入れ条件

| #   | 条件                                                          | 検証方法     |
| --- | ------------------------------------------------------------- | ------------ |
| 1   | 全時代名が省略なしで表示される（numberOfLines制限解除）       | UI確認       |
| 2   | 各チップは高さ44px（Apple HIG準拠）、幅は時代名に応じて可変   | UI確認       |
| 3   | ミニマップは高さ8px、opacity 0.8、hitSlop拡張でタップ精度確保 | UI確認       |
| 4   | チップタップで該当時代へスムーズジャンプ                      | 実機テスト   |
| 5   | ミニマップタップでも該当位置へジャンプ                        | 実機テスト   |
| 6   | 時代変化時にチップが自動スクロール（037の機能）               | 実機テスト   |
| 7   | 同期ループが発生しない（store.scrollX がSSOT）                | デバッグログ |
| 8   | 現在時代チップにシャドウ + 微細スケール（1.05x）で強調        | UI確認       |
| 9   | チップ行とミニマップ間に4pxセパレーター                       | UI確認       |

---

## 依存関係

| 種類             | 詳細                                       |
| ---------------- | ------------------------------------------ |
| ✓ 入力依存       | 023 (Era Picker)                           |
| ✓ 統合           | 037 (EraPickerBar Sync) - 本チケットに統合 |
| ✗ 他チケット依存 | なし                                       |
| ✓ 出力依存       | 044 (中国王朝連携) - v1.5で2段化対応       |

---

## ワイヤーフレーム

### 現状（問題あり）

```
┌─────────────────────────────────────────────────────────────┐
│ [━━━━━━━縄文━━━━━━━][弥生][古墳]...[安土...][江戸]...[令和] │  ← 真比率、縄文が長すぎ
└─────────────────────────────────────────────────────────────┘
                                    ↑ 省略される
```

### 提案（2層構造）

```
┌────────────────────────────────────────────────────────────┐
│ [縄文][弥生][古墳][飛鳥][奈良][平安][鎌倉][室町][戦国][安土桃山][江戸][明治][大正][昭和][平成][令和] │
├────────────────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░▼░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└────────────────────────────────────────────────────────────┘
  ↑ 可変幅チップ（文字数ベース、横スクロール）  ↑ 真比率ミニマップ + 現在位置
```

### 将来（v1.5: 世界史連携時）

```
┌──────────────────────────────────────────┐
│ 🇯🇵 [縄文][弥生]...[令和]                 │  ← 日本（常時表示）
│ 🇨🇳 [殷][周][秦][漢]...[清][中華人民]     │  ← 中国（Pro選択時）
├──────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓░░░░░░░▼░░░░░░░░░░░░░░░░░░░░░  │  ← ミニマップ
└──────────────────────────────────────────┘
```

---

## 実装ガイドライン

### 1. コンポーネント構成

```
components/timeline/
├── EraPickerBar.tsx          # メインコンポーネント（改修）
├── EraChipRow.tsx            # 可変幅チップ行（新規）
└── MiniMap.tsx               # 真比率ミニマップ（新規）
```

### 2. EraChipRow（可変幅チップ）

```typescript
// components/timeline/EraChipRow.tsx
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import type { Era } from '@/types/database';

interface EraChipRowProps {
  eras: Era[];
  currentEraId: string | null;
  onEraPress: (era: Era) => void;
}

// チップの最小幅（時代名が収まる幅）
const MIN_CHIP_WIDTH = 60;
const CHIP_PADDING = 12;
const CHIP_HEIGHT = 44; // Apple HIG準拠（タップターゲット最小44px）

export function EraChipRow({ eras, currentEraId, onEraPress }: EraChipRowProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const prevEraIdRef = useRef<string | null>(null);

  // チップ幅を計算（時代名の長さに応じて可変、最小60px）
  const chipWidths = useMemo(() => {
    return eras.map((era) => {
      // 日本語1文字あたり約14px、パディング含む
      const textWidth = era.name.length * 14 + CHIP_PADDING * 2;
      return Math.max(MIN_CHIP_WIDTH, textWidth);
    });
  }, [eras]);

  // 時代変化時の自動スクロール（037の機能を統合）
  useEffect(() => {
    if (!scrollViewRef.current) return;
    if (currentEraId === prevEraIdRef.current) return;
    prevEraIdRef.current = currentEraId;

    const eraIndex = eras.findIndex((e) => e.id === currentEraId);
    if (eraIndex < 0) return;

    // 該当チップまでのオフセットを計算
    let offset = 0;
    for (let i = 0; i < eraIndex; i++) {
      offset += chipWidths[i];
    }

    scrollViewRef.current.scrollTo({
      x: Math.max(0, offset - 100), // 少し余裕を持たせる
      animated: true,
    });
  }, [currentEraId, eras, chipWidths]);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipContainer}
    >
      {eras.map((era, index) => {
        const isCurrent = era.id === currentEraId;
        const eraColor = era.color ?? '#4A5568';

        return (
          <Pressable
            key={era.id}
            onPress={() => onEraPress(era)}
            accessibilityRole="button"
            accessibilityLabel={`${era.name}時代`}
            accessibilityHint="タップしてこの時代にジャンプ"
            style={({ pressed }) => [
              styles.chip,
              {
                width: chipWidths[index],
                backgroundColor: isCurrent ? eraColor : 'rgba(255, 255, 255, 0.05)',
                borderColor: eraColor,
                opacity: pressed ? 0.7 : 1,
                // 現在時代の強調（シャドウ + 微細スケール）
                ...(isCurrent && {
                  shadowColor: eraColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                  elevation: 4,
                  transform: [{ scale: 1.05 }],
                }),
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isCurrent ? '#FFFFFF' : '#E2E8F0' },
              ]}
            >
              {era.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    paddingHorizontal: 8,
    gap: 6,
    paddingVertical: 8,
  },
  chip: {
    height: CHIP_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
```

### 3. MiniMap（真比率ミニマップ）

```typescript
// components/timeline/MiniMap.tsx
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { Era } from '@/types/database';
import { TIMELINE_START_YEAR, TOTAL_YEARS } from '@/domain/timeline/coordinateSystem';

interface MiniMapProps {
  eras: Era[];
  scrollX: number;
  zoomLevel: number;
  onPositionPress: (year: number) => void;
}

const MINIMAP_HEIGHT = 8;
const MINIMAP_HIT_SLOP = { top: 18, bottom: 18, left: 0, right: 0 }; // タップ精度向上

export function MiniMap({ eras, scrollX, zoomLevel, onPositionPress }: MiniMapProps) {
  const { width: screenWidth } = useWindowDimensions();

  // 現在表示範囲を計算
  const visibleRatio = 1 / zoomLevel;
  const scrollRatio = -scrollX / (screenWidth * (zoomLevel - 1));
  const indicatorWidth = Math.max(4, screenWidth * visibleRatio);
  const indicatorX = scrollRatio * (screenWidth - indicatorWidth);

  const handlePress = (event: { nativeEvent: { locationX: number } }) => {
    const tapX = event.nativeEvent.locationX;
    const tapRatio = tapX / screenWidth;
    const targetYear = TIMELINE_START_YEAR + TOTAL_YEARS * tapRatio;
    onPositionPress(targetYear);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.container}
      hitSlop={MINIMAP_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel="タイムラインミニマップ"
      accessibilityHint="タップして任意の位置にジャンプ"
    >
      {/* 時代背景（真比率） */}
      {eras.map((era) => {
        const startRatio = (era.startYear - TIMELINE_START_YEAR) / TOTAL_YEARS;
        const endRatio = (era.endYear - TIMELINE_START_YEAR) / TOTAL_YEARS;
        const width = (endRatio - startRatio) * screenWidth;
        const left = startRatio * screenWidth;

        return (
          <View
            key={era.id}
            style={[
              styles.eraSegment,
              {
                left,
                width: Math.max(1, width),
                backgroundColor: era.color ?? '#4A5568',
              },
            ]}
          />
        );
      })}

      {/* 現在位置インジケーター */}
      <View
        style={[
          styles.indicator,
          {
            left: Math.max(0, Math.min(screenWidth - indicatorWidth, indicatorX)),
            width: indicatorWidth,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MINIMAP_HEIGHT,
    backgroundColor: '#1A202C',
    position: 'relative',
    overflow: 'hidden',
  },
  eraSegment: {
    position: 'absolute',
    top: 0,
    height: MINIMAP_HEIGHT,
    opacity: 0.8,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: MINIMAP_HEIGHT,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
    borderRadius: 2,
  },
});
```

### 4. EraPickerBar 統合

```typescript
// components/timeline/EraPickerBar.tsx（改修）
import { View, StyleSheet } from 'react-native';
import type { Era } from '@/types/database';
import { useTimelineStore } from '@/stores/timelineStore';
import { EraChipRow } from './EraChipRow';
import { MiniMap } from './MiniMap';
import { triggerHaptic } from '@/utils/haptics';
import {
  getPixelsPerYear,
  clampScrollX,
  TIMELINE_START_YEAR,
} from '@/domain/timeline/coordinateSystem';

interface EraPickerBarProps {
  eras: Era[];
}

export function EraPickerBar({ eras }: EraPickerBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollX = useTimelineStore((s) => s.scrollX);
  const zoomLevel = useTimelineStore((s) => s.zoomLevel);
  const setScroll = useTimelineStore((s) => s.setScroll);

  // 現在の時代を計算（037から移植）
  const currentEraId = useMemo(() => {
    const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
    const centerYear = (screenWidth / 2 - scrollX) / pixelsPerYear + TIMELINE_START_YEAR;

    const matchingEras = eras.filter(
      (e) => centerYear >= e.startYear && centerYear < e.endYear
    );

    if (matchingEras.length === 0) return null;

    // 最も短い時代を優先（より具体的な時代）
    matchingEras.sort(
      (a, b) => (a.endYear - a.startYear) - (b.endYear - b.startYear)
    );

    return matchingEras[0].id;
  }, [eras, scrollX, zoomLevel, screenWidth]);

  // 時代タップ時のジャンプ処理
  const handleEraPress = useCallback((era: Era) => {
    void triggerHaptic('selection');

    const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
    const targetScrollX = -((era.startYear - TIMELINE_START_YEAR) * pixelsPerYear);
    const clampedTarget = clampScrollX(targetScrollX, screenWidth, zoomLevel);

    // アニメーション付きスクロール（既存のjumpToEraロジックを流用）
    setScroll(clampedTarget);
  }, [screenWidth, zoomLevel, setScroll]);

  // ミニマップタップ時のジャンプ処理
  const handlePositionPress = useCallback((targetYear: number) => {
    void triggerHaptic('light');

    const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
    const targetScrollX = -((targetYear - TIMELINE_START_YEAR) * pixelsPerYear) + screenWidth / 2;
    const clampedTarget = clampScrollX(targetScrollX, screenWidth, zoomLevel);

    setScroll(clampedTarget);
  }, [screenWidth, zoomLevel, setScroll]);

  return (
    <View style={styles.container}>
      <EraChipRow
        eras={eras}
        currentEraId={currentEraId}
        onEraPress={handleEraPress}
      />
      {/* セパレーター（誤タップ防止） */}
      <View style={styles.separator} />
      <MiniMap
        eras={eras}
        scrollX={scrollX}
        zoomLevel={zoomLevel}
        onPositionPress={handlePositionPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  separator: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
```

---

## 世界史連携対応の設計（v1.5向け）

### 拡張可能なインターフェース

```typescript
// types/timeline.ts
interface EraPickerBarProps {
  primaryCountry: "japan"; // 常に日本
  secondaryCountry?: "china" | "usa" | "uk" | null; // Pro選択
  eras: {
    japan: Era[];
    china?: Era[];
    usa?: Era[];
    uk?: Era[];
  };
}
```

### 2段化時の構造

```typescript
// v1.5での実装イメージ
<View style={styles.container}>
  <EraChipRow country="japan" eras={eras.japan} ... />
  {secondaryCountry && (
    <EraChipRow country={secondaryCountry} eras={eras[secondaryCountry]} ... />
  )}
  <MiniMap ... />
</View>
```

---

## UI/UX デザインガイドライン（v4.1追加）

### タップターゲット最適化（Apple HIG準拠）

| 要素              | 推奨サイズ   | 理由                                  |
| ----------------- | ------------ | ------------------------------------- |
| チップ高さ        | 44px         | Apple HIG最小タップターゲット         |
| ミニマップhitSlop | 上下18px追加 | 視覚的には8pxだがタップ可能領域は44px |

### 現在時代の視覚的強調

```typescript
// 現在時代チップのスタイル
const currentChipStyle = {
  backgroundColor: eraColor,
  shadowColor: eraColor,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 4,
  elevation: 4,
  transform: [{ scale: 1.05 }], // 微細なスケールアップ
};
```

### アクセシビリティ

- 全チップに `accessibilityRole="button"` を設定
- `accessibilityLabel` で時代名を読み上げ
- `accessibilityHint` で操作の結果を説明
- ミニマップにも適切なラベルを設定

### 誤タップ防止

- チップ行とミニマップの間に4pxセパレーターを配置
- hitSlopを使用してタップ可能領域を拡大（視覚的サイズは維持）

---

## Todo リスト

### Phase 1: コンポーネント分割

- [x] `EraChipRow.tsx` 新規作成
- [x] `MiniMap.tsx` 新規作成
- [x] `EraPickerBar.tsx` を統合コンポーネントに改修

### Phase 2: 可変幅チップ（文字数ベース）

- [x] チップ幅計算ロジック実装（minWidth + paddingHorizontal でテキストに追従）
- [x] 時代名の省略を解除（numberOfLines削除）
- [x] 現在時代のハイライトスタイル（シャドウ + scale 1.05x）

### Phase 3: ミニマップ

- [x] 時代背景の真比率描画
- [x] 現在位置インジケーター
- [x] タップでジャンプ機能（スムーズアニメーション）

### Phase 4: 037統合（自動スクロール）

- [x] `currentEraId` の計算を移植
- [x] 時代変化時の自動スクロール（onLayoutベースの位置追跡）
- [x] 同期ループ回避の確認

### Phase 5: テスト

- [ ] 全時代が読み取れる形で表示されることを確認（安土桃山→安土の短縮含む）
- [ ] ミニマップの位置が正確であることを確認
- [ ] 時代ジャンプが正常に動作することを確認
- [ ] パフォーマンス確認（60fps維持）

---

## ファイル構成

```
components/timeline/
├── EraPickerBar.tsx         # 統合コンポーネント（改修）
├── EraChipRow.tsx           # 均等幅チップ行（新規）
├── MiniMap.tsx              # 真比率ミニマップ（新規）
└── index.ts                 # エクスポート更新
```

---

## リスク・考慮事項

- **パフォーマンス:** ミニマップの再描画頻度に注意。`scrollX` は高頻度更新のため、必要最小限の再レンダリングに抑える
- **アクセシビリティ:** ミニマップはタップターゲットが小さいため、チップ操作を主とする設計
- **将来拡張:** v1.5の2段化を見据え、コンポーネントを分割して設計

---

**作成日:** 2026-01-31
**更新日:** 2026-01-31
**優先度:** P0
**推定工数:** 1.5d
**ステータス:** In Progress (Phase 5 テスト待ち)
**ブロッカー:** 023 (Era Picker) ✅
**統合元:** 037 (EraPickerBar Sync)

---

## 変更履歴

### v4.2 (2026-01-31)

- 用語修正: 「均等幅」→「可変幅」（時代名の長さに応じた幅で、均等ではない）
- 設計意図の明確化: 旧設計「真比率」→ 新設計「文字数ベース可変幅」

### v4.1 (2026-01-31)

- UI/UX改善: チップ高さ36px→44px（Apple HIG準拠）
- UI/UX改善: ミニマップ高さ6px→8px、opacity 0.6→0.8
- UI/UX改善: 現在時代チップにシャドウ + 微細スケール追加
- UI/UX改善: チップ行とミニマップ間にセパレーター追加
- アクセシビリティ: accessibilityRole/Label/Hint追加
- 受け入れ条件 #8, #9 追加
