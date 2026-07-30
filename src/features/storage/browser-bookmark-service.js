/**
 * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
 * Bookmark provider backed by chrome.bookmarks; same duck-typed contract as LocalBookmarkService.
 * Folder path segments → tags (Chrome roots stripped); duplicate URLs collapse; shared/toread/extended read defaults / write no-ops.
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
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_SERVICE ===
 * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.bookmarks provider; same duck-typed contract as LocalBookmarkService; folder path ↔ tags with Chrome root strip; URL collapse. Contract: url/bookmark/tag inputs and provider-shaped outputs; native Chrome tree as backing store.
 *
 * ## CLEAN_URL
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize URL the same way as other providers (trim, strip trailing slash).
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: CLEAN_URL
 *   - RETURN trim(url) without trailing slashes
 *
 * ## LOAD_FLAT_ITEMS
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Flatten chrome.bookmarks.getTree to URL items with folderPath and parentIds; strip root segments via ids 1/2 (fallback titles).
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_FLAT_ITEMS
 *   - tree = chrome.bookmarks.getTree()
 *   - items = flattenTree(tree)  # { id, url, title, dateAdded, folderPath, parentId }
 *   - FOR each item:
 *   - item.tags = folderPathToTags(item.folderPath, { stripRoots: true })
 *   - RETURN items
 *
 * ## COLLAPSE_BY_URL
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Collapse duplicate URLs into one pin-shaped bookmark; merge tags; use earliest dateAdded for time; description from first title.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: COLLAPSE_BY_URL
 *   - map = {}
 *   - FOR each item IN items WHERE item.url:
 *   - key = cleanUrl(item.url)
 *   - IF map lacks key:
 *   - map[key] = pinShape(item)  # description=title, time=ISO(dateAdded), tags=item.tags, shared='yes', toread='no', extended='', nodeIds=[item.id]
 *   - ELSE:
 *   - merge tags into map[key].tags (dedupe)
 *   - append item.id to map[key].nodeIds
 *   - IF item.dateAdded earlier: map[key].time = ISO(item.dateAdded)
 *   - RETURN values(map)
 *
 * ## GET_BOOKMARK_FOR_URL
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Lookup by URL; return collapsed pin or empty stub.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - items = LOAD_FLAT_ITEMS filtered by cleanUrl(url)
 *   - IF items empty: RETURN emptyStub(url, title)
 *   - collapsed = collapseByUrl(items)
 *   - RETURN collapsed[0]
 *
 * ## GET_ALL_BOOKMARKS
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: All URL bookmarks for index aggregation (router tags storage='browser').
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALL_BOOKMARKS
 *   - RETURN collapseByUrl(LOAD_FLAT_ITEMS)
 *
 * ## GET_RECENT_BOOKMARKS
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Recent by dateAdded descending.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - list = getAllBookmarks(); SORT BY time DESCENDING; RETURN list[0..count-1]
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Ensure folder chain under Other Bookmarks (id 2) from tags; create or update all nodes for URL; ignore shared/toread/extended writes.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - key = cleanUrl(data.url)
 *   - parentId = ENSURE_TAG_FOLDERS(data.tags)  # nested under id "2"; empty tags → parent id "2"
 *   - existing = chrome.bookmarks.search({ url: data.url }) matching key
 *   - IF existing empty:
 *   - chrome.bookmarks.create({ parentId, title: data.description or '', url: data.url })
 *   - ELSE:
 *   - FOR each node IN existing:
 *   - chrome.bookmarks.update(node.id, { title: data.description or node.title })
 *   - IF node.parentId != parentId AND data.tags provided: chrome.bookmarks.move(node.id, { parentId })
 *   - How (sub-block): # shared, toread, extended: no-op (Chrome has no equivalents)
 *   - RETURN { success: true }
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Remove every Chrome node whose URL matches.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - key = cleanUrl(url)
 *   - nodes = search matching key
 *   - FOR each node: chrome.bookmarks.remove(node.id)
 *   - RETURN { success: true }
 *
 * ## SAVE_TAG
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Tag ops mutate folder placement via saveBookmark with updated tags.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG
 *   - bookmark = getBookmarkForUrl(tagData.url)
 *   - UPDATE bookmark.tags per tagData
 *   - RETURN saveBookmark(bookmark)
 *
 * ## TEST_CONNECTION
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Always available when bookmarks permission present.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: TEST_CONNECTION
 *   - RETURN true
 *
 * ## ENSURE_TAG_FOLDERS
 *
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Get-or-create nested folders under Other Bookmarks for each tag segment; return leaf folder id.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: ENSURE_TAG_FOLDERS
 *   - parentId = "2"  # Other Bookmarks
 *   - FOR each tag IN tags:
 *   - child = find folder under parentId titled tag OR create folder
 *   - parentId = child.id
 *   - RETURN parentId
 *
 * === END IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_SERVICE ===
 */
