# 043: Onboarding Flow（Sprint 4）

## 概要

**目的:** 初回ユーザーに対して、アプリの基本的な使い方と価値を数ステップで説明

**スコープ:**

- ウェルカムスクリーン（タイムライン紹介）
- ジェスチャーチュートリアル（ピンチズーム）
- 機能紹介（層、検索、ブックマーク）
- 無料版/Pro 版の紹介
- スキップ可能、完了後は非表示

**成功基準:**

- ✅ 3-4 ステップの Onboarding 完成
- ✅ ジェスチャーチュートリアル動作
- ✅ 初回起動時のみ自動表示
- ✅ スキップボタンで即座にメイン画面へ

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
| ✗ 他チケット依存 | 042 (Pro 紹介)                                                             |

---

## オンボーディングステップ

### Step 1: ウェルカム

```
┌──────────────────────────────┐
│                              │
│    📅 JidaiScope へようこそ   │
│                              │
│  日本史を時間軸で理解しよう    │
│                              │
│  -10000年 から 現在まで       │
│  1200以上のイベント、人物が   │
│  タイムラインに集約           │
│                              │
│ ┌──────────────────────────┐ │
│ │   ツアー開始 →            │ │
│ └──────────────────────────┘ │
│                              │
│  スキップ                    │
│                              │
└──────────────────────────────┘
```

### Step 2: ジェスチャーチュートリアル

```
┌──────────────────────────────┐
│                              │
│  🖐️ ピンチズームで拡大・縮小   │
│                              │
│  ┌────────────────────────┐  │
│  │  [Animation]           │  │
│  │  2 本の指で広げる →    │  │
│  │  時間軸が拡大！        │  │
│  └────────────────────────┘  │
│                              │
│  詳細情報がテンコ表示される   │
│  タップしてイベント情報確認   │
│                              │
│ ┌──────────────────────────┐ │
│ │  次へ →                  │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### Step 3: 機能紹介

```
┌──────────────────────────────┐
│                              │
│  🔍 検索・フィルター機能      │
│                              │
│  ・西暦で検索                │
│  ・人物名で検索              │
│  ・Era（時代）で絞り込み     │
│  ・Emperor（天皇）レイヤー   │
│  ・Shogun（将軍）レイヤー    │
│                              │
│  5つのレイヤーを自由に        │
│  ON/OFF できます             │
│                              │
│ ┌──────────────────────────┐ │
│ │  次へ →                  │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### Step 4: Pro 紹介

```
┌──────────────────────────────┐
│                              │
│  ⭐ Pro 版で全機能アンロック   │
│                              │
│  Free:                       │
│  ・Emperor 10/126            │
│  ・Shogun 5/45               │
│  ・Person 20/300             │
│                              │
│  Pro:                        │
│  ・全層の全データ表示         │
│  ・一度購入で永遠使用 ¥480   │
│                              │
│ ┌──────────────────────────┐ │
│ │  完了                    │ │
│ └──────────────────────────┘ │
│                              │
│  興味なし                    │
│                              │
└──────────────────────────────┘
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

const STEPS = [
  {
    id: 'welcome',
    title: 'JidaiScope へようこそ',
    description: '日本史を時間軸で理解しよう\n\n-10000年 から 現在まで\n1200以上のイベント、人物が\nタイムラインに集約',
  },
  {
    id: 'gesture',
    title: '🖐️ ピンチズームで拡大・縮小',
    description: '2本の指で広げる → 時間軸が拡大！\n\n詳細情報がテンコ表示される\nタップしてイベント情報確認',
  },
  {
    id: 'features',
    title: '🔍 検索・フィルター機能',
    description: '・西暦で検索\n・人物名で検索\n・Era（時代）で絞り込み\n・5つのレイヤーをON/OFF',
  },
  {
    id: 'pro',
    title: '⭐ Pro 版で全機能アンロック',
    description: 'Free vs Pro\n\nFree: Emperor 10/126, Shogun 5/45, Person 20/300\n\nPro: 全層の全データ表示（¥480 買い切り）',
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
              {isLastStep ? '完了' : '次へ →'}
            </Text>
          </Pressable>

          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>
              {isLastStep ? '興味なし' : 'スキップ'}
            </Text>
          </Pressable>
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

### Phase 2: Onboarding スクリーン

- [ ] app/onboarding/index.tsx 作成
- [ ] 4 ステップコンポーネント実装
- [ ] プログレスバー表示
- [ ] 次へ / スキップボタン

### Phase 3: ジェスチャーチュートリアル

- [ ] GestureDemo コンポーネント
- [ ] ピンチズームアニメーション（Reanimated）
- [ ] インタラクティブなデモ

### Phase 4: ルーティング統合

- [ ] app/\_layout.tsx で onboarding チェック
- [ ] 初回起動時に /onboarding へリダイレクト
- [ ] 2 回目以降は /（tabs）へ直接

### Phase 5: UX 最適化

- [ ] アニメーション追加
- [ ] 各ステップのタイミング
- [ ] ボタンプレスフィードバック（haptics）

### Phase 6: テスト

- [ ] 新規インストール → Onboarding 表示
- [ ] ジェスチャーデモ動作確認
- [ ] スキップ → メイン画面へ
- [ ] 2 回目起動 → Onboarding なし

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
| 初回起動         | アプリ起動（キャッシュ削除） | Onboarding 画面表示                 |
| ステップナビ     | 各ステップで "次へ"          | ステップ進行                        |
| ジェスチャーデモ | Step 2 表示                  | ピンチズームアニメーション表示      |
| スキップ         | "スキップ" ボタン            | メイン画面へ遷移                    |
| 完了時           | Step 4 で "完了"             | onboarding/completed フラグ ON      |
| 2 回目起動       | アプリ再起動                 | Onboarding スキップ、メイン画面表示 |

---

**作成日:** 2026-01-25
**優先度:** P2
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 014 (Settings/Onboarding store)
