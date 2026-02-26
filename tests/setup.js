import '@testing-library/jest-dom';
import 'jest-webextension-mock';

/**
 * Jest Test Setup Configuration
 * Sets up the testing environment for Hoverboard browser extension
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

// [TEST-FIX-IMPL-2025-07-14] - Enhanced Chrome extension API mocks
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    getBackgroundPage: jest.fn().mockImplementation(() => Promise.resolve(global.mockBackgroundPage)),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
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
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
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
      get: jest.fn().mockImplementation((keys, callback) => {
        // [TEST-FIX-STORAGE-001] - Enhanced local storage mock with realistic data
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
      }),
      set: jest.fn().mockImplementation((data, callback) => {
        if (callback) {
          callback();
        } else {
          return Promise.resolve();
        }
      }),
      remove: jest.fn().mockImplementation((keys, callback) => {
        if (callback) {
          callback();
        } else {
          return Promise.resolve();
        }
      }),
      clear: jest.fn().mockImplementation((callback) => {
        if (callback) {
          callback();
        } else {
          return Promise.resolve();
        }
      }),
    },
    sync: {
      get: jest.fn().mockImplementation((keys, callback) => {
        // [TEST-FIX-STORAGE-2025-07-14] - Enhanced sync storage mock
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
      }),
      set: jest.fn().mockImplementation((data, callback) => {
        if (callback) {
          callback();
        } else {
          return Promise.resolve();
        }
      }),
      remove: jest.fn().mockImplementation((keys, callback) => {
        if (callback) {
          callback();
        } else {
          return Promise.resolve();
        }
      }),
      clear: jest.fn().mockImplementation((callback) => {
        if (callback) {
          callback();
        } else {
          return Promise.resolve();
        }
      }),
    },
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(),
    create: jest.fn().mockResolvedValue(),
    update: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
    onActivated: { addListener: jest.fn(), removeListener: jest.fn() },
    onUpdated: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  windows: {
    get: jest.fn().mockResolvedValue({ id: 1, type: 'normal' }),
  },
  scripting: {
    executeScript: jest.fn().mockResolvedValue(),
    insertCSS: jest.fn().mockResolvedValue(),
    removeCSS: jest.fn().mockResolvedValue(),
  },
  permissions: {
    request: jest.fn().mockResolvedValue(),
    contains: jest.fn().mockResolvedValue(),
  },
};

// Mock browser APIs for cross-browser compatibility
global.browser = global.chrome;

// [SAFARI-EXT-TEST-001] - Safari-specific mocks for testing
global.safari = {
  extension: {
    globalPage: {
      contentWindow: {
        recentTagsMemory: {
          getRecentTags: jest.fn().mockReturnValue([
            { name: 'safari-test-tag-1', lastUsed: Date.now() },
            { name: 'safari-test-tag-2', lastUsed: Date.now() - 1000 }
          ]),
          addTag: jest.fn().mockReturnValue(true),
          clearRecentTags: jest.fn().mockReturnValue(true)
        }
      }
    }
  },
  extension: {
    settings: {
      get: jest.fn().mockReturnValue({}),
      set: jest.fn().mockReturnValue(true)
    }
  }
};

// [SAFARI-EXT-TEST-001] - Mock navigator.storage for Safari storage tests
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

// [SAFARI-EXT-TEST-001] - Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  if (global.chrome && global.chrome.runtime) {
    global.chrome.runtime.lastError = null;
  }
  // Only clear console mocks if they exist and are Jest mocks
  if (global.console.warn && typeof global.console.warn.mockClear === 'function') {
    global.console.warn.mockClear();
  }
  if (global.console.error && typeof global.console.error.mockClear === 'function') {
    global.console.error.mockClear();
  }
  if (global.console.debug && typeof global.console.debug.mockClear === 'function') {
    global.console.debug.mockClear();
  }
  if (global.console.log && typeof global.console.log.mockClear === 'function') {
    global.console.log.mockClear();
  }
});

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

// [TEST-FIX-MOCK-2025-07-14] - Mock background page for recent tags functionality
global.mockBackgroundPage = {
  recentTagsMemory: {
    getRecentTags: jest.fn().mockReturnValue([
      { name: 'test-tag-1', lastUsed: Date.now() },
      { name: 'test-tag-2', lastUsed: Date.now() - 1000 },
      { name: 'test-tag-3', lastUsed: Date.now() - 2000 }
    ]),
    addTag: jest.fn().mockReturnValue(true),
    clearRecentTags: jest.fn().mockReturnValue(true),
    getMemoryStatus: jest.fn().mockReturnValue({ status: 'active' })
  }
};

// [TEST-FIX-MOCK-2025-07-14] - Mock message service for overlay functionality
global.mockMessageService = {
  sendMessage: jest.fn().mockResolvedValue({ success: true }),
  onMessage: jest.fn(),
  removeListener: jest.fn()
};

// Mock fetch for API calls
global.fetch = jest.fn();

// [TEST-FIX-IMPL-2025-07-14] - Global state management for shared memory
// Only add properties to globalThis, never overwrite it
if (!globalThis.recentTagsMemory) {
  globalThis.recentTagsMemory = {
    getRecentTags: jest.fn().mockReturnValue([
      { name: 'test-tag-1', lastUsed: Date.now() },
      { name: 'test-tag-2', lastUsed: Date.now() - 1000 },
      { name: 'test-tag-3', lastUsed: Date.now() - 2000 }
    ]),
    addTag: jest.fn().mockReturnValue(true),
    clearRecentTags: jest.fn().mockReturnValue(true),
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

// [TEST-FIX-ENV-001] - Enhanced test setup with better error handling
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // [TEST-FIX-ENV-001] - Enhanced Chrome API mock reset
  if (global.chrome && global.chrome.runtime) {
    Object.values(global.chrome.runtime).forEach(mock => {
      if (typeof mock?.mockClear === 'function') {
        mock.mockClear();
      }
    });
  }
  
  if (global.chrome && global.chrome.storage && global.chrome.storage.local) {
    Object.values(global.chrome.storage.local).forEach(mock => {
      if (typeof mock?.mockClear === 'function') {
        mock.mockClear();
      }
    });
  }
  
  if (global.chrome && global.chrome.storage && global.chrome.storage.sync) {
    Object.values(global.chrome.storage.sync).forEach(mock => {
      if (typeof mock?.mockClear === 'function') {
        mock.mockClear();
      }
    });
  }
  
  // [TEST-FIX-MOCK-2025-07-14] - Reset shared memory mocks (disabled in tests)
  // global.recentTagsMemory is null in test environment
  
  // [TEST-FIX-MOCK-2025-07-14] - Reset background page mocks
  if (global.mockBackgroundPage && global.mockBackgroundPage.recentTagsMemory) {
    global.mockBackgroundPage.recentTagsMemory.getRecentTags.mockClear();
    global.mockBackgroundPage.recentTagsMemory.addTag.mockClear();
    global.mockBackgroundPage.recentTagsMemory.clearRecentTags.mockClear();
    global.mockBackgroundPage.recentTagsMemory.getMemoryStatus.mockClear();
  }
  
  // [TEST-FIX-MOCK-2025-07-14] - Reset message service mocks
  if (global.mockMessageService) {
    global.mockMessageService.sendMessage.mockClear();
    global.mockMessageService.onMessage.mockClear();
    global.mockMessageService.removeListener.mockClear();
  }
  
  // [TEST-FIX-ENV-001] - Reset error mocks
  if (global.chrome && global.chrome.runtime && global.chrome.runtime.lastError) {
    global.chrome.runtime.lastError = null;
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