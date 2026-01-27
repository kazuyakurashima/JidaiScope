/**
 * Settings Store - ユーザー設定管理（AsyncStorage同期）
 * Sprint 1: 014 State Management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SettingsState, ThemeMode, LayerVisibility } from '@/types/store';
import { DEFAULT_LAYER_VISIBILITY } from '@/types/store';

const STORAGE_KEY = '@jidaiscope/settings';

interface StoredSettings {
  hapticEnabled: boolean;
  theme: ThemeMode;
  visibleLayers: LayerVisibility;
}

const DEFAULT_SETTINGS: StoredSettings = {
  hapticEnabled: true,
  theme: 'system',
  visibleLayers: DEFAULT_LAYER_VISIBILITY,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial State
  hapticEnabled: DEFAULT_SETTINGS.hapticEnabled,
  theme: DEFAULT_SETTINGS.theme,
  visibleLayers: DEFAULT_SETTINGS.visibleLayers,
  isLoaded: false,

  // Actions
  toggleHaptic: () => {
    set((state) => {
      const newValue = !state.hapticEnabled;
      saveSettings({ ...getStoredSettings(state), hapticEnabled: newValue });
      return { hapticEnabled: newValue };
    });
  },

  setTheme: (theme) => {
    set((state) => {
      saveSettings({ ...getStoredSettings(state), theme });
      return { theme };
    });
  },

  toggleLayer: (layer) => {
    set((state) => {
      const newLayers = {
        ...state.visibleLayers,
        [layer]: !state.visibleLayers[layer],
      };
      saveSettings({ ...getStoredSettings(state), visibleLayers: newLayers });
      return { visibleLayers: newLayers };
    });
  },

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredSettings>;
        set({
          hapticEnabled: parsed.hapticEnabled ?? DEFAULT_SETTINGS.hapticEnabled,
          theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
          visibleLayers: {
            ...DEFAULT_SETTINGS.visibleLayers,
            ...parsed.visibleLayers,
          },
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('[settingsStore] Failed to load settings:', error);
      set({ isLoaded: true });
    }
  },
}));

// =============================================================================
// Helper Functions
// =============================================================================

function getStoredSettings(state: SettingsState): StoredSettings {
  return {
    hapticEnabled: state.hapticEnabled,
    theme: state.theme,
    visibleLayers: state.visibleLayers,
  };
}

async function saveSettings(settings: StoredSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[settingsStore] Failed to save settings:', error);
  }
}

// =============================================================================
// Selectors
// =============================================================================

export const selectHapticEnabled = (state: SettingsState) => state.hapticEnabled;
export const selectTheme = (state: SettingsState) => state.theme;
export const selectVisibleLayers = (state: SettingsState) => state.visibleLayers;
export const selectIsSettingsLoaded = (state: SettingsState) => state.isLoaded;
