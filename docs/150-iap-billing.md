# 150: IAP Billing（Sprint 4）

## 概要

**目的:** App Store / Google Play を通じた買い切り課金（Pro ティア ¥480）を実装

**スコープ:**

- react-native-iap with StoreKit 2（iOS）
- Google Play Billing（Android）
- 購入フロー: SKProduct → 決済 → receipt 検証
- 購入済みアイテムの復元
- オフライン時の graceful degradation

**成功基準:**

- ✅ iOS/Android で課金フロー完成
- ✅ receipt を検証して Pro ティア unlock
- ✅ 復元機能で既購入ユーザーを復帰可能
- ✅ エラー時の fallback 実装

---

## ユーザーストーリー

```
As an 有料機能を求めるユーザー
I want to App Store / Google Play から Pro 版を購入したい
So that 全機能（Emperor/Shogun/Person レイヤー）にアクセスできる
```

---

## 受け入れ条件

| #   | 条件                                  | 検証方法         | 担当 |
| --- | ------------------------------------- | ---------------- | ---- |
| 1   | iOS で SKProduct 取得・表示可能       | Sandbox 課金     | -    |
| 2   | 購入処理完了後 receipt 取得           | コンソール確認   | -    |
| 3   | receipt 検証後 Pro フラグが立つ       | Store state 確認 | -    |
| 4   | "購入済み商品を復元" ボタンで復帰可能 | Restore flow     | -    |
| 5   | ネットワークエラー時に retry UI 表示  | ネットワーク OFF | -    |
| 6   | Android でも同期動作                  | Android テスト   | -    |

---

## 依存関係

| 種類             | 詳細                                                  |
| ---------------- | ----------------------------------------------------- |
| ✓ 入力依存       | 020 (IAP store), 140 (Settings screen), 160 (Paywall) |
| ✗ コード依存     | react-native-iap, StoreKit 2                          |
| ✗ 他チケット依存 | なし                                                  |

---

## 技術仕様

### App Store / Google Play 設定

| プラットフォーム           | 商品 ID              | 価格 | 説明               |
| -------------------------- | -------------------- | ---- | ------------------ |
| **iOS（App Store）**       | `com.jidaiscope.pro` | ¥480 | Pro ティア買い切り |
| **Android（Google Play）** | `com.jidaiscope.pro` | ¥480 | Pro ティア買い切り |

### 購入フロー

```
┌─────────────────┐
│ 表示: SKProduct │ (product ID から取得)
│ ¥480 Pro 版     │
└────────┬────────┘
         ↓
┌─────────────────┐
│ ユーザータップ  │
└────────┬────────┘
         ↓
┌─────────────────────────┐
│ requestSubscription()    │ ← react-native-iap
│ (iOS: StoreKit 2)       │
│ (Android: Play Billing) │
└────────┬────────────────┘
         ↓
┌─────────────────┐
│ receipt 取得    │
└────────┬────────┘
         ↓
┌──────────────────────────┐
│ receipt 検証              │
│ (Apple / Google servers) │
└────────┬─────────────────┘
         ↓
┌─────────────────┐
│ Pro フラグON    │
│ StoreUNLOCK     │
└─────────────────┘
```

### IAP Store（020 対応）

```typescript
interface IAPState {
  products: SKProduct[];
  purchases: InAppPurchase[];
  proUnlocked: boolean;
  isLoading: boolean;
  error?: string;

  initIAP: () => Promise<void>;
  requestPurchase: (productId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkPro: () => Promise<void>;
}

interface SKProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
}

interface InAppPurchase {
  productId: string;
  transactionId: string;
  purchaseTime: number;
  purchaseState: "pending" | "purchased" | "failed";
  receipt: string;
}
```

### Receipt 検証エンドポイント（v1.1 予定）

```typescript
// v1.1 での外部サーバー検証実装
interface ReceiptValidationRequest {
  receipt: string; // Base64 encoded
  platform: "ios" | "android";
}

// 検証レスポンス
interface ReceiptValidationResponse {
  valid: boolean;
  productId: string;
  expiresDate?: number; // サブスク時のみ
  transactionId: string;
}
```

