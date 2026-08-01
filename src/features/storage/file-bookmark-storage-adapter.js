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
const FILE_FORMAT_VERSION = 1
const DEFAULT_FILE_DATA = () => ({ version: FILE_FORMAT_VERSION, bookmarks: {} })

/**
 * [IMPL-FILE_BOOKMARK_SERVICE] Adapter interface.
 * Implementations must provide:
 * - readBookmarksFile() -> Promise<{ version: number, bookmarks: Object }>
 * - writeBookmarksFile(data: { version, bookmarks }) -> Promise<void>
 */
export class FileBookmarkStorageAdapter {
  async readBookmarksFile () {
    throw new Error('readBookmarksFile must be implemented')
  }

  async writeBookmarksFile (_data) {
    throw new Error('writeBookmarksFile must be implemented')
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Optional sibling archive file contract. Bookmark providers remain compatible when unsupported.
   */
  async readArchiveFile () {
    throw new Error('readArchiveFile must be implemented by archive-capable file adapters')
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Optional sibling archive file contract for readable and screenshot artifacts.
   */
  async writeArchiveFile (_data) {
    throw new Error('writeArchiveFile must be implemented by archive-capable file adapters')
  }
}

/**
 * [IMPL-FILE_BOOKMARK_SERVICE] In-memory adapter for tests (and optional default when no directory set).
 * DEBUG: Used by unit tests and when no file directory is configured.
 */
export class InMemoryFileBookmarkAdapter extends FileBookmarkStorageAdapter {
  constructor () {
    super()
    this._data = DEFAULT_FILE_DATA()
    // [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
    // Test/default File provider keeps archive artifacts in a separate in-memory collection.
    this._archiveData = { version: 1, archives: {}, screenshots: {} }
  }

  async readBookmarksFile () {
    return { ...this._data, bookmarks: { ...this._data.bookmarks } }
  }

  async writeBookmarksFile (data) {
    if (data && typeof data.version === 'number' && typeof data.bookmarks === 'object') {
      this._data = { version: data.version, bookmarks: { ...data.bookmarks } }
    }
  }

  async readArchiveFile () {
    return JSON.parse(JSON.stringify(this._archiveData))
  }

  async writeArchiveFile (data) {
    this._archiveData = JSON.parse(JSON.stringify({
      version: data?.version || 1,
      archives: data?.archives || {},
      screenshots: data?.screenshots || {}
    }))
  }
}

export { FILE_FORMAT_VERSION, DEFAULT_FILE_DATA }
