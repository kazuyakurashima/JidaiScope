/**
 * Root Layout - アプリ全体のナビゲーション構造
 * Sprint 1: 011 Navigation Architecture
 * Sprint 1: 012 Database Schema & API
 * Sprint 1: 016 Dark Theme
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { initializeDatabase } from '@/data/database';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const setDbReady = useAppStore((state) => state.setDbReady);

  // データベース初期化（アプリ起動時に一度だけ実行）
  useEffect(() => {
    initializeDatabase()
      .then(() => {
        setDbReady(true);
      })
      .catch((error) => {
        console.error('Database initialization failed:', error);
      });
  }, [setDbReady]);

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
