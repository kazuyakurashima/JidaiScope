# 023: Era Picker - 時代ジャンプナビゲーション（Sprint 2）

## 概要

**目的:** ユーザーが時代を選択して、該当地点へスムーズに移動できるUI

**スコープ:**

- Era 一覧の横並び帯表示（幅 = 期間比率）
- タップでジャンプアニメーション（400ms ease-out）
- 現在位置のハイライト表示
- スクロール対応

**成功基準:**

- ✅ 15時代すべてが幅比率で表示される
- ✅ タップ → 該当時代開始地点へアニメーション移動
- ✅ アニメーション時間 300-500ms
- ✅ 時代境界通過時にハプティクス反応

---

## ユーザーストーリー

```
As a ユーザー
I want to 「江戸時代」をタップして瞬時に江戸に移動したい
So that 興味の時代へ素早くアクセスできる
```

---

## 受け入れ条件

| #   | 条件                                      | 検証方法                                   | 担当 |
| --- | ----------------------------------------- | ------------------------------------------ | ---- |
| 1   | 15時代が幅比率で表示                      | 縄文（約10000年）が江戸（265年）の40倍の幅 | -    |
| 2   | タップ → ジャンプアニメーション           | 400ms以内で目標地点到達                    | -    |
| 3   | 現在の Era が色・テキストで強調           | ビジュアル確認                             | -    |
| 4   | 時代を連続タップ → スムーズに順序ジャンプ | 遅延なし                                   | -    |

---

## 依存関係

| 種類             | 詳細                                                    |
| ---------------- | ------------------------------------------------------- |
| ✓ 入力依存       | 012 (Database), 020 (Timeline Core), 021 (Zoom Manager) |
| ✗ コード依存     | TimelineCanvas のスクロール位置を制御                   |
| ✗ 他チケット依存 | なし                                                    |
| ✓ 出力依存       | 025 (Haptics)：時代境界通過で発火                       |

---

## Todo リスト

### Phase 1: UI コンポーネント実装

- [ ] EraPickerBar コンポーネント作成
- [ ] ScrollView で時代帯を横並び
- [ ] 各時代の幅 = (endYear - startYear) / totalYears \* screenWidth
- [ ] 時代タイトル、開始年、終了年表示

### Phase 2: タップ検出・アニメーション

- [ ] 各時代 Pressable で タップ検出
- [ ] Reanimated Animated.Value で scrollX 計算
- [ ] withTiming で 400ms ease-out アニメーション

### Phase 3: 現在位置のハイライト

- [ ] 現在の scrollX 位置 → 該当 Era を判定
- [ ] 強調表示（色・下線・背景）

### Phase 4: レスポンシブ対応

- [ ] 横向き / 縦向き対応
- [ ] 小画面での折り返し対応

---

## 実装ガイドライン

```typescript
// components/timeline/EraPickerBar.tsx
import { useTimelineStore } from '@/stores/timelineStore';

export function EraPickerBar() {
  const { scrollX, setScroll } = useTimelineStore();
  const eras = useEras(); // Repository から取得
  const { width: screenWidth } = useWindowDimensions();

  const totalYears = 12025; // -10000 to 2025
  const pixelsPerYear = 0.1 * screenWidth / 1000; // baseline

  function jumpToEra(era: Era) {
    const targetScrollX = era.startYear * pixelsPerYear;

    // Animate to target
    scroll.value = withTiming(targetScrollX, {
      duration: 400,
      easing: Easing.out(Easing.exp),
    });

    setScroll(targetScrollX);
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {eras.map((era) => (
        <Pressable
          key={era.id}
          onPress={() => jumpToEra(era)}
          style={{
            width: ((era.endYear - era.startYear) / totalYears) * screenWidth,
            paddingVertical: 8,
            paddingHorizontal: 4,
            backgroundColor: era.color,
            opacity: isCurrentEra(era) ? 1 : 0.7,
          }}
        >
          <Text style={styles.eraTitle}>{era.name}</Text>
          <Text style={styles.eraYears}>
            {era.startYear} - {era.endYear}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

---

## ファイル構成

```
components/
└── timeline/
    └── EraPickerBar.tsx        # Era選択UI
```

---

## テスト項目

- [ ] 15時代の幅比率が正確
- [ ] タップ → 400ms以内でジャンプ
- [ ] 連続タップでも遅延なし
- [ ] 現在 Era が正しくハイライト

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 020, 021 完了
