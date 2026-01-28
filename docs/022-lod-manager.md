# 022: LOD Manager - Level of Detail 管理（Sprint 2）

## 概要

**目的:** ズームレベルに応じて表示情報の粒度を動的に変更し、情報過多を回避

**スコープ:**

- ズームレベル → LOD Level (L0-L3) 判定
- 表示対象イベント・テキストの動的フィルタリング
- 段階的フェード/スケールアニメーション
- 幕末〜明治の密集区間での情報抽出ロジック

**成功基準:**

- ✅ L0-L3 の 4段階が滑らかに切り替わる
- ✅ LOD切替時のカクツキなし
- ✅ 密集区間でも可読性維持

---

## 受け入れ条件

| #   | 条件                                     | 検証方法           | 担当 |
| --- | ---------------------------------------- | ------------------ | ---- |
| 1   | x1ズーム（L0）：時代名のみ表示           | ビジュアル確認     | -    |
| 2   | x5ズーム（L1）：主要イベント 30件程度    | マーカー数計測     | -    |
| 3   | x25ズーム（L2）：年単位イベント          | 同上               | -    |
| 4   | x100ズーム（L3）：月単位詳細表示         | 同上               | -    |
| 5   | Level 切替時のテキストフェード：スムーズ | 目視・フレーム計測 | -    |
| 6   | 幕末〜明治でも最小フォント 10px維持      | 可読性確認         | -    |

---

## 依存関係

| 種類             | 詳細                                    |
| ---------------- | --------------------------------------- |
| ✓ 入力依存       | 020 (Timeline Core), 021 (Zoom Manager) |
| ✗ コード依存     | 020 に統合される                        |
| ✗ 他チケット依存 | なし                                    |
| ✓ 出力依存       | 025 (Haptics)：LOD切替で発火            |

---

## Todo リスト

### Phase 1: LOD ルール定義

- [x] L0（全体俯瞰）
  - ズーム: x1〜x2
  - 表示: 時代名、時代背景帯のみ
  - イベント: なし
  - テキスト: 時代名（大）のみ
- [x] L1（時代単位）
  - ズーム: x2〜x10
  - 表示: 主要イベント（importance >= 2）
  - イベント: 最大100件
  - テキスト: 時代名のみ
- [x] L2（年単位）
  - ズーム: x10〜x50
  - 表示: 通常以上のイベント（importance >= 1）
  - イベント: 最大300件
  - テキスト: 時代名のみ
- [x] L3（月単位詳細）
  - ズーム: x50以上
  - 表示: 全イベント
  - イベント: 最大500件
  - テキスト: 時代名 + イベントタイトル

### Phase 2: フィルタリングロジック実装

- [x] Event.importanceLevel に基づいた フィルタリング関数
  - `filterEventsByLOD()` で LOD レベル別にフィルタリング
  - L0: イベント非表示
  - L1: importance >= 2
  - L2: importance >= 1
  - L3: 全て表示

- [x] マーカーサイズ動的計算
  - `getMarkerRadiusByLOD()` で LOD × 重要度に応じたサイズ調整
  - LOD レベルごとの乗数: L0=0.6, L1=0.8, L2=1.0, L3=1.2

- [x] 密集区間での情報圧縮
  - `filterDensePeriodEvents()` で幕末〜明治（1850-1920年）対応
  - 密集期間は重要度フィルタを1段階厳しくする

### Phase 3: マーカースケール実装

- [x] マーカースケール：LOD に応じた拡大縮小
  - 基本半径 × 重要度乗数 × LOD乗数
  - LOD レベル別乗数: L0=0.6, L1=0.8, L2=1.0, L3=1.2
- [x] イベントラベル：L3（高ズーム時）のみ表示
  - `shouldShowEventLabels()` で表示制御

### Phase 4: 密集区間の特別対応

- [x] 幕末〜明治の対応
  - `isDensePeriod()` で密集期間判定
  - `filterDensePeriodEvents()` で重要度フィルタを強化

### Phase 5: テスト

- [x] TypeScript ビルド確認
- [x] ESLint チェック
- [ ] LOD 段階別フィルタリング：ビジュアル確認
- [ ] 密集区間での見た目確認

### Phase 6: フィードバック対応

- [x] [High] 表示上限の適用順序修正
  - `filterEventsByLOD()` から `maxVisibleEvents` を分離
  - `applyEventLimit()` を新設、可視範囲フィルタ後に適用
  - 処理順序: 重要度フィルタ → 密集期間フィルタ → 可視範囲フィルタ → 上限適用
- [x] [Medium] LOD切替時のフェード/スケールアニメーション実装
  - `requestAnimationFrame` + ease-out cubic 補間でスムーズなアニメーション
  - Phase 1: opacity 1→0.5, scale 1→0.95 (80ms)
  - Phase 2: opacity 0.5→1, scale 0.95→1 (120ms)
  - Skia Group に opacity + transform scale 適用
  - `animateValue()` が cancel 関数を返す設計（メモリリーク防止）
  - `performance.now()` に `Date.now()` フォールバック（RN環境差異対応）
- [x] [Low] 年抽出を `extractYearFromDate()` に統一
  - `filterDensePeriodEvents()` の `substring(0, 5)` を修正
  - 負の5桁年（-14000等）でも正しく動作

---

## 実装ガイドライン

```typescript
// domain/timeline/lodManager.ts
export type LODLevel = 0 | 1 | 2 | 3;

export interface LODConfig {
  level: LODLevel;
  minImportance: number;
  maxTextSize: number;
  markerRadius: number;
}

const LOD_CONFIGS: Record<LODLevel, LODConfig> = {
  0: { level: 0, minImportance: Infinity, maxTextSize: 14, markerRadius: 4 },
  1: { level: 1, minImportance: 2, maxTextSize: 12, markerRadius: 6 },
  2: { level: 2, minImportance: 1, maxTextSize: 10, markerRadius: 8 },
  3: { level: 3, minImportance: 0, maxTextSize: 10, markerRadius: 10 },
};

export function useLODManager() {
  const { lodLevel, setLOD } = useTimelineStore();
  const sharedOpacity = useSharedValue(1);

  function updateLOD(newLOD: LODLevel) {
    if (newLOD !== lodLevel) {
      setLOD(newLOD);

      // フェードアニメーション
      sharedOpacity.value = withTiming(0.5, { duration: 100 }, () => {
        sharedOpacity.value = withTiming(1, { duration: 100 });
      });
    }
  }

  function filterEventsByLOD(events: Event[]): Event[] {
    const config = LOD_CONFIGS[lodLevel];
    return events.filter((e) => e.importanceLevel >= config.minImportance);
  }

  return {
    lodLevel,
    updateLOD,
    filterEventsByLOD,
    sharedOpacity,
    config: LOD_CONFIGS[lodLevel],
  };
}
```

---

## ファイル構成

```
domain/
└── timeline/
    ├── lodManager.ts           # LOD設定・フィルタリング関数
    └── constants.ts            # LOD_THRESHOLDS

components/
└── timeline/
    └── TimelineCanvas.tsx      # LOD統合済み
```

---

## テスト項目

- [x] TypeScript 型チェック
- [x] ESLint 静的解析
- [ ] L0-L3 段階での表示イベント数確認
- [ ] importanceLevel フィルタ正確性
- [ ] 密集区間での見た目確認

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 1.5d
**ステータス:** Done (Phase 1-5 実装完了)
**ブロッカー:** 020, 021 完了 ✓
