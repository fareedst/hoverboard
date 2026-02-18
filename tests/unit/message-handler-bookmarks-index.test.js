/**
 * Message handler getAggregatedBookmarksForIndex tests - [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Index page data: handler returns { bookmarks } with storage field; fallback when provider has no getAllBookmarksForIndex.
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

describe('MessageHandler getAggregatedBookmarksForIndex [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns { bookmarks } with storage field when provider has getAllBookmarksForIndex', async () => {
    const bookmarks = [
      { url: 'https://a.com', description: 'A', time: '2026-02-14T10:00:00Z', storage: 'local' },
      { url: 'https://b.com', description: 'B', time: '2026-02-14T11:00:00Z', storage: 'file' },
      { url: 'https://c.com', description: 'C', time: '2026-02-14T12:00:00Z', storage: 'sync' }
    ]
    const mockProvider = {
      getAllBookmarksForIndex: jest.fn().mockResolvedValue(bookmarks)
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.handleGetAggregatedBookmarksForIndex()
    expect(result).toEqual({ bookmarks })
    expect(mockProvider.getAllBookmarksForIndex).toHaveBeenCalled()
    expect(result.bookmarks.every(b => ['local', 'file', 'sync'].includes(b.storage))).toBe(true)
  })

  test('fallback: uses LocalBookmarkService and tags with storage local when provider has no getAllBookmarksForIndex', async () => {
    const stored = {
      'https://x.com': {
        description: 'X',
        time: '2026-02-14T09:00:00Z',
        tags: [],
        extended: '',
        shared: 'yes',
        toread: 'no'
      }
    }
    chrome.storage.local.get.mockResolvedValue({ hoverboard_local_bookmarks: stored })
    const mockProvider = {}
    const handler = new MessageHandler(mockProvider)
    const result = await handler.handleGetAggregatedBookmarksForIndex()
    expect(result.bookmarks).toBeDefined()
    expect(Array.isArray(result.bookmarks)).toBe(true)
    expect(result.bookmarks.length).toBe(1)
    expect(result.bookmarks[0].url).toBe('https://x.com')
    expect(result.bookmarks[0].storage).toBe('local')
    expect(result.bookmarks[0].description).toBe('X')
  })

  test('returns { bookmarks: [], error } on provider failure', async () => {
    const mockProvider = {
      getAllBookmarksForIndex: jest.fn().mockRejectedValue(new Error('Provider error'))
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.handleGetAggregatedBookmarksForIndex()
    expect(result.bookmarks).toEqual([])
    expect(result.error).toBe('Provider error')
  })
})
