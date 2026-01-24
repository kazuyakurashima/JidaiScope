# 035: Screenshot Sharing（Sprint 3）

## 概要

**目的:** ユーザーがタイムラインのスクリーンショットを撮影・共有し、社会学習シーンでスクリーンショット + キャプション付きで共有可能に

**スコープ:**

- Timeline キャプチャ UI（"Share" ボタン）
- スクリーンショット自動生成（`react-native-view-shot`）
- キャプション自動生成（表示中の年号 + Era + イベント数）
- SNS 共有（Twitter / LINE）
- ローカル保存

**成功基準:**

- ✅ Timeline 上部に "Share" ボタン表示
- ✅ ボタンタップ → スクリーンショット自動生成
- ✅ キャプション自動生成（例："1868年 明治時代 - 15 のイベント"）
- ✅ iOS/Android で SNS 共有可能

---

## ユーザーストーリー

```
As a 教育シーン
I want to タイムラインのスクリーンショットを SNS で共有したい
So that クラスメイトや同級生と情報を共有できる
```

---

## 受け入れ条件

| #   | 条件                                    | 検証方法         | 担当 |
| --- | --------------------------------------- | ---------------- | ---- |
| 1   | Timeline 上部に "Share" ボタン表示      | UI 確認          | -    |
| 2   | ボタンタップ → スクリーンショット生成   | 実機テスト       | -    |
| 3   | キャプション自動生成（年号・Era・件数） | 出力確認         | -    |
| 4   | SNS 共有フロー（Twitter / LINE）        | 共有テスト       | -    |
| 5   | iOS/Android 両対応                      | 両デバイステスト | -    |

---

## 依存関係

| 種類             | 詳細                                              |
| ---------------- | ------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings), 020 (Timeline Canvas)             |
| ✗ コード依存     | react-native-view-shot, @react-native-share/share |
| ✗ 他チケット依存 | なし                                              |

---

## 実装ガイドライン

### 1. Share ボタン（Timeline 上部）

```typescript
// app/(tabs)/index.tsx
import { Pressable, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Share from '@react-native-share/share';
import { useRef } from 'react';

const timelineRef = useRef(null);

export default function TimelineScreen() {
  const handleShare = async () => {
    try {
      const uri = await captureRef(timelineRef, {
        format: 'png',
        quality: 0.9,
      });

      const caption = generateCaption();

      await Share.open({
        url: uri,
        message: caption,
        title: 'JidaiScope タイムライン',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={handleShare} style={styles.shareButton}>
        <Feather name="share-2" size={20} color="#F7FAFC" />
      </Pressable>

      <View ref={timelineRef} style={{ flex: 1 }}>
        {/* Timeline Canvas */}
      </View>
    </View>
  );
}
```

### 2. キャプション自動生成

```typescript
// utils/screenshotCaption.ts
import { useTimelineStore } from "@/stores/timelineStore";

export function generateCaption(): string {
  const { currentYear, visibleEras, visibleEvents } =
    useTimelineStore.getState();
  const eraNames = visibleEras.map((e) => e.name).join(" / ");

  return `📅 ${currentYear}年 ${eraNames} - ${visibleEvents.length}件のイベント\n\nJidaiScope で日本史を学ぼう！`;
}
```

### 3. react-native-view-shot インストール

```bash
npx expo install react-native-view-shot
npx expo install @react-native-share/share
```

---

## Todo リスト

### Phase 1: UI 実装

- [ ] Timeline 上部に Share ボタン
- [ ] アイコン・スタイル

### Phase 2: スクリーンショット生成

- [ ] react-native-view-shot 統合
- [ ] PNG 形式、品質 0.9

### Phase 3: キャプション生成

- [ ] generateCaption() 実装
- [ ] 年号・Era・件数を含む

### Phase 4: SNS 共有

- [ ] @react-native-share/share 統合
- [ ] iOS Share Sheet
- [ ] Android Intent

### Phase 5: テスト

- [ ] iOS でスクリーンショット + 共有
- [ ] Android で同様
- [ ] キャプション正確性確認

---

**作成日:** 2026-01-25
**優先度:** P1 ← PRD FR-10 に基づき MVP 必須
**推定工数:** 1d
**ステータス:** Not Started
**ブロッカー:** 020 (Timeline Canvas)
