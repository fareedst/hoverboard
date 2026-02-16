/**
 * Bookmark Router - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER]
 * Delegates bookmark operations to the correct provider (pinboard, local, file, sync) per URL using storage index.
 * [REQ-PER_BOOKMARK_STORAGE_BACKEND]
 */

import { debugLog, debugError } from '../../shared/utils.js'

function cleanUrl (url) {
  if (!url) return ''
  return url.trim().replace(/\/+$/, '')
}

export class BookmarkRouter {
  /**
   * [IMPL-BOOKMARK_ROUTER] Constructor.
   * @param {Object} pinboardProvider - getBookmarkForUrl, saveBookmark, deleteBookmark, getRecentBookmarks, saveTag, deleteTag, testConnection
   * @param {Object} localProvider - same contract
   * @param {Object} fileProvider - same contract
   * @param {Object} syncProvider - same contract
   * @param {StorageIndex} storageIndex
   * @param {() => Promise<string>} getDefaultStorageMode - async returns 'pinboard'|'local'|'file'|'sync'
   */
  constructor (pinboardProvider, localProvider, fileProvider, syncProvider, storageIndex, getDefaultStorageMode) {
    this.pinboardProvider = pinboardProvider
    this.localProvider = localProvider
    this.fileProvider = fileProvider
    this.syncProvider = syncProvider
    this.storageIndex = storageIndex
    this.getDefaultStorageMode = getDefaultStorageMode
  }

  _providerFor (backend) {
    if (backend === 'pinboard') return this.pinboardProvider
    if (backend === 'local') return this.localProvider
    if (backend === 'file') return this.fileProvider
    if (backend === 'sync') return this.syncProvider
    return this.localProvider
  }

  async _backendForUrl (url) {
    const key = cleanUrl(url)
    const backend = await this.storageIndex.getBackendForUrl(key)
    if (backend) return backend
    return this.getDefaultStorageMode()
  }

  async getBookmarkForUrl (url, title = '') {
    const backend = await this._backendForUrl(url)
    const provider = this._providerFor(backend)
    debugLog('[IMPL-BOOKMARK_ROUTER] getBookmarkForUrl backend:', backend)
    return provider.getBookmarkForUrl(url, title)
  }

  async getRecentBookmarks (count = 15) {
    const [pin, local, file, sync] = await Promise.all([
      this.pinboardProvider.getRecentBookmarks(count),
      this.localProvider.getRecentBookmarks(count),
      this.fileProvider.getRecentBookmarks(count),
      this.syncProvider.getRecentBookmarks(count)
    ])
    const merged = [...pin, ...local, ...file, ...sync]
    const byTime = merged.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
    const list = byTime.slice(0, count)
    debugLog('[IMPL-BOOKMARK_ROUTER] getRecentBookmarks aggregated:', list.length)
    return list
  }

  async saveBookmark (bookmarkData) {
    const url = bookmarkData?.url ? cleanUrl(bookmarkData.url) : ''
    if (!url) {
      return { success: false, code: 'invalid', message: 'URL is required' }
    }
    let backend = await this.storageIndex.getBackendForUrl(url)
    if (!backend) backend = await this.getDefaultStorageMode()
    const provider = this._providerFor(backend)
    const result = await provider.saveBookmark(bookmarkData)
    if (result.success) {
      await this.storageIndex.setBackendForUrl(url, backend)
    }
    return result
  }

  async deleteBookmark (url) {
    const key = cleanUrl(url)
    let backend = await this.storageIndex.getBackendForUrl(key)
    if (!backend) backend = await this.getDefaultStorageMode()
    const provider = this._providerFor(backend)
    const result = await provider.deleteBookmark(url)
    if (result.success) {
      await this.storageIndex.removeUrl(key)
    }
    return result
  }

  async saveTag (tagData) {
    const url = tagData?.url ? cleanUrl(tagData.url) : ''
    if (!url) return { success: false, code: 'invalid', message: 'URL is required' }
    const backend = await this._backendForUrl(url)
    const provider = this._providerFor(backend)
    return provider.saveTag(tagData)
  }

  async deleteTag (tagData) {
    const url = tagData?.url ? cleanUrl(tagData.url) : ''
    if (!url) return { success: false, code: 'invalid', message: 'URL is required' }
    const backend = await this._backendForUrl(url)
    const provider = this._providerFor(backend)
    return provider.deleteTag(tagData)
  }

  async testConnection () {
    const defaultMode = await this.getDefaultStorageMode()
    const provider = this._providerFor(defaultMode)
    return provider.testConnection()
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] Return all bookmarks from local, file, and sync providers with storage field (for index page).
   * @returns {Promise<Array<{ ...bookmark, storage: 'local'|'file'|'sync' }>>}
   */
  async getAllBookmarksForIndex () {
    const [localList, fileList, syncList] = await Promise.all([
      this.localProvider.getAllBookmarks ? this.localProvider.getAllBookmarks() : [],
      this.fileProvider.getAllBookmarks ? this.fileProvider.getAllBookmarks() : [],
      this.syncProvider.getAllBookmarks ? this.syncProvider.getAllBookmarks() : []
    ])
    const withSource = [
      ...localList.map(b => ({ ...b, storage: 'local' })),
      ...fileList.map(b => ({ ...b, storage: 'file' })),
      ...syncList.map(b => ({ ...b, storage: 'sync' }))
    ]
    return withSource.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] Get storage backend for URL (for move UI).
   * @param {string} url
   * @returns {Promise<string>} 'pinboard'|'local'|'file'|'sync'
   */
  async getStorageBackendForUrl (url) {
    const backend = await this.storageIndex.getBackendForUrl(url)
    if (backend) return backend
    return this.getDefaultStorageMode()
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move bookmark to target storage (copy to target, delete from source, update index).
   * @param {string} url
   * @param {string} targetBackend - 'pinboard'|'local'|'file'|'sync'
   */
  async moveBookmarkToStorage (url, targetBackend) {
    const key = cleanUrl(url)
    const sourceBackend = await this.storageIndex.getBackendForUrl(key) || await this.getDefaultStorageMode()
    if (sourceBackend === targetBackend) {
      return { success: true, code: 'done', message: 'Already in target storage' }
    }
    const sourceProvider = this._providerFor(sourceBackend)
    const targetProvider = this._providerFor(targetBackend)
    const bookmark = await sourceProvider.getBookmarkForUrl(url)
    if (!bookmark || !bookmark.url) {
      return { success: false, code: 'not_found', message: 'Bookmark not found in source' }
    }
    // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Allow move when bookmark has url but missing time.
    const toSave = bookmark.time ? bookmark : { ...bookmark, time: new Date().toISOString() }
    const saveResult = await targetProvider.saveBookmark(toSave)
    if (!saveResult.success) {
      debugError('[IMPL-BOOKMARK_ROUTER] moveBookmarkToStorage save to target failed:', saveResult)
      return saveResult
    }
    const deleteResult = await sourceProvider.deleteBookmark(url)
    if (!deleteResult.success) {
      debugError('[IMPL-BOOKMARK_ROUTER] moveBookmarkToStorage delete from source failed:', deleteResult)
    }
    await this.storageIndex.setBackendForUrl(key, targetBackend)
    debugLog('[IMPL-BOOKMARK_ROUTER] moveBookmarkToStorage done:', key, sourceBackend, '->', targetBackend)
    return { success: true, code: 'done', message: 'Operation completed' }
  }
}
