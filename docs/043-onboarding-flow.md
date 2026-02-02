# 043: Onboarding Flow（Sprint 3）

> **移動通知:** Sprint 4 → Sprint 3 に移動しました（v4.0）
> ジェスチャー中心のUIでは、オンボーディングがないと発見可能性が低下するため、MVP必須としました。

## 概要

**目的:** 初回ユーザーに対して、アプリの基本的な使い方と価値を数ステップで説明

**スコープ:**

- ウェルカムスクリーン（タイムライン紹介）
- ジェスチャーチュートリアル（ピンチズーム - 最重要機能）
- 時代ジャンプ紹介（EraPickerBar）
- スキップ可能、完了後は非表示
- **プログレッシブ開示**: 高度な機能は使用時に説明

**成功基準:**

- ✅ **3ステップ**の簡潔なOnboarding完成（認知負荷軽減）
- ✅ ジェスチャーチュートリアル動作
- ✅ 初回起動時のみ自動表示
- ✅ スキップボタンで即座にメイン画面へ
- ✅ プログレッシブ開示で高度な機能を段階的に紹介

---

## ユーザーストーリー

```
As a 初回ユーザー
I want to アプリの基本的な使い方を学びたい
So that タイムラインを効果的に操作できる
```

---

## 受け入れ条件

| #   | 条件                            | 検証方法             | 担当 |
| --- | ------------------------------- | -------------------- | ---- |
| 1   | 初回起動時に Onboarding 表示    | 新規インストール確認 | -    |
| 2   | ウェルカムスクリーン表示        | UI 確認              | -    |
| 3   | ピンチズームチュートリアル動作  | 実機テスト           | -    |
| 4   | "スキップ" ボタンでメイン画面へ | UI 動作              | -    |
| 5   | 2 回目以降は非表示              | LocalStorage 確認    | -    |

---

## 依存関係

| 種類             | 詳細                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| ✓ 入力依存       | 014 (Settings/Onboarding store), 020 (Timeline canvas), 021 (Zoom gesture) |
| ✗ コード依存     | なし                                                                       |
| ✗ 他チケット依存 | なし（MVP は全機能無料、IAP/Pro 紹介は v1.5 で追加）                        |

---

## オンボーディングステップ（3ステップ構成 - v4.1改善）

> **設計方針:** 認知負荷を軽減するため、初回オンボーディングは3ステップに圧縮。
> 高度な機能（レイヤー、検索フィルター等）はプログレッシブ開示で使用時に説明。

### Step 1: ウェルカム

```
┌──────────────────────────────┐
│                              │
│    📅 JidaiScope へようこそ   │
│                              │
│  日本史を時間軸で理解しよう    │
│                              │
│  ┌────────────────────────┐  │
│  │  [タイムラインプレビュー] │  │
│  │  縄文〜令和のイメージ   │  │
│  └────────────────────────┘  │
│                              │
│ ┌──────────────────────────┐ │
│ │   はじめる →             │ │
│ └──────────────────────────┘ │
│                              │
│  スキップ                    │
│                              │
└──────────────────────────────┘
```

### Step 2: ピンチズーム（最重要機能）

```
┌──────────────────────────────┐
│                              │
│  🖐️ ピンチで時代を探索       │
│                              │
│  ┌────────────────────────┐  │
│  │  [Lottieアニメーション]  │  │
│  │  2本の指で広げる →     │  │
│  │  詳細が表示！          │  │
│  └────────────────────────┘  │
│                              │
│  ズームすると：              │
│  ・年代目盛りが詳細に        │
│  ・イベント・人物が登場       │
│  ・タップで詳細表示          │
│                              │
│ ┌──────────────────────────┐ │
│ │  次へ →                  │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### Step 3: 時代ジャンプ

```
┌──────────────────────────────┐
│                              │
│  🏯 時代へすぐジャンプ        │
│                              │
│  ┌────────────────────────┐  │
│  │ [EraPickerBarプレビュー] │  │
│  │ [縄文][弥生]...[令和]   │  │
│  │       ↓ タップ！        │  │
│  └────────────────────────┘  │
│                              │
│  画面上部のバーから           │
│  見たい時代を選んでタップ      │
│                              │
│ ┌──────────────────────────┐ │
│ │  探索開始！ 🚀            │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

