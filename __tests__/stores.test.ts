/**
 * Store Unit Tests - ストア単体テスト
 * Sprint 1: 014 State Management
 */

// Note: AsyncStorage is mocked in setup.ts
// We'll re-require it after resetModules() to get fresh mock

// Zustand のストアをテスト用にリセットするヘルパー
const resetAllStores = () => {
  // 各ストアをモジュールから再読み込み
  jest.resetModules();
};

// Helper to get fresh AsyncStorage mock after resetModules
const getAsyncStorageMock = () => {
  return require('@react-native-async-storage/async-storage');
};

describe('appStore', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  it('should have proUnlocked default to false', () => {
    const { useAppStore } = require('@/stores/appStore');
    const state = useAppStore.getState();
    expect(state.proUnlocked).toBe(false);
  });

  it('should update proUnlocked via setProUnlocked', () => {
    const { useAppStore } = require('@/stores/appStore');
    const { setProUnlocked } = useAppStore.getState();

    setProUnlocked(true);
    expect(useAppStore.getState().proUnlocked).toBe(true);

    setProUnlocked(false);
    expect(useAppStore.getState().proUnlocked).toBe(false);
  });
});

describe('iapStore', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  it('should have purchaseStatus default to "none"', () => {
    const { useIapStore } = require('@/stores/iapStore');
    const state = useIapStore.getState();
    expect(state.purchaseStatus).toBe('none');
    expect(state.isProcessing).toBe(false);
  });

  it('should update purchaseStatus via setPurchaseStatus', () => {
    const { useIapStore } = require('@/stores/iapStore');
    const { setPurchaseStatus } = useIapStore.getState();

    setPurchaseStatus('purchased');
    expect(useIapStore.getState().purchaseStatus).toBe('purchased');
  });

  it('should reset purchase state via resetPurchase', () => {
    const { useIapStore } = require('@/stores/iapStore');
    const { setPurchaseStatus, setProcessing, resetPurchase } = useIapStore.getState();

    setPurchaseStatus('purchased');
    setProcessing(true);

    resetPurchase();

    const state = useIapStore.getState();
    expect(state.purchaseStatus).toBe('none');
    expect(state.isProcessing).toBe(false);
  });
});

describe('timelineStore', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  it('should have correct default values', () => {
    const { useTimelineStore } = require('@/stores/timelineStore');
    const state = useTimelineStore.getState();

    expect(state.zoomLevel).toBe(1);
    expect(state.scrollX).toBe(0);
    expect(state.lodLevel).toBe(0);
    expect(state.selectedEraId).toBeNull();
  });

  it('should update zoomLevel via setZoom', () => {
    const { useTimelineStore } = require('@/stores/timelineStore');
    const { setZoom } = useTimelineStore.getState();

    setZoom(2.5);
    expect(useTimelineStore.getState().zoomLevel).toBe(2.5);
  });

  it('should update lodLevel via setLOD', () => {
    const { useTimelineStore } = require('@/stores/timelineStore');
    const { setLOD } = useTimelineStore.getState();

    setLOD(2);
    expect(useTimelineStore.getState().lodLevel).toBe(2);
  });

  it('should reset all values via reset', () => {
    const { useTimelineStore } = require('@/stores/timelineStore');
    const { setZoom, setLOD, selectEra, reset } = useTimelineStore.getState();

    setZoom(5);
    setLOD(3);
    selectEra('edo');

    reset();

    const state = useTimelineStore.getState();
    expect(state.zoomLevel).toBe(1);
    expect(state.lodLevel).toBe(0);
    expect(state.selectedEraId).toBeNull();
  });
});

