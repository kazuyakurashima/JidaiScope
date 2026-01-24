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

### Bookmark テーブル（PRD セクション 10.2）

```typescript
interface Bookmark {
  id: string; // UUID
  userId?: string; // 将来: multi-user 対応
  itemType: "event" | "person";
  itemId: string; // event.id or person.id
  title: string; // スナップショット用キャッシュ
  createdAt: string; // ISO8601
}
```

### SQL スキーマ（012 で定義）

```sql
CREATE TABLE bookmark (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL CHECK(item_type IN ('event', 'person')),
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_type, item_id)
);

CREATE INDEX idx_bookmark_type ON bookmark(item_type);
CREATE INDEX idx_bookmark_created ON bookmark(created_at DESC);
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

### 1. Bookmark Store 作成（014 対応）

```typescript
// stores/bookmarkStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BookmarkState {
  bookmarks: Bookmark[];
  loadBookmarks: () => Promise<void>;
  addBookmark: (
    itemType: "event" | "person",
    itemId: string,
    title: string,
  ) => Promise<void>;
  removeBookmark: (
    itemType: "event" | "person",
    itemId: string,
  ) => Promise<void>;
  isBookmarked: (itemType: "event" | "person", itemId: string) => boolean;
  searchBookmarks: (query: string) => Bookmark[];
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],

  loadBookmarks: async () => {
    // SQLite から全件取得
    const db = await openDatabaseAsync("jidaiscope.db");
    const bookmarks = await db.getAllAsync<Bookmark>(
      "SELECT * FROM bookmark ORDER BY created_at DESC",
    );
    set({ bookmarks });
  },

  addBookmark: async (itemType, itemId, title) => {
    const db = await openDatabaseAsync("jidaiscope.db");
    const id = generateUUID();

    await db.runAsync(
      `INSERT INTO bookmark (id, item_type, item_id, title) 
       VALUES (?, ?, ?, ?)`,
      [id, itemType, itemId, title],
    );

    // Store 更新
    set((state) => ({
      bookmarks: [
        { id, itemType, itemId, title, createdAt: new Date().toISOString() },
        ...state.bookmarks,
      ],
    }));
  },

  removeBookmark: async (itemType, itemId) => {
    const db = await openDatabaseAsync("jidaiscope.db");

    await db.runAsync(
      `DELETE FROM bookmark WHERE item_type = ? AND item_id = ?`,
      [itemType, itemId],
    );

    // Store 更新
    set((state) => ({
      bookmarks: state.bookmarks.filter(
        (b) => !(b.itemType === itemType && b.itemId === itemId),
      ),
    }));
  },

  isBookmarked: (itemType, itemId) => {
    const { bookmarks } = get();
    return bookmarks.some(
      (b) => b.itemType === itemType && b.itemId === itemId,
    );
  },

  searchBookmarks: (query) => {
    const { bookmarks } = get();
    if (query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return bookmarks.filter((b) => b.title.toLowerCase().includes(lowerQuery));
  },
}));
```

### 2. Bookmark ボタン（Event 詳細）

```typescript
// components/BookmarkButton.tsx
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet } from 'react-native';
import { triggerMediumHaptic } from '@/utils/haptics';
import { useBookmarkStore } from '@/stores/bookmarkStore';

interface BookmarkButtonProps {
  itemType: 'event' | 'person';
  itemId: string;
  title: string;
}

export function BookmarkButton({ itemType, itemId, title }: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();
  const bookmarked = isBookmarked(itemType, itemId);

  const handlePress = async () => {
    await triggerMediumHaptic();

    if (bookmarked) {
      await removeBookmark(itemType, itemId);
    } else {
      await addBookmark(itemType, itemId, title);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather
        name={bookmarked ? 'star' : 'star'}
        size={24}
        color={bookmarked ? '#FDB813' : '#718096'}
        style={{ opacity: bookmarked ? 1 : 0.5 }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
```

### 3. Bookmark ボタンを Event Detail に統合（031 対応）

```typescript
// app/event/[id].tsx
import { BookmarkButton } from '@/components/BookmarkButton';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEventStore((s) => s.getEvent(id!));

  if (!event) return <Text>Not found</Text>;

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <BookmarkButton itemType="event" itemId={event.id} title={event.title} />
      </View>

      {/* ... 既存コンテンツ */}
    </SafeAreaView>
  );
}
```

### 4. Bookmark 一覧画面

```typescript
// app/bookmarks/index.tsx
import { FlatList, Text, View, StyleSheet } from 'react-native';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useEffect } from 'react';

export default function BookmarksScreen() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const loadBookmarks = useBookmarkStore((s) => s.loadBookmarks);

  useEffect(() => {
    loadBookmarks();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ブックマーク</Text>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookmarkItem item={item} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>ブックマークはまだありません</Text>
        }
      />
    </View>
  );
}

function BookmarkItem({ item }: { item: Bookmark }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        if (item.itemType === 'event') {
          router.push(`/event/${item.itemId}`);
        } else {
          router.push(`/person/${item.itemId}`);
        }
      }}
      style={styles.item}
    >
      <View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemType}>
          {item.itemType === 'event' ? 'イベント' : '人物'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemType: { fontSize: 12, color: '#718096', marginTop: 4 },
  empty: { textAlign: 'center', color: '#A0AEC0', marginTop: 32 },
});
```

### 5. Bookmark 検索

```typescript
// app/bookmarks/search.tsx
import { TextInput, FlatList } from 'react-native';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useState, useCallback } from 'react';

export default function BookmarkSearchScreen() {
  const [query, setQuery] = useState('');
  const searchBookmarks = useBookmarkStore((s) => s.searchBookmarks);
  const results = useCallback(() => searchBookmarks(query), [query, searchBookmarks])();

  return (
    <View>
      <TextInput
        placeholder="ブックマークを検索"
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookmarkItem item={item} />}
      />
    </View>
  );
}
```

---

## Todo リスト

### Phase 1: SQLite スキーマ（012 対応）

- [ ] bookmark テーブル定義
- [ ] UNIQUE 制約（item_type, item_id）
- [ ] インデックス作成

### Phase 2: Bookmark Store 実装

- [ ] useBookmarkStore 作成
- [ ] addBookmark/removeBookmark 関数
- [ ] isBookmarked 判定ロジック
- [ ] searchBookmarks インクリメンタル検索

### Phase 3: Event/Person 詳細画面に ☆ ボタン

- [ ] BookmarkButton コンポーネント作成
- [ ] Event 詳細に統合（031）
- [ ] Person 詳細に統合（032）
- [ ] タップで store 更新

### Phase 4: Bookmark 一覧画面

- [ ] app/bookmarks/index.tsx 作成
- [ ] FlatList で全件表示
- [ ] Item タップで詳細遷移
- [ ] Empty state 表示

### Phase 5: Bookmark 検索

- [ ] app/bookmarks/search.tsx 作成
- [ ] 2 文字トリガーのインクリメンタル検索
- [ ] 検索結果表示

### Phase 6: テスト・最適化

- [ ] ブックマーク追加/削除テスト
- [ ] オフライン時の動作確認
- [ ] パフォーマンス（DB クエリ最適化）

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
**ステータス:** Not Started
**ブロッカー:** 012 (bookmark テーブル), 031/032 (詳細画面)