---

## プログレッシブ開示（初回以降のTips）

> 高度な機能は使用時に段階的に紹介

### 初回イベントタップ時
```
┌─────────────────────────┐
│ 💡 Tip: ブックマーク     │
│ 右上の☆でお気に入り登録  │
│ あとで見返せます        │
│              [OK]      │
└─────────────────────────┘
```

### 3回目起動時（メインタイムライン表示後）
```
┌─────────────────────────────────┐
│ 💡 知ってた？                    │
│ 設定で天皇・将軍レイヤーを       │
│ ON/OFFできます                  │
│              [見てみる] [あとで] │
└─────────────────────────────────┘
```

### 初回検索実行時
```
┌──────────────────────────┐
│ 💡 和暦でも検索できます    │
│ 例: 「明治」「天平」      │
│               [OK]       │
└──────────────────────────┘
```

---

## 実装ガイドライン

### 1. Onboarding Store（014 対応）

```typescript
// stores/onboardingStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  completed: boolean;
  markCompleted: () => Promise<void>;
  checkCompleted: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: false,

  markCompleted: async () => {
    await AsyncStorage.setItem("@onboarding/completed", "true");
    set({ completed: true });
  },

  checkCompleted: async () => {
    const completed = await AsyncStorage.getItem("@onboarding/completed");
    set({ completed: completed === "true" });
  },
}));
```

### 2. Root Layout で初期化

```typescript
// app/_layout.tsx
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect } from 'react';

export default function RootLayout() {
  const checkCompleted = useOnboardingStore((s) => s.checkCompleted);

  useEffect(() => {
    checkCompleted();
  }, []);

  return (
    // ... Layout
  );
}
```

### 3. Onboarding スクリーン

```typescript
// app/onboarding/index.tsx
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboardingStore';

// 3ステップ構成（v4.1改善 - 認知負荷軽減）
const STEPS = [
  {
    id: 'welcome',
    title: 'JidaiScope へようこそ',
    description: '日本史を時間軸で理解しよう',
    showPreview: true, // タイムラインプレビュー表示
  },
  {
    id: 'gesture',
    title: '🖐️ ピンチで時代を探索',
    description: 'ズームすると：\n・年代目盛りが詳細に\n・イベント・人物が登場\n・タップで詳細表示',
    showAnimation: true, // Lottieアニメーション表示
  },
  {
    id: 'era-jump',
    title: '🏯 時代へすぐジャンプ',
    description: '画面上部のバーから\n見たい時代を選んでタップ',
    showEraPickerPreview: true, // EraPickerBarプレビュー表示
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await markCompleted();
      router.replace('/(tabs)');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await markCompleted();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={false}
      >
        {/* プログレスバー */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ステップコンテンツ */}
        <View style={styles.stepContainer}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {/* Step 2: ジェスチャーチュートリアル */}
          {step.id === 'gesture' && <GestureDemo />}
        </View>

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          <Pressable onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentStep === 0 ? 'はじめる →' :
               isLastStep ? '探索開始！ 🚀' : '次へ →'}
            </Text>
          </Pressable>

          {!isLastStep && (
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>スキップ</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ジェスチャーデモ
function GestureDemo() {
  const [scale, setScale] = useState(1);

  return (
    <View style={styles.gestureDemo}>
      <View
        style={[
          styles.gestureDemoContent,
          { transform: [{ scale: scale }] },
        ]}
      >
        <Text style={styles.gestureDemoText}>📊 Timeline</Text>
      </View>
      <Text style={styles.gestureDemoHint}>
        (イメージ: 2本の指で広げるジェスチャーを表示)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D3748',
  },
  progressDotActive: {
    backgroundColor: '#4FD1C5',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F7FAFC',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#A0AEC0',
    lineHeight: 24,
    textAlign: 'center',
  },
  gestureDemo: {
    marginTop: 24,
    alignItems: 'center',
  },
  gestureDemoContent: {
    width: 120,
    height: 120,
    backgroundColor: '#1A1F2E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gestureDemoText: {
    fontSize: 20,
  },
  gestureDemoHint: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  nextButton: {
    backgroundColor: '#4FD1C5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: '#2D3748',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#A0AEC0',
  },
});
```

### 4. ルーティング統合

