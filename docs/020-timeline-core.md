# 020: Timeline Core - TimelineCanvas 基本実装（Sprint 2）

## 概要

**目的:** Skia を使用したメインタイムライン描画エンジンの基本実装

**スコープ:**

- 真比率タイムライン基本描画（縄文〜令和）
- 時代背景帯の描画
- イベントマーカー（点/線）の描画
- ヒット領域検出（タップ/タッチ）
- ScrollView/PanGestureHandler の統合
- 基本ハプティクス連携

**成功基準:**

- ✅ 全体タイムラインが画面に表示される
- ✅ 水平スクロール / ピンチズーム操作可能
- ✅ イベントマーカータップで詳細画面へ遷移
- ✅ 60fps 維持（Sprint 0 検証結果を活用）

---

## ユーザーストーリー

```
As a ユーザー
I want to 縄文から令和までの日本史全体を一本の真比率タイムラインとして見たい
So that 時間の長さを体感しながら歴史を探索できる
```

---

## 受け入れ条件

| #   | 条件                                                   | 検証方法            | 担当 |
| --- | ------------------------------------------------------ | ------------------- | ---- |
| 1   | 縄文〜令和（-10000年〜2025年）が一本のラインとして表示 | ビジュアル確認      | -    |
| 2   | 時代区分（15区分）が背景帯で区別できる                 | 色分けで確認        | -    |
| 3   | 主要イベント（100件以上）がマーカーで表示              | マーカー数計測      | -    |
| 4   | イベントタップ → EventDetail 画面遷移                  | ナビゲーション確認  | -    |
| 5   | スクロール・ピンチズーム操作で 60fps 維持              | Xcode Instruments   | -    |
| 6   | オフライン環境で全機能動作                             | WiFi OFF 状態で確認 | -    |

---

## 依存関係

| 種類             | 詳細                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| ✓ 入力依存       | 001 Tech Validation (Skia検証), 012 Database, 014 State Management, 015 Design Tokens      |
| ✗ コード依存     | 021 (Zoom Manager), 022 (LOD Manager) は後続で統合                                         |
| ✗ 他チケット依存 | なし                                                                                       |
| ✓ 出力依存       | 023 (Era Picker), 024 (Layer Management), 025 (Haptics) 等（全タイムライン機能がコア依存） |

---

## Todo リスト

### Phase 1: キャンバス基本設定

- [x] TimelineCanvas.tsx 作成
- [x] Skia Canvas コンテナ実装
- [x] 親コンポーネント（app/(tabs)/index.tsx）から呼び出し
- [x] 画面サイズ取得（useWindowDimensions）
- [ ] 縦/横レイアウト対応

### Phase 2: 座標系・スケーリング

- [x] 年号 → ピクセル変換ロジック
  - [x] 最小ズーム時：全体（-10000〜2025年）が画面内収まる
  - [x] スケール計算：totalYears × pixelsPerYear
- [x] 描画領域のクリッピング（可視範囲のみ）
- [x] スクロール位置（scrollX）の管理

### Phase 3: 時代背景帯描画

- [x] 各時代（Era）の背景帯描画
  - [x] Era.startYear/endYear から矩形を計算
  - [x] Era.color で塗り分け
  - [x] テキスト（時代名）配置
- [x] 時代境界線（縦線）の描画
- [x] アルファ値調整（重なった場合の透視感）

### Phase 4: イベントマーカー描画

- [x] イベント点（●）の描画
  - [x] Event.startDate → x座標計算
  - [x] 重要度別サイズ分け（importanceLevel）
  - [x] 色分け（tag: politics/war/culture/diplomacy）
- [x] イベント縦線（期間イベント対応）
  - [x] startDate 〜 endDate の間を線で表示
- [ ] テキストラベル配置（高ズーム時のみ）

### Phase 5: インタラクション

- [x] タップ検出ロジック（ヒット領域計算）
  - [x] イベント : 44pt 円形のヒット領域（アクセシビリティ対応）
  - [x] 時代帯 : タップ時に Era 情報取得
- [ ] 長押しプレビュー機能（PRD 要件）
  - [ ] 200ms 以上長押し → イベント簡易プレビュー表示
  - [ ] ツールチップ：イベント名 + 日付
  - [ ] 指を離すと消える
- [x] タップ → EventDetail 画面遷移
  - [x] useRouter().push(`/event/${eventId}`)
- [x] スクロール検出（PanGestureHandler）
  - [x] ドラッグで水平スクロール
  - [x] 慣性スクロール有効化

### Phase 6: パフォーマンス最適化

- [x] 可視範囲のみ描画（バーチャライゼーション）
  - [x] 画面外のマーカー・テキスト描画スキップ
- [ ] 描画キャッシュ（時代背景帯）
- [x] useSharedValue / useAnimatedStyle との統合

### Phase 7: 基本ハプティクス

- [x] 時代境界通過時に Light impact 発火
- [x] 設定で有効/無効切り替え可能

---

## 実装ガイドライン

### TimelineCanvas 基本構造

