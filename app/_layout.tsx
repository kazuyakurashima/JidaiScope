/**
 * Root Layout - アプリ全体のナビゲーション構造
 * Sprint 1: 011 Navigation Architecture
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
