/**
 * JidaiScope - Timeline Screen
 * Sprint 0: Tech Validation PoC
 * Sprint 1: Navigation Architecture
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, Pressable } from 'react-native';

import { DenseRenderTest } from '@/components/poc/DenseRenderTest';
import { LODTest } from '@/components/poc/LODTest';
import { PinchZoomTest } from '@/components/poc/PinchZoomTest';
import { useTheme } from '@/hooks/useTheme';

type TestMode = 'pinch' | 'lod' | 'dense';

export default function TimelineScreen() {
  const [testMode, setTestMode] = useState<TestMode>('dense');
  const router = useRouter();
  const { colors, typography, spacing, radius, isDark } = useTheme();

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
              Sprint 0: Tech Validation
            </Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={{ padding: spacing[2] }}>
            <Ionicons name="settings-outline" size={spacing[6]} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* テスト切替ボタン */}
        <View style={[styles.toggleContainer, { marginTop: spacing[3], gap: spacing[2] }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: testMode === 'pinch' ? colors.primary : colors.bgTertiary,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setTestMode('pinch')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: testMode === 'pinch' ? colors.bg : colors.textTertiary,
                  fontSize: typography.size.sm,
                },
              ]}
            >
              Day 1: Pinch
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: testMode === 'lod' ? colors.primary : colors.bgTertiary,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setTestMode('lod')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: testMode === 'lod' ? colors.bg : colors.textTertiary,
                  fontSize: typography.size.sm,
                },
              ]}
            >
              Day 2: LOD
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: testMode === 'dense' ? colors.primary : colors.bgTertiary,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
                borderRadius: radius.md,
              },
            ]}
            onPress={() => setTestMode('dense')}
          >
            <Text
              style={[
                styles.toggleText,
                {
                  color: testMode === 'dense' ? colors.bg : colors.textTertiary,
                  fontSize: typography.size.sm,
                },
              ]}
            >
              Day 3: Dense
            </Text>
          </TouchableOpacity>
        </View>

        {/* ナビゲーションテスト用ボタン */}
        <View style={{ marginTop: spacing[3] }}>
          <TouchableOpacity
            style={[
              styles.navTestButton,
              {
                backgroundColor: colors.accent,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
                borderRadius: radius.md,
              },
            ]}
            onPress={() => router.push('/event/demo-event-001')}
          >
            <Text
              style={[
                styles.navTestText,
                {
                  color: colors.bg,
                  fontSize: typography.size.sm,
                },
              ]}
            >
              → Event Detail (テスト)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* タイムライン PoC */}
      <View style={styles.timelineContainer}>
        {testMode === 'pinch' && <PinchZoomTest />}
        {testMode === 'lod' && <LODTest />}
        {testMode === 'dense' && <DenseRenderTest />}
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
  toggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toggleButton: {},
  toggleText: {
    fontWeight: '600',
  },
  navTestButton: {
    alignSelf: 'flex-start',
  },
  navTestText: {
    fontWeight: '600',
  },
  timelineContainer: {
    flex: 1,
  },
});
