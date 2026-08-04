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
 * === IMPL-FULL-BLOCK: IMPL-FILE_BOOKMARK_SERVICE ===
 * [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — File-based bookmark provider via adapter; same contract as Local/Pinboard. Contract: url/bookmark/tag inputs and provider-shaped outputs; adapter and file shape.
 *
 * ## GET_BOOKMARK_FOR_URL
 *
 * - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements getBookmarkForUrl(url) behavior for IMPL-FILE_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: adapter (readBookmarksFile, writeBookmarksFile); file shape = { version: 1, bookmarks: map url -> bookmark }
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - bookmarks = LOAD bookmarks from file
 *   - urlNorm = normalize(url)
 *   - RETURN bookmarks[urlNorm] or null
 *
 * ## WRITE_VIA_ADAPTER
 *
 * - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Persist via adapter; MessageFileBookmarkAdapter requires WRITE_FILE_BOOKMARKS response.success === true.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: adapter (readBookmarksFile, writeBookmarksFile); file shape = { version: 1, bookmarks: map url -> bookmark }
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: WRITE_VIA_ADAPTER
 *   - adapter.writeBookmarksFile(data)  # production: reject unless response.success === true
 *   - How (sub-block): Merge data into bookmark shape and write file.
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements saveBookmark(data) behavior for IMPL-FILE_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: adapter (readBookmarksFile, writeBookmarksFile); file shape = { version: 1, bookmarks: map url -> bookmark }
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - bookmarks = LOAD bookmarks from file
 *   - urlNorm = normalize(data.url)
 *   - bookmarks[urlNorm] = merge(data into bookmark shape with url, description, extended, tags, time, shared, toread, hash)
 *   - writeViaAdapter({ version: 1, bookmarks })
 *   - RETURN { success: true }
 *   - How (sub-block): Remove by normalized URL and write file.
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements deleteBookmark(url) behavior for IMPL-FILE_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: adapter (readBookmarksFile, writeBookmarksFile); file shape = { version: 1, bookmarks: map url -> bookmark }
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - bookmarks = LOAD bookmarks from file
 *   - REMOVE bookmarks[normalize(url)]
 *   - writeViaAdapter({ version: 1, bookmarks })
 *   - RETURN { success: true }
 *   - How (sub-block): Update tags on bookmark and persist.
 *
 * ## SAVE_TAG
 *
 * - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements saveTag(data), deleteTag(data) behavior for IMPL-FILE_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: adapter (readBookmarksFile, writeBookmarksFile); file shape = { version: 1, bookmarks: map url -> bookmark }
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG
 *   - bookmark = getBookmarkForUrl(data.url); update tags; saveBookmark(bookmark) or equivalent
 *   - RETURN { success: true }
 *   - How (sub-block): Sort by time descending and return first count.
 *
 * ## GET_RECENT_BOOKMARKS
 *
 * - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements getRecentBookmarks(count) behavior for IMPL-FILE_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: adapter (readBookmarksFile, writeBookmarksFile); file shape = { version: 1, bookmarks: map url -> bookmark }
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - bookmarks = LOAD bookmarks from file
 *   - list = values(bookmarks)
 *   - SORT list BY time DESCENDING
 *   - RETURN list[0..count-1]
 *
 * === END IMPL-FULL-BLOCK: IMPL-FILE_BOOKMARK_SERVICE ===
 */
import { TagService } from '../tagging/tag-service.js'
import { debugLog, debugError } from '../../shared/utils.js'
import { InMemoryFileBookmarkAdapter, FILE_FORMAT_VERSION } from './file-bookmark-storage-adapter.js'

export class FileBookmarkService {
  /**
   * [IMPL-FILE_BOOKMARK_SERVICE] Constructor. adapter required for production; defaults to InMemory for tests.
   * @param {FileBookmarkStorageAdapter} adapter - readBookmarksFile / writeBookmarksFile
   * @param {TagService|null} tagService - optional TagService for recent-tag tracking
   */
  constructor (adapter = null, tagService = null) {
    this.adapter = adapter || new InMemoryFileBookmarkAdapter()
    this.tagService = tagService || new TagService(this)
  }

  /** [IMPL-FILE_BOOKMARK_SERVICE] Normalize URL for storage key (match LocalBookmarkService.cleanUrl). */
  cleanUrl (url) {
    if (!url) return ''
    return url.trim().replace(/\/+$/, '')
  }

  /** [IMPL-FILE_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Empty bookmark shape (match LocalBookmarkService.createEmptyBookmark). */
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

  /** [IMPL-FILE_BOOKMARK_SERVICE] Read all bookmarks from adapter. */
  async _getAllBookmarks () {
    try {
      const result = await this.adapter.readBookmarksFile()
      if (!result || typeof result !== 'object') return {}
      const raw = result.bookmarks
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
      return raw
    } catch (e) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] _getAllBookmarks failed:', e)
      return {}
    }
  }

  /** [IMPL-FILE_BOOKMARK_SERVICE] Write full bookmarks map via adapter. */
  async _setAllBookmarks (map) {
    await this.adapter.writeBookmarksFile({ version: FILE_FORMAT_VERSION, bookmarks: map })
  }

  /** [IMPL-FILE_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Normalize bookmark for return: tags as array; legacy updated_at default to time. */
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

  /** [IMPL-FILE_BOOKMARK_SERVICE] Generate a stable local hash for a URL. */
  _fileHash (url) {
    let h = 0
    const s = String(url)
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return 'file-' + Math.abs(h).toString(36)
  }

  async getBookmarkForUrl (url, title = '') {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      const b = all[cleanUrl]
      if (b) {
        debugLog('[IMPL-FILE_BOOKMARK_SERVICE] getBookmarkForUrl found:', cleanUrl)
        return this._normalizeBookmark({ ...b, url: cleanUrl })
      }
      debugLog('[IMPL-FILE_BOOKMARK_SERVICE] getBookmarkForUrl not found, returning empty:', cleanUrl)
      return this.createEmptyBookmark(url, title)
    } catch (error) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] getBookmarkForUrl failed:', error)
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
      debugLog('[IMPL-FILE_BOOKMARK_SERVICE] getRecentBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] getRecentBookmarks failed:', error)
      return []
    }
  }

  /**
   * [IMPL-FILE_BOOKMARK_SERVICE] Return full normalized array of all file bookmarks, sorted by time descending.
   */
  async getAllBookmarks () {
    try {
      const all = await this._getAllBookmarks()
      const list = Object.entries(all)
        .map(([url, b]) => this._normalizeBookmark({ ...b, url }))
        .filter(b => b && b.url)
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
      debugLog('[IMPL-FILE_BOOKMARK_SERVICE] getAllBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] getAllBookmarks failed:', error)
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
        hash: existing?.hash ?? this._fileHash(url)
      }
      all[url] = bookmark
      await this._setAllBookmarks(all)
      await this.trackBookmarkTags(bookmark)
      debugLog('[IMPL-FILE_BOOKMARK_SERVICE] saveBookmark ok:', url)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] saveBookmark failed:', error)
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
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] saveTag failed:', error)
      throw error
    }
  }

  async deleteBookmark (url) {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      if (!(cleanUrl in all)) {
        debugLog('[IMPL-FILE_BOOKMARK_SERVICE] deleteBookmark URL not found:', cleanUrl)
        return { success: true, code: 'done', message: 'Operation completed' }
      }
      delete all[cleanUrl]
      await this._setAllBookmarks(all)
      debugLog('[IMPL-FILE_BOOKMARK_SERVICE] deleteBookmark ok:', cleanUrl)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] deleteBookmark failed:', error)
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
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] deleteTag failed:', error)
      throw error
    }
  }

  async testConnection () {
    try {
      await this.adapter.readBookmarksFile()
      return true
    } catch (e) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] testConnection failed:', e)
      return false
    }
  }

  async trackBookmarkTags (bookmarkData) {
    try {
      const tags = this.extractTagsFromBookmarkData(bookmarkData)
      const sanitizedTags = Array.from(new Set(tags.map(tag => this.tagService.sanitizeTag(tag)).filter(Boolean)))
      if (sanitizedTags.length > 0) {
        for (const sanitizedTag of sanitizedTags) {
          await this.tagService.handleTagAddition(sanitizedTag, bookmarkData)
        }
        debugLog('[IMPL-FILE_BOOKMARK_SERVICE] Tracked tags for bookmark:', sanitizedTags)
      }
    } catch (error) {
      debugError('[IMPL-FILE_BOOKMARK_SERVICE] Failed to track bookmark tags:', error)
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