---

## 実装ガイドライン

### 1. react-native-iap のセットアップ

```typescript
// utils/iap.ts
import RNIap, {
  purchaseUpdatedListener,
  purchaseErrorListener,
  initConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  withIAPContext,
} from "react-native-iap";
import { Platform } from "react-native";

const SKU_IOS = "com.jidaiscope.pro";
const SKU_ANDROID = "com.jidaiscope.pro";
const SKUS = Platform.select({
  ios: [SKU_IOS],
  android: [SKU_ANDROID],
});

export async function initIAP() {
  try {
    await initConnection();
    console.log("IAP connected");
  } catch (error) {
    console.error("IAP init failed:", error);
  }
}

export async function getProductsForSale() {
  try {
    const products = await getProducts(SKUS);
    return products;
  } catch (error) {
    console.error("Get products failed:", error);
    return [];
  }
}
```

### 2. IAP Store 実装（020 対応）

```typescript
// stores/iapStore.ts
import { create } from "zustand";
import { useSettingsStore } from "./settingsStore";
import RNIap, {
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from "react-native-iap";

interface IAPState {
  products: any[];
  proUnlocked: boolean;
  isLoading: boolean;
  error?: string;

  initIAP: () => Promise<void>;
  requestPurchase: (productId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkPro: () => void;
}

export const useIAPStore = create<IAPState>((set, get) => ({
  products: [],
  proUnlocked: false,
  isLoading: false,

  initIAP: async () => {
    set({ isLoading: true });
    try {
      await initIAP();
      const products = await getProductsForSale();
      set({ products });

      // 既に購入済みか確認
      await get().checkPro();
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  requestPurchase: async (productId: string) => {
    set({ isLoading: true });
    try {
      const receipt = await requestPurchase({
        skus: [productId],
      });

      // receipt を検証（v1.0 では local store、v1.1 では server）
      if (receipt) {
        set({ proUnlocked: true });

        // SecureStore に receipt 保存
        await SecureStore.setItemAsync("receipt", receipt);
      }
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true });
    try {
      const purchases = await getAvailablePurchases();

      const hasPro = purchases.some(
        (p) => p.productId === "com.jidaiscope.pro",
      );

      if (hasPro) {
        set({ proUnlocked: true });
      }
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  checkPro: async () => {
    try {
      const receipt = await SecureStore.getItemAsync("receipt");
      if (receipt) {
        set({ proUnlocked: true });
      }
    } catch (error) {
      console.error("Check pro failed:", error);
    }
  },
}));
```

### 3. 購入ボタン・フロー

```typescript
// components/ProPurchaseButton.tsx
import { Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import { useIAPStore } from '@/stores/iapStore';
import { triggerMediumHaptic } from '@/utils/haptics';

export function ProPurchaseButton() {
  const { products, isLoading, error, requestPurchase } = useIAPStore();

  const proProduct = products.find(
    (p) => p.productId === 'com.jidaiscope.pro'
  );

  const handlePurchase = async () => {
    await triggerMediumHaptic();

    Alert.alert(
      'Pro 版を購入',
      `${proProduct?.localizedPrice} で全機能にアクセスできます`,
      [
        { text: 'キャンセル', onPress: () => {} },
        {
          text: '購入',
          onPress: async () => {
            await requestPurchase(proProduct?.productId);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <Pressable onPress={handlePurchase} style={styles.button}>
      <Text style={styles.text}>
        {proProduct?.localizedPrice} で Pro に升级
      </Text>
    </Pressable>
  );
}
```

### 4. 購入済み復元

