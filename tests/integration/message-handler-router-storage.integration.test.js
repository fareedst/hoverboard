/**
 * [IMPL-MESSAGE_HANDLING] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [IMPL-LOCAL_BOOKMARK_SERVICE]
 * [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-FILE_BOOKMARK_SERVICE]
 * Integration test: MessageHandler + BookmarkRouter + StorageIndex + Local/File providers
 * composed flow with minimal mocks (chrome.storage / runtime messaging).
 */

import { MessageHandler } from '../../src/core/message-handler.js'
import { LocalBookmarkService } from '../../src/features/storage/local-bookmark-service.js'
import { FileBookmarkService } from '../../src/features/storage/file-bookmark-service.js'
import { MessageFileBookmarkAdapter } from '../../src/features/storage/message-file-bookmark-adapter.js'
import { StorageIndex } from '../../src/features/storage/storage-index.js'
import { BookmarkRouter } from '../../src/features/storage/bookmark-router.js'

let localStorage
let indexStorage

beforeEach(() => {
  localStorage = {}
  indexStorage = {}
  global.chrome.storage.local.get.mockImplementation(async (keys) => {
    const key = typeof keys === 'object' && !Array.isArray(keys) ? Object.keys(keys)[0] : (Array.isArray(keys) ? keys[0] : keys)
    if (key === 'hoverboard_local_bookmarks') {
      return { hoverboard_local_bookmarks: { ...localStorage } }
    }
    if (key === 'hoverboard_storage_index') {
      return { hoverboard_storage_index: { ...indexStorage } }
    }
    return {}
  })
  global.chrome.storage.local.set.mockImplementation((obj) => {
    if (obj.hoverboard_local_bookmarks !== undefined) {
      localStorage = typeof obj.hoverboard_local_bookmarks === 'object' && !Array.isArray(obj.hoverboard_local_bookmarks)
        ? { ...obj.hoverboard_local_bookmarks }
        : {}
    }
    if (obj.hoverboard_storage_index !== undefined) {
      indexStorage = typeof obj.hoverboard_storage_index === 'object' && !Array.isArray(obj.hoverboard_storage_index)
        ? { ...obj.hoverboard_storage_index }
        : {}
    }
    return Promise.resolve()
  })
  global.chrome.storage.sync.get.mockResolvedValue({
    hoverboard_auth_token: '',
    hoverboard_settings: {},
    hoverboard_inhibit_urls: ''
  })
  global.chrome.tabs.query.mockResolvedValue([])
})

function stubProvider () {
  return {
    getBookmarkForUrl: jest.fn().mockResolvedValue(null),
    saveBookmark: jest.fn().mockResolvedValue(undefined),
    deleteBookmark: jest.fn().mockResolvedValue(undefined),
    getRecentBookmarks: jest.fn().mockResolvedValue([]),
    saveTag: jest.fn().mockResolvedValue(undefined),
    deleteTag: jest.fn().mockResolvedValue(undefined),
    getAllBookmarks: jest.fn().mockResolvedValue([])
  }
}

