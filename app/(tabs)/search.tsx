/**
 * Search Screen - 検索タブ
 * Sprint 3: 030 Search Feature
 *
 * 検索機能:
 * - 西暦「1868」→ 該当年のイベント
 * - 和暦「明治元年」→ 西暦変換して検索
 * - 人物名・事件名でのテキスト検索
 * - インクリメンタルサーチ（500ms デバウンス）
 * - 検索履歴表示
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useSearchStore } from '@/stores/searchStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { useAppStore } from '@/stores/appStore';
import { search, type SearchResultItem } from '@/domain/search/searchService';
import { triggerHaptic } from '@/utils/haptics';
import {
  TIMELINE_START_YEAR,
  getPixelsPerYear,
  clampScrollX,
} from '@/domain/timeline/coordinateSystem';
import { calculateLODLevel } from '@/domain/timeline/lodManager';

// =============================================================================
// Constants
// =============================================================================

/** デバウンス時間（ms） */
const DEBOUNCE_MS = 500;

/** 最小検索文字数 */
const MIN_QUERY_LENGTH = 2;

// =============================================================================
// Component
// =============================================================================

/** ジャンプ先表示用のズームレベル */
const JUMP_ZOOM_LEVEL = 15;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();
  const dbReady = useAppStore((s) => s.dbReady);
  const { searchHistory, cacheResults, getCachedResult, touchHistory, clearHistory } = useSearchStore();
  const { setScroll, setZoom, setLOD } = useTimelineStore();

  // デバウンスタイマー
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 検索実行
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < MIN_QUERY_LENGTH || !dbReady) {
        setResults([]);
        setSuggestions([]);
        setTotalCount(0);
        return;
      }

      // キャッシュチェック（5分以内の同一クエリはDBを叩かない）
      const cached = getCachedResult(searchQuery);
      if (cached) {
        // キャッシュからの復元（dataはnullで復元、必要に応じて再取得）
        setResults(cached.items.map((item) => ({ ...item, data: null })));
        setTotalCount(cached.totalCount);
        setSuggestions(cached.suggestions);
        // 履歴順を更新（直近順を維持）
        touchHistory(searchQuery);
        return;
      }

      setIsLoading(true);

      try {
        const result = await search(searchQuery);
        setResults(result.items);
        setTotalCount(result.totalCount);
        setSuggestions(result.suggestions);

        // キャッシュに保存（フル結果、dataは除外してサイズ削減）
        cacheResults(searchQuery, {
          items: result.items.map(({ id, type, title, subtitle, year }) => ({
            id,
            type,
            title,
            subtitle,
            year,
          })),
          totalCount: result.totalCount,
          suggestions: result.suggestions,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setSuggestions([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [dbReady, cacheResults, getCachedResult, touchHistory]
  );

  // デバウンス付き検索
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  /**
   * 指定年をタイムラインの中央に表示するようスクロール位置を計算
   */
  const jumpToYear = useCallback(
    (year: number) => {
      const { width: screenWidth } = Dimensions.get('window');
      const pixelsPerYear = getPixelsPerYear(screenWidth, JUMP_ZOOM_LEVEL);
      const yearOffset = year - TIMELINE_START_YEAR;

      // 年が画面中央に来るようスクロール位置を計算
      const targetScrollX = -(yearOffset * pixelsPerYear - screenWidth / 2);
      // 範囲端で空白が出ないようクランプ
      const clampedScrollX = clampScrollX(targetScrollX, screenWidth, JUMP_ZOOM_LEVEL);

      setZoom(JUMP_ZOOM_LEVEL);
      setScroll(clampedScrollX);
      // LOD同期（ズーム15 = L2）
      setLOD(calculateLODLevel(JUMP_ZOOM_LEVEL));
    },
    [setZoom, setScroll, setLOD]
  );

  // 検索結果タップ
  const handleResultPress = useCallback(
    (item: SearchResultItem) => {
      void triggerHaptic('light');

      // タイムラインジャンプ（年が有効な場合）
      if (item.year && item.year !== 0) {
        jumpToYear(item.year);
      }

      // 詳細画面へ遷移
      if (item.type === 'event') {
        router.push(`/event/${item.id}`);
      } else if (item.type === 'person') {
        router.push(`/person/${item.id}`);
      }
    },
    [router, jumpToYear]
  );

  // 履歴アイテムタップ
  const handleHistoryPress = useCallback((historyItem: string) => {
    setQuery(historyItem);
  }, []);

  // サジェストアイテムタップ
  const handleSuggestionPress = useCallback((suggestion: string) => {
    setQuery(suggestion);
  }, []);

  // クリアボタン
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setTotalCount(0);
  }, []);

  // 結果アイテムのレンダリング
  const renderResult = useCallback(
    ({ item }: { item: SearchResultItem }) => (
      <Pressable
        style={[
          styles.resultItem,
          {
            backgroundColor: colors.bgSecondary,
            borderRadius: radius.md,
            padding: spacing[4],
            marginBottom: spacing[2],
          },
        ]}
        onPress={() => handleResultPress(item)}
      >
        <View style={styles.resultIcon}>
          <Ionicons
            name={item.type === 'event' ? 'calendar-outline' : 'person-outline'}
            size={24}
            color={item.type === 'event' ? colors.accent : colors.primary}
          />
        </View>
        <View style={[styles.resultContent, { marginLeft: spacing[3] }]}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]}>
            {item.subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>
    ),
    [colors, spacing, radius, handleResultPress]
  );

  // 履歴アイテムのレンダリング
  const renderHistoryItem = useCallback(
    ({ item }: { item: string }) => (
      <Pressable
        style={[
          styles.historyItem,
          {
            backgroundColor: colors.bgSecondary,
            borderRadius: radius.md,
            padding: spacing[3],
            marginBottom: spacing[2],
          },
        ]}
        onPress={() => handleHistoryPress(item)}
      >
        <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
        <Text
          style={[
            styles.historyText,
            { color: colors.text, marginLeft: spacing[2] },
          ]}
        >
          {item}
        </Text>
      </Pressable>
    ),
    [colors, spacing, radius, handleHistoryPress]
  );

  // DB準備中の表示
  if (!dbReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            データベースを初期化中...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 検索バー */}
      <View style={[styles.searchBar, { padding: spacing[4] }]}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: radius.md,
              paddingHorizontal: spacing[3],
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.text,
                marginLeft: spacing[2],
                fontSize: typography.size.base,
              },
            ]}
            placeholder="西暦・和暦・人物名で検索..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {isLoading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {query.length > 0 && !isLoading && (
            <Pressable onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 検索結果または履歴 */}
      {query.length >= MIN_QUERY_LENGTH ? (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderResult}
          contentContainerStyle={{ padding: spacing[4], paddingTop: 0 }}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text
                style={[
                  styles.resultCount,
                  { color: colors.textSecondary, marginBottom: spacing[3] },
                ]}
              >
                {totalCount}件の結果
                {totalCount > results.length && ` (上位${results.length}件を表示)`}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={colors.textTertiary}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.textSecondary, marginTop: spacing[4] },
                  ]}
                >
                  検索結果がありません
                </Text>
                <Text
                  style={[
                    styles.emptyHint,
                    { color: colors.textTertiary, marginTop: spacing[2] },
                  ]}
                >
                  別のキーワードで試してみてください
                </Text>
                {/* サジェスト表示 */}
                {suggestions.length > 0 && (
                  <View style={{ marginTop: spacing[6], width: '100%' }}>
                    <Text
                      style={[
                        styles.suggestionsTitle,
                        { color: colors.textSecondary, marginBottom: spacing[2] },
                      ]}
                    >
                      もしかして:
                    </Text>
                    <View style={styles.suggestionsContainer}>
                      {suggestions.map((suggestion, index) => (
                        <Pressable
                          key={`suggestion-${index}`}
                          style={[
                            styles.suggestionChip,
                            {
                              backgroundColor: colors.bgSecondary,
                              borderRadius: radius.full,
                              paddingHorizontal: spacing[3],
                              paddingVertical: spacing[2],
                              marginRight: spacing[2],
                              marginBottom: spacing[2],
                            },
                          ]}
                          onPress={() => handleSuggestionPress(suggestion)}
                        >
                          <Text style={{ color: colors.primary, fontSize: 13 }}>
                            {suggestion}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* 検索履歴 */}
          {searchHistory.length > 0 && (
            <View style={{ padding: spacing[4], paddingTop: 0 }}>
              <View style={styles.historyHeader}>
                <Text
                  style={[
                    styles.historyTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  検索履歴
                </Text>
                <Pressable onPress={clearHistory}>
                  <Text style={{ color: colors.primary, fontSize: 12 }}>
                    クリア
                  </Text>
                </Pressable>
              </View>
              <FlatList
                data={searchHistory.slice(0, 10)}
                keyExtractor={(item, index) => `history-${index}-${item}`}
                renderItem={renderHistoryItem}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* 検索ヒント */}
          <View style={[styles.hintContainer, { padding: spacing[4] }]}>
            <Text style={[styles.hintTitle, { color: colors.textSecondary }]}>
              検索例
            </Text>
            <View style={{ marginTop: spacing[2] }}>
              <Text style={[styles.hintItem, { color: colors.textTertiary }]}>
                • 西暦: 1868, 1600
              </Text>
              <Text style={[styles.hintItem, { color: colors.textTertiary }]}>
                • 和暦: 明治元年, 令和3年
              </Text>
              <Text style={[styles.hintItem, { color: colors.textTertiary }]}>
                • 人物: 織田信長, 坂本龍馬
              </Text>
              <Text style={[styles.hintItem, { color: colors.textTertiary }]}>
                • 事件: 本能寺, 関ヶ原
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  searchBar: {},
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  resultCount: {
    fontSize: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
  },
  emptyHint: {
    fontSize: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    fontSize: 14,
  },
  hintContainer: {},
  hintTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  hintItem: {
    fontSize: 13,
    marginTop: 4,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestionChip: {
    // Dynamic styles applied inline
  },
});
