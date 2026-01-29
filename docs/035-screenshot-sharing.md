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
- ✅ ボタンタップ → ActionSheet/Alert で選択肢表示
- ✅ スクリーンショット自動生成
- ✅ キャプション自動生成（例："1868年 明治時代 - 15 のイベント"）
- ✅ iOS/Android で SNS 共有可能（キャプション付き）
- ✅ フォトライブラリへのローカル保存

---

## ユーザーストーリー

```
As a 教育シーン
I want to タイムラインのスクリーンショットを SNS で共有したい
So that クラスメイトや同級生と情報を共有できる
```

---

## 受け入れ条件

| #   | 条件                                     | 検証方法         | 担当 |
| --- | ---------------------------------------- | ---------------- | ---- |
| 1   | Timeline 上部に "Share" ボタン表示       | UI 確認          | -    |
| 2   | ボタンタップ → ActionSheet/Alert 表示    | 実機テスト       | -    |
| 3   | スクリーンショット生成                   | 実機テスト       | -    |
| 4   | キャプション自動生成（年号・Era・件数）  | 出力確認         | -    |
| 5   | SNS 共有フロー（キャプション付き）       | 共有テスト       | -    |
| 6   | フォトライブラリ保存                     | 保存テスト       | -    |
| 7   | iOS/Android 両対応                       | 両デバイステスト | -    |

---

## 依存関係

| 種類             | 詳細                                              |
| ---------------- | ------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings), 020 (Timeline Canvas)             |
| ✗ コード依存     | react-native-view-shot, react-native-share, expo-sharing, expo-media-library, expo-constants |
| ✗ 他チケット依存 | なし                                              |

---

## 実装ガイドライン

### 1. Share ボタン（Timeline 上部）

```typescript
// app/(tabs)/index.tsx
import { useRef, useState } from 'react';
import {
  View,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Share from 'react-native-share';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { generateCaption } from '@/utils/screenshotCaption';

// 環境判定: Expo Go ではネイティブモジュールが使えないため expo-sharing を使用
const isExpoGo = Constants.appOwnership === 'expo';

export default function TimelineScreen() {
  const timelineRef = useRef<View>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [isCapturing, setIsCapturing] = useState(false);

  // スクリーンショットをキャプチャ
  const captureScreenshot = async (): Promise<string | null> => {
    if (!timelineRef.current) return null;
    try {
      const uri = await captureRef(timelineRef, {
        format: 'png',
        quality: 0.9,
      });
      return uri;
    } catch (error) {
      console.error('Capture failed:', error);
      return null;
    }
  };

  // SNS共有
  const shareScreenshot = async () => {
    setIsCapturing(true);
    try {
      const uri = await captureScreenshot();
      if (!uri) return;
      const caption = generateCaption(eras, events, screenWidth);

      if (isExpoGo) {
        // Expo Go: expo-sharing（キャプションは dialogTitle のみ、本文には載らない）
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { dialogTitle: caption });
        }
      } else {
        // Development Build / Standalone: react-native-share でキャプション本文共有
        await Share.open({
          url: uri,
          message: caption,
          title: 'JidaiScope タイムライン',
        });
      }
    } catch (error) {
      if ((error as Error).message !== 'User did not share') {
        console.error('Share failed:', error);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // ローカル保存
  const saveToPhotos = async () => {
    setIsCapturing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限が必要です', '写真を保存するにはフォトライブラリへのアクセス許可が必要です。');
        return;
      }
      const uri = await captureScreenshot();
      if (!uri) return;
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('保存完了', 'タイムラインを写真に保存しました。');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('エラー', '保存に失敗しました。');
    } finally {
      setIsCapturing(false);
    }
  };

  // シェアボタンタップ時のアクション
  const handleSharePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['キャンセル', 'SNSで共有', '写真に保存'], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) void shareScreenshot();
          else if (buttonIndex === 2) void saveToPhotos();
        }
      );
    } else {
      Alert.alert('スクリーンショット', '操作を選択してください', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '写真に保存', onPress: () => void saveToPhotos() },
        { text: 'SNSで共有', onPress: () => void shareScreenshot() },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerButtons}>
        <Pressable onPress={handleSharePress} disabled={isCapturing}>
          <Ionicons name="share-social-outline" size={24} color="#718096" />
        </Pressable>
      </View>

      <View ref={timelineRef} style={{ flex: 1 }} collapsable={false}>
        {/* Timeline Canvas */}
      </View>
    </View>
  );
}
```

