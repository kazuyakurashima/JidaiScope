/**
 * JidaiScope - Timeline Screen
 * Sprint 2: 020 Timeline Core
 *
 * メインタイムライン画面。真比率タイムラインで日本史を探索。
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, Pressable, ActivityIndicator } from 'react-native';

import { TimelineCanvas, EraPickerBar } from '@/components/timeline';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineData } from '@/hooks/useTimelineData';
import { useAppStore } from '@/stores';

export default function TimelineScreen() {
  const router = useRouter();
  const { colors, typography, spacing, isDark } = useTheme();

  // データベース状態
  const dbReady = useAppStore((s) => s.dbReady);

  // タイムラインデータ
  const { eras, events, isLoading, error } = useTimelineData();

  // ローディング・エラー表示
  const showLoading = !dbReady || isLoading;
  const showError = error !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ヘッダー */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingHorizontal: spacing[4],
            paddingTop: spacing[2],
            paddingBottom: spacing[3],
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: typography.size['4xl'],
                },
              ]}
            >
              JidaiScope
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textTertiary,
                  fontSize: typography.size.base,
                  marginTop: spacing[1],
                },
              ]}
            >
              {showLoading ? 'Loading...' : `${eras.length} eras / ${events.length} events`}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={{ padding: spacing[2] }}>
            <Ionicons name="settings-outline" size={spacing[6]} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Era Picker Bar */}
      {!showLoading && !showError && eras.length > 0 && (
        <EraPickerBar eras={eras} />
      )}

      {/* タイムライン本体 */}
      <View style={styles.timelineContainer}>
        {showLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: spacing[3] }]}>
              Loading timeline data...
            </Text>
          </View>
        )}

        {showError && !showLoading && (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error, marginTop: spacing[3] }]}>
              Failed to load timeline data
            </Text>
            <Text style={[styles.errorDetail, { color: colors.textSecondary, marginTop: spacing[2] }]}>
              {error?.message}
            </Text>
          </View>
        )}

        {!showLoading && !showError && eras.length > 0 && (
          <TimelineCanvas
            eras={eras}
            events={events}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {},
  timelineContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
