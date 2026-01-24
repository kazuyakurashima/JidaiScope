# 160: Paywall Screen（Sprint 4）

## 概要

**目的:** Free ティアユーザーに対して Pro 機能の価値を伝え、購入を促すペイウォール画面

**スコープ:**

- 機能比較表（Free vs Pro）
- 視覚的な Pro 推奨UI
- "Pro に升级" ボタン → IAP フロー へ
- モーダルで表示可能
- アニメーション付きトランジション

**成功基準:**

- ✅ Free/Pro 機能比較が見やすく表示
- ✅ Pro に升级ボタンで 150 IAP フロー へ
- ✅ モーダル形式で組込み可能
- ✅ 150 チケットと連動

---

## ユーザーストーリー

```
As a Free ティアユーザー
I want to Pro 版でどの機能がアンロックされるか確認したい
So that 購入する価値があるか判断できる
```

---

## 受け入れ条件

| #   | 条件                                      | 検証方法       | 担当 |
| --- | ----------------------------------------- | -------------- | ---- |
| 1   | Free/Pro 機能比較表表示                   | UI 確認        | -    |
| 2   | Emperor/Shogun/Person 層が Pro 限定と明記 | テキスト確認   | -    |
| 3   | "Pro に升级" ボタンで IAP フロー呼び出し  | フロー確認     | -    |
| 4   | モーダルで重ねて表示可能                  | レイアウト確認 | -    |
| 5   | Pro ユーザーには表示しない                | 非表示確認     | -    |

---

## 依存関係

| 種類             | 詳細                                                      |
| ---------------- | --------------------------------------------------------- |
| ✓ 入力依存       | 020 (IAP store), 150 (IAP フロー), 070 (Layer management) |
| ✗ コード依存     | Reanimated (modal transition)                             |
| ✗ 他チケット依存 | なし                                                      |

---

## 機能比較表（PRD セクション 5.2）

### Free vs Pro

| 機能                    | Free          | Pro            |
| ----------------------- | ------------- | -------------- |
| **タイムライン表示**    | ✅            | ✅             |
| **Era 層**              | ✅            | ✅             |
| **Event レイヤー**      | ✅            | ✅             |
| **Emperor 層**          | ❌ 最初の10名 | ✅ 全126名     |
| **Shogun 層**           | ❌ 最初の5名  | ✅ 全45名      |
| **Person 層（著名人）** | ❌ 最初の20名 | ✅ 全200-300名 |
| **ズーム・検索**        | ✅            | ✅             |
| **ブックマーク**        | ✅            | ✅             |
| **価格**                | 無料          | ¥480 買い切り  |

---

## デザイン仕様

### Paywall Modal

```
┌──────────────────────────────┐
│ ✕ (close button)             │
├──────────────────────────────┤
│                              │
│ 🔒 Emperor 層をアンロック    │
│  (Pro 機能紹介)              │
│                              │
│ ┌──────────────────────────┐ │
│ │ Free    │    Pro         │ │
│ ├─────────┼─────────────────│ │
│ │ Era     │ ✅ Era         │ │
│ │ Events  │ ✅ Events      │ │
│ │ Emperor │ ❌ 10/126  ✅  │ │
│ │ Shogun  │ ❌ 5/45    ✅  │ │
│ │ Person  │ ❌ 20/300  ✅  │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │  ¥480 で Pro に升级      │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

---

## 実装ガイドライン

### 1. Paywall コンポーネント

```typescript
// components/PaywallModal.tsx
import { View, Text, ScrollView, StyleSheet, Pressable, Modal } from 'react-native';
import { useIAPStore } from '@/stores/iapStore';
import Feather from '@expo/vector-icons/Feather';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const { products, requestPurchase, isLoading } = useIAPStore();

  const proProduct = products.find(
    (p) => p.productId === 'com.jidaiscope.pro'
  );

  const handlePurchase = async () => {
    await requestPurchase(proProduct?.productId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close ボタン */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#F7FAFC" />
          </Pressable>

          <ScrollView contentContainerStyle={styles.content}>
            {/* ヘッダー */}
            <View style={styles.header}>
              <Feather name="lock" size={40} color="#FDB813" />
              <Text style={styles.headerTitle}>Pro 機能をアンロック</Text>
              <Text style={styles.headerSubtitle}>
                Emperor・Shogun・Person 層を全数表示
              </Text>
            </View>

            {/* 機能比較表 */}
            <View style={styles.comparisonTable}>
              <ComparisonHeader />
              <ComparisonRow feature="Era レイヤー" free={true} pro={true} />
              <ComparisonRow feature="Event レイヤー" free={true} pro={true} />
              <ComparisonRow
                feature="Emperor レイヤー"
                free="10/126"
                pro={true}
              />
              <ComparisonRow
                feature="Shogun レイヤー"
                free="5/45"
                pro={true}
              />
              <ComparisonRow
                feature="Person レイヤー"
                free="20/300+"
                pro={true}
              />
              <ComparisonRow feature="ズーム・検索" free={true} pro={true} />
              <ComparisonRow feature="ブックマーク" free={true} pro={true} />
            </View>

            {/* 価格表示 */}
            <View style={styles.pricing}>
              <Text style={styles.pricingLabel}>買い切り</Text>
              <Text style={styles.price}>
                {proProduct?.localizedPrice || '¥480'}
              </Text>
              <Text style={styles.pricingNote}>一度購入すれば、永遠に使用可能</Text>
            </View>

            {/* 購入ボタン */}
            <Pressable
              onPress={handlePurchase}
              disabled={isLoading}
              style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
            >
              <Text style={styles.purchaseButtonText}>
                {isLoading ? '処理中...' : 'Pro に升级'}
              </Text>
            </Pressable>

            {/* サポートテキスト */}
            <Text style={styles.supportText}>
              ご質問は{' '}
              <Text style={styles.supportLink} onPress={() => {}}>
                こちら
              </Text>
              {' '}からお問い合わせください
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// サブコンポーネント
function ComparisonHeader() {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}></Text>
      <Text style={[styles.tableCell, styles.tableCellFree]}>Free</Text>
      <Text style={[styles.tableCell, styles.tableCellPro]}>Pro</Text>
    </View>
  );
}

