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
  theme: "system" as ThemeMode,
  visibleLayers: DEFAULT_VISIBLE_LAYERS,
};

type SettingsSnapshot = Pick<
  SettingsState,
  "hapticEnabled" | "theme" | "visibleLayers"
>;

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

export const useSettingsStore = create<SettingsState>((set, get) => {
  const hydrate = async () => {
    const stored = await loadSettingsFromStorage();
    set(stored);
  };

  void hydrate();

  return {
    ...DEFAULT_SETTINGS,

    toggleHaptic: () => {
      const next = !get().hapticEnabled;
      set({ hapticEnabled: next });
      void persistSettings({
        hapticEnabled: next,
        theme: get().theme,
        visibleLayers: get().visibleLayers,
      });
    },

    setTheme: (theme: ThemeMode) => {
      set({ theme });
      void persistSettings({
        hapticEnabled: get().hapticEnabled,
        theme,
        visibleLayers: get().visibleLayers,
      });
    },

    toggleLayer: (type: LayerType) => {
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
