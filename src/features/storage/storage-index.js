/**
 * [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
 * Per-URL storage backend mapping in chrome.storage.local; getIndex, getBackendForUrl, setBackendForUrl, removeUrl.
 */

import { debugLog, debugError } from '../../shared/utils.js'

const STORAGE_INDEX_KEY = 'hoverboard_storage_index'
const VALID_BACKENDS = ['pinboard', 'local', 'file', 'sync']

function cleanUrl (url) {
  if (!url) return ''
  return url.trim().replace(/\/+$/, '')
}

export class StorageIndex {
  /**
   * [IMPL-STORAGE_INDEX] Get full index from chrome.storage.local.
   * @returns {Promise<Object>} { [url]: 'pinboard'|'local'|'file'|'sync' }
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
   * @param {string} backend - 'pinboard'|'local'|'file'|'sync'
   */
  async setBackendForUrl (url, backend) {
    if (!VALID_BACKENDS.includes(backend)) {
      throw new Error(`Invalid backend: ${backend}. Use pinboard, local, file, or sync.`)
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
   * @returns {Promise<string|null>} 'pinboard'|'local'|'file'|'sync' or null
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
