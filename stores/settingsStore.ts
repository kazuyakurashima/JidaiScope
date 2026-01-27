/**
 * Settings Store - ユーザー設定管理
 * Sprint 1: 014 State Management
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type { LayerType, SettingsState, ThemeMode } from "@/types/store";

const STORAGE_KEY = "settings";

const DEFAULT_VISIBLE_LAYERS: Record<LayerType, boolean> = {
  era: true,
  events: true,
  emperor: true,
  shogun: true,
  person: true,
};

const DEFAULT_SETTINGS = {
  hapticEnabled: true,
  theme: "dark" as ThemeMode,
  visibleLayers: DEFAULT_VISIBLE_LAYERS,
};

type SettingsSnapshot = Pick<SettingsState, "hapticEnabled" | "theme" | "visibleLayers">;

const sanitizeTheme = (value: unknown): ThemeMode => {
  if (value === "light" || value === "dark" || value === "system") return value;
  return DEFAULT_SETTINGS.theme;
};

const sanitizeVisibleLayers = (value: unknown): Record<LayerType, boolean> => {
  if (!value || typeof value !== "object") return { ...DEFAULT_VISIBLE_LAYERS };
  const layerRecord = value as Record<string, unknown>;
  return {
    era: Boolean(layerRecord.era ?? DEFAULT_VISIBLE_LAYERS.era),
    events: Boolean(layerRecord.events ?? DEFAULT_VISIBLE_LAYERS.events),
    emperor: Boolean(layerRecord.emperor ?? DEFAULT_VISIBLE_LAYERS.emperor),
    shogun: Boolean(layerRecord.shogun ?? DEFAULT_VISIBLE_LAYERS.shogun),
    person: Boolean(layerRecord.person ?? DEFAULT_VISIBLE_LAYERS.person),
  };
};

const loadSettingsFromStorage = async (): Promise<SettingsSnapshot> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(stored) as Partial<SettingsSnapshot>;
    return {
      hapticEnabled:
        typeof parsed.hapticEnabled === "boolean"
          ? parsed.hapticEnabled
          : DEFAULT_SETTINGS.hapticEnabled,
      theme: sanitizeTheme(parsed.theme),
      visibleLayers: sanitizeVisibleLayers(parsed.visibleLayers),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

const persistSettings = async (snapshot: SettingsSnapshot): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore persistence failures to avoid blocking UI.
  }
};

// Hydration promise to prevent race conditions
let hydratePromise: Promise<void> | null = null;
let isHydrated = false;

export const useSettingsStore = create<SettingsState>((set, get) => {
  const hydrate = async () => {
    const stored = await loadSettingsFromStorage();
    // Use functional update to avoid overwriting any changes made during hydration
    set((state) => {
      // If already hydrated by another call, don't overwrite
      if (isHydrated) return state;
      isHydrated = true;
      return stored;
    });
  };

  hydratePromise = hydrate();

  return {
    ...DEFAULT_SETTINGS,

    toggleHaptic: async () => {
      // Wait for initial hydration to complete
      if (hydratePromise) {
        await hydratePromise;
      }

      const next = !get().hapticEnabled;
      set({ hapticEnabled: next });
      void persistSettings({
        hapticEnabled: next,
        theme: get().theme,
        visibleLayers: get().visibleLayers,
      });
    },

    setTheme: async (theme: ThemeMode) => {
      // Wait for initial hydration to complete
      if (hydratePromise) {
        await hydratePromise;
      }

      set({ theme });
      void persistSettings({
        hapticEnabled: get().hapticEnabled,
        theme,
        visibleLayers: get().visibleLayers,
      });
    },

    toggleLayer: async (type: LayerType) => {
      // Wait for initial hydration to complete
      if (hydratePromise) {
        await hydratePromise;
      }

      const nextLayers = {
        ...get().visibleLayers,
        [type]: !get().visibleLayers[type],
      };
      set({ visibleLayers: nextLayers });
      void persistSettings({
        hapticEnabled: get().hapticEnabled,
        theme: get().theme,
        visibleLayers: nextLayers,
      });
    },
  };
});
