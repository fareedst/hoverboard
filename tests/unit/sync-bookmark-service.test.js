/**
 * Unit tests for SyncBookmarkService - [ARCH-SYNC_STORAGE_PROVIDER] [IMPL-SYNC_BOOKMARK_SERVICE]
 */

import { SyncBookmarkService } from '../../src/features/storage/sync-bookmark-service.js'

describe('SyncBookmarkService [ARCH-SYNC_STORAGE_PROVIDER] [IMPL-SYNC_BOOKMARK_SERVICE]', () => {
  let service
  let stored

  beforeEach(() => {
    stored = {}
    global.chrome.storage.sync.get.mockImplementation(async (keys) => {
      const key = typeof keys === 'object' && !Array.isArray(keys) ? Object.keys(keys)[0] : (Array.isArray(keys) ? keys[0] : keys)
      if (key === 'hoverboard_sync_bookmarks') {
        return { hoverboard_sync_bookmarks: { ...stored } }
      }
      return {}
    })
    global.chrome.storage.sync.set.mockImplementation((obj) => {
      if (obj.hoverboard_sync_bookmarks !== undefined) {
        stored = typeof obj.hoverboard_sync_bookmarks === 'object' && !Array.isArray(obj.hoverboard_sync_bookmarks)
          ? { ...obj.hoverboard_sync_bookmarks }
          : {}
      }
      return Promise.resolve()
    })
    service = new SyncBookmarkService(null)
  })

  test('getBookmarkForUrl returns empty bookmark when URL not stored', async () => {
    const b = await service.getBookmarkForUrl('https://example.com/new')
    expect(b.url).toBe('https://example.com/new')
    expect(b.description).toBe('')
    expect(b.tags).toEqual([])
  })

  test('saveBookmark and getBookmarkForUrl round-trip [IMPL-SYNC_BOOKMARK_SERVICE]', async () => {
    const result = await service.saveBookmark({
      url: 'https://example.com/page',
      description: 'Test',
      tags: ['a', 'b'],
      time: '2026-02-15T12:00:00.000Z'
    })
    expect(result.success).toBe(true)
    const b = await service.getBookmarkForUrl('https://example.com/page')
    expect(b.url).toBe('https://example.com/page')
    expect(b.description).toBe('Test')
    expect(b.tags).toEqual(['a', 'b'])
    expect(b.time).toBe('2026-02-15T12:00:00.000Z')
  })

  test('deleteBookmark removes URL from sync storage', async () => {
    await service.saveBookmark({ url: 'https://example.com/del', description: 'Del' })
    const result = await service.deleteBookmark('https://example.com/del')
    expect(result.success).toBe(true)
    const b = await service.getBookmarkForUrl('https://example.com/del')
    expect(b.description).toBe('')
  })

  test('getAllBookmarks returns sync bookmarks with storage [REQ-LOCAL_BOOKMARKS_INDEX]', async () => {
    await service.saveBookmark({ url: 'https://a.com', description: 'A', time: '2026-02-15T10:00:00.000Z' })
    await service.saveBookmark({ url: 'https://b.com', description: 'B', time: '2026-02-15T11:00:00.000Z' })
    const list = await service.getAllBookmarks()
    expect(list.length).toBe(2)
    expect(list.map(b => b.description).sort()).toEqual(['A', 'B'])
  })

  test('testConnection returns true', async () => {
    const ok = await service.testConnection()
    expect(ok).toBe(true)
  })
})
