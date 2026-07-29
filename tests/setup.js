import '@testing-library/jest-dom';

/**
 * Jest Test Setup Configuration
 * Sets up the testing environment for Hoverboard browser extension
 * [TEST-FIX-ENV-002] jest-webextension-mock removed — global.chrome is defined here and replaced the package mock.
 */

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// [TEST-FIX-MOCK-2025-07-14] - Before global.chrome so getBackgroundPage can resolve it (applyChromeMockImplementations)
global.mockBackgroundPage = {
  recentTagsMemory: {
    getRecentTags: jest.fn().mockReturnValue([
      { name: 'test-tag-1', lastUsed: '2022-01-01T00:00:02.000Z' },
      { name: 'test-tag-2', lastUsed: '2022-01-01T00:00:01.000Z' },
      { name: 'test-tag-3', lastUsed: '2022-01-01T00:00:00.000Z' }
    ]),
    getRecentTagsForUi: jest.fn().mockResolvedValue([
      { name: 'test-tag-1', lastUsed: '2022-01-01T00:00:02.000Z' },
      { name: 'test-tag-2', lastUsed: '2022-01-01T00:00:01.000Z' },
      { name: 'test-tag-3', lastUsed: '2022-01-01T00:00:00.000Z' }
    ]),
    addTag: jest.fn().mockReturnValue(true),
    clearRecentTags: jest.fn().mockResolvedValue(undefined),
    getMemoryStatus: jest.fn().mockReturnValue({ status: 'active' })
  }
};

global.mockMessageService = {
  sendMessage: jest.fn().mockResolvedValue({ success: true }),
  onMessage: jest.fn(),
  removeListener: jest.fn()
};

/**
 * [TEST-FIX-ENV-002] Re-attach chrome mock implementations (safe if restoreMocks or mockReset cleared them).
 * @param {typeof global.chrome} chrome
 */
function applyChromeMockImplementations (chrome) {
  if (!chrome?.runtime || !chrome?.storage) return;

  // [TEST-FIX-ENV-002] Optional chaining: some tests replace global.chrome with a minimal stub (e.g. message-handler-runtime-validation.test.js)
  chrome.runtime.getBackgroundPage?.mockImplementation(() => Promise.resolve(global.mockBackgroundPage));
  chrome.runtime.getURL?.mockImplementation((path) => `chrome-extension://test-id/${path}`);
  chrome.runtime.getManifest?.mockImplementation(() => ({ version: '1.0.0' }));

  chrome.storage.local?.get?.mockImplementation((keys, callback) => {
    const mockData = {
      hoverboard_recent_tags_cache: {
        tags: [
          { name: 'test-tag-1', lastUsed: Date.now() },
          { name: 'test-tag-2', lastUsed: Date.now() - 1000 },
          { name: 'test-tag-3', lastUsed: Date.now() - 2000 }
        ],
        timestamp: Date.now()
      },
      hoverboard_tag_frequency: {
        'test-tag-1': 5,
        'test-tag-2': 3,
        'test-tag-3': 2
      }
    };
    const result = {};
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        result[key] = mockData[key] || null;
      });
    } else {
      result[keys] = mockData[keys] || null;
    }
    if (callback) {
      callback(result);
    } else {
      return Promise.resolve(result);
    }
  });
  chrome.storage.local?.set?.mockImplementation((data, callback) => {
    if (callback) callback(); else return Promise.resolve();
  });
  chrome.storage.local?.remove?.mockImplementation((keys, callback) => {
    if (callback) callback(); else return Promise.resolve();
  });
  chrome.storage.local?.clear?.mockImplementation((callback) => {
    if (callback) callback(); else return Promise.resolve();
  });

  chrome.storage.sync?.get?.mockImplementation((keys, callback) => {
    const mockData = {
      hoverboard_settings: {
        recentTagsCountMax: 10,
        initRecentPostsCount: 20,
        showHoverOnPageLoad: true,
        hoverShowRecentTags: true
      },
      hoverboard_auth_token: 'user-test-token:123456',
      hoverboard_inhibit_urls: ''
    };
    const result = {};
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        result[key] = mockData[key] || null;
      });
    } else {
      result[keys] = mockData[keys] || null;
    }
    if (callback) {
      callback(result);
    } else {
      return Promise.resolve(result);
    }
  });
  chrome.storage.sync?.set?.mockImplementation((data, callback) => {
    if (callback) callback(); else return Promise.resolve();
  });
  chrome.storage.sync?.remove?.mockImplementation((keys, callback) => {
    if (callback) callback(); else return Promise.resolve();
  });
  chrome.storage.sync?.clear?.mockImplementation((callback) => {
    if (callback) callback(); else return Promise.resolve();
  });

  chrome.tabs?.query?.mockResolvedValue([]);
  chrome.tabs?.sendMessage?.mockResolvedValue();
  chrome.tabs?.create?.mockResolvedValue();
  chrome.tabs?.update?.mockResolvedValue();
  chrome.tabs?.get?.mockResolvedValue({ id: 1, url: 'https://example.com' });
  chrome.windows?.get?.mockResolvedValue({ id: 1, type: 'normal' });
  chrome.scripting?.executeScript?.mockResolvedValue();
  chrome.scripting?.insertCSS?.mockResolvedValue();
  chrome.scripting?.removeCSS?.mockResolvedValue();
  chrome.permissions?.request?.mockResolvedValue();
  chrome.permissions?.contains?.mockResolvedValue();
  chrome.contextMenus?.removeAll?.mockImplementation((cb) => { if (typeof cb === 'function') cb(); });
}

