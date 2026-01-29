/**
 * Bookmarks Screen - ブックマーク一覧
 * Sprint 3: 034 Bookmarks Feature
 *
 * 機能:
 * - ブックマーク一覧表示
 * - インクリメンタル検索（2文字以上）
 * - タップで詳細画面へ遷移
 * - 削除ボタン
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BookmarkWithTitle } from '@/types/store';
import { useTheme } from '@/hooks/useTheme';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useAppStore } from '@/stores/appStore';

// =============================================================================
// Component
// =============================================================================

export default function BookmarksScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dbReady = useAppStore((s) => s.dbReady);

  const { bookmarks, isLoaded, loadBookmarks, removeBookmark, searchBookmarks } =
    useBookmarkStore();

  const [searchQuery, setSearchQuery] = useState('');

  // 初回読み込み
  useEffect(() => {
    if (dbReady && !isLoaded) {
      void loadBookmarks();
    }
  }, [dbReady, isLoaded, loadBookmarks]);

  // 検索結果
  const displayedBookmarks = useMemo(() => {
    if (searchQuery.length >= 2) {
      return searchBookmarks(searchQuery);
    }
    return bookmarks;
  }, [bookmarks, searchQuery, searchBookmarks]);

  // ナビゲーション
  const handlePress = useCallback(
    (item: BookmarkWithTitle) => {
      if (item.targetType === 'event') {
        router.push(`/event/${item.targetId}`);
      } else {
        router.push(`/person/${item.targetId}`);
      }
    },
    [router]
  );

  // 削除
  const handleDelete = useCallback(
    async (item: BookmarkWithTitle) => {
      await removeBookmark(item.targetType, item.targetId);
    },
    [removeBookmark]
  );

  // アイテムレンダラー
  const renderItem = useCallback(
    ({ item }: { item: BookmarkWithTitle }) => (
      <BookmarkItem
        item={item}
        onPress={() => handlePress(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [handlePress, handleDelete]
  );

  const keyExtractor = useCallback((item: BookmarkWithTitle) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2], paddingHorizontal: spacing[4] }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.size['2xl'] }]}>
          ブックマーク
        </Text>

        {/* 検索バー */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.bgSecondary,
              marginTop: spacing[3],
              paddingHorizontal: spacing[3],
              borderRadius: 10,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.text,
                fontSize: typography.size.base,
                marginLeft: spacing[2],
              },
            ]}
            placeholder="検索（2文字以上）"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={displayedBookmarks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: spacing[4],
            paddingBottom: insets.bottom + spacing[4],
          },
        ]}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { marginTop: spacing[8] }]}>
            <Ionicons
              name={searchQuery.length >= 2 ? 'search-outline' : 'star-outline'}
              size={48}
              color={colors.textTertiary}
            />
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textSecondary,
                  marginTop: spacing[3],
                  fontSize: typography.size.base,
                },
              ]}
            >
              {searchQuery.length >= 2
                ? '検索結果がありません'
                : 'ブックマークはまだありません'}
            </Text>
            {searchQuery.length === 0 && (
              <Text
                style={[
                  styles.emptyHint,
                  {
                    color: colors.textTertiary,
                    marginTop: spacing[2],
                  },
                ]}
              >
                イベントや人物の詳細画面から追加できます
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

// =============================================================================
// Bookmark Item
// =============================================================================

interface BookmarkItemProps {
  item: BookmarkWithTitle;
  onPress: () => void;
  onDelete: () => void;
}

function BookmarkItem({ item, onPress, onDelete }: BookmarkItemProps) {
  const { colors, spacing } = useTheme();

  // 削除ボタンのイベント伝播防止
  const handleDelete = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    onDelete();
  };

  return (
    <Pressable
      style={[
        styles.item,
        {
          backgroundColor: colors.bgSecondary,
          marginTop: spacing[2],
          padding: spacing[3],
          borderRadius: 10,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.itemContent}>
        <Ionicons
          name={item.targetType === 'event' ? 'calendar-outline' : 'person-outline'}
          size={20}
          color={colors.textSecondary}
        />
        <View style={[styles.itemText, { marginLeft: spacing[3] }]}>
          <Text
            style={[styles.itemTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.itemType, { color: colors.textTertiary }]}>
            {item.targetType === 'event' ? 'イベント' : '人物'}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.deleteButton, { padding: spacing[2] }]}
        onPress={handleDelete}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerTitle: {
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  listContent: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyHint: {
    textAlign: 'center',
    fontSize: 13,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemType: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {},
});
