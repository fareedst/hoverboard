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
  warn: console.warn,
  error: console.error,
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

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset chrome API mocks
  Object.values(global.chrome.runtime).forEach(mock => {
    if (typeof mock?.mockClear === 'function') {
      mock.mockClear();
    }
  });
  
  Object.values(global.chrome.storage.local).forEach(mock => {
    if (typeof mock?.mockClear === 'function') {
      mock.mockClear();
    }
  });
  
  Object.values(global.chrome.storage.sync).forEach(mock => {
    if (typeof mock?.mockClear === 'function') {
      mock.mockClear();
    }
  });
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

// Suppress console warnings for tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes && args[0].includes('deprecated')) {
    return;
  }
  originalConsoleWarn(...args);
}; 