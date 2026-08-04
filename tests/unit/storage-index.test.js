/**
 * === IMPL-FULL-BLOCK: IMPL-STORAGE_INDEX ===
 * [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] — Per-URL backend in chrome.storage.local; getIndex, getBackendForUrl, setBackendForUrl, removeUrl; migration from local bookmarks when empty.
 *
 * ## GET_INDEX
 *
 * - [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Load and return index from storage (or {}).
 * - Contract:
 *   - INPUT: storage key (hoverboard_storage_index)
 *   - PRE: chrome.storage.local available
 *   - OUTPUT: index map url -> backend (pinboard|local|file|sync|browser)
 *   - POST:
 *     - success => map or empty map if missing
 *   - DATA: index persisted under hoverboard_storage_index; VALID_BACKENDS includes browser
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_INDEX
 *   - 1. LOAD index from storage under key
 *   - 2. RETURN index (or empty map if missing)
 *
 * ## GET_BACKEND_FOR_URL
 *
 * - [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Lookup backend for URL.
 * - Contract:
 *   - INPUT: url
 *   - PRE: url is a string
 *   - OUTPUT: backend string | null
 *   - POST:
 *     - success => index[url] or null
 *   - DATA: index
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_BACKEND_FOR_URL
 *   - 1. index = GET_INDEX()
 *   - 2. RETURN index[url] or null
 *
 * ## SET_BACKEND_FOR_URL
 *
 * - [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Set backend for URL and persist.
 * - Contract:
 *   - INPUT: url, backend (pinboard|local|file|sync|browser)
 *   - PRE: backend in VALID_BACKENDS
 *   - OUTPUT: void (persisted)
 *   - POST:
 *     - success => index[url] = backend and persisted
 *   - DATA: index
 *   - DATA_TRANSITION: index[url] set to backend; storage updated
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SET_BACKEND_FOR_URL
 *   - 1. index = GET_INDEX()
 *   - 2. SET index[url] = backend
 *   - 3. PERSIST index to storage
 *
 * ## REMOVE_URL
 *
 * - [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Remove URL from index and persist.
 * - Contract:
 *   - INPUT: url
 *   - PRE: url is a string
 *   - OUTPUT: void (persisted)
 *   - POST:
 *     - success => url absent from index and persisted
 *   - DATA: index
 *   - DATA_TRANSITION: index[url] removed; storage updated
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: REMOVE_URL
 *   - 1. index = GET_INDEX()
 *   - 2. REMOVE index[url]
 *   - 3. PERSIST index to storage
 *
 * ## MIGRATE_FROM_LOCAL_WHEN_EMPTY
 *
 * - [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Seed index from local bookmarks when empty.
 * - Contract:
 *   - INPUT: optional localBookmarkProvider
 *   - PRE: called on first use or when index empty
 *   - OUTPUT: void
 *   - POST:
 *     - success => when index was empty and provider given, each local bookmark url mapped to "local"
 *   - DATA: index
 *   - DATA_TRANSITION: may set many index[url] = "local"
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MIGRATE_FROM_LOCAL_WHEN_EMPTY
 *   - 1. IF GET_INDEX() is empty AND localBookmarkProvider given:
 *   - 2. bookmarks = localBookmarkProvider.getAllBookmarks()
 *   - 3. FOR each bookmark WITH url: SET_BACKEND_FOR_URL(url, "local")
 *
 * ## ROUTER_STORAGE_INDEX
 *
 * - [IMPL-STORAGE_INDEX] [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-RELIABILITY] How: Persists the backend selected by BookmarkRouter after successful provider operations and leaves the index unchanged on failed writes.
 * - Contract:
 *   - INPUT: URL, selected backend, provider operation result
 *   - PRE: URL and selected backend are valid
 *   - OUTPUT: persisted backend mapping
 *   - POST:
 *     - success => index maps URL to the selected backend
 *   - FAILURE_MODES: ProviderSaveFailed
 *   - DATA: storage index map
 *   - DATA_TRANSITION: successful provider writes set the URL mapping; failed writes do not mutate it
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_INDEX
 *   - AWAIT provider operation
 *   - IF operation succeeds: SET_BACKEND_FOR_URL(url, backend)
 *   - RETURN operation result
 *
 * === END IMPL-FULL-BLOCK: IMPL-STORAGE_INDEX ===
 */
import { StorageIndex } from '../../src/features/storage/storage-index.js'

describe('StorageIndex [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-STORAGE_INDEX]', () => {
  let index
  let stored

  beforeEach(() => {
    stored = {}
    global.chrome.storage.local.get.mockImplementation(async (key) => {
      if (key === 'hoverboard_storage_index') {
        return { hoverboard_storage_index: { ...stored } }
      }
      return { [key]: stored }
    })
    global.chrome.storage.local.set.mockImplementation((obj) => {
      if (obj.hoverboard_storage_index) {
        stored = { ...obj.hoverboard_storage_index }
      }
      return Promise.resolve()
    })
    index = new StorageIndex()
  })

  test('getIndex returns empty object when nothing stored', async () => {
    stored = {}
    const result = await index.getIndex()
    expect(result).toEqual({})
  })

  test('setBackendForUrl and getBackendForUrl round-trip [IMPL-STORAGE_INDEX]', async () => {
    await index.setBackendForUrl('https://example.com/page', 'local')
    const backend = await index.getBackendForUrl('https://example.com/page')
    expect(backend).toBe('local')
  })

  test('setBackendForUrl normalizes URL (trailing slash) [IMPL-STORAGE_INDEX]', async () => {
    await index.setBackendForUrl('https://example.com/path/', 'file')
    const backend = await index.getBackendForUrl('https://example.com/path')
    expect(backend).toBe('file')
  })

  test('getBackendForUrl returns null when URL not in index', async () => {
    const backend = await index.getBackendForUrl('https://example.com/unknown')
    expect(backend).toBe(null)
  })

  test('removeUrl removes entry', async () => {
    await index.setBackendForUrl('https://example.com/r', 'pinboard')
    await index.removeUrl('https://example.com/r')
    const backend = await index.getBackendForUrl('https://example.com/r')
    expect(backend).toBe(null)
  })

  test('setBackendForUrl rejects invalid backend', async () => {
    await expect(index.setBackendForUrl('https://x.com', 'invalid')).rejects.toThrow('Invalid backend')
  })

  test('accepts pinboard, local, file, sync [REQ-PER_BOOKMARK_STORAGE_BACKEND] [ARCH-SYNC_STORAGE_PROVIDER]', async () => {
    await index.setBackendForUrl('https://a.com', 'pinboard')
    await index.setBackendForUrl('https://b.com', 'local')
    await index.setBackendForUrl('https://c.com', 'file')
    await index.setBackendForUrl('https://d.com', 'sync')
    expect(await index.getBackendForUrl('https://a.com')).toBe('pinboard')
    expect(await index.getBackendForUrl('https://b.com')).toBe('local')
    expect(await index.getBackendForUrl('https://c.com')).toBe('file')
    expect(await index.getBackendForUrl('https://d.com')).toBe('sync')
  })

  test('accepts browser backend [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-STORAGE_INDEX]', async () => {
    await index.setBackendForUrl('https://chrome.example', 'browser')
    expect(await index.getBackendForUrl('https://chrome.example')).toBe('browser')
  })
})
