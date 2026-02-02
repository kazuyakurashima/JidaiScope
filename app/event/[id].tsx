/**
 * Event Detail Screen - イベント詳細画面
 * Sprint 3: 031 Event Detail Screen
 *
 * 機能:
 * - イベント基本情報（タイトル、日付、概要）
 * - 関連人物・関連イベントへのリンク
 * - 典拠（出典）表示
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

import type { HistoricalEvent, Person } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/appStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useOnboardingStore, useBookmarkTipShown, useIsOnboardingInitialized } from '@/stores/onboardingStore';
import { TipModal } from '@/components/ui/TipModal';
import { getEventById, getEventsByIds } from '@/data/repositories/EventRepository';
import { getEraById } from '@/data/repositories/EraRepository';
import { getPersonsByIds } from '@/data/repositories/PersonRepository';
import { extractYearFromDate } from '@/domain/timeline/coordinateSystem';
import { seirekiToWakaAsync } from '@/utils/wakaCalendar';
import { formatYear } from '@/utils/formatYear';
import {
  TagBadge,
  PersonLink,
  EventLink,
  SourceBadge,
  BookmarkButton,
} from '@/components/cards';

// =============================================================================
// Component
// =============================================================================

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const dbReady = useAppStore((s) => s.dbReady);
  const touchAccess = useBookmarkStore((s) => s.touchAccess);

  // プログレッシブ開示: ブックマークTip
  const onboardingInitialized = useIsOnboardingInitialized();
  const bookmarkTipShown = useBookmarkTipShown();
  const markBookmarkTipShown = useOnboardingStore((s) => s.markBookmarkTipShown);
  const [showBookmarkTip, setShowBookmarkTip] = useState(false);

  const [event, setEvent] = useState<HistoricalEvent | null>(null);
  const [eraName, setEraName] = useState<string | null>(null);
  const [relatedPersons, setRelatedPersons] = useState<Person[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startWaka, setStartWaka] = useState<string | null>(null);
  const [endWaka, setEndWaka] = useState<string | null>(null);

  // データ読み込み
  useEffect(() => {
    if (!id || !dbReady) return;

    const loadData = async () => {
      setIsLoading(true);
      // 関連データを初期化（イベント切替時の残表示を防止）
      setRelatedPersons([]);
      setRelatedEvents([]);
      setEraName(null);
      setStartWaka(null);
      setEndWaka(null);

      try {
        const eventData = await getEventById(id);
        setEvent(eventData);

        if (!eventData) return;

        // 時代名を取得
        if (eventData.eraId) {
          const era = await getEraById(eventData.eraId);
          setEraName(era?.name ?? null);
        }

        // 和暦変換（全時代対応）
        const startYear = extractYearFromDate(eventData.startDate);
        const startWakaText = await seirekiToWakaAsync(startYear);
        setStartWaka(startWakaText);

        if (eventData.endDate) {
          const endYear = extractYearFromDate(eventData.endDate);
          const endWakaText = await seirekiToWakaAsync(endYear);
          setEndWaka(endWakaText);
        }

        // 関連人物を取得
        if (eventData.relatedPersonIds.length > 0) {
          const persons = await getPersonsByIds(eventData.relatedPersonIds);
          setRelatedPersons(persons);
        }

        // 関連イベントを取得（eventDataを活用して冗長な再取得を回避）
        if (eventData.relatedEventIds.length > 0) {
          const events = await getEventsByIds(eventData.relatedEventIds);
          setRelatedEvents(events);
        }

        // アクセス順キャッシュを更新（ブックマーク済みの場合）
        void touchAccess('event', id);
      } catch (error) {
        console.error('Failed to load event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [id, dbReady, touchAccess]);

  // ナビゲーション
  const handlePersonPress = useCallback(
    (personId: string) => {
      router.push(`/person/${personId}`);
    },
    [router]
  );

  const handleEventPress = useCallback(
    (eventId: string) => {
      router.push(`/event/${eventId}`);
    },
    [router]
  );

  // 初回イベント表示時のブックマークTip
  useEffect(() => {
    // initialized完了後のみ判定（AsyncStorage読み込み前の誤表示を防止）
    if (onboardingInitialized && !isLoading && event && !bookmarkTipShown) {
      // 少し遅延させてからTip表示（コンテンツ読み込み後）
      const timer = setTimeout(() => {
        setShowBookmarkTip(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingInitialized, isLoading, event, bookmarkTipShown]);

  const handleBookmarkTipClose = useCallback(() => {
    setShowBookmarkTip(false);
    void markBookmarkTipShown();
  }, [markBookmarkTipShown]);

  // 日付フォーマット（西暦表示用 - 負の年は紀元前○○年）
  const formatSeirekiDate = (dateStr: string): string => {
    const year = extractYearFromDate(dateStr);
    if (dateStr.includes('-') && year >= 0) {
      // 月日がある場合: YYYY/MM/DD 形式
      return dateStr.replace(/-/g, '/');
    }
    // 年のみ or 紀元前: formatYear で統一
    return formatYear(year);
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
  if (!event) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.textSecondary, marginTop: spacing[4] }]}>
          イベントが見つかりませんでした
        </Text>
      </View>
    );
  }

  const startSeireki = formatSeirekiDate(event.startDate);
  const endSeireki = event.endDate ? formatSeirekiDate(event.endDate) : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerRight: () => (
            <BookmarkButton targetType="event" targetId={id!} title={event.title} />
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={[styles.content, { padding: spacing[4] }]}
      >
        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: typography.size['2xl'] },
          ]}
        >
          {event.title}
        </Text>

        {/* Date */}
        <View style={[styles.dateSection, { marginTop: spacing[3] }]}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {startSeireki}
            {endSeireki ? ` 〜 ${endSeireki}` : ''}
          </Text>
          {(startWaka || endWaka) && (
            <Text style={[styles.dateWaka, { color: colors.textTertiary, marginTop: spacing[1] }]}>
              {startWaka ?? ''}
              {endWaka ? ` 〜 ${endWaka}` : ''}
            </Text>
          )}
        </View>

        {/* Era & Importance */}
        <View style={[styles.metaRow, { marginTop: spacing[3] }]}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>時代</Text>
            <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
              {eraName ?? '未設定'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>重要度</Text>
            <Text style={[styles.metaValue, { color: colors.textSecondary }]}>
              {['低', '通常', '重要', '最重要'][event.importanceLevel] ?? '未設定'}
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View style={[styles.section, { marginTop: spacing[4] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
            タグ
          </Text>
          {event.tags.length > 0 ? (
            <View style={[styles.tagsContainer, { marginTop: spacing[2] }]}>
              {event.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
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
          {event.summary ? (
            <Text
              style={[
                styles.summary,
                { color: colors.textSecondary, marginTop: spacing[2], lineHeight: 22 },
              ]}
            >
              {event.summary}
            </Text>
          ) : (
            <Text style={[styles.placeholder, { color: colors.textTertiary, marginTop: spacing[2] }]}>
              未設定
            </Text>
          )}
        </View>

        {/* Related Persons */}
        {relatedPersons.length > 0 && (
          <View style={[styles.section, { marginTop: spacing[6] }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
              関連人物
            </Text>
            <View style={{ marginTop: spacing[3] }}>
              {relatedPersons.map((person) => (
                <PersonLink
                  key={person.id}
                  person={person}
                  onPress={() => handlePersonPress(person.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <View style={[styles.section, { marginTop: spacing[6] }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
              関連出来事
            </Text>
            <View style={{ marginTop: spacing[3] }}>
              {relatedEvents.map((evt) => (
                <EventLink
                  key={evt.id}
                  event={evt}
                  onPress={() => handleEventPress(evt.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Source / 典拠 */}
        {event.source && (
          <View style={[styles.section, { marginTop: spacing[6] }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.base }]}>
              典拠
            </Text>
            <View style={{ marginTop: spacing[2] }}>
              <SourceBadge source={event.source} />
            </View>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: spacing[8] }} />
      </ScrollView>

      {/* プログレッシブ開示: ブックマークTip */}
      <TipModal
        visible={showBookmarkTip}
        title="ブックマーク機能"
        description="右上の☆マークでお気に入り登録できます。あとで見返したい出来事を保存しておきましょう！"
        icon="bookmark-outline"
        primaryButtonText="OK"
        onPrimaryPress={handleBookmarkTipClose}
        onClose={handleBookmarkTipClose}
      />
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
  title: {
    fontWeight: '700',
  },
  dateSection: {},
  date: {
    fontSize: 14,
  },
  dateWaka: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  section: {},
  sectionTitle: {
    fontWeight: '600',
  },
  summary: {
    fontSize: 14,
  },
  placeholder: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
