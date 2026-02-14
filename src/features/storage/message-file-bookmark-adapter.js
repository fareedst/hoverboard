/**
 * Message-based file bookmark adapter - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER]
 * Used from service worker; sends READ_FILE_BOOKMARKS / WRITE_FILE_BOOKMARKS to offscreen document.
 * [REQ-FILE_BOOKMARK_STORAGE]
 */

import { FileBookmarkStorageAdapter } from './file-bookmark-storage-adapter.js'

const OFFSCREEN_PATH = 'src/offscreen/file-bookmark-io.html'

/**
 * [IMPL-FILE_BOOKMARK_SERVICE] Ensure offscreen document exists (call before using adapter).
 * @returns {Promise<void>}
 */
export async function ensureOffscreenDocument () {
  if (typeof chrome === 'undefined' || !chrome.offscreen) return
  const url = chrome.runtime.getURL(OFFSCREEN_PATH)
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [url]
  })
  if (existing.length > 0) return
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: ['DOM_PARSER'],
    justification: 'Parse and serialize bookmark file JSON for file storage'
  })
}

/**
 * [IMPL-FILE_BOOKMARK_SERVICE] Adapter that delegates read/write to offscreen document via messaging.
 */
export class MessageFileBookmarkAdapter extends FileBookmarkStorageAdapter {
  async readBookmarksFile () {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'READ_FILE_BOOKMARKS' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (response?.error) {
          reject(new Error(response.error))
          return
        }
        resolve(response?.data ?? { version: 1, bookmarks: {} })
      })
    })
  }

  async writeBookmarksFile (data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'WRITE_FILE_BOOKMARKS', data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (response?.error) {
          reject(new Error(response.error))
          return
        }
        resolve()
      })
    })
  }
}