function resetChromeMockImplementations () {
  applyChromeMockImplementations(global.chrome);
}

// [TEST-FIX-IMPL-2025-07-14] - Enhanced Chrome extension API mocks
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    getBackgroundPage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn(),
    id: 'test-extension-id',
    // [TEST-FIX-IMPL-2025-07-14] - Add missing properties to prevent Object.values error
    connect: jest.fn(),
    disconnect: jest.fn(),
    onConnect: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onDisconnect: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onStartup: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onUpdateAvailable: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onSuspend: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onSuspendCanceled: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onRestartRequired: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onConnectExternal: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onMessageExternal: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getManifest: jest.fn(),
    getPlatformInfo: jest.fn(),
    getPackageDirectoryEntry: jest.fn(),
    requestUpdateCheck: jest.fn(),
    restart: jest.fn(),
    reload: jest.fn(),
    connectNative: jest.fn(),
    sendNativeMessage: jest.fn(),
    openOptionsPage: jest.fn(),
    setUninstallURL: jest.fn(),
    lastError: null,
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    onActivated: { addListener: jest.fn(), removeListener: jest.fn() },
    onUpdated: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  windows: {
    get: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn(),
    removeCSS: jest.fn(),
  },
  permissions: {
    request: jest.fn(),
    contains: jest.fn(),
  },
  // [REQ-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] [IMPL-CONTEXT_MENU_QUICK_ACCESS] Mocks for quick-access tests
  commands: {
    onCommand: { addListener: jest.fn() },
  },
  sidePanel: {
    open: jest.fn(),
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(),
    onClicked: { addListener: jest.fn() },
  },
  // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] action.onClicked and openPopup for icon click tests
  action: {
    onClicked: { addListener: jest.fn() },
    openPopup: jest.fn(),
  },
};

resetChromeMockImplementations();

// Mock browser APIs for Chrome / browser API shim tests
global.browser = global.chrome;

// Mock navigator.storage for storage quota helpers in browser API shim
if (!global.navigator) global.navigator = {};
global.navigator.storage = {
  estimate: jest.fn().mockResolvedValue({
    usage: 1024 * 1024, // 1MB
    quota: 10 * 1024 * 1024 // 10MB
  })
};

// [SAFARI-EXT-TEST-001] - Mock setTimeout and setInterval only if not already mocked
if (!global._realSetTimeout) {
  global._realSetTimeout = setTimeout;
}
global.setTimeout = global._realSetTimeout;
if (!global._realSetInterval) {
  global._realSetInterval = setInterval;
}
global.setInterval = global._realSetInterval;

// [SAFARI-EXT-TEST-001] - Mock clearTimeout and clearInterval
if (!global._realClearTimeout) {
  global._realClearTimeout = clearTimeout;
}
global.clearTimeout = global._realClearTimeout;
if (!global._realClearInterval) {
  global._realClearInterval = clearInterval;
}
global.clearInterval = global._realClearInterval;

// [SAFARI-EXT-TEST-001] - Mock Math.random for consistent testing
global.Math.random = jest.fn(() => 0.5);

// [SAFARI-EXT-TEST-001] - Mock Date.now for consistent testing
const originalDateNow = Date.now;
global.Date.now = jest.fn(() => 1640995200000); // 2022-01-01 00:00:00 UTC

// [SAFARI-EXT-TEST-001] - Restore original Date.now after tests
afterAll(() => {
  global.Date.now = originalDateNow;
});

// Mock DOM APIs commonly used in browser extensions
// [Jest 30 / jsdom v26] window.location is non-configurable; only override when possible
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com',
        hostname: 'example.com',
        pathname: '/',
        search: '',
        hash: '',
      },
      writable: true,
    });
  } catch (_) {
    // jsdom v26+ defines a non-configurable location; leave it as-is
  }
}

// Mock fetch for API calls
global.fetch = jest.fn();

