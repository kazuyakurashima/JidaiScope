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
const BOOKMARK_TIP_KEY = '@tips/bookmarkShown';
const LAYER_TIP_KEY = '@tips/layerShown';
const WAREKI_TIP_KEY = '@tips/warekiShown';
const LAUNCH_COUNT_KEY = '@app/launchCount';

interface OnboardingState {
  /** 初期化完了（AsyncStorage チェック済み） */
  initialized: boolean;
  /** オンボーディング完了済み */
  completed: boolean;
  /** 長押しヒント表示済み */
  longPressHintShown: boolean;
  /** ブックマークTip表示済み（初回イベントタップ時） */
  bookmarkTipShown: boolean;
  /** レイヤー設定Tip表示済み（3回目起動時） */
  layerTipShown: boolean;
  /** 和暦検索Tip表示済み（初回検索時） */
  warekiTipShown: boolean;
  /** 起動回数 */
  launchCount: number;
  /** オンボーディング完了をマーク */
  markCompleted: () => Promise<void>;
  /** 起動時に完了状態をチェック */
  checkCompleted: () => Promise<void>;
  /** オンボーディングをリセット（デバッグ用） */
  resetOnboarding: () => Promise<void>;
  /** 長押しヒント表示済みをマーク */
  markLongPressHintShown: () => Promise<void>;
  /** ブックマークTip表示済みをマーク */
  markBookmarkTipShown: () => Promise<void>;
  /** レイヤー設定Tip表示済みをマーク */
  markLayerTipShown: () => Promise<void>;
  /** 和暦検索Tip表示済みをマーク */
  markWarekiTipShown: () => Promise<void>;
  /** 起動回数をインクリメント */
  incrementLaunchCount: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  initialized: false,
  completed: false,
  longPressHintShown: false,
  bookmarkTipShown: false,
  layerTipShown: false,
  warekiTipShown: false,
  launchCount: 0,

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
      const [
        completedValue,
        hintValue,
        bookmarkValue,
        layerValue,
        warekiValue,
        launchValue,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(LONG_PRESS_HINT_KEY),
        AsyncStorage.getItem(BOOKMARK_TIP_KEY),
        AsyncStorage.getItem(LAYER_TIP_KEY),
        AsyncStorage.getItem(WAREKI_TIP_KEY),
        AsyncStorage.getItem(LAUNCH_COUNT_KEY),
      ]);
      set({
        initialized: true,
        completed: completedValue === 'true',
        longPressHintShown: hintValue === 'true',
        bookmarkTipShown: bookmarkValue === 'true',
        layerTipShown: layerValue === 'true',
        warekiTipShown: warekiValue === 'true',
        launchCount: launchValue ? parseInt(launchValue, 10) : 0,
      });
    } catch (error) {
      console.error('[OnboardingStore] Failed to check completed state:', error);
      set({
        initialized: true,
        completed: false,
        longPressHintShown: false,
        bookmarkTipShown: false,
        layerTipShown: false,
        warekiTipShown: false,
        launchCount: 0,
      });
    }
  },

  resetOnboarding: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        LONG_PRESS_HINT_KEY,
        BOOKMARK_TIP_KEY,
        LAYER_TIP_KEY,
        WAREKI_TIP_KEY,
        LAUNCH_COUNT_KEY,
      ]);
      set({
        completed: false,
        longPressHintShown: false,
        bookmarkTipShown: false,
        layerTipShown: false,
        warekiTipShown: false,
        launchCount: 0,
      });
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

  markBookmarkTipShown: async () => {
    try {
      await AsyncStorage.setItem(BOOKMARK_TIP_KEY, 'true');
      set({ bookmarkTipShown: true });
    } catch (error) {
      console.error('[OnboardingStore] Failed to save bookmark tip state:', error);
    }
  },

  markLayerTipShown: async () => {
    try {
      await AsyncStorage.setItem(LAYER_TIP_KEY, 'true');
      set({ layerTipShown: true });
    } catch (error) {
      console.error('[OnboardingStore] Failed to save layer tip state:', error);
    }
  },

  markWarekiTipShown: async () => {
    try {
      await AsyncStorage.setItem(WAREKI_TIP_KEY, 'true');
      set({ warekiTipShown: true });
    } catch (error) {
      console.error('[OnboardingStore] Failed to save wareki tip state:', error);
    }
  },

  incrementLaunchCount: async () => {
    try {
      const currentCount = useOnboardingStore.getState().launchCount;
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(newCount));
      set({ launchCount: newCount });
    } catch (error) {
      console.error('[OnboardingStore] Failed to increment launch count:', error);
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

/** ブックマークTip表示済みかどうか */
export const useBookmarkTipShown = () =>
  useOnboardingStore((state) => state.bookmarkTipShown);

/** レイヤー設定Tip表示済みかどうか */
export const useLayerTipShown = () =>
  useOnboardingStore((state) => state.layerTipShown);

/** 和暦検索Tip表示済みかどうか */
export const useWarekiTipShown = () =>
  useOnboardingStore((state) => state.warekiTipShown);

/** 起動回数を取得 */
export const useLaunchCount = () =>
  useOnboardingStore((state) => state.launchCount);
