/**
 * Search Screen - 検索タブ
 * Sprint 1: 011 Navigation Architecture
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type SearchResultType = 'event' | 'person';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
}

// ダミー検索結果（Sprint 2でDB連携）
const DUMMY_RESULTS: SearchResult[] = [
  { id: 'event-001', type: 'event', title: '本能寺の変', subtitle: '1582年 - 政治' },
  { id: 'event-002', type: 'event', title: '関ヶ原の戦い', subtitle: '1600年 - 軍事' },
  { id: 'event-003', type: 'event', title: '大政奉還', subtitle: '1867年 - 政治' },
  { id: 'person-001', type: 'person', title: '織田信長', subtitle: '1534-1582 - 武将' },
  { id: 'person-002', type: 'person', title: '豊臣秀吉', subtitle: '1537-1598 - 武将' },
  { id: 'person-003', type: 'person', title: '徳川家康', subtitle: '1543-1616 - 将軍' },
  { id: 'event-004', type: 'event', title: '明治維新', subtitle: '1868年 - 政治' },
  { id: 'person-004', type: 'person', title: '坂本龍馬', subtitle: '1836-1867 - 志士' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();

  const filteredResults = query.length > 0
    ? DUMMY_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : DUMMY_RESULTS;

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'event') {
      router.push(`/event/${result.id}`);
    } else {
      router.push(`/person/${result.id}`);
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
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
        <Text style={[styles.resultTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.resultSubtitle, { color: colors.textTertiary }]}>
          {item.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );

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
            placeholder="イベント・人物を検索..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 検索結果 */}
      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id}
        renderItem={renderResult}
        contentContainerStyle={{ padding: spacing[4], paddingTop: 0 }}
        ListHeaderComponent={
          <Text
            style={[
              styles.resultCount,
              { color: colors.textSecondary, marginBottom: spacing[3] },
            ]}
          >
            {filteredResults.length}件の結果（ダミーデータ）
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: spacing[4] }]}>
              検索結果がありません
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