describe('[IMPL-MESSAGE_HANDLING] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] MessageHandler + Router + StorageIndex integration', () => {
  test('saveBookmark via router (local default) then getCurrentBookmark returns saved bookmark', async () => {
    const localProvider = new LocalBookmarkService(null)
    const storageIndex = new StorageIndex()
    await storageIndex.ensureMigrationFromLocal(localProvider)

    const getDefaultStorageMode = () => Promise.resolve('local')
    const router = new BookmarkRouter(
      stubProvider(),
      localProvider,
      stubProvider(),
      stubProvider(),
      storageIndex,
      getDefaultStorageMode
    )

    const handler = new MessageHandler(router)

    const saveResult = await handler.processMessage(
      {
        type: 'saveBookmark',
        data: {
          url: 'https://example.com/integration',
          description: 'Integration test',
          tags: 'a b',
          shared: 'yes',
          toread: 'no'
        }
      },
      {}
    )
    expect(saveResult.error).toBeUndefined()
    expect(saveResult.success).toBe(true)

    const getResult = await handler.processMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://example.com/integration' } },
      {}
    )
    expect(getResult.success).toBe(true)
    expect(getResult.data).toBeDefined()
    expect(getResult.data.url).toBe('https://example.com/integration')
    expect(getResult.data.description).toBe('Integration test')
    expect(Array.isArray(getResult.data.tags)).toBe(true)
    expect(getResult.data.tags).toContain('a')
    expect(getResult.data.tags).toContain('b')
  })

  test('StorageIndex getBackendForUrl returns null for new URL; router uses default mode', async () => {
    const localProvider = new LocalBookmarkService(null)
    const storageIndex = new StorageIndex()
    await storageIndex.ensureMigrationFromLocal(localProvider)

    const backend = await storageIndex.getBackendForUrl('https://new.example.com')
    expect(backend).toBeNull()

    const getDefaultStorageMode = () => Promise.resolve('local')
    const router = new BookmarkRouter(
      stubProvider(),
      localProvider,
      stubProvider(),
      stubProvider(),
      storageIndex,
      getDefaultStorageMode
    )
    const handler = new MessageHandler(router)

    await handler.processMessage(
      {
        type: 'saveBookmark',
        data: {
          url: 'https://new.example.com',
          description: 'New',
          tags: 'x',
          shared: 'no',
          toread: 'yes'
        }
      },
      {}
    )

    const getResult = await handler.processMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://new.example.com' } },
      {}
    )
    expect(getResult.success).toBe(true)
    expect(getResult.data.url).toBe('https://new.example.com')
  })
})

describe('[REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER] [IMPL-MESSAGE_HANDLING] deleteBookmark preferredBackend composition', () => {
  const url = 'https://example.com/file-compose'

  async function buildHandlerWithFileSeed () {
    const localProvider = new LocalBookmarkService(null)
    const fileProvider = new FileBookmarkService()
    const storageIndex = new StorageIndex()
    await storageIndex.ensureMigrationFromLocal(localProvider)

    await fileProvider.saveBookmark({
      url,
      description: 'File row',
      tags: 'f',
      shared: 'yes',
      toread: 'no',
      time: '2026-02-14T12:00:00.000Z',
      updated_at: '2026-02-14T12:00:00.000Z'
    })
    await storageIndex.setBackendForUrl(url, 'local')

    const router = new BookmarkRouter(
      stubProvider(),
      localProvider,
      fileProvider,
      stubProvider(),
      storageIndex,
      () => Promise.resolve('local')
    )
    return { handler: new MessageHandler(router), fileProvider, localProvider, storageIndex }
  }

  test('processMessage deleteBookmark with preferredBackend file removes File despite local index', async () => {
    const { handler, fileProvider, localProvider } = await buildHandlerWithFileSeed()

    const result = await handler.processMessage(
      { type: 'deleteBookmark', data: { url, preferredBackend: 'file' } },
      {}
    )
    expect(result.success).toBe(true)

    const fileRemaining = await fileProvider.getAllBookmarks()
    expect(fileRemaining.some(b => b.url === url)).toBe(false)
    const localBookmark = await localProvider.getBookmarkForUrl(url)
    expect(localBookmark.time).toBe('')
  })

  test('processMessage deleteBookmark URL-only uses index and leaves File bookmark', async () => {
    const { handler, fileProvider } = await buildHandlerWithFileSeed()

    const result = await handler.processMessage(
      { type: 'deleteBookmark', data: { url } },
      {}
    )
    expect(result.success).toBe(true)

    const fileRemaining = await fileProvider.getAllBookmarks()
    expect(fileRemaining.some(b => b.url === url)).toBe(true)
  })
})

