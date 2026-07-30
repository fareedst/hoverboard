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
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARK_SERVICE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), filter pipeline, table with Storage column; Stores L/F/S/B. Contract: page load and user actions; displayed table and filtered list; state data.
 *
 * ## LOAD_LOCAL_BOOKMARKS_INDEX
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: LOAD_LOCAL_BOOKMARKS_INDEX: aggregate first; treat error/success:false as failure even when bookmarks is []; then filter.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_LOCAL_BOOKMARKS_INDEX
 *   - SEND getAggregatedBookmarksForIndex
 *   - IF response has error OR success is false OR bookmarks is not an array:
 *   - SEND getLocalBookmarksForIndex
 *   - SET allBookmarks = response.bookmarks with storage "local"
 *   - ELSE:
 *   - SET allBookmarks = response.bookmarks (each item has storage "local"|"file"|"sync"|"browser")
 *   - applySearchAndFilter()
 *   - 1. ON page load:
 *   - LOAD_LOCAL_BOOKMARKS_INDEX
 *
 * ## SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: Store checkbox change refilters; if cache empty and at least one store checked, reload (cold SW recovery).
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE
 *   - RETURN allBookmarksLength == 0 AND allowedStoresSize > 0
 *
 * ## GET_ALLOWED_STORES
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: getAllowedStores includes browser when #store-browser checked; Move/Import-to targets include browser.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALLOWED_STORES
 *   - SET from checked #store-local|#store-file|#store-sync|#store-browser → { local, file, sync, browser }
 *   - How (sub-block): Apply stores filter, search, show-only, exclude tags; sort and render.
 *
 * ## APPLY_SEARCH_AND_FILTER
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Implements applySearchAndFilter() behavior for IMPL-LOCAL_BOOKMARKS_INDEX.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_SEARCH_AND_FILTER
 *   - filteredBookmarks = allBookmarks
 *   - APPLY stores filter (matchStoresFilter, getAllowedStores)
 *   - APPLY search (text)
 *   - APPLY show-only (tags, toread, private, time range; getShowOnlyDefaultState for Clear)
 *   - APPLY exclude tags (matchExcludeTags)
 *   - SORT by sortKey (e.g. time desc)
 *   - renderTableBody(filteredBookmarks); updateRowCount()
 *
 * ## BULK_DELETE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER] How: Bulk Delete uses row Storage column as preferredBackend; pending/final #delete-result mirrors Import status UX. Orchestrator: runBulkDelete (bookmarks-table-bulk-delete.js) for composition-testable wiring.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BULK_DELETE
 *   - IF selectedUrls empty: RETURN
 *   - runBulkDelete(urls, bookmarksByUrl, sendMessage, confirmFn, #delete-result, onAfterDelete):
 *   - titles = descriptions for selected URLs from bookmarksByUrl
 *   - IF NOT confirmFn(buildDeleteConfirmMessage(count, titles)): RETURN cancelled
 *   - setDeleteResultPending(#delete-result)  # "Deleting…" warning color
 *   - FOR each url IN urls:
 *   - bookmark = lookup url in bookmarksByUrl
 *   - payload = buildDeletePayload(bookmark)  # { url, preferredBackend from storage }
 *   - SEND deleteBookmark with data = payload
 *   - COUNT ok / fail from response
 *   - onAfterDelete()  # CLEAR selectedUrls; loadBookmarks(); updateMoveControlsState()
 *   - setDeleteResultFinal(#delete-result, formatDeleteResultMessage({ deleted: ok, failed: fail }))
 *   - How (sub-block): buildDeletePayload(bookmark):
 *   - IF bookmark missing or no url: RETURN null
 *   - RETURN { url: bookmark.url, preferredBackend: lowercase(bookmark.storage) OR "local" }
 *
 * ## OPEN_BOOKMARKS_INDEX_TAB
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: concurrent cold-start messages share one in-flight initBookmarkProvider promise (createProviderInitMutex). OPEN_BOOKMARKS_INDEX_TAB: create index tab then dismiss already-open side panel (tab-create only; not page refresh). How: SW owns create+broadcast so popup/command/menu share one path; panel closes via REQUEST_SIDE_PANEL_CLOSE (icon-toggle semantics).
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_BOOKMARKS_INDEX_TAB
 *   - url = runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html')
 *   - tabs.create({ url })
 *   - runtime.sendMessage({ type: REQUEST_SIDE_PANEL_CLOSE })
 *   - How (sub-block): Entry points that call OPEN_BOOKMARKS_INDEX_TAB (not options href):
 *   - 1. ON OPEN_BOOKMARKS_INDEX message: OPEN_BOOKMARKS_INDEX_TAB
 *   - 2. ON command open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
 *   - 3. ON context menu hoverboard-open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
 *   - 4. Popup: bookmarksIndexBtn -> openBookmarksIndex -> SEND OPEN_BOOKMARKS_INDEX
 *   - 5. Options: bookmarks-index-link href -> extension URL (no dismiss; out of scope)
 *   - How (sub-block): Index page init must NOT send REQUEST_SIDE_PANEL_CLOSE (refresh must not re-dismiss after icon reopen).
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 */
import { TagService } from '../tagging/tag-service.js'
import { debugLog, debugError } from '../../shared/utils.js'

const STORAGE_KEY = 'hoverboard_local_bookmarks'

export class LocalBookmarkService {
  constructor (tagService = null) {
    this.tagService = tagService || new TagService(this)
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Normalize URL for storage key (match PinboardService.cleanUrl behavior). */
  cleanUrl (url) {
    if (!url) return ''
    return url.trim().replace(/\/+$/, '')
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Empty bookmark shape (match PinboardService.createEmptyBookmark). */
  createEmptyBookmark (url, title) {
    return {
      url: url || '',
      description: title || '',
      extended: '',
      tags: [],
      time: '',
      updated_at: '',
      shared: 'yes',
      toread: 'no',
      hash: ''
    }
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Read all bookmarks from chrome.storage.local. */
  async _getAllBookmarks () {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const raw = result[STORAGE_KEY]
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
      return raw
    } catch (e) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] _getAllBookmarks failed:', e)
      return {}
    }
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Write full bookmarks map to chrome.storage.local. */
  async _setAllBookmarks (map) {
    await chrome.storage.local.set({ [STORAGE_KEY]: map })
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Normalize bookmark for return: tags as array; legacy updated_at default to time. */
  _normalizeBookmark (b) {
    if (!b) return null
    const tags = b.tags == null ? [] : Array.isArray(b.tags) ? b.tags : String(b.tags).split(/\s+/).filter(Boolean)
    const time = b.time || ''
    return {
      url: b.url || '',
      description: b.description || '',
      extended: b.extended || '',
      tags,
      time,
      updated_at: b.updated_at ?? time ?? '',
      shared: b.shared === 'no' ? 'no' : 'yes',
      toread: b.toread === 'yes' ? 'yes' : 'no',
      hash: b.hash || ''
    }
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Generate a stable local hash for a URL. */
  _localHash (url) {
    let h = 0
    const s = String(url)
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return 'local-' + Math.abs(h).toString(36)
  }

  async getBookmarkForUrl (url, title = '') {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      const b = all[cleanUrl]
      if (b) {
        debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] getBookmarkForUrl found:', cleanUrl)
        return this._normalizeBookmark({ ...b, url: cleanUrl })
      }
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] getBookmarkForUrl not found, returning empty:', cleanUrl)
      return this.createEmptyBookmark(url, title)
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] getBookmarkForUrl failed:', error)
      return this.createEmptyBookmark(url, title)
    }
  }

  async getRecentBookmarks (count = 15) {
    try {
      const all = await this._getAllBookmarks()
      const list = Object.values(all)
        .map(b => this._normalizeBookmark(b))
        .filter(b => b && b.time)
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
        .slice(0, count)
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] getRecentBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] getRecentBookmarks failed:', error)
      return []
    }
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Return full normalized array of all local bookmarks, sorted by time descending.
   * Used by the local bookmarks index page; no count limit.
   */
  async getAllBookmarks () {
    try {
      const all = await this._getAllBookmarks()
      const list = Object.entries(all)
        .map(([url, b]) => this._normalizeBookmark({ ...b, url }))
        .filter(b => b && b.url)
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
      debugLog('[IMPL-LOCAL_BOOKMARKS_INDEX] getAllBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARKS_INDEX] getAllBookmarks failed:', error)
      return []
    }
  }

  async saveBookmark (bookmarkData) {
    try {
      const url = bookmarkData?.url ? this.cleanUrl(bookmarkData.url) : ''
      if (!url) {
        return { success: false, code: 'invalid', message: 'URL is required' }
      }
      const tags = bookmarkData.tags == null
        ? []
        : Array.isArray(bookmarkData.tags)
          ? bookmarkData.tags
          : String(bookmarkData.tags).split(/\s+/).filter(Boolean)
      const now = new Date().toISOString()
      const all = await this._getAllBookmarks()
      const existing = all[url]
      // [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Create: use payload time/updated_at when present (import); else now. Update: keep create time, bump updated_at.
      const payloadTime = typeof bookmarkData.time === 'string' ? bookmarkData.time.trim() : ''
      const payloadUpdated = typeof bookmarkData.updated_at === 'string' ? bookmarkData.updated_at.trim() : ''
      const time = existing ? (existing.time || now) : (payloadTime || now)
      const updatedAt = existing ? now : (payloadUpdated || time)
      const bookmark = {
        url,
        description: bookmarkData.description ?? existing?.description ?? '',
        extended: bookmarkData.extended ?? existing?.extended ?? '',
        tags,
        time,
        updated_at: updatedAt,
        shared: bookmarkData.shared !== undefined ? String(bookmarkData.shared) : (existing?.shared ?? 'yes'),
        toread: bookmarkData.toread !== undefined ? String(bookmarkData.toread) : (existing?.toread ?? 'no'),
        hash: existing?.hash ?? this._localHash(url)
      }
      all[url] = bookmark
      await this._setAllBookmarks(all)
      await this.trackBookmarkTags(bookmark)
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] saveBookmark ok:', url)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] saveBookmark failed:', error)
      throw error
    }
  }

  async saveTag (tagData) {
    try {
      const currentBookmark = await this.getBookmarkForUrl(tagData.url)
      const existingTags = currentBookmark.tags || []
      const newTags = [...existingTags]
      if (tagData.value && !existingTags.includes(tagData.value)) {
        newTags.push(tagData.value)
      }
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: newTags.join(' ')
      }
      if (tagData.value) {
        await this.tagService.handleTagAddition(tagData.value, updatedBookmark)
      }
      return this.saveBookmark(updatedBookmark)
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] saveTag failed:', error)
      throw error
    }
  }

  async deleteBookmark (url) {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      if (!(cleanUrl in all)) {
        debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteBookmark URL not found:', cleanUrl)
        return { success: true, code: 'done', message: 'Operation completed' }
      }
      delete all[cleanUrl]
      await this._setAllBookmarks(all)
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteBookmark ok:', cleanUrl)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteBookmark failed:', error)
      throw error
    }
  }

  async deleteTag (tagData) {
    try {
      const currentBookmark = await this.getBookmarkForUrl(tagData.url)
      const existingTags = currentBookmark.tags || []
      const filteredTags = existingTags.filter(tag => tag !== tagData.value)
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: filteredTags.join(' ')
      }
      return this.saveBookmark(updatedBookmark)
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteTag failed:', error)
      throw error
    }
  }

  async testConnection () {
    return true
  }

  async trackBookmarkTags (bookmarkData) {
    try {
      const tags = this.extractTagsFromBookmarkData(bookmarkData)
      const sanitizedTags = Array.from(new Set(tags.map(tag => this.tagService.sanitizeTag(tag)).filter(Boolean)))
      if (sanitizedTags.length > 0) {
        for (const sanitizedTag of sanitizedTags) {
          await this.tagService.handleTagAddition(sanitizedTag, bookmarkData)
        }
        debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] Tracked tags for bookmark:', sanitizedTags)
      }
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] Failed to track bookmark tags:', error)
    }
  }

  extractTagsFromBookmarkData (bookmarkData) {
    const tags = []
    if (bookmarkData.tags) {
      if (typeof bookmarkData.tags === 'string') {
        tags.push(...bookmarkData.tags.split(/\s+/).filter(tag => tag.trim()))
      } else if (Array.isArray(bookmarkData.tags)) {
        tags.push(...bookmarkData.tags.filter(tag => tag && tag.trim()))
      }
    }
    return tags
  }
}
