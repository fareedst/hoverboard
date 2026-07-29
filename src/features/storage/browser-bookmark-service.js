/**
 * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
 * Bookmark provider backed by chrome.bookmarks; same duck-typed contract as LocalBookmarkService.
 * Folder path segments → tags (Chrome roots stripped); duplicate URLs collapse; shared/toread/extended read defaults / write no-ops.
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