```typescript
// components/timeline/TimelineCanvas.tsx
import { Canvas, Skia } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface TimelineCanvasProps {
  scrollX?: number;
  zoomLevel?: number;
  onEventPress?: (eventId: string) => void;
  onEraPress?: (eraId: string) => void;
}

export function TimelineCanvas({
  scrollX = 0,
  zoomLevel = 1,
  onEventPress,
  onEraPress,
}: TimelineCanvasProps) {
  const { width, height } = useWindowDimensions();

  // 年→ピクセル変換
  const pixelsPerYear = 0.1 * zoomLevel; // 基本: 1年 = 0.1px

  // スクロール位置（shared value）
  const translateX = useSharedValue(scrollX);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Canvas
          style={{ flex: 1 }}
          onDraw={({ canvas, info }) => {
            drawTimeline(canvas, {
              width,
              height,
              pixelsPerYear,
              translateX: translateX.value,
              zoomLevel,
            });
          }}
        />
      </Animated.View>
    </GestureDetector>
  );
}

function drawTimeline(
  canvas,
  {
    width,
    height,
    pixelsPerYear,
    translateX,
    zoomLevel,
  }
) {
  // 背景
  const bgPaint = Skia.Paint();
  bgPaint.setColor(Skia.Color('#0A0E14')); // ダークテーマ
  canvas.drawRect(Skia.XYWHRect(0, 0, width, height), bgPaint);

  // 時代背景帯と イベントマーカー描画
  drawEras(canvas, { width, height, pixelsPerYear, translateX });
  drawEvents(canvas, { width, height, pixelsPerYear, translateX });
}

function drawEras(canvas, { width, height, pixelsPerYear, translateX }) {
  // 各時代ループ
  for (const era of eraData) {
    const startX = era.startYear * pixelsPerYear + translateX;
    const endX = era.endYear * pixelsPerYear + translateX;

    // 可視範囲チェック
    if (endX < 0 || startX > width) continue;

    // 背景帯描画
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(era.color));
    canvas.drawRect(
      Skia.XYWHRect(startX, 0, endX - startX, height),
      paint
    );
  }
}

function drawEvents(canvas, { width, height, pixelsPerYear, translateX }) {
  // 主要イベントのマーカー描画
  for (const event of eventData) {
    const x = event.startYear * pixelsPerYear + translateX;

    if (x < 0 || x > width) continue;

    const paint = Skia.Paint();
    paint.setColor(Skia.Color(getEventColor(event.tag)));

    // イベント点
    const radius = getRadiusByImportance(event.importanceLevel);
    canvas.drawCircle(x, height / 2, radius, paint);

    // 期間イベント対応（endDate がある場合）
    if (event.endDate) {
      const endX = event.endDate * pixelsPerYear + translateX;
      canvas.drawLine(x, height / 2, endX, height / 2, paint);
    }
  }
}
```

### タップ検出

```typescript
function getEventAtPoint(x: number, y: number, { pixelsPerYear, translateX }) {
  for (const event of eventData) {
    const eventX = event.startYear * pixelsPerYear + translateX;
    const distance = Math.abs(x - eventX);

    // ヒット領域：16pt (44pt recommended min から縮小)
    if (distance < 16) {
      return event;
    }
  }
  return null;
}
```

---

## ファイル構成

```
components/
├── timeline/
│   ├── TimelineCanvas.tsx      # メイン描画エンジン
│   ├── drawEras.ts             # 時代帯描画
│   ├── drawEvents.ts           # イベントマーカー描画
│   └── hitDetection.ts         # タップ検出
│
domain/
└── timeline/
    ├── coordinateSystem.ts     # 年→ピクセル変換
    └── constants.ts            # Magic numbers
```

---

## テスト項目

### ビジュアルテスト

- [ ] 全時代が色で区別できる
- [ ] イベントマーカーがバラけて見える（重ならない）
- [ ] スクロール時にマーカーが滑らかに動く

### インタラクションテスト

- [ ] イベント●をタップ → EventDetail 表示
- [ ] 時代背景帯をタップ → Era情報または Era Picker トリガー
- [ ] ピンチズーム → 滑らかに拡大縮小

### パフォーマンステスト

- [ ] フレームレート測定：**60fps 維持**
- [ ] メモリ使用量：**< 150MB**
- [ ] 描画時間：**< 16ms / frame**

---

## リスク・対応

| リスク                   | 対応                                       |
| ------------------------ | ------------------------------------------ |
| 幕末〜明治の密集描画破綻 | Sprint 0 検証結果を活用、LODルール適用     |
| テキスト重複             | テキスト衝突検出、動的配置アルゴリズム実装 |
| パフォーマンス低下       | バーチャライゼーション強化                 |

---

## 次のステップ

- ✅ 020 完了 → チケット 021 (Zoom Manager) 統合開始
- ✅ 020 完了 → チケット 022 (LOD Manager) 統合開始
- ✅ 020 完了 → チケット 023 (Era Picker) 統合開始

---

**作成日:** 2025-01-25
**優先度:** P0 - Critical
**推定工数:** 3d
**ステータス:** In Progress (Phase 1-7 基本実装完了)
**ブロッカー:** 012, 014 完了 ✓
