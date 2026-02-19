/**
 * Unit tests for LocalBookmarkService - [ARCH-LOCAL_STORAGE_PROVIDER] [IMPL-LOCAL_BOOKMARK_SERVICE]
 * [REQ-BOOKMARK_CREATE_UPDATE_TIMES] New record: updated_at equals create-time; update preserves time, sets updated_at.
 */

import { LocalBookmarkService } from '../../src/features/storage/local-bookmark-service.js'

describe('LocalBookmarkService [ARCH-LOCAL_STORAGE_PROVIDER] [IMPL-LOCAL_BOOKMARK_SERVICE]', () => {
  let service
  let stored

  beforeEach(() => {
    stored = {}
    global.chrome.storage.local.get.mockImplementation(async (keys) => {
      const key = typeof keys === 'object' && !Array.isArray(keys) ? Object.keys(keys)[0] : (Array.isArray(keys) ? keys[0] : keys)
      if (key === 'hoverboard_local_bookmarks') {
        return { hoverboard_local_bookmarks: { ...stored } }
      }
      return {}
    })
    global.chrome.storage.local.set.mockImplementation((obj) => {
      if (obj.hoverboard_local_bookmarks !== undefined) {
        stored = typeof obj.hoverboard_local_bookmarks === 'object' && !Array.isArray(obj.hoverboard_local_bookmarks)
          ? { ...obj.hoverboard_local_bookmarks }
          : {}
      }
      return Promise.resolve()
    })
    service = new LocalBookmarkService(null)
  })

  test('getBookmarkForUrl returns empty bookmark when URL not stored [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    const b = await service.getBookmarkForUrl('https://example.com/new')
    expect(b.url).toBe('https://example.com/new')
    expect(b.description).toBe('')
    expect(b.tags).toEqual([])
    expect(b.time).toBe('')
    expect(b.updated_at).toBe('')
  })

  test('createEmptyBookmark includes updated_at empty [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
    const b = service.createEmptyBookmark('https://example.com', 'Title')
    expect(b).toHaveProperty('updated_at', '')
    expect(b.time).toBe('')
  })

  test('saveBookmark and getBookmarkForUrl round-trip [IMPL-LOCAL_BOOKMARK_SERVICE] [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    const result = await service.saveBookmark({
      url: 'https://example.com/page',
      description: 'Test',
      tags: ['a', 'b']
    })
    expect(result.success).toBe(true)
    const b = await service.getBookmarkForUrl('https://example.com/page')
    expect(b.url).toBe('https://example.com/page')
    expect(b.description).toBe('Test')
    expect(b.tags).toEqual(['a', 'b'])
    expect(b.time).toBeTruthy()
    expect(b.updated_at).toBeTruthy()
    expect(b.time).toBe(b.updated_at)
  })

  test('rejects when URL is missing [IMPL-LOCAL_BOOKMARK_SERVICE]', async () => {
    const result = await service.saveBookmark({ description: 'No URL' })
    expect(result).toEqual({ success: false, code: 'invalid', message: 'URL is required' })
  })

  test('update preserves create time and sets new updated_at [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    await service.saveBookmark({ url: 'https://example.com/ut', description: 'First', tags: [] })
    const afterFirst = await service.getBookmarkForUrl('https://example.com/ut')
    const createTime = afterFirst.time
    expect(createTime).toBeTruthy()
    expect(afterFirst.updated_at).toBe(createTime)
    await new Promise(r => setTimeout(r, 5))
    await service.saveBookmark({ url: 'https://example.com/ut', description: 'Second', tags: ['x'] })
    const afterSecond = await service.getBookmarkForUrl('https://example.com/ut')
    expect(afterSecond.time).toBe(createTime)
    expect(afterSecond.updated_at).toBeTruthy()
    expect(afterSecond.updated_at).not.toBe(createTime)
  })

  test('legacy bookmark without updated_at normalizes updated_at to time [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    stored['https://example.com/legacy'] = {
      url: 'https://example.com/legacy',
      description: 'Legacy',
      tags: [],
      time: '2026-02-10T08:00:00.000Z',
      shared: 'yes',
      toread: 'no',
      hash: 'local-h'
    }
    const result = await service.getBookmarkForUrl('https://example.com/legacy')
    expect(result.time).toBe('2026-02-10T08:00:00.000Z')
    expect(result.updated_at).toBe('2026-02-10T08:00:00.000Z')
  })

  test('deleteBookmark removes URL from local storage', async () => {
    await service.saveBookmark({ url: 'https://example.com/del', description: 'Del' })
    const result = await service.deleteBookmark('https://example.com/del')
    expect(result.success).toBe(true)
    const b = await service.getBookmarkForUrl('https://example.com/del')
    expect(b.description).toBe('')
  })

  test('testConnection returns true', async () => {
    const ok = await service.testConnection()
    expect(ok).toBe(true)
  })
})
