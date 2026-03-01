/**
 * [IMPL-MESSAGE_HANDLING] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [IMPL-LOCAL_BOOKMARK_SERVICE]
 * Integration test: MessageHandler + BookmarkRouter + StorageIndex + LocalBookmarkService
 * composed flow with minimal mocks (chrome.storage only). Validates save then getCurrentBookmark path.
 */

import { MessageHandler } from '../../src/core/message-handler.js'
import { LocalBookmarkService } from '../../src/features/storage/local-bookmark-service.js'
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
