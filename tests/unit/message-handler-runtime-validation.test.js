/**
 * [IMPL-RUNTIME_VALIDATION] processMessage validation: invalid saveBookmark data returns error
 * and does not call bookmarkProvider.saveBookmark (catches "Invalid message data for type saveBookmark").
 */

import { MessageHandler } from '../../src/core/message-handler.js'

global.chrome = {
  storage: {
    local: { get: jest.fn(), set: jest.fn() },
    sync: { get: jest.fn(), set: jest.fn() }
  },
  tabs: { sendMessage: jest.fn(), query: jest.fn() },
  runtime: { sendMessage: jest.fn() }
}

describe('[IMPL-RUNTIME_VALIDATION] processMessage saveBookmark validation', () => {
  test('accepts local-storage save payload with shared/toread yes/no and calls saveBookmark [IMPL-RUNTIME_VALIDATION]', async () => {
    const saveBookmark = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn().mockResolvedValue({ tags: [] }),
      saveBookmark,
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage(
      { type: 'saveBookmark', data: { url: 'https://example.com', shared: 'yes', toread: 'no', description: 'Test' } },
      {}
    )
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(saveBookmark).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com', shared: 'yes', toread: 'no' }))
  })

  test('returns error and does not call saveBookmark when data is missing', async () => {
    const saveBookmark = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark,
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveBookmark' }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(saveBookmark).not.toHaveBeenCalled()
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage invalid envelope', () => {
  test('returns error and does not dispatch when envelope data is not a plain object', async () => {
    const getBookmarkForUrl = jest.fn()
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getCurrentBookmark', data: [] }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(getBookmarkForUrl).not.toHaveBeenCalled()
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage getTagsForUrl validation', () => {
  test('returns error and does not call getBookmarkForUrl when data missing url', async () => {
    const getBookmarkForUrl = jest.fn()
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getTagsForUrl', data: {} }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(getBookmarkForUrl).not.toHaveBeenCalled()
  })
  test('returns error when data has empty url', async () => {
    const getBookmarkForUrl = jest.fn()
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getTagsForUrl', data: { url: '' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(getBookmarkForUrl).not.toHaveBeenCalled()
  })
  test('accepts valid getTagsForUrl and calls getBookmarkForUrl [IMPL-RUNTIME_VALIDATION]', async () => {
    const getBookmarkForUrl = jest.fn().mockResolvedValue({ url: 'https://example.com', tags: [] })
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getTagsForUrl', data: { url: 'https://example.com' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(getBookmarkForUrl).toHaveBeenCalledWith('https://example.com', '')
    expect(result).toEqual({ tags: [] })
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage deleteBookmark validation', () => {
  test('returns error and does not call deleteBookmark when data missing url', async () => {
    const deleteBookmark = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark,
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteBookmark', data: {} }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(deleteBookmark).not.toHaveBeenCalled()
  })
  test('accepts valid deleteBookmark and calls deleteBookmark [IMPL-RUNTIME_VALIDATION]', async () => {
    const deleteBookmark = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark,
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteBookmark', data: { url: 'https://example.com' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(deleteBookmark).toHaveBeenCalledWith('https://example.com')
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage saveTag validation', () => {
  test('returns error and does not call saveTag when data missing value', async () => {
    const saveTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag,
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveTag', data: { url: 'https://example.com' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(saveTag).not.toHaveBeenCalled()
  })
  test('returns error and does not call saveTag when value is empty', async () => {
    const saveTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag,
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveTag', data: { url: 'https://example.com', value: '' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(saveTag).not.toHaveBeenCalled()
  })
  test('accepts valid saveTag and calls saveTag [IMPL-RUNTIME_VALIDATION]', async () => {
    const saveTag = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag,
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveTag', data: { url: 'https://example.com', value: 'mytag' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(saveTag).toHaveBeenCalledWith({ url: 'https://example.com', value: 'mytag' })
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage moveBookmarkToStorage validation', () => {
  test('returns error and does not call moveBookmarkToStorage when data missing url', async () => {
    const moveBookmarkToStorage = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn(),
      moveBookmarkToStorage
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'moveBookmarkToStorage', data: { targetBackend: 'local' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(moveBookmarkToStorage).not.toHaveBeenCalled()
  })
  test('returns error and does not call moveBookmarkToStorage when data missing targetBackend', async () => {
    const moveBookmarkToStorage = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn(),
      moveBookmarkToStorage
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'moveBookmarkToStorage', data: { url: 'https://example.com' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(moveBookmarkToStorage).not.toHaveBeenCalled()
  })
  test('accepts valid moveBookmarkToStorage and calls moveBookmarkToStorage [IMPL-RUNTIME_VALIDATION]', async () => {
    const moveBookmarkToStorage = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn(),
      moveBookmarkToStorage
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage(
      { type: 'moveBookmarkToStorage', data: { url: 'https://example.com', targetBackend: 'local' } },
      {}
    )
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(moveBookmarkToStorage).toHaveBeenCalledWith('https://example.com', 'local')
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage deleteTag validation', () => {
  test('returns error and does not call deleteTag when data missing url', async () => {
    const deleteTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteTag', data: { value: 'mytag' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(deleteTag).not.toHaveBeenCalled()
  })
  test('returns error and does not call deleteTag when data missing value', async () => {
    const deleteTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteTag', data: { url: 'https://example.com' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(deleteTag).not.toHaveBeenCalled()
  })
  test('accepts valid deleteTag and calls deleteTag [IMPL-RUNTIME_VALIDATION]', async () => {
    const deleteTag = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteTag', data: { url: 'https://example.com', value: 'mytag' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(deleteTag).toHaveBeenCalledWith({ url: 'https://example.com', value: 'mytag' })
  })
})
