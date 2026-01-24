# 053: Analytics（Sprint 5）

## 概要

**目的:** ユーザー行動を計測し、機能利用状況・UX 改善の指標を収集

**スコープ:**

- 画面ビュー計測（Screen View）
- イベント計測（EventTap, ZoomAction, Search, Bookmark）
- ユーザープロパティ（Pro/Free, Theme, Language）
- セッション管理
- Amplitude or Firebase Analytics 統合

**成功基準:**

- ✅ 主要イベント（10+）のトラッキング実装
- ✅ Pro/Free ユーザー別の行動分析可能
- ✅ 画面遷移フロー可視化
- ✅ リアルタイムダッシュボード確認可能

---

## ユーザーストーリー

```
As a プロダクト マネージャー
I want to ユーザー行動データを分析したい
So that UX 改善の優先順位を決定できる
```

---

## 受け入れ条件

| #   | 条件                           | 検証方法             | 担当 |
| --- | ------------------------------ | -------------------- | ---- |
| 1   | Screen View 計測               | Dashboard 確認       | -    |
| 2   | 主要イベント 10+ 計測          | イベント一覧確認     | -    |
| 3   | ユーザープロパティ（Pro/Free） | Cohort 分析確認      | -    |
| 4.  | リアルタイムデータ             | Dashboard ライブ確認 | -    |
| 5   | GDPR 対応（オプトアウト）      | Settings 確認        | -    |

---

## 依存関係

| 種類             | 詳細                                               |
| ---------------- | -------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings store), 040 (Settings screen)        |
| ✗ コード依存     | expo-analytics or @react-native-firebase/analytics |
| ✗ 他チケット依存 | なし                                               |

---

## トラッキング仕様

### Screen View イベント

```typescript
const SCREEN_EVENTS = {
  TIMELINE_VIEW: "timeline_view",
  EVENT_DETAIL_VIEW: "event_detail_view",
  PERSON_DETAIL_VIEW: "person_detail_view",
  SEARCH_VIEW: "search_view",
  BOOKMARKS_VIEW: "bookmarks_view",
  SETTINGS_VIEW: "settings_view",
};
```

### ユーザーアクション イベント

```typescript
const ACTION_EVENTS = {
  ZOOM_PINCH: "zoom_pinch",
  ZOOM_DOUBLE_TAP: "zoom_double_tap",
  ERA_TAP: "era_tap",
  EVENT_TAP: "event_tap",
  SEARCH_QUERY: "search_query",
  BOOKMARK_ADD: "bookmark_add",
  BOOKMARK_REMOVE: "bookmark_remove",
  LAYER_TOGGLE: "layer_toggle",
  IAP_PURCHASE: "iap_purchase",
};
```

### ユーザープロパティ

```typescript
interface UserProperties {
  userId: string; // UUID
  tier: "free" | "pro";
  language: "ja" | "en";
  theme: "dark" | "light";
  installDate: string; // ISO8601
  firstOpenDate: string;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
}
```

---

## 実装ガイドライン

### 1. Analytics Store

```typescript
// stores/analyticsStore.ts
import * as Analytics from "expo-analytics";

interface AnalyticsState {
  trackScreenView: (screenName: string) => void;
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  setUserProperties: (props: UserProperties) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  trackScreenView: async (screenName: string) => {
    await Analytics.setCurrentScreen(screenName);
  },

  trackEvent: async (eventName: string, params = {}) => {
    await Analytics.logEvent(eventName, params);
  },

  setUserProperties: async (props: UserProperties) => {
    await Analytics.setUserId(props.userId);
    await Analytics.setUserProperties(props);
  },
}));
```

### 2. Screen View トラッキング

```typescript
// app/(tabs)/index.tsx
import { useFocusEffect } from '@react-navigation/native';
import { useAnalyticsStore } from '@/stores/analyticsStore';

export default function TimelineScreen() {
  const { trackScreenView } = useAnalyticsStore();

  useFocusEffect(() => {
    trackScreenView('Timeline');
  });

  return <View>{/* ... */}</View>;
}
```

### 3. イベント トラッキング

```typescript
// components/TimelineCanvas.tsx
const handleEventTap = async (eventId: string) => {
  await triggerMediumHaptic();
  useAnalyticsStore.getState().trackEvent("event_tap", {
    eventId,
    eraId: event.eraId,
    importance: event.importanceLevel,
  });

  router.push(`/event/${eventId}`);
};
```

### 4. ユーザープロパティ設定（初回 + 購入時）

```typescript
// app/_layout.tsx
import { useSettingsStore } from "@/stores/settingsStore";
import { useIAPStore } from "@/stores/iapStore";

export default function RootLayout() {
  const { language, theme } = useSettingsStore();
  const { proUnlocked } = useIAPStore();
  const { setUserProperties } = useAnalyticsStore();

  useEffect(() => {
    setUserProperties({
      userId: generateUUID(),
      tier: proUnlocked ? "pro" : "free",
      language,
      theme,
      // ... other props
    });
  }, [proUnlocked, language, theme]);
}
```

---

## Todo リスト

### Phase 1: Amplitude or Firebase 選定

- [ ] Amplitude vs Firebase Analytics 比較
- [ ] 取得・設定（API key etc）

### Phase 2: Analytics Store 実装

- [ ] useAnalyticsStore 作成
- [ ] trackScreenView, trackEvent, setUserProperties

### Phase 3: Screen View トラッキング

- [ ] 全 Screen に useFocusEffect 追加
- [ ] 画面ビュー計測

### Phase 4: イベント トラッキング

- [ ] 10+ の主要ユーザーアクション計測
- [ ] パラメータ設定

### Phase 5: ユーザープロパティ

- [ ] 初回起動時にプロパティ設定
- [ ] Pro 購入時にアップデート

### Phase 6: ダッシュボード・レポート

- [ ] Dashboard 作成
- [ ] Cohort 分析設定
- [ ] リアルタイムイベント確認

---

**作成日:** 2026-01-25
**優先度:** P2
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** なし
