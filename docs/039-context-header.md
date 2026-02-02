# 039: Context Header（Sprint 3）

## 概要

**目的:** 画面上部に現在表示中の時代・年代・在位者を常時表示し、ユーザーが「今どこを見ているか」を直感的に把握できるようにする

**スコープ:**

- 現在位置情報の常時表示
- LODレベルに応じた表示情報の増減
- リアルタイム更新（60fps対応）
- 将来の世界史連携に備えた設計

**成功基準:**

- [x] 現在の時代名が常に表示される
- [x] LODに応じて年代・天皇・将軍情報が追加される
- [x] スクロールに追従してリアルタイム更新
- [x] パフォーマンス: 60fps維持

---

## ユーザーストーリー

```
As a ユーザー
I want to 現在どの時代を見ているか常に把握したい
So that 歴史的な文脈を理解しながらタイムラインを探索できる
```

---

## 受け入れ条件

| #   | 条件                                                            | 検証方法            |
| --- | --------------------------------------------------------------- | ------------------- |
| 1   | 現在の時代名が常に表示される                                    | UI確認              |
| 2   | L0: 時代名のみ表示                                              | LOD切替テスト       |
| 3   | L1: 時代名 + 年代（100年単位）表示                              | LOD切替テスト       |
| 4   | L2: 時代名 + 年代 + 天皇or将軍（代表1名）表示                   | LOD切替テスト       |
| 5   | L3: 時代名 + 年代 + 和暦 + 天皇 + 将軍 表示                     | LOD切替テスト       |
| 6   | スクロールに追従してリアルタイム更新                            | 実機テスト          |
| 7   | ダークテーマ対応                                                | テーマ切替テスト    |
| 8   | パフォーマンス: 60fps維持                                       | FPSモニタリング     |
| 9   | 時代名がカードスタイルで視覚的に強調される                      | UI確認              |
| 10  | 天皇・将軍にアイコン（👑/⚔）が表示される                        | UI確認              |
| 11  | 狭い画面（320px）でもL3の全情報が表示される（コンパクトレイアウト + adjustsFontSizeToFit） | iPhone SE実機テスト |
| 12  | 長い時代名（安土桃山）がはみ出さない                            | UI確認              |

---

## 依存関係

| 種類             | 詳細                                                           |
| ---------------- | -------------------------------------------------------------- |
| ✓ 入力依存       | 020 (Timeline Core), 022 (LOD Manager), 024 (Layer Management) |
| ✗ コード依存     | timelineStore (scrollX, zoomLevel, lodLevel)                   |
| ✗ 他チケット依存 | なし                                                           |
| ✓ 出力依存       | 044 (中国王朝連携) - v1.5で2カ国並列表示                       |

---

## ワイヤーフレーム

### LOD別表示内容（v4.1 改善版）

```
L0 (2000年単位):
┌────────────────────────────────────────────────────────┐
│  ┌─────────┐                                           │
│  │🏯 縄文  │                                           │
│  │  時代   │                                           │
│  └─────────┘                                           │
└────────────────────────────────────────────────────────┘
  ↑ 時代名カード化で視覚的強調

L1 (500年単位):
┌────────────────────────────────────────────────────────┐
│  ┌─────────┐                                           │
│  │🏯 平安  │ 1000年頃                                  │
│  │  時代   │                                           │
│  └─────────┘                                           │
└────────────────────────────────────────────────────────┘

L2 (100年単位):
┌────────────────────────────────────────────────────────┐
│  ┌─────────┐                                           │
│  │🏯 江戸  │ 1750年頃 │ 👑 桃園天皇                    │
│  │  時代   │                                           │
│  └─────────┘                                           │
└────────────────────────────────────────────────────────┘
  ↑ アイコンで天皇/将軍を視覚的に区別

L3 (50年単位):
┌────────────────────────────────────────────────────────┐
│  ┌─────────┐                                           │
│  │🏯 江戸  │ 1750年（宝暦元年）│ 👑桃園天皇 ⚔徳川家重  │
│  │  時代   │                                           │
│  └─────────┘                                           │
└────────────────────────────────────────────────────────┘
```

### 将来（v1.5: 世界史連携時）

```
┌────────────────────────────────────────────────────────┐
│  🇯🇵 江戸時代 1750年頃 │ 🇨🇳 清朝 乾隆帝              │
└────────────────────────────────────────────────────────┘
```

---

## 実装ガイドライン

### 1. コンポーネント構成

```
components/timeline/
└── ContextHeader.tsx         # 現在位置ヘッダー（新規）
```

### 2. ContextHeader コンポーネント