interface ComparisonRowProps {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}

function ComparisonRow({ feature, free, pro }: ComparisonRowProps) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{feature}</Text>
      <View style={styles.tableCell}>
        {typeof free === 'boolean' ? (
          <Feather
            name={free ? 'check' : 'x'}
            size={18}
            color={free ? '#48BB78' : '#FC8181'}
          />
        ) : (
          <Text style={styles.limitedText}>{free}</Text>
        )}
      </View>
      <View style={styles.tableCell}>
        {typeof pro === 'boolean' ? (
          <Feather
            name={pro ? 'check' : 'x'}
            size={18}
            color={pro ? '#48BB78' : '#FC8181'}
          />
        ) : (
          <Text style={styles.unlimitedText}>{pro}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A1F2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F7FAFC',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
    textAlign: 'center',
  },
  comparisonTable: {
    marginVertical: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
    backgroundColor: '#0A0E14',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#F7FAFC',
    fontWeight: '500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellFree: {
    backgroundColor: '#1A1F2E',
  },
  tableCellPro: {
    backgroundColor: '#1A1F2E',
  },
  limitedText: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  unlimitedText: {
    fontSize: 12,
    color: '#48BB78',
  },
  pricing: {
    alignItems: 'center',
    marginVertical: 24,
  },
  pricingLabel: {
    fontSize: 12,
    color: '#718096',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FDB813',
    marginTop: 4,
  },
  pricingNote: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 8,
  },
  purchaseButton: {
    backgroundColor: '#FDB813',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E14',
  },
  supportText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginTop: 24,
  },
  supportLink: {
    color: '#4FD1C5',
    textDecorationLine: 'underline',
  },
});
```

### 2. Layer 変更時のペイウォール表示（070 連携）

```typescript
// stores/layerStore.ts
import { useIAPStore } from "./iapStore";
import { usePaywallStore } from "./paywallStore";

export const useLayerStore = create((set, get) => ({
  // ... 既存コード

  toggleLayer: (layer: "emperor" | "shogun" | "person") => {
    const { proUnlocked } = useIAPStore.getState();

    if (!proUnlocked && layer !== "era" && layer !== "event") {
      // Pro 限定層をタップ → ペイウォール表示
      usePaywallStore.getState().showPaywall();
      return;
    }

    // 通常の toggle 処理
    // ...
  },
}));
```

### 3. Paywall Store

```typescript
// stores/paywallStore.ts
import { create } from "zustand";

interface PaywallState {
  visible: boolean;
  showPaywall: () => void;
  hidePaywall: () => void;
}

export const usePaywallStore = create<PaywallState>((set) => ({
  visible: false,
  showPaywall: () => set({ visible: true }),
  hidePaywall: () => set({ visible: false }),
}));
```

### 4. タイムライン画面に統合

```typescript
// app/(tabs)/index.tsx
import { PaywallModal } from '@/components/PaywallModal';
import { usePaywallStore } from '@/stores/paywallStore';

export default function TimelineScreen() {
  const { visible, hidePaywall } = usePaywallStore();

  return (
    <>
      {/* ... 既存コンテンツ */}

      <PaywallModal visible={visible} onClose={hidePaywall} />
    </>
  );
}
```

---

## Todo リスト

### Phase 1: Paywall コンポーネント実装

- [ ] PaywallModal コンポーネント作成
- [ ] Free/Pro 比較表 UI
- [ ] ヘッダー・価格表示・ボタン

### Phase 2: Paywall Store

- [ ] usePaywallStore 作成
- [ ] showPaywall() / hidePaywall()

### Phase 3: Layer Manager 統合（070 連携）

- [ ] Emperor/Shogun/Person タップ → showPaywall()
- [ ] Pro 限定層の制御

### Phase 4: 購入フロー統合（150 連携）

- [ ] "Pro に升级" ボタンで requestPurchase()
- [ ] 購入完了後に自動 close

### Phase 5: アニメーション・UX

- [ ] Modal 開閉アニメーション
- [ ] ボタンプレスフィードバック
- [ ] エラーアラート

### Phase 6: テスト

- [ ] Free ユーザーで Pro 層タップ → ペイウォール表示
- [ ] Pro ユーザーで Pro 層タップ → ペイウォール非表示
- [ ] "Pro に升级" → IAP フロー
- [ ] Close ボタン → モーダル close

---

## ファイル構成

```
stores/
└── paywallStore.ts          # Paywall 状態管理

components/
└── PaywallModal.tsx         # ペイウォール UI
```

---

## テスト項目

| テスト       | 手順                     | 期待値                           |
| ------------ | ------------------------ | -------------------------------- |
| 機能比較表   | ペイウォール表示         | Free/Pro 項目が見やすく          |
| Pro 層タップ | Emperor 層タップ（Free） | ペイウォール表示                 |
| ボタン       | "Pro に升级" をタップ    | IAP フロー開始                   |
| 購入後       | 購入完了                 | ペイウォール close, Pro 機能有効 |
| Close        | X ボタン をタップ        | モーダル close                   |

---

**作成日:** 2026-01-25
**優先度:** P2
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 020 (IAP store), 150 (IAP フロー)