describe('[IMPL-FILE_BOOKMARK_SERVICE] [REQ-FILE_BOOKMARK_STORAGE] FileBookmarkService + MessageFileBookmarkAdapter delete composition', () => {
  const url = 'https://example.com/adapter-delete'
  const clean = url

  beforeEach(() => {
    global.chrome.runtime.lastError = undefined
  })

  test('deleteBookmark resolves when WRITE_FILE_BOOKMARKS returns success true', async () => {
    const bookmarks = {
      [clean]: {
        url: clean,
        description: 'Via adapter',
        extended: '',
        tags: [],
        time: '2026-02-14T12:00:00.000Z',
        updated_at: '2026-02-14T12:00:00.000Z',
        shared: 'yes',
        toread: 'no',
        hash: ''
      }
    }
    let writtenBookmarks = null
    global.chrome.runtime.sendMessage = jest.fn((msg, cb) => {
      if (msg.type === 'READ_FILE_BOOKMARKS') {
        cb({ data: { version: 1, bookmarks: { ...bookmarks } } })
        return
      }
      if (msg.type === 'WRITE_FILE_BOOKMARKS') {
        writtenBookmarks = msg.data.bookmarks
        cb({ error: null, success: true })
        return
      }
      cb({})
    })

    const service = new FileBookmarkService(new MessageFileBookmarkAdapter())
    const result = await service.deleteBookmark(url)
    expect(result.success).toBe(true)
    expect(writtenBookmarks).toBeDefined()
    expect(writtenBookmarks[clean]).toBeUndefined()
  })

  test('deleteBookmark rejects when WRITE_FILE_BOOKMARKS omits success', async () => {
    const bookmarks = {
      [clean]: {
        url: clean,
        description: 'Via adapter',
        extended: '',
        tags: [],
        time: '2026-02-14T12:00:00.000Z',
        updated_at: '2026-02-14T12:00:00.000Z',
        shared: 'yes',
        toread: 'no',
        hash: ''
      }
    }
    global.chrome.runtime.sendMessage = jest.fn((msg, cb) => {
      if (msg.type === 'READ_FILE_BOOKMARKS') {
        cb({ data: { version: 1, bookmarks: { ...bookmarks } } })
        return
      }
      if (msg.type === 'WRITE_FILE_BOOKMARKS') {
        cb({ error: null })
        return
      }
      cb({})
    })

    const service = new FileBookmarkService(new MessageFileBookmarkAdapter())
    await expect(service.deleteBookmark(url)).rejects.toThrow()
  })
})

describe('[REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BOOKMARK_ROUTER] [IMPL-MESSAGE_HANDLING] browser aggregate and move composition', () => {
  test('getAggregatedBookmarksForIndex includes browser storage; moveBookmarkToStorage target browser', async () => {
    const localProvider = new LocalBookmarkService(null)
    const browserProvider = {
      getBookmarkForUrl: jest.fn(async (url) => ({
        url,
        description: 'Chrome',
        extended: '',
        tags: ['work'],
        time: '2026-02-14T15:00:00.000Z',
        updated_at: '2026-02-14T15:00:00.000Z',
        shared: 'yes',
        toread: 'no',
        hash: ''
      })),
      saveBookmark: jest.fn(async () => ({ success: true, code: 'done', message: 'ok' })),
      deleteBookmark: jest.fn(async () => ({ success: true, code: 'done', message: 'ok' })),
      getRecentBookmarks: jest.fn(async () => []),
      saveTag: jest.fn(async () => ({ success: true })),
      deleteTag: jest.fn(async () => ({ success: true })),
      getAllBookmarks: jest.fn(async () => [{
        url: 'https://example.com/browser-row',
        description: 'Chrome row',
        tags: ['work'],
        time: '2026-02-14T15:00:00.000Z',
        updated_at: '2026-02-14T15:00:00.000Z',
        shared: 'yes',
        toread: 'no',
        hash: ''
      }]),
      testConnection: jest.fn(async () => true)
    }
    const storageIndex = new StorageIndex()
    await localProvider.saveBookmark({
      url: 'https://example.com/local-row',
      description: 'Local row',
      tags: ['a'],
      time: '2026-02-14T12:00:00.000Z'
    })
    await storageIndex.setBackendForUrl('https://example.com/local-row', 'local')

    const router = new BookmarkRouter(
      stubProvider(),
      localProvider,
      stubProvider(),
      stubProvider(),
      storageIndex,
      () => Promise.resolve('local'),
      browserProvider
    )
    const handler = new MessageHandler(router)

    const agg = await handler.processMessage({ type: 'getAggregatedBookmarksForIndex' }, {})
    expect(agg.bookmarks.some(b => b.storage === 'browser')).toBe(true)
    expect(agg.bookmarks.some(b => b.storage === 'local')).toBe(true)

    const move = await handler.processMessage(
      { type: 'moveBookmarkToStorage', data: { url: 'https://example.com/local-row', targetBackend: 'browser' } },
      {}
    )
    expect(move.success).toBe(true)
    expect(browserProvider.saveBookmark).toHaveBeenCalled()
    expect(await storageIndex.getBackendForUrl('https://example.com/local-row')).toBe('browser')
  })
})