describe('bookmarkStore', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
    const AsyncStorage = getAsyncStorageMock();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('should have empty bookmarks by default', () => {
    const { useBookmarkStore } = require('@/stores/bookmarkStore');
    const state = useBookmarkStore.getState();
    expect(state.bookmarks).toEqual([]);
  });

  it('should add bookmark via addBookmark', async () => {
    const { useBookmarkStore } = require('@/stores/bookmarkStore');
    const { addBookmark } = useBookmarkStore.getState();

    await addBookmark('event-001');

    const state = useBookmarkStore.getState();
    expect(state.bookmarks).toContain('event-001');
  });

  it('should remove bookmark via removeBookmark', async () => {
    const { useBookmarkStore } = require('@/stores/bookmarkStore');
    const { addBookmark, removeBookmark } = useBookmarkStore.getState();

    await addBookmark('event-001');
    await addBookmark('event-002');
    await removeBookmark('event-001');

    const state = useBookmarkStore.getState();
    expect(state.bookmarks).not.toContain('event-001');
    expect(state.bookmarks).toContain('event-002');
  });

  it('should maintain bookmark order (newest first)', async () => {
    const { useBookmarkStore } = require('@/stores/bookmarkStore');
    const { addBookmark } = useBookmarkStore.getState();

    await addBookmark('event-001');
    await addBookmark('event-002');
    await addBookmark('event-003');

    const state = useBookmarkStore.getState();
    // Newest bookmark should be first
    expect(state.bookmarks[0]).toBe('event-003');
    expect(state.bookmarks[2]).toBe('event-001');
  });

  it('should limit bookmarks to 100', async () => {
    const { useBookmarkStore } = require('@/stores/bookmarkStore');
    const { addBookmark } = useBookmarkStore.getState();

    // Add 105 bookmarks
    for (let i = 0; i < 105; i++) {
      await addBookmark(`event-${i.toString().padStart(3, '0')}`);
    }

    const state = useBookmarkStore.getState();
    expect(state.bookmarks.length).toBeLessThanOrEqual(100);
  });

  // AsyncStorage persistence tests
  it('should call AsyncStorage.setItem when adding bookmark', async () => {
    const AsyncStorage = getAsyncStorageMock();
    const { useBookmarkStore } = require('@/stores/bookmarkStore');
    const { addBookmark } = useBookmarkStore.getState();

    await addBookmark('event-persist-001');
    // Wait for fire-and-forget persistence to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'bookmarks',
      expect.stringContaining('event-persist-001')
    );
  });

  it('should call AsyncStorage.setItem when removing bookmark', async () => {
    const AsyncStorage = getAsyncStorageMock();
    const { useBookmarkStore } = require('@/stores/bookmarkStore');
    const { addBookmark, removeBookmark } = useBookmarkStore.getState();

    await addBookmark('event-to-remove');
    await new Promise(resolve => setTimeout(resolve, 10));
    jest.clearAllMocks(); // Clear previous setItem calls

    await removeBookmark('event-to-remove');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'bookmarks',
      expect.any(String)
    );
    // Verify the removed item is not in the persisted data
    const lastCall = (AsyncStorage.setItem as jest.Mock).mock.calls.pop();
    expect(lastCall[1]).not.toContain('event-to-remove');
  });

  it('should restore bookmarks from AsyncStorage on hydration', async () => {
    // Reset modules first
    jest.resetModules();

    // Get fresh mock and set up return value BEFORE requiring store
    const AsyncStorage = getAsyncStorageMock();
    const storedBookmarks = ['restored-001', 'restored-002', 'restored-003'];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedBookmarks));

    const { useBookmarkStore } = require('@/stores/bookmarkStore');

    // Wait for hydration to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const state = useBookmarkStore.getState();
    expect(state.bookmarks).toEqual(storedBookmarks);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('bookmarks');
  });
});