// [TEST-FIX-IMPL-2025-07-14] - Global state management for shared memory
// Only add properties to globalThis, never overwrite it
if (!globalThis.recentTagsMemory) {
  globalThis.recentTagsMemory = {
    getRecentTags: jest.fn().mockReturnValue([
      { name: 'test-tag-1', lastUsed: '2022-01-01T00:00:02.000Z' },
      { name: 'test-tag-2', lastUsed: '2022-01-01T00:00:01.000Z' },
      { name: 'test-tag-3', lastUsed: '2022-01-01T00:00:00.000Z' }
    ]),
    getRecentTagsForUi: jest.fn().mockResolvedValue([
      { name: 'test-tag-1', lastUsed: '2022-01-01T00:00:02.000Z' },
      { name: 'test-tag-2', lastUsed: '2022-01-01T00:00:01.000Z' },
      { name: 'test-tag-3', lastUsed: '2022-01-01T00:00:00.000Z' }
    ]),
    addTag: jest.fn().mockReturnValue(true),
    clearRecentTags: jest.fn().mockResolvedValue(undefined),
    getMemoryStatus: jest.fn().mockReturnValue({ status: 'active' })
  };
}

// [TEST-FIX-IMPL-2025-07-14] - Service worker context simulation
if (!globalThis.self) {
  globalThis.self = globalThis;
}

if (!globalThis.self.recentTagsMemory) {
  globalThis.self.recentTagsMemory = globalThis.recentTagsMemory;
}

// [TEST-FIX-MOCK-2025-07-14] - Enhanced shared memory mock for service worker context
// In test environment, we want to use background page mock instead of direct access
global.recentTagsMemory = null; // Disable direct access in tests

// Mock StateManager popupState to prevent undefined errors
global.popupState = {
  loadPersistedState: jest.fn().mockResolvedValue({}),
  savePersistedState: jest.fn().mockResolvedValue(),
  clearPersistedState: jest.fn().mockResolvedValue(),
};

// [TEST-FIX-ENV-002] Per-test reset: jest clearMocks clears call history; re-seed chrome implementations; fetch cleared
beforeEach(() => {
  resetChromeMockImplementations();
  if (global.fetch && typeof global.fetch.mockClear === 'function') {
    global.fetch.mockClear();
  }
  if (global.chrome && global.chrome.runtime) {
    global.chrome.runtime.lastError = null;
  }
  if (global.mockBackgroundPage && global.mockBackgroundPage.recentTagsMemory) {
    const m = global.mockBackgroundPage.recentTagsMemory;
    if (typeof m.getRecentTags?.mockClear === 'function') m.getRecentTags.mockClear();
    if (typeof m.getRecentTagsForUi?.mockClear === 'function') m.getRecentTagsForUi.mockClear();
    if (typeof m.addTag?.mockClear === 'function') m.addTag.mockClear();
    if (typeof m.clearRecentTags?.mockClear === 'function') m.clearRecentTags.mockClear();
    if (typeof m.getMemoryStatus?.mockClear === 'function') m.getMemoryStatus.mockClear();
  }
  if (global.mockMessageService) {
    if (typeof global.mockMessageService.sendMessage?.mockClear === 'function') {
      global.mockMessageService.sendMessage.mockClear();
    }
    if (typeof global.mockMessageService.onMessage?.mockClear === 'function') {
      global.mockMessageService.onMessage.mockClear();
    }
    if (typeof global.mockMessageService.removeListener?.mockClear === 'function') {
      global.mockMessageService.removeListener.mockClear();
    }
  }
});

// Global test utilities
global.testUtils = {
  // Create mock chrome.storage responses
  createStorageResponse: (data) => Promise.resolve(data),
  
  // Create mock chrome.tabs.query responses
  createTabsResponse: (tabs) => Promise.resolve(tabs),
  
  // Create mock Pinboard API responses
  createPinboardResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),
  
  // Wait for async operations in tests
  waitFor: (fn, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          const result = fn();
          if (result) {
            resolve(result);
          } else if (Date.now() - startTime >= timeout) {
            reject(new Error('Timeout waiting for condition'));
          } else {
            setTimeout(check, 10);
          }
        } catch (error) {
          if (Date.now() - startTime >= timeout) {
            reject(error);
          } else {
            setTimeout(check, 10);
          }
        }
      };
      check();
    });
  },
};

// Suppress console warnings and errors for tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  // Suppress specific expected warnings
  const message = args[0]?.toString() || '';
  if (message.includes('deprecated') || 
      message.includes('Failed to load persisted state') ||
      message.includes('Cannot read properties of undefined')) {
    return;
  }
  originalConsoleWarn(...args);
};

console.error = (...args) => {
  // Suppress specific expected errors from tests
  const message = args[0]?.toString() || '';
  if (message.includes('Failed to get stored settings') ||
      message.includes('Failed to parse stored settings') ||
      message.includes('Failed to get auth token') ||
      message.includes('Failed to set auth token') ||
      message.includes('Failed to get inhibit URLs') ||
      message.includes('Failed to save settings') ||
      message.includes('Failed to record tag usage') ||
      message.includes('Failed to get cached tags') ||
      message.includes('HTTP request failed') ||
      message.includes('Max retries exceeded') ||
      message.includes('Failed to get bookmark for URL') ||
      message.includes('Network error') ||
      message.includes('Storage error') ||
      message.includes('Critical storage error') ||
      message.includes('cb is not a function')) {
    return;
  }
  originalConsoleError(...args);
}; 