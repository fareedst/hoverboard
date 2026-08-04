/**
 * Unit tests for SyncBookmarkService - [ARCH-SYNC_STORAGE_PROVIDER] [IMPL-SYNC_BOOKMARK_SERVICE]
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.
 *
 * ## PINBOARD
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
 * - Contract:
 *   - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark with time and updated_at set per provider and context
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: time = create time; updated_at = last update time
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PINBOARD
 *   - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
 *   - SEND to API: do NOT include updated_at
 *   - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
 *   - 1. Normalize (url-tags-manager, display, move, export/import):
 *   - IF bookmark has no updated_at: SET updated_at = time   // legacy
 *   - ELSE: keep updated_at
 *   - Include updated_at in payload/CSV/JSON
 *
 * ## ROUTER_STORAGE_BOOKMARK_TIMES
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-RELIABILITY] How: Preserves bookmark time fields while router storage operations select a provider and update the storage index.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, storage providers, storage index
 *   - PRE: bookmark URL and provider map are available
 *   - OUTPUT: provider result with normalized time fields and updated storage index
 *   - POST:
 *     - success => saved bookmark retains time and updated_at; index points to the selected backend
 *   - FAILURE_MODES: ProviderSaveFailed
 *   - DATA: bookmark time fields and storage-index backend mapping
 *   - DATA_TRANSITION: successful save updates the selected URL mapping; failed save leaves the mapping unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_BOOKMARK_TIMES
 *   - Normalize missing updated_at from time
 *   - Resolve provider from preferred backend
 *   - AWAIT provider save
 *   - IF save succeeds: update storage index for the URL
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SYNC_BOOKMARK_SERVICE ===
 * [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.storage.sync peer provider under five-provider BookmarkRouter; same contract as LocalBookmarkService; quota ~100 KB. Contract: url/bookmark/tag inputs and provider-shaped outputs; sync key and shape.
 * 
 * ## GET_BOOKMARK_FOR_URL
 * 
 * - [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForUrl(url) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - bookmarks = LOAD bookmarks
 *   - RETURN bookmarks[normalize(url)] or null
 *   - How (sub-block): Merge data and persist to sync.
 * 
 * ## SAVE_BOOKMARK
 * 
 * - [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveBookmark(data) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - bookmarks = LOAD bookmarks
 *   - bookmarks[normalize(data.url)] = merge(data into bookmark shape)
 *   - PERSIST bookmarks to chrome.storage.sync
 *   - RETURN { success: true }
 *   - How (sub-block): Update bookmarks/tags and persist; return success.
 * 
 * ## DELETE_BOOKMARK
 * 
 * - [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements deleteBookmark(url), saveTag(data), deleteTag(data) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - UPDATE bookmarks; PERSIST;       RETURN { success: true }
 *   - How (sub-block): Sort by time descending and return first count.
 * 
 * ## GET_RECENT_BOOKMARKS
 * 
 * - [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getRecentBookmarks(count) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - list = values(LOAD bookmarks); SORT BY time DESCENDING; RETURN list[0..count-1]
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SYNC_BOOKMARK_SERVICE ===
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

  test('getBookmarkForUrl returns empty bookmark when URL not stored [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    const b = await service.getBookmarkForUrl('https://example.com/new')
    expect(b.url).toBe('https://example.com/new')
    expect(b.description).toBe('')
    expect(b.tags).toEqual([])
    expect(b.time).toBe('')
    expect(b.updated_at).toBe('')
  })

  test('saveBookmark and getBookmarkForUrl round-trip [IMPL-SYNC_BOOKMARK_SERVICE] [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
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

  test('create with payload time/updated_at preserves them [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    const time = '2024-06-15T10:00:00.000Z'
    const updatedAt = '2024-06-16T11:00:00.000Z'
    await service.saveBookmark({
      url: 'https://example.com/import-times',
      description: 'Imported',
      tags: [],
      time,
      updated_at: updatedAt
    })
    const b = await service.getBookmarkForUrl('https://example.com/import-times')
    expect(b.time).toBe(time)
    expect(b.updated_at).toBe(updatedAt)
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
