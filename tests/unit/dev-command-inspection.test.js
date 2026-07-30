/**
 * === IMPL-FULL-BLOCK: IMPL-DEV_COMMAND_INSPECTION ===
 * Unit tests for MessageHandler.processDevCommand subcommands.
 * === END IMPL-FULL-BLOCK: IMPL-DEV_COMMAND_INSPECTION ===
 */
import { MessageHandler } from '../../src/core/message-handler.js'

function createMockProvider (overrides = {}) {
  return {
    getBookmarkForUrl: jest.fn().mockResolvedValue({ url: 'https://example.com', tags: ['a'], time: '2020-01-01T00:00:00Z' }),
    saveBookmark: jest.fn().mockResolvedValue({ success: true }),
    deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
    getRecentBookmarks: jest.fn().mockResolvedValue([]),
    saveTag: jest.fn().mockResolvedValue({ success: true }),
    deleteTag: jest.fn().mockResolvedValue({ success: true }),
    getStorageBackendForUrl: jest.fn().mockResolvedValue('local'),
    moveBookmarkToStorage: jest.fn().mockResolvedValue({ success: true }),
    getAllBookmarksForIndex: jest.fn().mockResolvedValue([]),
    ...overrides
  }
}

describe('[IMPL-DEV_COMMAND_INSPECTION] processDevCommand', () => {
  beforeEach(() => {
    global.chrome.storage.sync.get.mockResolvedValue({})
    global.chrome.storage.local.get.mockImplementation((keys, cb) => {
      const result = {}
      if (cb) cb(result)
      else return Promise.resolve(result)
    })
  })

  test('missing subcommand returns error [IMPL-DEV_COMMAND_INSPECTION]', async () => {
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processDevCommand({}, {})
    expect(result).toEqual({ error: 'missing subcommand' })
  })

  test('unknown subcommand returns error [IMPL-DEV_COMMAND_INSPECTION]', async () => {
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processDevCommand({ subcommand: 'notAThing' }, {})
    expect(result).toEqual({ error: 'unknown subcommand' })
  })

  test('getCurrentBookmark requires url [IMPL-DEV_COMMAND_INSPECTION]', async () => {
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processDevCommand({ subcommand: 'getCurrentBookmark' }, {})
    expect(result).toEqual({ error: 'url required' })
  })

  test('getTagsForUrl delegates with url [IMPL-DEV_COMMAND_INSPECTION]', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    handler.handleGetTagsForUrl = jest.fn().mockResolvedValue({ tags: ['x'] })
    const result = await handler.processDevCommand(
      { subcommand: 'getTagsForUrl', url: 'https://example.com' },
      {}
    )
    expect(handler.handleGetTagsForUrl).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.com' })
    )
    expect(result).toEqual({ tags: ['x'] })
  })

  test('getStorageBackendForUrl delegates [IMPL-DEV_COMMAND_INSPECTION]', async () => {
    const handler = new MessageHandler(createMockProvider())
    handler.handleGetStorageBackendForUrl = jest.fn().mockResolvedValue({ backend: 'file' })
    const result = await handler.processDevCommand(
      { subcommand: 'getStorageBackendForUrl', url: 'https://example.com/a' },
      {}
    )
    expect(handler.handleGetStorageBackendForUrl).toHaveBeenCalledWith({ url: 'https://example.com/a' })
    expect(result).toEqual({ backend: 'file' })
  })
})
