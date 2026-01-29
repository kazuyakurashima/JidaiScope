/**
 * Root Layout - アプリ全体のナビゲーション構造
 * Sprint 1: 011 Navigation Architecture
 * Sprint 1: 012 Database Schema & API
 * Sprint 1: 013 Data Preparation
 * Sprint 1: 016 Dark Theme
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { initializeDatabase } from '@/data/database';
import { isDatabaseSeeded, seedDatabase } from '@/data/seed';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores';
import { useBookmarkStore } from '@/stores/bookmarkStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const setDbReady = useAppStore((state) => state.setDbReady);
  const loadBookmarks = useBookmarkStore((state) => state.loadBookmarks);

  // データベース初期化とシーディング（アプリ起動時に一度だけ実行）
  useEffect(() => {
    const initDb = async () => {
      try {
        // 1. DBスキーマ初期化
        await initializeDatabase();

        // 2. シーディングが必要かチェック
        const isSeeded = await isDatabaseSeeded();
        if (!isSeeded) {
          console.log('[App] Database is empty, starting seeding...');
          await seedDatabase();
        }

        // 3. 準備完了
        setDbReady(true);

        // 4. ブックマーク読み込み（詳細画面で即座に使えるよう）
        await loadBookmarks();
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    };

    initDb();
  }, [setDbReady, loadBookmarks]);

  // React Navigation テーマをカスタムカラーで構築
  const navigationTheme = useMemo(() => ({
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.bg,
      card: colors.bgSecondary,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
    fonts: isDark ? DarkTheme.fonts : DefaultTheme.fonts,
  }), [colors, isDark]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.bgSecondary,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          contentStyle: {
            backgroundColor: colors.bg,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="event/[id]"
          options={{
            title: 'イベント詳細',
            headerBackTitle: '戻る',
          }}
        />
        <Stack.Screen
          name="person/[id]"
          options={{
            title: '人物詳細',
            headerBackTitle: '戻る',
          }}
        />
        <Stack.Screen
          name="era/[id]"
          options={{
            title: '時代詳細',
            headerBackTitle: '戻る',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            title: '設定',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            title: 'Pro版',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
