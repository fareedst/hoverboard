/**
 * [TEST-FIX-001] - Test helper utilities for common operations
 * Provides factory functions and utilities for consistent test setup
 */

/**
 * [TEST-FIX-001] - Create mock message service
 * @returns {Object} Mock message service
 */
export const createMockMessageService = () => ({
  sendMessage: jest.fn().mockResolvedValue({
    success: true,
    data: { result_code: 'done' }
  }),
  sendMessageToTab: jest.fn().mockResolvedValue({}),
  broadcastMessage: jest.fn().mockResolvedValue(),
  isBackgroundAvailable: jest.fn().mockResolvedValue(true),
  cleanup: jest.fn(),
  getStats: jest.fn().mockReturnValue({})
});

/**
 * [TEST-FIX-001] - Create mock tag service
 * @returns {Object} Mock tag service
 */
export const createMockTagService = () => ({
  sanitizeTag: jest.fn((tag) => {
    if (!tag || typeof tag !== 'string') return null;
    return tag.trim().replace(/<[^>]*>/g, '').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
  }),
  addTagToRecent: jest.fn().mockResolvedValue(true),
  getRecentTags: jest.fn().mockResolvedValue([]),
  getRecentTagsExcludingCurrent: jest.fn().mockResolvedValue([]),
  recordTagUsage: jest.fn().mockResolvedValue(),
  handleTagAddition: jest.fn().mockResolvedValue(),
  getUserRecentTags: jest.fn().mockResolvedValue([]),
  addTagToUserRecentList: jest.fn().mockResolvedValue(true)
});

/**
 * [TEST-FIX-001] - Create mock Chrome API
 * @returns {Object} Mock Chrome API
 */
export const createMockChromeAPI = () => ({
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    id: 'test-extension-id',
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(),
      clear: jest.fn().mockResolvedValue()
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
      clear: jest.fn().mockResolvedValue()
    }
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue(),
    create: jest.fn().mockResolvedValue(),
    update: jest.fn().mockResolvedValue()
  }
});

/**
 * [TEST-FIX-001] - Create mock tag data
 * @param {Object} options - Tag options
 * @returns {Object} Mock tag data
 */
export const createMockTagData = (options = {}) => ({
  name: options.name || 'test-tag',
  count: options.count || 1,
  lastUsed: options.lastUsed || new Date(),
  bookmarks: options.bookmarks || []
});

/**
 * [TEST-FIX-001] - Create mock bookmark data
 * @param {Object} options - Bookmark options
 * @returns {Object} Mock bookmark data
 */
export const createMockBookmarkData = (options = {}) => ({
  url: options.url || 'https://example.com',
  description: options.description || 'Test Bookmark',
  tags: options.tags || ['test-tag'],
  extended: options.extended || '',
  time: options.time || new Date().toISOString(),
  shared: options.shared || 'yes',
  toread: options.toread || 'no',
  hash: options.hash || 'test-hash'
});

/**
 * [TEST-FIX-001] - Create mock overlay content
 * @param {Object} options - Content options
 * @returns {Object} Mock overlay content
 */
export const createMockOverlayContent = (options = {}) => ({
  bookmark: createMockBookmarkData(options.bookmark),
  pageTitle: options.pageTitle || 'Test Page',
  pageUrl: options.pageUrl || 'https://example.com'
});

/**
 * [TEST-FIX-001] - Create mock document element
 * @param {string} tagName - Element tag name
 * @param {Object} options - Element options
 * @returns {Object} Mock DOM element
 */
export const createMockElement = (tagName, options = {}) => ({
  tagName: tagName.toUpperCase(),
  style: {},
  className: options.className || '',
  textContent: options.textContent || '',
  innerHTML: options.innerHTML || '',
  value: options.value || '',
  addEventListener: jest.fn(),
  onclick: options.onclick || null,
  ondblclick: options.ondblclick || null,
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  parentNode: null,
  contains: jest.fn(() => false),
  getBoundingClientRect: jest.fn(() => ({ width: 300, height: 200 })),
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false)
  }
});

/**
 * [TEST-FIX-001] - Create mock document
 * @returns {Object} Mock document
 */
export const createMockDocument = () => ({
  createElement: jest.fn((tagName) => createMockElement(tagName)),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  body: createMockElement('body'),
  title: 'Test Page'
});

/**
 * [TEST-FIX-001] - Wait for async operations
 * @param {Function} fn - Function to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise that resolves when condition is met
 */
export const waitFor = (fn, timeout = 1000) => {
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
};

/**
 * [TEST-FIX-001] - Create mock Pinboard API response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Object} Mock API response
 */
export const createMockPinboardResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data))
});

/**
 * [TEST-FIX-001] - Create mock storage response
 * @param {Object} data - Storage data
 * @returns {Promise} Promise that resolves with data
 */
export const createStorageResponse = (data) => Promise.resolve(data);

/**
 * [TEST-FIX-001] - Create mock tabs response
 * @param {Array} tabs - Tabs data
 * @returns {Promise} Promise that resolves with tabs
 */
export const createTabsResponse = (tabs) => Promise.resolve(tabs); 