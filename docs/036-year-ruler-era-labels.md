# 036: Year Ruler & Era Labels Enhancement（Sprint 3）

## 概要

**目的:** ユーザーが「今何年頃を見ているか」を常に把握できるようにする

**スコープ:**
- 年代ルーラー（目盛り）の追加
- 時代名ラベルの視認性向上
- LODレベルに応じた目盛り粒度調整
- 年代表記の統一（既存の不整合修正含む）
- **全時代和暦対応**（大化〜令和）← v4.0追加

**成功基準:**
- [ ] タイムライン軸に年代目盛りが表示される
- [ ] LODレベルに応じて目盛り間隔が変化する
- [ ] 時代名が適切に表示され、重ならない
- [ ] 年代表記が「紀元前○○年」形式で統一されている（※スペース制約のある箇所は「年」省略可）
- [ ] **L3で和暦表示（全時代対応: 大化645年〜令和）**

---

## ユーザーストーリー

```
As a ユーザー
I want to タイムライン上で現在の年代を確認したい
So that 歴史的な時間軸を把握しながら探索できる
```

---

## 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|----------|
| 1 | 年代目盛りがタイムライン軸に表示される | UI確認 |
| 2 | L0: 2000年単位、L1: 500年単位、L2: 100年単位、L3: 50年単位 | 各LODでテスト |
| 3 | 負の年は「紀元前○○年」形式で表示される（※スペース制約のある EraPickerBar 等は「紀元前○○」で年省略可） | UI確認 |
| 4 | L0-L1: 画面中央の年を含む時代のみラベル表示 | UI確認 |
| 5 | L2-L3: 幅60px以上の時代のみラベル表示 | UI確認 |
| 6 | 既存の BC 表記が「紀元前」に統一されている | grep検証（`app/`, `components/`, `domain/`, `utils/` のみ対象、`docs/` 除外） |
| 7 | **L3で和暦表示（全時代: 大化645年〜令和対応）** | 各時代でUI確認 |
| 8 | **検索で和暦入力対応（「大化」「天平」など古代・中世も）** | 検索テスト |

---

## 依存関係

| 種類 | 詳細 |
|------|------|
| ✓ 入力依存 | 020 (Timeline Core), 022 (LOD Manager), 013 (Data Preparation - 元号マスター) |
| ✗ コード依存 | なし |
| ⓘ データ共有 | 030 (Search) と元号マスターデータを共有 |

---

## 実装ガイドライン

### 1. 年代ルーラー

```typescript
// domain/timeline/constants.ts に追加
import type { LODLevel } from '@/types/store';

// LODLevel は 0 | 1 | 2 | 3 の数値型（types/store.ts 参照）
export const YEAR_RULER_INTERVALS: Record<LODLevel, number> = {
  0: 2000,  // L0: 2000年単位
  1: 500,   // L1: 500年単位
  2: 100,   // L2: 100年単位
  3: 50,    // L3: 50年単位
};
```

```typescript
// TimelineCanvas.tsx 内で目盛り描画
// getVisibleYearRange は coordinateSystem.ts の既存API
import { getVisibleYearRange } from '@/domain/timeline/coordinateSystem';

const yearMarks = useMemo(() => {
  const interval = YEAR_RULER_INTERVALS[lodLevel];
  const { startYear: visibleStartYear, endYear: visibleEndYear } = getVisibleYearRange({
    screenWidth,
    screenHeight,
    zoomLevel,
    scrollX,
  });
  const marks: number[] = [];
  const alignedStart = Math.ceil(visibleStartYear / interval) * interval;
  for (let year = alignedStart; year <= visibleEndYear; year += interval) {
    marks.push(year);
  }
  return marks;
}, [lodLevel, screenWidth, screenHeight, zoomLevel, scrollX]);
```

### 2. 年代表記統一ユーティリティ

