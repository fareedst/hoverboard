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
        // [IMPL-FILE_BOOKMARK_SERVICE] Require explicit success so a missing offscreen reply cannot fake a durable write.
        if (!response || response.success !== true) {
          reject(new Error('WRITE_FILE_BOOKMARKS did not return success'))
          return
        }
        resolve()
      })
    })
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Read the sibling archive artifact file through the existing offscreen File System Access boundary.
   */
  async readArchiveFile () {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'READ_FILE_ARCHIVES' }, (response) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
        if (response?.error) return reject(new Error(response.error))
        resolve(response?.data ?? { version: 1, archives: {}, screenshots: {} })
      })
    })
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Write the sibling archive artifact file and require an explicit durable success response.
   */
  async writeArchiveFile (data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'WRITE_FILE_ARCHIVES', data }, (response) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
        if (response?.error) return reject(new Error(response.error))
        if (!response || response.success !== true) return reject(new Error('WRITE_FILE_ARCHIVES did not return success'))
        resolve()
      })
    })
  }
}
