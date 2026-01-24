# 052: Accessibility（Sprint 5）

## 概要

**目的:** WCAG 2.1 AA レベルのアクセシビリティを確保し、視覚障害・運動障害ユーザーも利用可能に

**スコープ:**

- スクリーンリーダー対応（VoiceOver / TalkBack）
- コントラスト比 4.5:1 以上（通常テキスト）
- タッチターゲット最小 44pt
- キーボードナビゲーション対応
- 色のみに依存しない情報設計

**成功基準:**

- ✅ VoiceOver/TalkBack で全画面操作可能
- ✅ WCAG AA コントラスト比達成
- ✅ 44pt タッチターゲット確保
- ✅ 自動テスト + 手動チェック完了

---

## ユーザーストーリー

```
As a 視覚障害ユーザー
I want to スクリーンリーダーで JidaiScope を操作したい
So that 同じように日本史を学べる
```

---

## 受け入れ条件

| #   | 条件                       | 検証方法                | 担当 |
| --- | -------------------------- | ----------------------- | ---- |
| 1   | VoiceOver で全機能操作可能 | iOS 実機テスト          | -    |
| 2   | TalkBack で全機能操作可能  | Android 実機テスト      | -    |
| 3   | コントラスト比 4.5:1 以上  | WebAIM Contrast Checker | -    |
| 4   | タッチターゲット 44pt 以上 | デザイン確認            | -    |
| 5   | 自動テスト（axe-core）     | CI 実行                 | -    |

---

## 依存関係

| 種類             | 詳細                                                         |
| ---------------- | ------------------------------------------------------------ |
| ✓ 入力依存       | 015 (Design Tokens - コントラスト値), 016 (Dark/Light theme) |
| ✗ コード依存     | なし                                                         |
| ✗ 他チケット依存 | 全コンポーネント（統合対象）                                 |

---

## WCAG 2.1 AA チェックリスト

### 知覚可能（Perceivable）

- [ ] **1.4.3 コントラスト（最小）:** テキスト/背景で 4.5:1 以上（AAA 7:1）
- [ ] **1.4.11 非テキストコントラスト:** UI コンポーネントで 3:1 以上

### 操作可能（Operable）

- [ ] **2.1.1 キーボード:** 全機能がキーボード操作可能
- [ ] **2.1.2 キーボードトラップなし:** フォーカス移動が可能
- [ ] **2.5.5 ターゲットサイズ:** 最小 44×44pt

### 理解可能（Understandable）

- [ ] **3.1 言語:** 言語タグ正確性確認
- [ ] **3.2 予測可能:** UI の一貫性

### 堅牢性（Robust）

- [ ] **4.1.2 名前・役割・値:** アクセシビリティツリー確認
- [ ] **4.1.3 ステータスメッセージ:** ライブリージョン対応

---

## 実装ガイドライン

### 1. accessibilityLabel / accessibilityHint

```typescript
// components/Button.tsx
<Pressable
  accessibilityLabel="Pro に升级"
  accessibilityHint="¥480 で全機能アンロック"
  accessibilityRole="button"
  onPress={handlePress}
>
  <Text>Pro に升级</Text>
</Pressable>
```

### 2. コントラスト比チェック

```typescript
// constants/tokens.ts（015 対応）
// 全色組み合わせでコントラスト比を確認
const COLORS_DARK = {
  text: "#F7FAFC", // 15.5:1 on #0A0E14 ✅
  textSecondary: "#A0AEC0", // 6.5:1 on #0A0E14 ✅
  textTertiary: "#718096", // 4.2:1 on #1A1F2E ⚠️ (注: 大きいテキストのみ)
};
```

### 3. タッチターゲット 44pt

```typescript
// components/Button.tsx
const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
```

### 4. キーボードナビゲーション

```typescript
// app/(tabs)/index.tsx
import { useFocusEffect } from '@react-navigation/native';

export default function Screen() {
  useFocusEffect(() => {
    // フォーカス管理
    return () => {};
  });

  return (
    // TabStops で navigation order を制御
    <View accessible={false}>
      <Pressable accessibilityRole="button">Button 1</Pressable>
      <Pressable accessibilityRole="button">Button 2</Pressable>
    </View>
  );
}
```

### 5. スクリーンリーダーテスト

```typescript
// iOS VoiceOver
Settings > Accessibility > VoiceOver > ON

// Android TalkBack
Settings > Accessibility > TalkBack > ON

// テスト項目:
- 全ボタン/リンク読み込み可能か
- フォーカスが視覚的に明確か
- 動的更新（ライブリージョン）が読み込まれるか
```

---

## Todo リスト

### Phase 1: 既存コンポーネント監査

- [ ] 全コンポーネント accessibilityLabel 確認
- [ ] 遠落・不足箇所を特定

### Phase 2: コントラスト比修正

- [ ] 015-design-tokens.md で色を確認
- [ ] AA 基準達成していない色を修正

### Phase 3: タッチターゲット最適化

- [ ] 全ボタン・リンク 44pt 確認
- [ ] hitSlop で補正

### Phase 4: キーボードナビゲーション

- [ ] TabStops で navigation order 設定
- [ ] キーボード操作テスト

### Phase 5: スクリーンリーダーテスト

- [ ] iOS VoiceOver でテスト
- [ ] Android TalkBack でテスト

### Phase 6: 自動テスト統合

- [ ] axe-core または Lighthouse CI 導入
- [ ] CI パイプラインに統合

---

**作成日:** 2026-01-25
**優先度:** P1
**推定工数:** 2d
**ステータス:** Not Started
**ブロッカー:** 015 (Design Tokens)