```typescript
// utils/formatYear.ts（新規作成）

/**
 * 年を「○○年」形式でフォーマット
 * 負の年は「紀元前○○年」
 */
export function formatYear(year: number): string {
  if (year < 0) {
    return `紀元前${Math.abs(year)}年`;
  }
  return `${year}年`;
}

/**
 * 年を「○○」形式でフォーマット（「年」なし）
 * 負の年は「紀元前○○」
 * EraPickerBar などスペースが限られる箇所向け
 */
export function formatYearShort(year: number): string {
  if (year < 0) {
    return `紀元前${Math.abs(year)}`;
  }
  return `${year}`;
}

/**
 * 年範囲を「○○年 - ○○年」形式でフォーマット
 * app/era/[id].tsx のヘッダー表示用
 */
export function formatYearRange(startYear: number, endYear: number): string {
  return `${formatYear(startYear)} - ${formatYear(endYear)}`;
}
```

### 2.5 全時代和暦データ（v4.0追加）

**データソース方針（v4.1 明確化）:**
- 元号マスターデータは **013 Data Preparation** で SQLite DB に格納
- `utils/wakaCalendar.ts` は DB の元号テーブルを参照
- 030 Search Feature と本チケットで同一データソースを共有
- ハードコードは避け、DB を Single Source of Truth (SSOT) とする

```typescript
// utils/wakaCalendar.ts

import { getWarekiEras } from '@/data/repositories/WarekiRepository';

export interface WarekiEra {
  name: string;
  startYear: number;
  endYear: number;
}

// DB から元号マスターを取得（キャッシュ付き）
let cachedEras: WarekiEra[] | null = null;

async function getEras(): Promise<WarekiEra[]> {
  if (cachedEras) return cachedEras;
  cachedEras = await getWarekiEras(); // DB から取得
  return cachedEras;
}

/**
 * 西暦から和暦を取得
 * @param year 西暦
 * @returns 和暦情報 or null
 */
export async function toWareki(year: number): Promise<{ era: string; year: number } | null> {
  const eras = await getEras();
  const era = eras.find((e) => year >= e.startYear && year < e.endYear);
  if (!era) return null;

  return {
    era: era.name,
    year: year - era.startYear + 1,
  };
}

/**
 * 和暦名から西暦範囲を取得（検索用）
 * @param eraName 元号名（例: "大化", "天平"）
 * @returns { startYear, endYear } or null
 */
export async function fromWarekiName(eraName: string): Promise<{ startYear: number; endYear: number } | null> {
  const eras = await getEras();
  const era = eras.find((e) => e.name === eraName);
  if (!era) return null;

  return {
    startYear: era.startYear,
    endYear: era.endYear,
  };
}
```

**DB スキーマ（013 で定義）:**
```sql
CREATE TABLE wareki_eras (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,           -- 元号名（例: "大化", "令和"）
  reading TEXT,                 -- 読み仮名
  startYear INTEGER NOT NULL,   -- 開始年（西暦）
  endYear INTEGER,              -- 終了年（西暦）※令和など現行元号はNULL
  period TEXT,                  -- 時代区分（飛鳥, 奈良, 平安, 南北朝-南朝, 南北朝-北朝, 等）
  sequence INTEGER DEFAULT 0    -- 同一年内の順序（大きいほど後の元号）
);

-- 約250件の元号データを挿入
-- 南北朝時代は北朝・南朝両方を収録し、period と sequence で区別
-- sequence: 南朝=0, 北朝=1 → getWarekiByYear は北朝を優先
```

**年単位変換の制約（MVP）:**
- `getWarekiByYear(year)` は年単位で元号を判定
- 年内に改元がある年（例: 749年の天平感宝→天平勝宝）は `sequence DESC` で後の元号を返す
- 日付精度での判定は MVP スコープ外（将来の `getWarekiByDate` で対応予定）

### 3. Era ラベル衝突回避

