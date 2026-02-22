/**
 * [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
 * Bookmark provider backed by chrome.storage.sync (synced across Chrome profile devices); quota ~100 KB.
 * Provider contract: getBookmarkForUrl, getRecentBookmarks, saveBookmark, deleteBookmark, saveTag, deleteTag, testConnection.
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] time = create-time, updated_at = most-recent-update-time.
 */

import { TagService } from '../tagging/tag-service.js'
import { debugLog, debugError } from '../../shared/utils.js'

const STORAGE_KEY = 'hoverboard_sync_bookmarks'

export class SyncBookmarkService {
  constructor (tagService = null) {
    this.tagService = tagService || new TagService(this)
  }

  /** [IMPL-SYNC_BOOKMARK_SERVICE] Normalize URL for storage key (match PinboardService.cleanUrl behavior). */
  cleanUrl (url) {
    if (!url) return ''
    return url.trim().replace(/\/+$/, '')
  }

  /** [IMPL-SYNC_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Empty bookmark shape (match PinboardService.createEmptyBookmark). */
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

  /** [IMPL-SYNC_BOOKMARK_SERVICE] Read all bookmarks from chrome.storage.sync. */
  async _getAllBookmarks () {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEY)
      const raw = result[STORAGE_KEY]
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
      return raw
    } catch (e) {
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] _getAllBookmarks failed:', e)
      return {}
    }
  }

  /** [IMPL-SYNC_BOOKMARK_SERVICE] Write full bookmarks map to chrome.storage.sync. */
  async _setAllBookmarks (map) {
    await chrome.storage.sync.set({ [STORAGE_KEY]: map })
  }

  /** [IMPL-SYNC_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Normalize bookmark for return: tags as array; legacy updated_at default to time. */
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

  /** [IMPL-SYNC_BOOKMARK_SERVICE] Generate a stable sync hash for a URL. */
  _syncHash (url) {
    let h = 0
    const s = String(url)
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return 'sync-' + Math.abs(h).toString(36)
  }

  async getBookmarkForUrl (url, title = '') {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      const b = all[cleanUrl]
      if (b) {
        debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] getBookmarkForUrl found:', cleanUrl)
        return this._normalizeBookmark({ ...b, url: cleanUrl })
      }
      debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] getBookmarkForUrl not found, returning empty:', cleanUrl)
      return this.createEmptyBookmark(url, title)
    } catch (error) {
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] getBookmarkForUrl failed:', error)
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
      debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] getRecentBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] getRecentBookmarks failed:', error)
      return []
    }
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Return full normalized array of all sync bookmarks, sorted by time descending.
   * Used by the local bookmarks index page; no count limit.
   */
  async getAllBookmarks () {
    try {
      const all = await this._getAllBookmarks()
      const list = Object.entries(all)
        .map(([url, b]) => this._normalizeBookmark({ ...b, url }))
        .filter(b => b && b.url)
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
      debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] getAllBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] getAllBookmarks failed:', error)
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
      // [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] New: time and updated_at = now; update: preserve time (create-time), set updated_at = now.
      const time = existing ? (existing.time || now) : now
      const bookmark = {
        url,
        description: bookmarkData.description ?? existing?.description ?? '',
        extended: bookmarkData.extended ?? existing?.extended ?? '',
        tags,
        time,
        updated_at: now,
        shared: bookmarkData.shared !== undefined ? String(bookmarkData.shared) : (existing?.shared ?? 'yes'),
        toread: bookmarkData.toread !== undefined ? String(bookmarkData.toread) : (existing?.toread ?? 'no'),
        hash: existing?.hash ?? this._syncHash(url)
      }
      all[url] = bookmark
      await this._setAllBookmarks(all)
      await this.trackBookmarkTags(bookmark)
      debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] saveBookmark ok:', url)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] saveBookmark failed:', error)
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
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] saveTag failed:', error)
      throw error
    }
  }

  async deleteBookmark (url) {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      if (!(cleanUrl in all)) {
        debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] deleteBookmark URL not found:', cleanUrl)
        return { success: true, code: 'done', message: 'Operation completed' }
      }
      delete all[cleanUrl]
      await this._setAllBookmarks(all)
      debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] deleteBookmark ok:', cleanUrl)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] deleteBookmark failed:', error)
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
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] deleteTag failed:', error)
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
        debugLog('[IMPL-SYNC_BOOKMARK_SERVICE] Tracked tags for bookmark:', sanitizedTags)
      }
    } catch (error) {
      debugError('[IMPL-SYNC_BOOKMARK_SERVICE] Failed to track bookmark tags:', error)
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
