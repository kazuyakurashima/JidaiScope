/**
 * Era Detail Screen - 時代詳細
 * Sprint 2: 020 Timeline Core
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getDatabase } from '@/data/database';
import { useTheme } from '@/hooks/useTheme';
import { extractYearFromDate } from '@/domain/timeline/coordinateSystem';
import { formatYear, formatYearRange } from '@/utils/formatYear';
import type { Era, EraRow, HistoricalEvent, EventRow, EventTag, ImportanceLevel, EventSource } from '@/types/database';

function convertEventRow(row: EventRow): HistoricalEvent {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    summary: row.summary,
    tags: JSON.parse(row.tags) as EventTag[],
    importanceLevel: row.importanceLevel as ImportanceLevel,
    eraId: row.eraId,
    source: row.source ? JSON.parse(row.source) as EventSource : null,
    relatedPersonIds: JSON.parse(row.relatedPersonIds) as string[],
    relatedEventIds: JSON.parse(row.relatedEventIds) as string[],
  };
}

export default function EraDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();

  const [era, setEra] = useState<Era | null>(null);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const db = await getDatabase();

        // 時代データ取得
        const eraRow = await db.getFirstAsync<EraRow>(
          'SELECT * FROM era WHERE id = ?',
          id
        );

        if (eraRow) {
          setEra({
            id: eraRow.id,
            name: eraRow.name,
            nameEn: eraRow.nameEn,
            startYear: eraRow.startYear,
            endYear: eraRow.endYear,
            parentEraId: eraRow.parentEraId,
            color: eraRow.color,
          });
        }

        // この時代のイベント取得（上位10件）
        const eventRows = await db.getAllAsync<EventRow>(
          'SELECT * FROM event WHERE eraId = ? ORDER BY importanceLevel DESC, startDate ASC LIMIT 10',
          id
        );

        setEvents(eventRows.map(convertEventRow));
      } catch (error) {
        console.error('[EraDetail] Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!era) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error, marginTop: spacing[3] }]}>
          Era not found
        </Text>
      </View>
    );
  }

  const yearRange = formatYearRange(era.startYear, era.endYear);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {/* 時代ヘッダー */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: era.color ?? colors.bgSecondary,
              borderRadius: radius.lg,
              padding: spacing[6],
            },
          ]}
        >
          <Text style={[styles.title, { color: '#FFFFFF', fontSize: typography.size['3xl'] }]}>
            {era.name}
          </Text>
          <Text style={[styles.yearRange, { color: 'rgba(255,255,255,0.8)', marginTop: spacing[2] }]}>
            {yearRange}
          </Text>
        </View>

        {/* 時代情報 */}
        <View style={[styles.section, { marginTop: spacing[6] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.lg }]}>
            Period Duration
          </Text>
          <Text style={[styles.duration, { color: colors.textSecondary, marginTop: spacing[2] }]}>
            {era.endYear - era.startYear} years
          </Text>
        </View>

        {/* 関連イベント */}
        {events.length > 0 && (
          <View style={[styles.section, { marginTop: spacing[6] }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.lg }]}>
              Major Events ({events.length})
            </Text>
            <View style={[styles.eventList, { marginTop: spacing[3] }]}>
              {events.map((event) => (
                <Pressable
                  key={event.id}
                  style={[
                    styles.eventItem,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderRadius: radius.md,
                      padding: spacing[4],
                      marginBottom: spacing[2],
                    },
                  ]}
                  onPress={() => router.push(`/event/${event.id}`)}
                >
                  <View style={styles.eventInfo}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    <View style={{ marginLeft: spacing[3], flex: 1 }}>
                      <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={[styles.eventDate, { color: colors.textTertiary }]}>
                        {formatYear(extractYearFromDate(event.startDate))}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  yearRange: {
    fontSize: 16,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  duration: {
    fontSize: 24,
    fontWeight: '300',
  },
  eventList: {},
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
