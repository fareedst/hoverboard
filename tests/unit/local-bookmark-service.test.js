/**
 * Unit tests for LocalBookmarkService - [ARCH-LOCAL_STORAGE_PROVIDER] [IMPL-LOCAL_BOOKMARK_SERVICE]
 * [REQ-BOOKMARK_CREATE_UPDATE_TIMES] New record: updated_at equals create-time; update preserves time, sets updated_at.
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
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARK_SERVICE ===
 * [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.storage.local bookmark provider (one of five BookmarkRouter peers); same contract as Pinboard; keyed by URL. ARCH-STORAGE is settings/portability only — not this bookmark backend. Contract: url/bookmark/tag inputs and provider-shaped outputs; storage key and shape.
 *
 * ## GET_BOOKMARK_FOR_URL
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForUrl(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - bookmarks = LOAD bookmarks
 *   - urlNorm = normalize(url)
 *   - RETURN bookmarks[urlNorm] or null
 *   - How (sub-block): Merge data into bookmark shape and persist to storage.
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveBookmark(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - bookmarks = LOAD bookmarks
 *   - urlNorm = normalize(data.url)
 *   - bookmarks[urlNorm] = merge(data into bookmark shape with url, description, extended, tags, time, shared, toread, hash)
 *   - PERSIST bookmarks to storage under key
 *   - RETURN { success: true }
 *   - How (sub-block): Remove by normalized URL and persist.
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements deleteBookmark(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - bookmarks = LOAD bookmarks
 *   - REMOVE bookmarks[normalize(url)]
 *   - PERSIST bookmarks to storage
 *   - RETURN { success: true }
 *   - How (sub-block): Update tags on bookmark and persist.
 *
 * ## SAVE_TAG
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveTag(data), deleteTag(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG
 *   - bookmark = getBookmarkForUrl(data.url)
 *   - update tags on bookmark
 *   - saveBookmark(bookmark) or equivalent
 *   - RETURN { success: true }
 *   - How (sub-block): Sort by time descending and return first count.
 *
 * ## GET_RECENT_BOOKMARKS
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getRecentBookmarks(count) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - bookmarks = LOAD bookmarks
 *   - list = values(bookmarks)
 *   - SORT list BY time DESCENDING
 *   - RETURN list[0..count-1]
 *
 * ## ROUTER_STORAGE_LOCAL_PROVIDER
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-RELIABILITY] How: Supplies the local provider operation used by BookmarkRouter and persists the selected URL mapping through StorageIndex.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, local provider, storage index
 *   - PRE: local provider storage and router index are initialized
 *   - OUTPUT: provider save result and updated backend mapping
 *   - POST:
 *     - success => local storage contains the normalized bookmark and the index identifies local
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: local bookmark map and storage-index backend mapping
 *   - DATA_TRANSITION: local bookmark map and index update only after a successful provider save
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_LOCAL_PROVIDER
 *   - Normalize bookmark URL and time fields
 *   - AWAIT local provider save
 *   - IF save succeeds: set the URL backend in StorageIndex
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARK_SERVICE ===
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

  test('saveBookmark and getBookmarkForUrl round-trip with shared/toread (UI-style payload) [IMPL-LOCAL_BOOKMARK_SERVICE]', async () => {
    const result = await service.saveBookmark({
      url: 'https://example.com/page',
      description: 'Test',
      tags: ['a'],
      shared: 'yes',
      toread: 'no'
    })
    expect(result.success).toBe(true)
    const b = await service.getBookmarkForUrl('https://example.com/page')
    expect(b.url).toBe('https://example.com/page')
    expect(b.description).toBe('Test')
    expect(b.tags).toEqual(['a'])
    expect(b.shared).toBe('yes')
    expect(b.toread).toBe('no')
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

  test('create with only time sets updated_at to time [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    const time = '2024-03-01T08:00:00.000Z'
    await service.saveBookmark({
      url: 'https://example.com/import-time-only',
      description: 'Imported',
      tags: [],
      time
    })
    const b = await service.getBookmarkForUrl('https://example.com/import-time-only')
    expect(b.time).toBe(time)
    expect(b.updated_at).toBe(time)
  })

  test('overwrite update ignores payload times and bumps updated_at [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    await service.saveBookmark({
      url: 'https://example.com/ow',
      description: 'First',
      tags: [],
      time: '2020-01-01T00:00:00.000Z',
      updated_at: '2020-01-02T00:00:00.000Z'
    })
    const afterFirst = await service.getBookmarkForUrl('https://example.com/ow')
    await new Promise(r => setTimeout(r, 5))
    await service.saveBookmark({
      url: 'https://example.com/ow',
      description: 'Overwrite',
      tags: ['x'],
      time: '1999-01-01T00:00:00.000Z',
      updated_at: '1999-01-02T00:00:00.000Z'
    })
    const afterSecond = await service.getBookmarkForUrl('https://example.com/ow')
    expect(afterSecond.time).toBe(afterFirst.time)
    expect(afterSecond.updated_at).not.toBe(afterFirst.updated_at)
    expect(afterSecond.updated_at).not.toBe('1999-01-02T00:00:00.000Z')
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