```typescript
// app/settings.tsx (抜粋)
import { useIAPStore } from '@/stores/iapStore';

export default function SettingsScreen() {
  const { restorePurchases, proUnlocked } = useIAPStore();

  const handleRestore = async () => {
    await restorePurchases();
    Alert.alert('完了', 'アカウントを復元しました');
  };

  return (
    <ScrollView>
      {/* ... 既存セクション */}

      {!proUnlocked && (
        <SettingsSection title="課金">
          <SettingRow
            label="購入済み商品を復元"
            value="復元"
            onPress={handleRestore}
          />
        </SettingsSection>
      )}
    </ScrollView>
  );
}
```

### 5. エラーハンドリング

```typescript
// 購入エラー時
purchaseErrorListener((error) => {
  console.error("Purchase error:", error);

  switch (error.code) {
    case "E_USER_CANCELLED":
      // ユーザーがキャンセル
      break;
    case "E_NETWORK_ERROR":
      Alert.alert("ネットワークエラー", "接続を確認して再度お試しください");
      break;
    case "E_ALREADY_OWNED":
      Alert.alert("購入済み", "このアイテムは既に購入しています");
      break;
    default:
      Alert.alert("エラー", "購入に失敗しました");
  }
});
```

---

## Todo リスト

### Phase 1: react-native-iap セットアップ

- [ ] package.json に react-native-iap 追加
- [ ] iOS: Xcode で SKProduct 登録
- [ ] Android: Google Play Console で商品設定
- [ ] utils/iap.ts で initialization 関数実装

### Phase 2: IAP Store 実装（020 対応）

- [ ] useIAPStore 作成（Zustand）
- [ ] getProductsForSale()
- [ ] requestPurchase() + receipt 取得
- [ ] checkPro() + SecureStore 連携

### Phase 3: 購入フロー UI

- [ ] ProPurchaseButton コンポーネント
- [ ] 購入確認ダイアログ
- [ ] 購入中のローディング表示
- [ ] エラーアラート

### Phase 4: 復元機能

- [ ] restorePurchases() 実装
- [ ] Settings 画面に "復元" ボタン
- [ ] 既購入ユーザーを Pro に upgrade

### Phase 5: エラーハンドリング

- [ ] ネットワークエラー → retry UI
- [ ] キャンセル → graceful degradation
- [ ] receipt 検証失敗 → fallback

### Phase 6: テスト・最適化

- [ ] iOS Sandbox で購入テスト
- [ ] Android でも動作確認
- [ ] receipt 永続性確認
- [ ] パフォーマンス測定

---

## App Store / Google Play 設定チェックリスト

### iOS（App Store Connect）

- [ ] Bundle ID 確認（com.jidaiscope.app）
- [ ] SKU 登録（com.jidaiscope.pro）
- [ ] 価格設定（¥480）
- [ ] 説明・スクリーンショット追加
- [ ] Sandbox テスター登録

### Android（Google Play Console）

- [ ] Package name 確認（com.jidaiscope.app）
- [ ] 製品 ID（com.jidaiscope.pro）
- [ ] 価格設定（¥480）
- [ ] ライセンスキー設定
- [ ] テスト用アカウント登録

---

## ファイル構成

```
utils/
└── iap.ts                  # react-native-iap setup

stores/
└── iapStore.ts             # IAP 状態管理（020 拡張）

components/
└── ProPurchaseButton.tsx   # 購入ボタン

app/
└── settings.tsx            # 復元ボタン統合
```

---

## テスト項目

| テスト           | 手順                     | 期待値                            |
| ---------------- | ------------------------ | --------------------------------- |
| 商品表示         | Pro 画面を開く           | ¥480 の商品表示                   |
| 購入フロー       | "購入" ボタンをタップ    | Apple/Google 認証後、receipt 取得 |
| receipt 検証     | 購入完了                 | proUnlocked = true                |
| 復元             | "復元" ボタン → 前回購入 | Pro 復帰                          |
| ネットワーク OFF | オフライン時に購入試行   | エラーアラート + retry            |
| キャンセル       | Apple ID キャンセル      | 購入キャンセル、状態変わらず      |

---

**作成日:** 2026-01-25
**優先度:** P1
**推定工数:** 2d
**ステータス:** Not Started
**ブロッカー:** 020 (IAP store base)