import { TagService } from '../tagging/tag-service.js'
import { debugLog, debugError } from '../../shared/utils.js'
import {
  flattenTree,
  folderPathToTags,
  collapseByUrl,
  sanitizeTag
} from '../../ui/browser-bookmark-import/browser-bookmark-import-utils.js'

/** Chrome Other Bookmarks folder id */
const OTHER_BOOKMARKS_ID = '2'

export class BrowserBookmarkService {
  constructor (tagService = null) {
    this.tagService = tagService || new TagService(this)
  }

  /** [IMPL-BROWSER_BOOKMARK_SERVICE] Normalize URL for lookup (match other providers). */
  cleanUrl (url) {
    if (!url) return ''
    return url.trim().replace(/\/+$/, '')
  }

  /** [IMPL-BROWSER_BOOKMARK_SERVICE] Empty bookmark shape (match LocalBookmarkService). */
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

  /**
   * [IMPL-BROWSER_BOOKMARK_SERVICE] [REQ-BROWSER_BOOKMARK_STORAGE]
   * Flatten chrome.bookmarks tree and attach root-stripped tags.
   */
  async _loadFlatItems () {
    try {
      if (typeof chrome === 'undefined' || !chrome.bookmarks?.getTree) {
        return []
      }
      const tree = await chrome.bookmarks.getTree()
      const flat = flattenTree(tree)
      return flat.map(item => ({
        ...item,
        tags: folderPathToTags(item.folderPath, { stripRoots: true })
      }))
    } catch (e) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] _loadFlatItems failed:', e)
      return []
    }
  }

  /**
   * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
   * Lookup by URL; collapse all matching Chrome nodes into one pin-shaped bookmark.
   */
  async getBookmarkForUrl (url, title = '') {
    try {
      const key = this.cleanUrl(url)
      const items = (await this._loadFlatItems()).filter(i => this.cleanUrl(i.url) === key)
      if (items.length === 0) {
        return this.createEmptyBookmark(url, title)
      }
      const collapsed = collapseByUrl(items)
      const b = collapsed[0]
      debugLog('[IMPL-BROWSER_BOOKMARK_SERVICE] getBookmarkForUrl found:', key, 'tags:', b.tags)
      return {
        url: b.url,
        description: b.description,
        extended: '',
        tags: b.tags,
        time: b.time,
        updated_at: b.updated_at || b.time,
        shared: 'yes',
        toread: 'no',
        hash: b.hash || ''
      }
    } catch (error) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] getBookmarkForUrl failed:', error)
      return this.createEmptyBookmark(url, title)
    }
  }

  /**
   * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
   * All URL bookmarks for index aggregation (router tags storage='browser').
   */
  async getAllBookmarks () {
    try {
      const items = await this._loadFlatItems()
      const list = collapseByUrl(items)
        .map(b => ({
          url: b.url,
          description: b.description,
          extended: '',
          tags: b.tags,
          time: b.time,
          updated_at: b.updated_at || b.time,
          shared: 'yes',
          toread: 'no',
          hash: b.hash || ''
        }))
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
      debugLog('[IMPL-BROWSER_BOOKMARK_SERVICE] getAllBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] getAllBookmarks failed:', error)
      return []
    }
  }

  async getRecentBookmarks (count = 15) {
    const list = await this.getAllBookmarks()
    return list.slice(0, count)
  }

  /**
   * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
   * ENSURE_TAG_FOLDERS: get-or-create nested folders under Other Bookmarks for each tag; return leaf folder id.
   */
  async _ensureTagFolders (tags) {
    let parentId = OTHER_BOOKMARKS_ID
    const list = Array.isArray(tags) ? tags : String(tags || '').split(/\s+/).filter(Boolean)
    for (const raw of list) {
      const tag = sanitizeTag(raw)
      if (!tag) continue
      const children = await chrome.bookmarks.getChildren(parentId)
      let folder = children.find(c => !c.url && sanitizeTag(c.title) === tag)
      if (!folder) {
        folder = await chrome.bookmarks.create({ parentId, title: tag })
      }
      parentId = folder.id
    }
    return parentId
  }

  /**
   * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
   * Create or update all matching Chrome nodes; ENSURE_TAG_FOLDERS; shared/toread/extended write no-ops.
   */
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
      const title = bookmarkData.description ?? ''
      const parentId = await this._ensureTagFolders(tags)
      const existing = await chrome.bookmarks.search({ url: bookmarkData.url })
      const matching = (existing || []).filter(n => n.url && this.cleanUrl(n.url) === url)
      if (matching.length === 0) {
        await chrome.bookmarks.create({ parentId, title: title || url, url })
      } else {
        for (const node of matching) {
          await chrome.bookmarks.update(node.id, { title: title || node.title || url })
          if (tags.length > 0 && node.parentId !== parentId) {
            await chrome.bookmarks.move(node.id, { parentId })
          }
        }
      }
      // shared, toread, extended: write no-ops (Chrome has no equivalents)
      await this.trackBookmarkTags({ url, tags, description: title })
      debugLog('[IMPL-BROWSER_BOOKMARK_SERVICE] saveBookmark ok:', url)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] saveBookmark failed:', error)
      throw error
    }
  }

  /**
   * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
   * Remove every Chrome node whose cleaned URL matches.
   */
  async deleteBookmark (url) {
    try {
      const key = this.cleanUrl(url)
      const found = await chrome.bookmarks.search({ url })
      const matching = (found || []).filter(n => n.url && this.cleanUrl(n.url) === key)
      for (const node of matching) {
        await chrome.bookmarks.remove(node.id)
      }
      debugLog('[IMPL-BROWSER_BOOKMARK_SERVICE] deleteBookmark ok:', key, 'removed:', matching.length)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] deleteBookmark failed:', error)
      throw error
    }
  }

  async saveTag (tagData) {
    try {
      const current = await this.getBookmarkForUrl(tagData.url)
      const existingTags = current.tags || []
      const newTags = [...existingTags]
      if (tagData.value && !existingTags.includes(tagData.value)) {
        newTags.push(tagData.value)
      }
      return this.saveBookmark({ ...current, tags: newTags })
    } catch (error) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] saveTag failed:', error)
      throw error
    }
  }

  async deleteTag (tagData) {
    try {
      const current = await this.getBookmarkForUrl(tagData.url)
      const filtered = (current.tags || []).filter(t => t !== tagData.value)
      return this.saveBookmark({ ...current, tags: filtered })
    } catch (error) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] deleteTag failed:', error)
      throw error
    }
  }

  async testConnection () {
    return true
  }

  async trackBookmarkTags (bookmarkData) {
    try {
      const tags = Array.isArray(bookmarkData.tags)
        ? bookmarkData.tags
        : String(bookmarkData.tags || '').split(/\s+/).filter(Boolean)
      for (const tag of tags) {
        const sanitized = this.tagService.sanitizeTag(tag)
        if (sanitized) await this.tagService.handleTagAddition(sanitized, bookmarkData)
      }
    } catch (error) {
      debugError('[IMPL-BROWSER_BOOKMARK_SERVICE] Failed to track bookmark tags:', error)
    }
  }
}
