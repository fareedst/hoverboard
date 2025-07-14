/**
 * Jest Test Setup Configuration
 * Sets up the testing environment for Hoverboard browser extension
 */

// Import testing utilities
require('@testing-library/jest-dom');
require('jest-webextension-mock');

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

// Mock chrome extension APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    id: 'test-extension-id',
    // Add missing properties to prevent Object.values error
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
    getBackgroundPage: jest.fn(),
    openOptionsPage: jest.fn(),
    setUninstallURL: jest.fn(),
    getPackageDirectoryEntry: jest.fn(),
    getPlatformInfo: jest.fn(),
    getManifest: jest.fn(),
    requestUpdateCheck: jest.fn(),
    restart: jest.fn(),
    reload: jest.fn(),
    connectNative: jest.fn(),
    sendNativeMessage: jest.fn(),
    getBackgroundPage: jest.fn(),
    openOptionsPage: jest.fn(),
    setUninstallURL: jest.fn(),
    lastError: null,
    onStartup: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onInstalled: {
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
    }
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
      clear: jest.fn().mockResolvedValue(),
    },
    sync: {
      get: jest.fn().mockResolvedValue({
        hoverboard_settings: {
          recentTagsCountMax: 10,
          initRecentPostsCount: 20,
          showHoverOnPageLoad: true,
          hoverShowRecentTags: true
        },
        hoverboard_auth_token: 'user-test-token:123456',
        hoverboard_inhibit_urls: ''
      }),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
      clear: jest.fn().mockResolvedValue(),
    },
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(),
    create: jest.fn().mockResolvedValue(),
    update: jest.fn().mockResolvedValue(),
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

// Mock DOM APIs commonly used in browser extensions
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

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock StateManager popupState to prevent undefined errors
global.popupState = {
  loadPersistedState: jest.fn().mockResolvedValue({}),
  savePersistedState: jest.fn().mockResolvedValue(),
  clearPersistedState: jest.fn().mockResolvedValue(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset chrome API mocks
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