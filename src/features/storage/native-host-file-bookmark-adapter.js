/**
 * [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE]
 * Adapter that reads/writes the bookmark file via the native host using a user-typed path.
 * Path is read from chrome.storage.local (hoverboard_file_storage_path) on each call; no picker or offscreen doc.
 */

import { FileBookmarkStorageAdapter } from './file-bookmark-storage-adapter.js'

const NATIVE_HOST_NAME = 'com.hoverboard.native_host'
const STORAGE_KEY_PATH = 'hoverboard_file_storage_path'
const DEFAULT_PATH = '~/.hoverboard'

/**
 * [IMPL-FILE_STORAGE_TYPED_PATH] Get path from storage; default ~/.hoverboard.
 * @returns {Promise<string>}
 */
async function getPathFromStorage () {
  const result = await chrome.storage.local.get(STORAGE_KEY_PATH)
  const path = result[STORAGE_KEY_PATH]
  return (path && typeof path === 'string' && path.trim()) ? path.trim() : DEFAULT_PATH
}

/**
 * [IMPL-FILE_STORAGE_TYPED_PATH] Adapter that sends read/write to native host with path from storage.
 */
export class NativeHostFileBookmarkAdapter extends FileBookmarkStorageAdapter {
  async readBookmarksFile () {
    const path = await getPathFromStorage()
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, { type: 'readBookmarksFile', path })
    if (!response) {
      throw new Error(chrome.runtime.lastError?.message || 'Native host did not respond')
    }
    if (response.type === 'error') {
      throw new Error(response.message || 'Native host error')
    }
    if (response.type === 'readBookmarksFile' && response.data) {
      return { version: response.data.version ?? 1, bookmarks: response.data.bookmarks ?? {} }
    }
    throw new Error('Invalid native host response for readBookmarksFile')
  }

  async writeBookmarksFile (data) {
    const path = await getPathFromStorage()
    const payload = { version: data?.version ?? 1, bookmarks: data?.bookmarks ?? {} }
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, { type: 'writeBookmarksFile', path, data: payload })
    if (!response) {
      throw new Error(chrome.runtime.lastError?.message || 'Native host did not respond')
    }
    if (response.type === 'error') {
      throw new Error(response.message || 'Native host error')
    }
    if (response.type === 'writeBookmarksFile' && response.success) {
      return
    }
    throw new Error('Invalid native host response for writeBookmarksFile')
  }
}
