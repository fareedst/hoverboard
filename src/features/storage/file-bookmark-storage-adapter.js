/**
 * File Bookmark Storage Adapter - [IMPL-FILE_BOOKMARK_SERVICE]
 * Abstraction for reading/writing the file-based bookmarks store.
 * Enables unit tests with in-memory implementation; real adapter uses File System Access in document context.
 *
 * [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE]
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
}

/**
 * [IMPL-FILE_BOOKMARK_SERVICE] In-memory adapter for tests (and optional default when no directory set).
 * DEBUG: Used by unit tests and when no file directory is configured.
 */
export class InMemoryFileBookmarkAdapter extends FileBookmarkStorageAdapter {
  constructor () {
    super()
    this._data = DEFAULT_FILE_DATA()
  }

  async readBookmarksFile () {
    return { ...this._data, bookmarks: { ...this._data.bookmarks } }
  }

  async writeBookmarksFile (data) {
    if (data && typeof data.version === 'number' && typeof data.bookmarks === 'object') {
      this._data = { version: data.version, bookmarks: { ...data.bookmarks } }
    }
  }
}

export { FILE_FORMAT_VERSION, DEFAULT_FILE_DATA }
