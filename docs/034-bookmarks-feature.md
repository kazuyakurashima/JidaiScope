# 034: Bookmarks Feature（Sprint 3）

## 概要

**目的:** ユーザーが重要なイベント・人物を保存し、タイムラインから素早くアクセス可能にする

**スコープ:**

- Event/Person の "☆" ボタンでブックマーク追加
- ブックマーク一覧画面
- ブックマーク検索（英数字 2 文字以上）
- ローカル DBに SQLite 保存
- AsyncStorage で最近アクセス 10 件キャッシュ

**成功基準:**

- ✅ Event/Person 詳細画面に ☆ ボタン実装
- ✅ ブックマーク一覧画面で全件表示
- ✅ インクリメンタル検索（2 文字トリガー）
- ✅ オフラインで追加・削除可能

---

## ユーザーストーリー

```
As a 学習者
I want to 重要なイベント・人物をブックマークして
So that あとで素早く見返すことができる
```

---

## 受け入れ条件

| #   | 条件                                  | 検証方法         | 担当 |
| --- | ------------------------------------- | ---------------- | ---- |
| 1   | Event 詳細に ☆ ボタン表示             | 画面確認         | -    |
| 2   | ☆ クリック → bookmark テーブル INSERT | DB 確認          | -    |
| 3   | ブックマーク一覧ですべて表示          | UI テスト        | -    |
| 4   | ブックマーク検索可能（2 文字以上）    | 検索テスト       | -    |
| 5   | ブックマーク削除機能                  | UI テスト        | -    |
| 6   | オフライン時も動作                    | ネットワーク OFF | -    |

---

## 依存関係

| 種類             | 詳細                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| ✓ 入力依存       | 012 (bookmark テーブル), 014 (Store), 031/032 (Event/Person 詳細画面) |
| ✗ コード依存     | なし                                                                  |
| ✗ 他チケット依存 | 030 (検索ロジック)                                                    |

---

## データ仕様

### Bookmark テーブル（実装済み - V2 マイグレーション）

```typescript
interface Bookmark {
  id: string; // UUID
  targetType: "event" | "person"; // itemType から改名
  targetId: string; // itemId から改名
  title: string | null; // スナップショット用キャッシュ（V2 で追加）
  createdAt: string; // ISO8601
  note: string | null; // メモ欄（オプション）
}
```

### SQL スキーマ（V2 マイグレーション適用済み）

```sql
CREATE TABLE bookmark (
  id TEXT PRIMARY KEY,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  title TEXT,
  createdAt TEXT NOT NULL,
  note TEXT,
  UNIQUE(targetType, targetId)
);

CREATE INDEX idx_bookmark_target ON bookmark(targetType, targetId);
```

### 関連テーブル

```typescript
// Event に JOIN して取得
interface BookmarkedEvent extends Event {
  bookmarkedAt: string;
}

// Person に JOIN して取得
interface BookmarkedPerson extends Person {
  bookmarkedAt: string;
}
```

---

## 実装ガイドライン

### 1. Bookmark Store 作成（実装済み）

```typescript
// stores/bookmarkStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BookmarkWithTitle {
  id: string;
  targetType: "event" | "person";
  targetId: string;
  title: string;
  createdAt: string;
}

interface BookmarkState {
  bookmarks: BookmarkWithTitle[];
  isLoaded: boolean;
  loadBookmarks: () => Promise<void>;
  addBookmark: (
    targetType: "event" | "person",
    targetId: string,
    title: string,
  ) => Promise<void>;
  removeBookmark: (
    targetType: "event" | "person",
    targetId: string,
  ) => Promise<void>;
  isBookmarked: (targetType: "event" | "person", targetId: string) => boolean;
  searchBookmarks: (query: string) => BookmarkWithTitle[];
  /** 詳細画面訪問時にアクセス順を更新（最近アクセスキャッシュ用） */
  touchAccess: (
    targetType: "event" | "person",
    targetId: string,
  ) => Promise<void>;
}
```

**実装特徴:**

- **キャッシュ戦略**: AsyncStorage で最近 10 件をキャッシュ（アクセス順）
- **重複防止**: addBookmark で DB + Store 両方をチェック
- **N+1 最適化**: タイトル取得は Promise.all で並列化
- **アクセス順追跡**: touchAccess で詳細画面訪問時にキャッシュ順を更新

### 2. Bookmark ボタン（実装済み）