```typescript
// components/timeline/ContextHeader.tsx
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Era, Reign } from '@/types/database';
import type { LODLevel } from '@/types/store';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineStore } from '@/stores/timelineStore';
import {
  getPixelsPerYear,
  TIMELINE_START_YEAR,
} from '@/domain/timeline/coordinateSystem';
import { formatYear } from '@/utils/formatYear';
import { seirekiToWakaAsync } from '@/utils/wakaCalendar';

interface ContextHeaderProps {
  eras: Era[];
  reigns: Reign[];
  screenWidth: number;
}

export function ContextHeader({ eras, reigns, screenWidth }: ContextHeaderProps) {
  const { colors, typography } = useTheme();
  const scrollX = useTimelineStore((s) => s.scrollX);
  const zoomLevel = useTimelineStore((s) => s.zoomLevel);
  const lodLevel = useTimelineStore((s) => s.lodLevel);

  // 画面中央の年を計算
  const centerYear = useMemo(() => {
    const pixelsPerYear = getPixelsPerYear(screenWidth, zoomLevel);
    const yearOffset = (screenWidth / 2 - scrollX) / pixelsPerYear;
    return Math.round(yearOffset + TIMELINE_START_YEAR);
  }, [scrollX, zoomLevel, screenWidth]);

  // 現在の時代を特定
  const currentEra = useMemo(() => {
    const matching = eras.filter(
      (e) => centerYear >= e.startYear && centerYear < e.endYear
    );
    if (matching.length === 0) return null;

    // 最も短い時代を優先（より具体的）
    matching.sort((a, b) => (a.endYear - a.startYear) - (b.endYear - b.startYear));
    return matching[0];
  }, [eras, centerYear]);

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
        r.officeType.includes('shogun') &&
        centerYear >= r.startYear &&
        centerYear < r.endYear
    );
  }, [reigns, centerYear]);

  // LODに応じた表示内容を構築
  const displayContent = useMemo(() => {
    const content: { era: string; year?: string; wareki?: string; reign?: string } = {
      era: currentEra?.name ?? '不明',
    };

    // L1以上: 年代表示
    if (lodLevel >= 1 && centerYear) {
      // 100年単位に丸める
      const roundedYear = Math.round(centerYear / 100) * 100;
      content.year = `${formatYear(roundedYear)}頃`;
    }

    // L2以上: 天皇または将軍（代表1名）
    if (lodLevel >= 2) {
      if (currentEmperor) {
        content.reign = currentEmperor.name;
      } else if (currentShogun) {
        content.reign = currentShogun.name;
      }
    }

    // L3: 和暦追加 + 天皇・将軍両方
    if (lodLevel >= 3 && centerYear > 0) {
      content.year = formatYear(centerYear);
      const wareki = formatWareki(centerYear);
      if (wareki) {
        content.wareki = wareki;
      }

      // L3では天皇・将軍両方表示
      const reignParts: string[] = [];
      if (currentEmperor) reignParts.push(currentEmperor.name);
      if (currentShogun) reignParts.push(currentShogun.name);
      if (reignParts.length > 0) {
        content.reign = reignParts.join('・');
      }
    }

    return content;
  }, [lodLevel, currentEra, centerYear, currentEmperor, currentShogun]);

  // 天皇・将軍表示のフォーマット（アイコン付き）
  const formattedReign = useMemo(() => {
    if (!displayContent.reign) return null;

    const parts: string[] = [];
    if (currentEmperor) parts.push(`👑 ${currentEmperor.name}`);
    if (currentShogun) parts.push(`⚔ ${currentShogun.name}`);

    return parts.length > 0 ? parts.join('  ') : displayContent.reign;
  }, [displayContent.reign, currentEmperor, currentShogun]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {/* 時代名カード（視覚的強調） */}
      <View style={[styles.eraCard, { backgroundColor: currentEra?.color ?? colors.bgTertiary }]}>
        <Text style={styles.eraIcon}>🏯</Text>
        <Text style={styles.eraName}>{displayContent.era}</Text>
      </View>

      {/* 年代（L1以上） */}
      {displayContent.year && (
        <>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Text style={[styles.yearText, { color: colors.textSecondary }]}>
            {displayContent.year}
            {displayContent.wareki && ` (${displayContent.wareki})`}
          </Text>
        </>
      )}

      {/* 天皇・将軍（L2以上、アイコン付き） */}
      {formattedReign && (
        <>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <Text
            style={[styles.reignText, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formattedReign}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  // 時代名カード（視覚的強調）
  eraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
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
    color: '#FFFFFF',
  },
  separator: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
  },
  yearText: {
    fontSize: 13,
  },
  reignText: {
    fontSize: 13,
    flex: 1,
  },
});
```

