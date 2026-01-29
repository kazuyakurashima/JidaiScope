/**
 * Person Detail Screen - 人物詳細画面
 * Sprint 3: 032 Person Detail Screen
 *
 * 機能:
 * - 人物基本情報（氏名、読み、生没年、活動期間）
 * - 役職・概要
 * - 関連イベント一覧
 * - ブックマーク機能
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { HistoricalEvent, Person, PersonRole } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/appStore';
import { getPersonById } from '@/data/repositories/PersonRepository';
import { getEventsByPersonId } from '@/data/repositories/EventRepository';
import { seirekiToWaka } from '@/utils/wakaCalendar';
import { EventLink, BookmarkButton } from '@/components/cards';

// =============================================================================
// Role Labels
// =============================================================================

const ROLE_LABELS: Record<PersonRole, string> = {
  emperor: '天皇',
  shogun: '将軍',
  politician: '政治家',
  military: '武将',
  scholar: '学者',
  artist: '芸術家',
  other: 'その他',
};

// =============================================================================
// Component
// =============================================================================

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const dbReady = useAppStore((s) => s.dbReady);

  const [person, setPerson] = useState<Person | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // データ読み込み
  useEffect(() => {
    if (!id || !dbReady) return;

    const loadData = async () => {
      setIsLoading(true);
      // 関連データを初期化（人物切替時の残表示を防止）
      setRelatedEvents([]);

      try {
        const personData = await getPersonById(id);
        setPerson(personData);

        if (!personData) return;

        // 関連イベントを取得
        const events = await getEventsByPersonId(id);
        setRelatedEvents(events);
      } catch (error) {
        console.error('Failed to load person:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [id, dbReady]);

  // ナビゲーション
  const handleEventPress = useCallback(
    (eventId: string) => {
      router.push(`/event/${eventId}`);
    },
    [router]
  );

  // 生没年フォーマット（データがある場合のみ表示）
  const formatLifespan = (): string | null => {
    if (!person?.birthYear && !person?.deathYear) return null;

    const formatYear = (year: number): string =>
      `${year}年${year >= 1868 ? ` (${seirekiToWaka(year)})` : ''}`;

    // birth のみ
    if (person.birthYear && !person.deathYear) {
      return formatYear(person.birthYear);
    }
    // death のみ
    if (!person.birthYear && person.deathYear) {
      return `〜${formatYear(person.deathYear)}`;
    }
    // 両方あり
    return `${formatYear(person.birthYear!)} 〜 ${formatYear(person.deathYear!)}`;
  };

  // 活動期間フォーマット
  const formatActivePeriod = (): string | null => {
    if (!person?.activeStartYear) return null;

    const start = `${person.activeStartYear}年`;
    const end = person.activeEndYear ? `${person.activeEndYear}年` : '';

    return end ? `${start} 〜 ${end}` : `${start} 〜`;
  };

  // Loading
  if (isLoading || !dbReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not Found
  if (!person) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.textSecondary, marginTop: spacing[4] }]}>
          人物が見つかりませんでした
        </Text>
      </View>
    );
  }

  const lifespan = formatLifespan();
  const activePeriod = formatActivePeriod();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerRight: () => <BookmarkButton targetId={id!} />,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={[styles.content, { padding: spacing[4] }]}
      >
        {/* Name */}
        <Text
          style={[
            styles.name,
            { color: colors.text, fontSize: typography.size['2xl'] },
          ]}
        >
          {person.name}
        </Text>

        {/* Name Reading */}
        {person.nameReading && (
          <Text style={[styles.nameReading, { color: colors.textSecondary, marginTop: spacing[1] }]}>
            {person.nameReading}
          </Text>
        )}

        {/* Importance */}
        <View style={[styles.metaRow, { marginTop: spacing[3] }]}>
          <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>重要度</Text>
          <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
            {['低', '通常', '重要', '最重要'][person.importanceLevel] ?? '未設定'}
          </Text>
        </View>

        {/* Lifespan - データがある場合のみ表示 */}
        {lifespan && (
          <View style={[styles.section, { marginTop: spacing[4] }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
              生没年
            </Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary, marginTop: spacing[2] }]}>
              {lifespan}
            </Text>
          </View>
        )}

        {/* Active Period */}
        <View style={[styles.section, { marginTop: spacing[4] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
            活動期間
          </Text>
          <Text style={[styles.sectionContent, { color: colors.textSecondary, marginTop: spacing[2] }]}>
            {activePeriod ?? '未設定'}
          </Text>
        </View>

        {/* Roles */}
        <View style={[styles.section, { marginTop: spacing[6] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
            役職
          </Text>
          {person.roles.length > 0 ? (
            <View style={{ marginTop: spacing[2] }}>
              {person.roles.map((role, index) => (
                <Text
                  key={`${role}-${index}`}
                  style={[styles.roleItem, { color: colors.textSecondary }]}
                >
                  • {ROLE_LABELS[role] ?? role}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={[styles.placeholder, { color: colors.textTertiary, marginTop: spacing[2] }]}>
              未設定
            </Text>
          )}
        </View>

        {/* Summary */}
        <View style={[styles.section, { marginTop: spacing[6] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
            概要
          </Text>
          {person.summary ? (
            <Text
              style={[
                styles.summary,
                { color: colors.textSecondary, marginTop: spacing[2], lineHeight: 22 },
              ]}
            >
              {person.summary}
            </Text>
          ) : (
            <Text style={[styles.placeholder, { color: colors.textTertiary, marginTop: spacing[2] }]}>
              未設定
            </Text>
          )}
        </View>

        {/* Related Events */}
        <View style={[styles.section, { marginTop: spacing[6] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
            関連出来事
          </Text>
          {relatedEvents.length > 0 ? (
            <View style={{ marginTop: spacing[3] }}>
              {relatedEvents.map((event) => (
                <EventLink
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event.id)}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.placeholder, { color: colors.textTertiary, marginTop: spacing[2] }]}>
              関連する出来事はありません
            </Text>
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  name: {
    fontWeight: '700',
  },
  nameReading: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginRight: 8,
  },
  metaValue: {
    fontSize: 13,
  },
  section: {},
  sectionTitle: {
    fontWeight: '600',
  },
  sectionContent: {
    fontSize: 14,
  },
  roleItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  summary: {
    fontSize: 14,
  },
  placeholder: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
