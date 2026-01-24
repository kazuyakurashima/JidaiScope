# 050: LOD Manager - Level of Detail 管理（Sprint 1）

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
| ✓ 入力依存       | 030 (Timeline Core), 040 (Zoom Manager) |
| ✗ コード依存     | 030 に統合される                        |
| ✗ 他チケット依存 | なし                                    |
| ✓ 出力依存       | 120 (Haptics)：LOD切替で発火            |

---

## Todo リスト

### Phase 1: LOD ルール定義

- [ ] L0（全体俯瞰）
  - ズーム: x1〜x2
  - 表示: 時代名、時代背景帯のみ
  - イベント: なし
  - テキスト: 時代名（大）のみ
- [ ] L1（時代単位）
  - ズーム: x2〜x10
  - 表示: 主要イベント（importance >= 2）
  - イベント: 30-50件（時代ごと）
  - テキスト: 時代名、主要イベントタイトル
- [ ] L2（年単位）
  - ズーム: x10〜x50
  - 表示: すべてのイベント
  - イベント: 800件全て
  - テキスト: イベントタイトル + 年号
- [ ] L3（月単位詳細）
  - ズーム: x50以上
  - 表示: 全イベント + 日付詳細
  - イベント: 800件全て + 小イベント
  - テキスト: 詳細テキスト、人物名

### Phase 2: フィルタリングロジック実装

- [ ] Event.importanceLevel に基づいた フィルタリング関数

  ```typescript
  function filterEventsByLOD(events: Event[], lod: LODLevel) {
    if (lod === 0) return [];
    if (lod === 1) return events.filter((e) => e.importanceLevel >= 2);
    if (lod === 2) return events.filter((e) => e.importanceLevel >= 1);
    return events;
  }
  ```

- [ ] テキストサイズ動的計算

  ```typescript
  function getFontSizeByLOD(baseSizePx: number, lod: LODLevel): number {
    const minSize = 10; // 最小フォント
    return Math.max(minSize, (baseSizePx * (lod + 1)) / 4);
  }
  ```

- [ ] 密集区間での情報圧縮
  - 幕末〜明治（1850-1920年）で 50件/10年
  - インポーティビティの高さで選別

### Phase 3: アニメーション・フェード実装

- [ ] テキストオパシティ：LOD切替で段階的フェード
  - L0→L1：古いテキスト fade out（100ms）
  - 新しいテキスト fade in（100ms）
- [ ] マーカースケール：LOD に応じた拡大縮小
  - L0: radius = 4px
  - L1: radius = 6px
  - L2/L3: radius = 8px

### Phase 4: 密集区間の特別対応

- [ ] 幕末〜明治の L0→L1 切替：情報爆発対応
  - 優先度フィルタの段階的緩和
  - または時間軸スケール非線形化（v1.1 で Log/Focus）

### Phase 5: テスト

- [ ] LOD 段階別フィルタリング正確性
- [ ] 密集区間での見た目確認
- [ ] アニメーション滑らかさ

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
    ├── lodManager.ts           # LOD計算・フィルタリング
    └── constants.ts            # LOD_CONFIGS
```

---

## テスト項目

- [ ] L0-L3 段階での表示イベント数確認
- [ ] importanceLevel フィルタ正確性
- [ ] フェードアニメーション：60fps 維持
- [ ] 密集区間での最小フォント維持（10px）

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 030, 040 完了