### 3. TimelineCanvas への統合

```typescript
// app/(tabs)/index.tsx
import { ContextHeader } from '@/components/timeline/ContextHeader';

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {/* コンテキストヘッダー */}
      <ContextHeader
        eras={eras}
        reigns={reigns}
        screenWidth={screenWidth}
      />

      {/* EraPickerBar */}
      <EraPickerBar eras={eras} />

      {/* メインキャンバス */}
      <TimelineCanvas ... />
    </View>
  );
}
```

### 4. 和暦フォーマッター

```typescript
// utils/wakaCalendar.ts の既存関数を使用

/**
 * 西暦を和暦に変換（非同期・全時代対応）
 * 例: 1868 → "明治元年"
 *
 * 使用例:
 * const wakaText = await seirekiToWakaAsync(1868);
 * // => "明治元年"
 */
export async function seirekiToWakaAsync(
  seirekiYear: number,
): Promise<string | null>;
```

---

## 世界史連携対応の設計（v1.5向け）

### 拡張可能なインターフェース

```typescript
// v1.5での実装イメージ
interface ContextHeaderProps {
  primaryCountry: "japan";
  secondaryCountry?: "china" | "usa" | "uk" | null;
  eras: {
    japan: Era[];
    china?: Era[];
  };
  reigns: {
    japan: Reign[];
    china?: Reign[]; // 皇帝
  };
}
```

### 2カ国並列表示

```
┌────────────────────────────────────────────────────────┐
│  🇯🇵 江戸時代 1750年頃 │ 🇨🇳 清朝 乾隆帝              │
└────────────────────────────────────────────────────────┘
```

---

## Todo リスト

### Phase 1: 基本実装

- [ ] `ContextHeader.tsx` 新規作成
- [ ] 画面中央の年計算ロジック
- [ ] 現在時代の特定ロジック

### Phase 2: LOD連動

- [ ] L0: 時代名のみ
- [ ] L1: 時代名 + 年代
- [ ] L2: 時代名 + 年代 + 天皇or将軍
- [ ] L3: 時代名 + 年代 + 和暦 + 天皇 + 将軍

### Phase 3: 天皇・将軍表示

- [ ] 現在の天皇特定ロジック
- [ ] 現在の将軍特定ロジック
- [ ] 複数人表示（L3）

### Phase 4: 統合

- [ ] `app/(tabs)/index.tsx` に配置
- [ ] ダークテーマ対応

### Phase 5: テスト

- [ ] 各LODでの表示確認
- [ ] スクロール時の更新確認
- [ ] パフォーマンス確認（60fps）

---

## ファイル構成

```
components/timeline/
├── ContextHeader.tsx         # 現在位置ヘッダー（新規）
└── index.ts                  # エクスポート更新

utils/
└── wakaCalendar.ts           # seirekiToWakaAsync 等（既存）
```

---

## UI/UX デザインガイドライン（v4.1追加）

### 視覚的階層の確立

1. **時代名カード化**
   - 時代名を角丸カードで囲み、視覚的に独立させる
   - 時代固有の色を背景に適用
   - 微細なシャドウで浮き上がり効果

2. **アイコンによる識別**
   - 天皇: 👑（王冠）
   - 将軍: ⚔（刀剣）
   - 視覚的に即座に識別可能

### EraPickerBarとの役割分担

```
ContextHeader:
├── 主役: 詳細情報（和暦、天皇、将軍）
└── 時代名はカード化して補助情報扱い

EraPickerBar:
├── 主役: ナビゲーション（時代ジャンプ）
└── 現在位置はミニマップで表示
```

**設計意図:** 両コンポーネントで「現在時代」を表示するが、役割を明確に分離することで情報の重複感を軽減

### アクセシビリティ

- VoiceOver対応: 時代名、年代、在位者を順に読み上げ
- 十分なカラーコントラスト確保

### オーバーフロー/省略ルール（v4.2追加）

狭い画面や長いコンテンツに対するレスポンシブ対応：

**省略優先度（低→高）:**

1. 天皇・将軍名（最初に省略）→ `numberOfLines={1}` + `ellipsizeMode="tail"`
2. 和暦 → 省略可能（年代のみ表示）
3. 年代 → 「頃」を削除して短縮
4. 時代名（最後まで残す）→ 絶対に省略しない

**実装:**

