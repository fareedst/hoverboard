/**
 * Unit tests for BookmarkRouter - [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER]
 */

import { BookmarkRouter } from '../../src/features/storage/bookmark-router.js'
import { StorageIndex } from '../../src/features/storage/storage-index.js'

describe('BookmarkRouter [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER]', () => {
  let router
  let pinboard
  let local
  let file
  let sync
  let storageIndex
  let defaultMode

  beforeEach(() => {
    const empty = { url: '', description: '', extended: '', tags: [], time: '', shared: 'yes', toread: 'no', hash: '' }
    const makeProvider = (name) => {
      const store = {}
      return {
        getBookmarkForUrl: jest.fn(async (url) => {
          const u = url.replace(/\/+$/, '')
          return store[u] ? { ...store[u] } : { ...empty, url: u }
        }),
        getRecentBookmarks: jest.fn(async () => Object.values(store).sort((a, b) => (b.time || '').localeCompare(a.time || ''))),
        getAllBookmarks: jest.fn(async () => Object.values(store).sort((a, b) => (b.time || '').localeCompare(a.time || ''))),
        saveBookmark: jest.fn(async (data) => {
          const u = (data.url || '').replace(/\/+$/, '')
          store[u] = { ...data, url: u, time: store[u]?.time || new Date().toISOString() }
          return { success: true, code: 'done', message: 'Operation completed' }
        }),
        deleteBookmark: jest.fn(async (url) => {
          const u = url.replace(/\/+$/, '')
          delete store[u]
          return { success: true, code: 'done', message: 'Operation completed' }
        }),
        saveTag: jest.fn(async (data) => ({ success: true })),
        deleteTag: jest.fn(async () => ({ success: true })),
        testConnection: jest.fn(async () => true)
      }
    }
    pinboard = makeProvider('pinboard')
    local = makeProvider('local')
    file = makeProvider('file')
    sync = makeProvider('sync')

    let stored = {}
    global.chrome.storage.local.get.mockImplementation(async (key) => {
      if (key === 'hoverboard_storage_index') {
        return { hoverboard_storage_index: { ...stored } }
      }
      return {}
    })
    global.chrome.storage.local.set.mockImplementation((obj) => {
      if (obj.hoverboard_storage_index !== undefined) {
        stored = { ...obj.hoverboard_storage_index }
      }
      return Promise.resolve()
    })
    storageIndex = new StorageIndex()
    defaultMode = jest.fn().mockResolvedValue('local')
    router = new BookmarkRouter(pinboard, local, file, sync, storageIndex, defaultMode)
  })

  test('getBookmarkForUrl uses default provider when URL not in index [REQ-PER_BOOKMARK_STORAGE_BACKEND]', async () => {
    await router.getBookmarkForUrl('https://example.com/new')
    expect(defaultMode).toHaveBeenCalled()
    expect(local.getBookmarkForUrl).toHaveBeenCalledWith('https://example.com/new', '')
    expect(pinboard.getBookmarkForUrl).not.toHaveBeenCalled()
  })

  test('getBookmarkForUrl uses index when URL in index [IMPL-BOOKMARK_ROUTER]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/p', 'pinboard')
    await pinboard.saveBookmark({ url: 'https://example.com/p', description: 'Pin', time: '2026-02-14T12:00:00.000Z' })
    const b = await router.getBookmarkForUrl('https://example.com/p')
    expect(pinboard.getBookmarkForUrl).toHaveBeenCalled()
    expect(b.description).toBe('Pin')
  })

  test('saveBookmark updates index and uses default when new [IMPL-BOOKMARK_ROUTER]', async () => {
    const result = await router.saveBookmark({
      url: 'https://example.com/save',
      description: 'Saved',
      tags: ['x']
    })
    expect(result.success).toBe(true)
    expect(local.saveBookmark).toHaveBeenCalled()
    const backend = await storageIndex.getBackendForUrl('https://example.com/save')
    expect(backend).toBe('local')
  })

  test('deleteBookmark removes from index [REQ-PER_BOOKMARK_STORAGE_BACKEND]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/d', 'local')
    await local.saveBookmark({ url: 'https://example.com/d', description: 'D' })
    await router.deleteBookmark('https://example.com/d')
    expect(local.deleteBookmark).toHaveBeenCalledWith('https://example.com/d')
    const backend = await storageIndex.getBackendForUrl('https://example.com/d')
    expect(backend).toBe(null)
  })

  test('getRecentBookmarks aggregates all four providers [IMPL-BOOKMARK_ROUTER]', async () => {
    await pinboard.saveBookmark({ url: 'https://p.com', description: 'P', time: '2026-02-14T10:00:00.000Z' })
    await local.saveBookmark({ url: 'https://l.com', description: 'L', time: '2026-02-14T11:00:00.000Z' })
    await file.saveBookmark({ url: 'https://f.com', description: 'F', time: '2026-02-14T12:00:00.000Z' })
    await sync.saveBookmark({ url: 'https://s.com', description: 'S', time: '2026-02-14T13:00:00.000Z' })
    const list = await router.getRecentBookmarks(10)
    expect(list.length).toBe(4)
    expect(pinboard.getRecentBookmarks).toHaveBeenCalled()
    expect(local.getRecentBookmarks).toHaveBeenCalled()
    expect(file.getRecentBookmarks).toHaveBeenCalled()
    expect(sync.getRecentBookmarks).toHaveBeenCalled()
  })

  test('getStorageBackendForUrl returns index or default', async () => {
    const b1 = await router.getStorageBackendForUrl('https://example.com/unknown')
    expect(b1).toBe('local')
    await storageIndex.setBackendForUrl('https://example.com/k', 'file')
    const b2 = await router.getStorageBackendForUrl('https://example.com/k')
    expect(b2).toBe('file')
  })

  test('moveBookmarkToStorage copies to target, deletes from source, updates index [REQ-PER_BOOKMARK_STORAGE_BACKEND]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/m', 'local')
    await local.saveBookmark({
      url: 'https://example.com/m',
      description: 'Move me',
      tags: ['t'],
      time: '2026-02-14T12:00:00.000Z'
    })
    const result = await router.moveBookmarkToStorage('https://example.com/m', 'file')
    expect(result.success).toBe(true)
    expect(file.saveBookmark).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com/m', description: 'Move me' }))
    expect(local.deleteBookmark).toHaveBeenCalledWith('https://example.com/m')
    const backend = await storageIndex.getBackendForUrl('https://example.com/m')
    expect(backend).toBe('file')
  })

  test('moveBookmarkToStorage no-op when already in target', async () => {
    await storageIndex.setBackendForUrl('https://example.com/same', 'local')
    const result = await router.moveBookmarkToStorage('https://example.com/same', 'local')
    expect(result.success).toBe(true)
    expect(result.message).toMatch(/Already/)
    expect(local.saveBookmark).not.toHaveBeenCalled()
  })

  // [REQ-MOVE_BOOKMARK_STORAGE_UI] File ↔ browser toggle: explicit file → local move
  test('moveBookmarkToStorage file to local updates index and providers [REQ-MOVE_BOOKMARK_STORAGE_UI]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/fl', 'file')
    await file.saveBookmark({
      url: 'https://example.com/fl',
      description: 'From file',
      tags: ['a'],
      time: '2026-02-14T13:00:00.000Z'
    })
    const result = await router.moveBookmarkToStorage('https://example.com/fl', 'local')
    expect(result.success).toBe(true)
    expect(local.saveBookmark).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com/fl', description: 'From file' }))
    expect(file.deleteBookmark).toHaveBeenCalledWith('https://example.com/fl')
    const backend = await storageIndex.getBackendForUrl('https://example.com/fl')
    expect(backend).toBe('local')
  })

  test('getAllBookmarksForIndex includes local, file, and sync [REQ-LOCAL_BOOKMARKS_INDEX]', async () => {
    await local.saveBookmark({ url: 'https://l.com', description: 'L', time: '2026-02-14T11:00:00.000Z' })
    await file.saveBookmark({ url: 'https://f.com', description: 'F', time: '2026-02-14T12:00:00.000Z' })
    await sync.saveBookmark({ url: 'https://s.com', description: 'S', time: '2026-02-14T13:00:00.000Z' })
    const list = await router.getAllBookmarksForIndex()
    expect(list.some(b => b.storage === 'local')).toBe(true)
    expect(list.some(b => b.storage === 'file')).toBe(true)
    expect(list.some(b => b.storage === 'sync')).toBe(true)
    expect(local.getAllBookmarks).toHaveBeenCalled()
    expect(file.getAllBookmarks).toHaveBeenCalled()
    expect(sync.getAllBookmarks).toHaveBeenCalled()
  })

  // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move succeeds when source bookmark has url but no time
  test('moveBookmarkToStorage succeeds when bookmark has url but no time [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/notime', 'local')
    await local.saveBookmark({
      url: 'https://example.com/notime',
      description: 'No time',
      tags: [],
      time: ''
    })
    const result = await router.moveBookmarkToStorage('https://example.com/notime', 'file')
    expect(result.success).toBe(true)
    expect(file.saveBookmark).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/notime',
      description: 'No time'
    }))
    const saved = file.saveBookmark.mock.calls[0][0]
    expect(saved.time).toBeDefined()
    expect(typeof saved.time).toBe('string')
    expect(local.deleteBookmark).toHaveBeenCalledWith('https://example.com/notime')
    const backend = await storageIndex.getBackendForUrl('https://example.com/notime')
    expect(backend).toBe('file')
  })
})