### 2. キャプション自動生成

```typescript
// utils/screenshotCaption.ts
import type { Era, HistoricalEvent } from '@/types/database';
import { useTimelineStore } from '@/stores/timelineStore';
import { getVisibleYearRange, extractYearFromDate } from '@/domain/timeline/coordinateSystem';

export function generateCaption(
  eras: Era[],
  events: HistoricalEvent[],
  screenWidth: number
): string {
  const { scrollX, zoomLevel } = useTimelineStore.getState();

  // 既存ユーティリティで可視範囲を計算
  const { startYear, endYear } = getVisibleYearRange({
    screenWidth,
    screenHeight: 0,
    zoomLevel,
    scrollX,
  });

  const centerYear = Math.floor((startYear + endYear) / 2);

  // 可視時代を取得（中心年を含む時代を優先）
  const visibleEras = eras.filter(
    (era) => era.endYear >= startYear && era.startYear <= endYear
  );
  const primaryEra = visibleEras.find(
    (era) => centerYear >= era.startYear && centerYear <= era.endYear
  ) ?? visibleEras[0];
  const eraName = primaryEra?.name ?? '';

  // 可視イベント数
  const visibleEventCount = events.filter((e) => {
    const year = extractYearFromDate(e.startDate);
    return year >= startYear && year <= endYear;
  }).length;

  // 年号表示のフォーマット（紀元前対応）
  const yearDisplay = centerYear < 0 ? `紀元前${Math.abs(centerYear)}年` : `${centerYear}年`;

  return `📅 ${yearDisplay} ${eraName} - ${visibleEventCount}件のイベント\n\n#JidaiScope で日本史を学ぼう！`;
}
```

### 3. パッケージインストール

```bash
npx expo install react-native-view-shot expo-sharing expo-media-library expo-constants
npm install react-native-share
```

> **注:**
> - `expo-sharing` は `dialogTitle` のみで本文共有ができない
> - `react-native-share` はネイティブモジュールのため Expo Go では動作しない
> - **実装では `expo-constants` で環境判定し、Expo Go では `expo-sharing`、Development Build / Standalone では `react-native-share` を使い分ける**

---

## Todo リスト

### Phase 1: UI 実装

- [x] Timeline 上部に Share ボタン（Settings ボタンの左隣）
- [x] アイコン・スタイル（Ionicons `share-social-outline`）

### Phase 2: スクリーンショット生成

- [x] react-native-view-shot 統合
- [x] PNG 形式、品質 0.9

### Phase 3: キャプション生成

- [x] generateCaption() 実装（utils/screenshotCaption.ts）
- [x] 年号・Era・件数を含む（紀元前対応）

### Phase 4: SNS 共有

- [x] react-native-share 統合（Development Build 用、キャプション本文共有）
- [x] expo-sharing フォールバック（Expo Go 用、dialogTitle のみ）
- [x] expo-constants で環境判定（isExpoGo）
- [x] iOS Share Sheet（ActionSheetIOS）
- [x] Android Intent（Alert）

### Phase 4.5: ローカル保存

- [x] expo-media-library 統合
- [x] フォトライブラリ権限リクエスト
- [x] 保存成功/エラーアラート表示

### Phase 5: テスト

- [ ] iOS でスクリーンショット + 共有（実機検証待ち）
- [ ] Android で同様
- [ ] キャプション正確性確認

---

## ファイル構成

```
utils/
└── screenshotCaption.ts     # キャプション生成ユーティリティ

app/(tabs)/
└── index.tsx                # Timeline画面（Share ボタン追加）
```

---

**作成日:** 2025-01-25
**優先度:** P1
**推定工数:** 1d
**ステータス:** Completed
**ブロッカー:** 020 (Timeline Canvas)