```typescript
const styles = StyleSheet.create({
  // 時代名: 省略不可、最大幅を設定
  eraCard: {
    maxWidth: 100, // 「安土桃山」でも収まる幅
    flexShrink: 0, // 縮小しない
  },
  eraName: {
    numberOfLines: 1, // 1行に制限
  },

  // 年代: flexShrink対応
  yearText: {
    flexShrink: 1,
    minWidth: 60, // 最小幅保証
  },

  // 天皇・将軍: 最初に省略される
  reignText: {
    flex: 1,
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },
});
```

**画面幅別の表示（v4.3更新: L3は常に全情報表示）:**

| 画面幅            | 時代名 | 年代 | 和暦        | 天皇・将軍         |
| ----------------- | ------ | ---- | ----------- | ------------------ |
| 430px+ (Pro Max)  | ○      | ○    | ○           | ○                  |
| 375px (iPhone 13) | ○      | ○    | ○           | ○（縮小表示可）    |
| 320px (SE)        | ○      | ○    | ○（compact）| ○（縮小表示可）    |

**全情報表示の実装方式:**

- `adjustsFontSizeToFit` + `minimumFontScale` で情報を維持しながらフォントを縮小
  - 通常画面: `minimumFontScale={0.7}`
  - コンパクト画面（320px以下）: `minimumFontScale={0.5}`（より積極的に縮小）
- フォント縮小が限界に達した場合のみ `ellipsizeMode="tail"` でフォールバック
- 「全情報表示」= 情報は隠さない（省略コンポーネント化しない）、表示上の短縮は許容

**コンパクトレイアウト（320px以下）:**

```typescript
const isCompactLayout = screenWidth <= 320;
// 和暦: 括弧省略（例: "1868 明治元年" instead of "1868（明治元年）"）
// 天皇・将軍: adjustsFontSizeToFitで縮小表示
```

---

## リスク・考慮事項

- **パフォーマンス:** `scrollX` は60fps更新のため、useMemoでメモ化。不要な再計算を避ける
- **紀元前対応:** 縄文時代など紀元前の表示に対応（`formatYear` 使用）
- **時代の重複:** 戦国・室町のように重複する時代は、最も短い（具体的な）時代を表示
- **将軍不在期間:** 幕府がない時代（平安前期など）は天皇のみ表示

---

**作成日:** 2026-01-31
**更新日:** 2026-02-02
**優先度:** P1
**推定工数:** 1d
**ステータス:** Done ✅
**ブロッカー:** 020, 022, 024 ✅

---

## 変更履歴

### v4.3 (2026-02-02) - 監査修正

**監査指摘と対応:**

| # | 重要度 | 指摘内容 | 対応 |
|---|--------|----------|------|
| 1 | 重大 | L3小画面で和暦/在位者を省略 → 039要件違反 | コンパクトレイアウトで全情報表示に変更 |
| 2 | 中 | SCREEN_WIDTH_MD未使用（死コード） | 削除 |
| 3 | 中 | 和暦変換が毎フレーム発火 → 負荷リスク | デバウンス + Mapキャッシュ追加 |
| 4 | 低 | 在位検索が毎フレーム線形探索 | キャッシュ付き検索に変更 |

**修正内容:**

1. **L3小画面対応（仕様変更）**
   - 省略廃止、コンパクトレイアウトで全情報表示
   - 小画面: 和暦は括弧省略フォーマット、在位者は名前付きでellipsis

2. **死コード削除**
   - `SCREEN_WIDTH_MD` 定数削除
   - `isMediumScreen` 変数削除

3. **和暦デバウンス + キャッシュ**
   - `warekiCacheRef: Map<number, string | null>` 追加
   - 50msデバウンス追加

4. **在位キャッシュ**
   - `lastEmperorRef` / `lastShogunRef` 追加
   - 同じ在位期間内ならキャッシュヒット（O(1)）

**受け入れ条件更新:**

- #5: L3では小画面でも全情報をコンパクト表示
- #11: 狭い画面（320px）でもL3の全情報が表示される（コンパクトレイアウト）

### v4.2 (2026-01-31)

- オーバーフロー/省略ルールを追加（狭い画面対応）
- 省略優先度を明確化（天皇・将軍 → 和暦 → 年代 → 時代名の順）
- 画面幅別の表示ルールを追加（320px/375px/430px+）
- 受け入れ条件 #11, #12 追加

### v4.1 (2026-01-31)

- UI/UX改善: 時代名をカードスタイルで強調
- UI/UX改善: 天皇・将軍にアイコン（👑/⚔）追加
- EraPickerBarとの役割分担を明確化
- 受け入れ条件 #9, #10 追加
