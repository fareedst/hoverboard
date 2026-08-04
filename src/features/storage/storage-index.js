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
import { debugLog, debugError } from '../../shared/utils.js'

const STORAGE_INDEX_KEY = 'hoverboard_storage_index'
const VALID_BACKENDS = ['pinboard', 'local', 'file', 'sync', 'browser']

function cleanUrl (url) {
  if (!url) return ''
  return url.trim().replace(/\/+$/, '')
}

export class StorageIndex {
  /**
   * [IMPL-STORAGE_INDEX] Get full index from chrome.storage.local.
   * @returns {Promise<Object>} { [url]: 'pinboard'|'local'|'file'|'sync'|'browser' }
   */
  async getIndex () {
    try {
      const result = await chrome.storage.local.get(STORAGE_INDEX_KEY)
      const raw = result[STORAGE_INDEX_KEY]
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
      return { ...raw }
    } catch (e) {
      debugError('[IMPL-STORAGE_INDEX] getIndex failed:', e)
      return {}
    }
  }

  /**
   * [IMPL-STORAGE_INDEX] Set backend for URL.
   * @param {string} url
   * @param {string} backend - 'pinboard'|'local'|'file'|'sync'|'browser'
   */
  async setBackendForUrl (url, backend) {
    if (!VALID_BACKENDS.includes(backend)) {
      throw new Error(`Invalid backend: ${backend}. Use pinboard, local, file, sync, or browser.`)
    }
    const key = cleanUrl(url)
    if (!key) return
    const index = await this.getIndex()
    index[key] = backend
    await chrome.storage.local.set({ [STORAGE_INDEX_KEY]: index })
    debugLog('[IMPL-STORAGE_INDEX] setBackendForUrl:', key, backend)
  }

  /**
   * [IMPL-STORAGE_INDEX] Get backend for URL, or null if not in index.
   * @param {string} url
   * @returns {Promise<string|null>} 'pinboard'|'local'|'file'|'sync'|'browser' or null
   */
  async getBackendForUrl (url) {
    const index = await this.getIndex()
    const key = cleanUrl(url)
    const backend = index[key]
    return VALID_BACKENDS.includes(backend) ? backend : null
  }

  /**
   * [IMPL-STORAGE_INDEX] Remove URL from index.
   * @param {string} url
   */
  async removeUrl (url) {
    const key = cleanUrl(url)
    if (!key) return
    const index = await this.getIndex()
    if (!(key in index)) return
    delete index[key]
    await chrome.storage.local.set({ [STORAGE_INDEX_KEY]: index })
    debugLog('[IMPL-STORAGE_INDEX] removeUrl:', key)
  }

  /**
   * [IMPL-STORAGE_INDEX] Migration: seed index from existing local bookmarks (each URL -> 'local').
   * Call when index is empty so existing local bookmarks get an index entry.
   * @param {Object} localBookmarkService - instance with getAllBookmarks()
   */
  async ensureMigrationFromLocal (localBookmarkService) {
    const index = await this.getIndex()
    if (Object.keys(index).length > 0) {
      debugLog('[IMPL-STORAGE_INDEX] Migration skipped: index not empty')
      return
    }
    try {
      const bookmarks = await localBookmarkService.getAllBookmarks()
      for (const b of bookmarks) {
        if (b && b.url) await this.setBackendForUrl(b.url, 'local')
      }
      debugLog('[IMPL-STORAGE_INDEX] Migration done: seeded', bookmarks.length, 'URLs as local')
    } catch (e) {
      debugError('[IMPL-STORAGE_INDEX] Migration failed:', e)
    }
  }
}
