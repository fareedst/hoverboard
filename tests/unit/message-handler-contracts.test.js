/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [IMPL-RUNTIME_VALIDATION]
 * Contract tests: processMessage returns a plain object for each known message type
 * (no unexpected throw) and unknown type throws. Sender context tests for GET_TAB_ID / GET_CURRENT_BOOKMARK.
 */

import { MessageHandler, MESSAGE_TYPES } from '../../src/core/message-handler.js'

// Minimal mock provider used across contract tests
function createMockProvider (overrides = {}) {
  const base = {
    getBookmarkForUrl: jest.fn().mockResolvedValue({ url: 'https://example.com', tags: [] }),
    saveBookmark: jest.fn().mockResolvedValue({ success: true }),
    deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
    getRecentBookmarks: jest.fn().mockResolvedValue([]),
    saveTag: jest.fn().mockResolvedValue({ success: true }),
    deleteTag: jest.fn().mockResolvedValue({ success: true }),
    getStorageBackendForUrl: jest.fn().mockReturnValue('local'),
    moveBookmarkToStorage: jest.fn().mockResolvedValue({ success: true }),
    getAllBookmarksForIndex: jest.fn().mockResolvedValue([])
  }
  return { ...base, ...overrides }
}

// Mock tagService methods used by handler
function createMockTagService () {
  return {
    addTagToUserRecentList: jest.fn().mockResolvedValue(true),
    getUserRecentTags: jest.fn().mockResolvedValue([]),
    handleTagAddition: jest.fn().mockResolvedValue(undefined),
    sanitizeTag: jest.fn((s) => s),
    getUserRecentTagsExcludingCurrent: jest.fn().mockResolvedValue([]),
    pinboardService: null
  }
}

beforeEach(() => {
  global.chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }])
  global.chrome.storage.local.get.mockImplementation((keys, cb) => {
    const result = typeof keys === 'string' ? { [keys]: null } : (Array.isArray(keys) ? keys.reduce((o, k) => ({ ...o, [k]: null }), {}) : {})
    if (cb) cb(result)
    else return Promise.resolve(result)
  })
  global.chrome.storage.sync.get.mockResolvedValue({})
  global.chrome.storage.local.set.mockImplementation((_data, cb) => { if (cb) cb(); return Promise.resolve() })
  if (global.chrome.scripting) {
    global.chrome.scripting.executeScript = jest.fn().mockResolvedValue([{ result: { title: 'Test', textContent: 'Body' } }])
  }
})

describe('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] MessageHandler processMessage contracts', () => {
  test('unknown message type throws [IMPL-MESSAGE_HANDLING]', async () => {
    const handler = new MessageHandler(createMockProvider())
    await expect(handler.processMessage({ type: 'UnknownTypeXYZ', data: {} }, {})).rejects.toThrow('Unknown message type')
  })

  test('invalid envelope returns error object and does not throw [IMPL-RUNTIME_VALIDATION]', async () => {
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processMessage({ type: 'getOptions', data: [] }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
  })

  // Curated list: types that go through processMessage with minimal valid payload
  const contractCases = [
    [MESSAGE_TYPES.GET_OPTIONS, {}, {}],
    [MESSAGE_TYPES.GET_TAB_ID, {}, { tab: { id: 1, url: 'https://example.com' } }],
    [MESSAGE_TYPES.GET_TAGS_FOR_URL, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.GET_LOCAL_BOOKMARKS_FOR_INDEX, undefined, {}],
    [MESSAGE_TYPES.GET_AGGREGATED_BOOKMARKS_FOR_INDEX, undefined, {}],
    [MESSAGE_TYPES.GET_RECENT_BOOKMARKS, { currentTags: [] }, {}],
    [MESSAGE_TYPES.SAVE_BOOKMARK, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.DELETE_BOOKMARK, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.SAVE_TAG, { url: 'https://example.com', value: 't' }, {}],
    [MESSAGE_TYPES.DELETE_TAG, { url: 'https://example.com', value: 't' }, {}],
    [MESSAGE_TYPES.GET_STORAGE_BACKEND_FOR_URL, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE, { url: 'https://example.com', targetBackend: 'local' }, {}],
    [MESSAGE_TYPES.ECHO, 'ping', {}],
    [MESSAGE_TYPES.GET_SEARCH_HISTORY, undefined, {}],
    [MESSAGE_TYPES.CLEAR_SEARCH_STATE, undefined, {}],
    [MESSAGE_TYPES.CONTENT_SCRIPT_READY, {}, { tab: { id: 1, url: 'https://example.com' } }],
    [MESSAGE_TYPES.GET_USER_RECENT_TAGS, {}, {}],
    [MESSAGE_TYPES.GET_SESSION_TAGS, undefined, {}],
    [MESSAGE_TYPES.RECORD_SESSION_TAGS, { tags: [] }, {}]
  ]

  contractCases.forEach(([type, data, sender]) => {
    test(`processMessage(${type}) returns plain object [IMPL-MESSAGE_HANDLING]`, async () => {
      const provider = createMockProvider()
      const tagService = createMockTagService()
      const handler = new MessageHandler(provider, tagService)
      const message = data !== undefined ? { type, data } : { type }
      const result = await handler.processMessage(message, sender || {})
      expect(result).toBeDefined()
      // Handler may return object or primitive (e.g. getStorageBackendForUrl returns string)
      if (typeof result === 'object' && result !== null) {
        if (result.error === 'Invalid message') {
          expect(result.details).toBeDefined()
          return
        }
        expect(Array.isArray(result) || (result.constructor && result.constructor.name === 'Object')).toBe(true)
      } else {
        expect(['string', 'number', 'boolean']).toContain(typeof result)
      }
    })
  })
})

describe('[IMPL-MESSAGE_HANDLING] GET_CURRENT_BOOKMARK and GET_TAB_ID sender context', () => {
  test('GET_TAB_ID with sender.tab returns tabId [IMPL-MESSAGE_HANDLING]', async () => {
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processMessage({ type: MESSAGE_TYPES.GET_TAB_ID }, { tab: { id: 42, url: 'https://a.com' } })
    expect(result).toEqual({ tabId: 42 })
  })

  test('GET_TAB_ID without sender.tab uses tabs.query and returns tabId when tabs exist', async () => {
    global.chrome.tabs.query.mockResolvedValue([{ id: 99, url: 'https://b.com' }])
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processMessage({ type: MESSAGE_TYPES.GET_TAB_ID }, {})
    expect(result).toEqual({ tabId: 99 })
  })

  test('GET_CURRENT_BOOKMARK with sender.tab uses tab url when data.url not provided', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage(
      { type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK },
      { tab: { id: 1, url: 'https://example.com' } }
    )
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  test('GET_CURRENT_BOOKMARK with data.url uses data.url', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage(
      { type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK, data: { url: 'https://data-url.com' } },
      {}
    )
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
  })
})

describe('[IMPL-MESSAGE_HANDLING] getAggregatedBookmarksForIndex response shape', () => {
  test('returns object with bookmarks array [IMPL-MESSAGE_HANDLING]', async () => {
    const provider = createMockProvider({ getAllBookmarksForIndex: jest.fn().mockResolvedValue([{ url: 'https://x.com', storage: 'local' }]) })
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage({ type: MESSAGE_TYPES.GET_AGGREGATED_BOOKMARKS_FOR_INDEX }, {})
    expect(result).toHaveProperty('bookmarks')
    expect(Array.isArray(result.bookmarks)).toBe(true)
  })
})
