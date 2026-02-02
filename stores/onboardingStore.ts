/**
 * Onboarding Store - オンボーディング状態管理
 * Sprint 3: 043 Onboarding Flow
 *
 * AsyncStorage で完了フラグを永続化し、初回起動時のみ表示
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = '@onboarding/completed';
const LONG_PRESS_HINT_KEY = '@hints/longPressShown';

interface OnboardingState {
  /** 初期化完了（AsyncStorage チェック済み） */
  initialized: boolean;
  /** オンボーディング完了済み */
  completed: boolean;
  /** 長押しヒント表示済み */
  longPressHintShown: boolean;
  /** オンボーディング完了をマーク */
  markCompleted: () => Promise<void>;
  /** 起動時に完了状態をチェック */
  checkCompleted: () => Promise<void>;
  /** オンボーディングをリセット（デバッグ用） */
  resetOnboarding: () => Promise<void>;
  /** 長押しヒント表示済みをマーク */
  markLongPressHintShown: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  initialized: false,
  completed: false,
  longPressHintShown: false,

  markCompleted: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      set({ completed: true });
    } catch (error) {
      console.error('[OnboardingStore] Failed to save completed state:', error);
    }
  },

  checkCompleted: async () => {
    try {
      const [completedValue, hintValue] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(LONG_PRESS_HINT_KEY),
      ]);
      set({
        initialized: true,
        completed: completedValue === 'true',
        longPressHintShown: hintValue === 'true',
      });
    } catch (error) {
      console.error('[OnboardingStore] Failed to check completed state:', error);
      set({ initialized: true, completed: false, longPressHintShown: false });
    }
  },

  resetOnboarding: async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, LONG_PRESS_HINT_KEY]);
      set({ completed: false, longPressHintShown: false });
    } catch (error) {
      console.error('[OnboardingStore] Failed to reset onboarding:', error);
    }
  },

  markLongPressHintShown: async () => {
    try {
      await AsyncStorage.setItem(LONG_PRESS_HINT_KEY, 'true');
      set({ longPressHintShown: true });
    } catch (error) {
      console.error('[OnboardingStore] Failed to save long press hint state:', error);
    }
  },
}));

/** オンボーディング完了済みかどうか */
export const useIsOnboardingCompleted = () =>
  useOnboardingStore((state) => state.completed);

/** 初期化完了かどうか（AsyncStorage チェック済み） */
export const useIsOnboardingInitialized = () =>
  useOnboardingStore((state) => state.initialized);

/** 長押しヒント表示済みかどうか */
export const useLongPressHintShown = () =>
  useOnboardingStore((state) => state.longPressHintShown);