describe('settingsStore', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
    const AsyncStorage = getAsyncStorageMock();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  it('should have correct default values', () => {
    const { useSettingsStore } = require('@/stores/settingsStore');
    const state = useSettingsStore.getState();

    expect(state.hapticEnabled).toBe(true);
    expect(state.theme).toBe('system');
    expect(state.visibleLayers.era).toBe(true);
    expect(state.visibleLayers.events).toBe(true);
  });

  it('should toggle haptic via toggleHaptic', async () => {
    const { useSettingsStore } = require('@/stores/settingsStore');
    const { toggleHaptic } = useSettingsStore.getState();

    await toggleHaptic();
    expect(useSettingsStore.getState().hapticEnabled).toBe(false);

    await toggleHaptic();
    expect(useSettingsStore.getState().hapticEnabled).toBe(true);
  });

  it('should update theme via setTheme', async () => {
    const { useSettingsStore } = require('@/stores/settingsStore');
    const { setTheme } = useSettingsStore.getState();

    await setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');

    await setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('should toggle layer visibility via toggleLayer', async () => {
    const { useSettingsStore } = require('@/stores/settingsStore');
    const { toggleLayer } = useSettingsStore.getState();

    await toggleLayer('emperor');
    expect(useSettingsStore.getState().visibleLayers.emperor).toBe(false);

    await toggleLayer('emperor');
    expect(useSettingsStore.getState().visibleLayers.emperor).toBe(true);
  });

  it('should preserve settings after multiple updates', async () => {
    const { useSettingsStore } = require('@/stores/settingsStore');
    const { setTheme, toggleHaptic, toggleLayer } = useSettingsStore.getState();

    await setTheme('dark');
    await toggleHaptic();
    await toggleLayer('person');

    const state = useSettingsStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.hapticEnabled).toBe(false);
    expect(state.visibleLayers.person).toBe(false);
  });

  // AsyncStorage persistence tests
  it('should call AsyncStorage.setItem when toggling haptic', async () => {
    const AsyncStorage = getAsyncStorageMock();
    const { useSettingsStore } = require('@/stores/settingsStore');
    const { toggleHaptic } = useSettingsStore.getState();

    await toggleHaptic();
    // Wait for fire-and-forget persistence to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'settings',
      expect.stringContaining('"hapticEnabled":false')
    );
  });

  it('should call AsyncStorage.setItem when setting theme', async () => {
    const AsyncStorage = getAsyncStorageMock();
    const { useSettingsStore } = require('@/stores/settingsStore');
    const { setTheme } = useSettingsStore.getState();

    await setTheme('dark');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'settings',
      expect.stringContaining('"theme":"dark"')
    );
  });

  it('should call AsyncStorage.setItem when toggling layer', async () => {
    const AsyncStorage = getAsyncStorageMock();
    const { useSettingsStore } = require('@/stores/settingsStore');
    const { toggleLayer } = useSettingsStore.getState();

    await toggleLayer('emperor');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'settings',
      expect.stringContaining('"emperor":false')
    );
  });

  it('should restore settings from AsyncStorage on hydration', async () => {
    // Reset modules first
    jest.resetModules();

    // Get fresh mock and set up return value BEFORE requiring store
    const AsyncStorage = getAsyncStorageMock();
    const storedSettings = {
      hapticEnabled: false,
      theme: 'dark',
      visibleLayers: {
        era: true,
        events: false,
        emperor: true,
        shogun: false,
        person: true,
      },
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedSettings));

    const { useSettingsStore } = require('@/stores/settingsStore');

    // Wait for hydration to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const state = useSettingsStore.getState();
    expect(state.hapticEnabled).toBe(false);
    expect(state.theme).toBe('dark');
    expect(state.visibleLayers.events).toBe(false);
    expect(state.visibleLayers.shogun).toBe(false);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('settings');
  });
});

describe('searchStore', () => {
  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  it('should have correct default values', () => {
    const { useSearchStore } = require('@/stores/searchStore');
    const state = useSearchStore.getState();

    expect(state.searchHistory).toEqual([]);
    expect(state.searchResults).toEqual({});
    expect(state.currentKeyword).toBe('');
  });

  it('should update currentKeyword and history via search', () => {
    const { useSearchStore } = require('@/stores/searchStore');
    const { search } = useSearchStore.getState();

    search('織田信長');

    const state = useSearchStore.getState();
    expect(state.currentKeyword).toBe('織田信長');
    expect(state.searchHistory).toContain('織田信長');
  });

  it('should cache results via cacheResults', () => {
    const { useSearchStore } = require('@/stores/searchStore');
    const { cacheResults } = useSearchStore.getState();

    cacheResults('信長', ['event-001', 'person-001']);

    const state = useSearchStore.getState();
    expect(state.searchResults['信長']).toEqual(['event-001', 'person-001']);
  });

  it('should clear history via clearHistory', () => {
    const { useSearchStore } = require('@/stores/searchStore');
    const { search, clearHistory } = useSearchStore.getState();

    search('織田信長');
    search('豊臣秀吉');
    clearHistory();

    expect(useSearchStore.getState().searchHistory).toEqual([]);
  });
});