```typescript
// app/(tabs)/_layout.tsx
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function TabsLayout() {
  const completed = useOnboardingStore((s) => s.completed);
  const router = useRouter();

  useEffect(() => {
    if (!completed) {
      router.replace('/onboarding');
    }
  }, [completed]);

  return (
    // ... Tabs
  );
}
```

---

## Todo リスト

### Phase 1: Onboarding Store

- [ ] useOnboardingStore 作成
- [ ] AsyncStorage で "completed" フラグ保存
- [ ] 初回起動時に自動チェック
- [ ] プログレッシブ開示用フラグ追加（tips表示済みトラッキング）

### Phase 2: Onboarding スクリーン（3ステップ）

- [ ] app/onboarding/index.tsx 作成
- [ ] **3 ステップ**コンポーネント実装（v4.1改善）
- [ ] プログレスバー表示（3ドット）
- [ ] はじめる / 次へ / 探索開始ボタン

### Phase 3: ジェスチャーチュートリアル

- [ ] GestureDemo コンポーネント
- [ ] Lottieアニメーション（ピンチズーム）
- [ ] EraPickerBarプレビュー

### Phase 4: ルーティング統合

- [ ] app/\_layout.tsx で onboarding チェック
- [ ] 初回起動時に /onboarding へリダイレクト
- [ ] 2 回目以降は /（tabs）へ直接

### Phase 5: プログレッシブ開示（Tips）

- [ ] TipModal コンポーネント作成
- [ ] 初回イベントタップ時 → ブックマークTip
- [ ] 3回目起動時 → レイヤー設定Tip
- [ ] 初回検索時 → 和暦検索Tip
- [ ] Tips表示済みフラグをAsyncStorageに保存

### Phase 6: テスト

- [ ] 新規インストール → 3ステップOnboarding表示
- [ ] ジェスチャーデモ動作確認
- [ ] スキップ → メイン画面へ
- [ ] 2 回目起動 → Onboarding なし
- [ ] プログレッシブTips表示確認

---

## ファイル構成

```
stores/
└── onboardingStore.ts       # Onboarding 状態管理

app/
├── onboarding/
│   └── index.tsx            # Onboarding スクリーン
└── _layout.tsx              # 条件付きルーティング

components/
└── GestureDemo.tsx          # ジェスチャーデモ
```

---

## テスト項目

| テスト           | 手順                         | 期待値                              |
| ---------------- | ---------------------------- | ----------------------------------- |
| 初回起動         | アプリ起動（キャッシュ削除） | 3ステップOnboarding表示             |
| ステップナビ     | 各ステップで "次へ"          | 3ステップで完了                     |
| ジェスチャーデモ | Step 2 表示                  | Lottieアニメーション表示            |
| EraPickerプレビュー | Step 3 表示               | EraPickerBarプレビュー表示          |
| スキップ         | Step 1-2で "スキップ"        | メイン画面へ遷移                    |
| 完了時           | Step 3 で "探索開始"         | onboarding/completed フラグ ON      |
| 2 回目起動       | アプリ再起動                 | Onboarding スキップ、メイン画面表示 |
| プログレッシブTip1 | 初回イベントタップ         | ブックマークTip表示                 |
| プログレッシブTip2 | 3回目起動                  | レイヤー設定Tip表示                 |

---

**作成日:** 2026-01-25
**更新日:** 2026-01-31
**優先度:** P0（P2から昇格）
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 014 (Settings/Onboarding store) ✅
**Sprint:** 3（4から移動）

---

## 変更履歴

### v4.2 (2026-01-31)
- 依存関係を明確化: MVP は全機能無料、Pro/IAP 関連は v1.5 で対応
- Pro 紹介への言及を整理（MVP には含まれない）

### v4.1 (2026-01-31)
- UI/UX改善: 8ステップ→**3ステップ**に簡素化（認知負荷軽減）
- プログレッシブ開示: 高度な機能は使用時にTipsで紹介
- Step 3 を「時代ジャンプ」に変更
- Lottieアニメーション導入
- TipModalコンポーネント追加

### v4.0 (2026-01-31)
- Sprint 4 → Sprint 3 に移動（MVP必須化）
- 優先度を P2 → P0 に昇格
- 042 (Paywall) 依存を解除
