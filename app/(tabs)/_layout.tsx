/**
 * Tab Layout - 3タブナビゲーション
 * Sprint 1: 011 Navigation Architecture
 * Sprint 3: 043 Onboarding Flow
 */

import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function TabLayout() {
  const { colors } = useTheme();
  const initialized = useOnboardingStore((s) => s.initialized);
  const completed = useOnboardingStore((s) => s.completed);

  // オンボーディング状態チェック中は何も表示しない
  if (!initialized) {
    return null;
  }

  // 未完了の場合はオンボーディング画面へリダイレクト
  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'タイムライン',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '検索',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'ブックマーク',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