```typescript
// components/cards/BookmarkButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { triggerMediumHaptic } from '@/utils/haptics';
import { useBookmarkStore } from '@/stores/bookmarkStore';

interface BookmarkButtonProps {
  targetType: 'event' | 'person';
  targetId: string;
  title: string;
}

export function BookmarkButton({ targetType, targetId, title }: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();
  const bookmarked = isBookmarked(targetType, targetId);

  const handlePress = async () => {
    await triggerMediumHaptic();

    if (bookmarked) {
      await removeBookmark(targetType, targetId);
    } else {
      await addBookmark(targetType, targetId, title);
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.button} hitSlop={8}>
      <Ionicons
        name={bookmarked ? 'star' : 'star-outline'}
        size={24}
        color={bookmarked ? '#FDB813' : colors.textSecondary}
      />
    </Pressable>
  );
}
```

### 3. Bookmark ボタンを Event Detail に統合（実装済み）

```typescript
// app/event/[id].tsx - headerRight に配置
<Stack.Screen
  options={{
    headerRight: () => (
      <BookmarkButton targetType="event" targetId={id!} title={event.title} />
    ),
  }}
/>
```

### 4. Bookmark 一覧画面（実装済み）

```typescript
// app/(tabs)/bookmarks.tsx - 一覧画面と検索機能を統合
function BookmarkItem({ item, onPress, onDelete }: BookmarkItemProps) {
  // 削除ボタンのイベント伝播防止
  const handleDelete = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    onDelete();
  };

  return (
    <Pressable onPress={onPress}>
      <View style={styles.itemContent}>
        <Ionicons
          name={item.targetType === 'event' ? 'calendar-outline' : 'person-outline'}
          size={20}
        />
        <View>
          <Text>{item.title}</Text>
          <Text>{item.targetType === 'event' ? 'イベント' : '人物'}</Text>
        </View>
      </View>
      <Pressable onPress={handleDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} />
      </Pressable>
    </Pressable>
  );
}
```

### 5. Bookmark 検索（一覧画面内に統合）

```typescript
// 検索バーで 2 文字以上入力時に searchBookmarks を呼び出し
const [searchQuery, setSearchQuery] = useState('');
const displayedBookmarks = searchQuery.length >= 2
  ? searchBookmarks(searchQuery)
  : bookmarks;
```

---

## Todo リスト

### Phase 1: SQLite スキーマ（012 対応）

- [x] bookmark テーブル定義
- [x] UNIQUE 制約（targetType, targetId）
- [x] インデックス作成

### Phase 2: Bookmark Store 実装

- [x] useBookmarkStore 作成
- [x] addBookmark/removeBookmark 関数（重複防止付き）
- [x] isBookmarked 判定ロジック
- [x] searchBookmarks インクリメンタル検索
- [x] touchAccess アクセス順更新

### Phase 3: Event/Person 詳細画面に ☆ ボタン

- [x] BookmarkButton コンポーネント作成（☆スターアイコン、金色）
- [x] Event 詳細に統合（031）
- [x] Person 詳細に統合（032）
- [x] タップで store 更新
- [x] 詳細画面訪問時に touchAccess 呼び出し

### Phase 4: Bookmark 一覧画面

- [x] app/(tabs)/bookmarks.tsx 作成
- [x] FlatList で全件表示
- [x] Item タップで詳細遷移
- [x] Empty state 表示
- [x] 削除機能

### Phase 5: Bookmark 検索

- [x] 一覧画面内に検索バー統合
- [x] 2 文字トリガーのインクリメンタル検索
- [x] 検索結果表示

### Phase 6: テスト・最適化

- [x] ブックマーク追加/削除テスト
- [x] AsyncStorage キャッシュ（最近 10 件）
- [x] パフォーマンス（Promise.all で N+1 最適化）

---

## ファイル構成

```
stores/
└── bookmarkStore.ts         # Bookmark 状態管理

components/
└── BookmarkButton.tsx       # ☆ ボタンコンポーネント

app/bookmarks/
├── index.tsx                # ブックマーク一覧
└── search.tsx               # ブックマーク検索
```

---

## テスト項目

| テスト     | 方法                      | 期待値                       |
| ---------- | ------------------------- | ---------------------------- |
| 追加       | Event 詳細で ☆ タップ     | bookmark テーブルに INSERT   |
| 削除       | ☆ 再度タップ              | bookmark テーブルから DELETE |
| 一覧       | Bookmarks 画面を開く      | 全 bookmark 表示             |
| 検索       | 2 文字入力                | マッチした項目のみ表示       |
| オフライン | ネットワーク OFF 時に追加 | 追加可能                     |
| 同期       | ネットワーク ON に戻す    | 矛盾なし                     |

---

**作成日:** 2025-01-25
**優先度:** P2
**推定工数:** 2d
**ステータス:** Completed
**ブロッカー:** 012 (bookmark テーブル), 031/032 (詳細画面)