```typescript
import type { LODLevel } from '@/types/store';
import { pixelToYear, yearToPixel } from '@/domain/timeline/coordinateSystem';

// LODレベルに応じたラベル表示判定
// LODLevel は数値型（0 | 1 | 2 | 3）なので数値比較を使用
const shouldShowEraLabel = (era: Era, lodLevel: LODLevel, config: CoordinateConfig): boolean => {
  // L0-L1 (lodLevel <= 1): 画面中央の年を含む時代のみ
  if (lodLevel <= 1) {
    // 画面中央のピクセル座標から年を計算
    const centerPixelX = config.screenWidth / 2;
    const centerYear = pixelToYear(centerPixelX, config);
    return era.startYear <= centerYear && centerYear < era.endYear;
  }

  // L2-L3 (lodLevel >= 2): 幅60px以上の時代のみ
  const eraWidth = yearToPixel(era.endYear, config) - yearToPixel(era.startYear, config);
  return eraWidth >= 60;
};
```

### 4. 既存コード修正箇所

| ファイル | 現状 | 修正後 |
|---------|------|--------|
| `app/era/[id].tsx` | `BC ${year}` (line 16-21, 109-111) | `formatYear(year)`, `formatYearRange(start, end)` |
| `app/event/[id].tsx` | 負の年未対応 (formatDate関数) | 負の年を `紀元前○○年` 形式で表示 |
| `app/person/[id].tsx` | 負の年未対応 (formatLifespan/formatActivePeriod) | 負の年を `紀元前○○年` 形式で表示 |
| `domain/search/searchService.ts` | `BC${year}年` | `formatYear(year)` |
| `components/timeline/EraPickerBar.tsx` | `BC ${year}` | `formatYearShort(year)` |
| `utils/screenshotCaption.ts` | 既に紀元前形式 | 変更不要 |

**注:** イベント詳細（031）と人物詳細（032）の日付フォーマットも本チケットのスコープに含める。

---

## Todo リスト

### Phase 1: 年代表記統一
- [ ] `utils/formatYear.ts` 作成（`formatYear`, `formatYearShort`, `formatYearRange`）
- [ ] `app/era/[id].tsx` 修正（`formatYear` 関数と `yearRange` 変数）
- [ ] `app/event/[id].tsx` 修正（`formatDate` 関数で負の年対応）
- [ ] `app/person/[id].tsx` 修正（`formatLifespan`/`formatActivePeriod` 関数で負の年対応）
- [ ] `domain/search/searchService.ts` 修正
- [ ] `components/timeline/EraPickerBar.tsx` 修正

### Phase 2: 年代ルーラー
- [ ] `YEAR_RULER_INTERVALS` 定数追加
- [ ] `yearMarks` 計算ロジック追加
- [ ] Skia で目盛り線描画
- [ ] 目盛りラベル描画（formatYearShort使用）

### Phase 3: Era ラベル改善
- [ ] `shouldShowEraLabel` 関数実装
- [ ] 既存の era ラベル描画ロジック修正
- [ ] L0-L1: 中央時代のみ表示
- [ ] L2-L3: 幅60px以上のみ表示

### Phase 4: テスト
- [ ] 各LODレベルで目盛り表示確認
- [ ] 紀元前の年代表示確認
- [ ] ラベル重なりなし確認

---

## ファイル構成

```
utils/
└── formatYear.ts              # 年代フォーマットユーティリティ（新規）

domain/timeline/
└── constants.ts               # YEAR_RULER_INTERVALS 追加

components/timeline/
└── TimelineCanvas.tsx         # 年代ルーラー描画追加
```

---

**作成日:** 2025-01-30
**更新日:** 2026-01-31
**優先度:** P0（P1から昇格）
**推定工数:** 1.5d（全時代和暦対応を含む）
**ステータス:** Not Started
**ブロッカー:** 020 (Timeline Core) ✅

---

## 変更履歴

### v4.1 (2026-01-31)
- 和暦データソースを明確化: DB (013 Data Preparation) を SSOT とする
- 依存関係に 013 を追加、030 Search Feature とのデータ共有を明記
- ハードコードから DB 参照方式に設計変更

### v4.0 (2026-01-31)
- 全時代和暦対応を追加（大化645年〜令和）
- 優先度を P1 → P0 に昇格
- 工数を 1d → 1.5d に修正（和暦データ準備含む）
- 受け入れ条件 #7, #8 を追加
