/**
 * Unit tests for FileBookmarkService - [REQ-FILE_BOOKMARK_STORAGE] [IMPL-FILE_BOOKMARK_SERVICE]
 * Validates file-based bookmark provider with mocked adapter (in-memory).
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
import { FileBookmarkService } from '../../src/features/storage/file-bookmark-service.js'
import { InMemoryFileBookmarkAdapter, FILE_FORMAT_VERSION } from '../../src/features/storage/file-bookmark-storage-adapter.js'

describe('FileBookmarkService [REQ-FILE_BOOKMARK_STORAGE] [IMPL-FILE_BOOKMARK_SERVICE]', () => {
  let service
  let adapter
  let mockTagService

  beforeEach(() => {
    adapter = new InMemoryFileBookmarkAdapter()
    mockTagService = {
      sanitizeTag: (t) => (t && t.trim ? t.trim() : t),
      handleTagAddition: jest.fn().mockResolvedValue(undefined)
    }
    service = new FileBookmarkService(adapter, mockTagService)
  })

  describe('getBookmarkForUrl', () => {
    test('returns empty bookmark when URL not in file [REQ-FILE_BOOKMARK_STORAGE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      const result = await service.getBookmarkForUrl('https://example.com/foo', 'Example')
      expect(result).toMatchObject({
        url: 'https://example.com/foo',
        description: 'Example',
        extended: '',
        tags: [],
        time: '',
        updated_at: '',
        shared: 'yes',
        toread: 'no'
      })
      expect(result.hash).toBe('')
    })

    test('returns normalized bookmark when URL exists [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/page': {
            url: 'https://example.com/page',
            description: 'My Title',
            extended: 'notes',
            tags: ['a', 'b'],
            time: '2026-02-14T12:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'file-abc'
          }
        }
      })
      const result = await service.getBookmarkForUrl('https://example.com/page')
      expect(result).toMatchObject({
        url: 'https://example.com/page',
        description: 'My Title',
        extended: 'notes',
        tags: ['a', 'b'],
        time: '2026-02-14T12:00:00.000Z',
        shared: 'yes',
        toread: 'no',
        hash: 'file-abc'
      })
      expect(result.updated_at).toBe('2026-02-14T12:00:00.000Z')
    })

    test('legacy bookmark without updated_at normalizes updated_at to time [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/legacy': {
            url: 'https://example.com/legacy',
            description: 'Legacy',
            tags: [],
            time: '2026-02-10T08:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'h'
          }
        }
      })
      const result = await service.getBookmarkForUrl('https://example.com/legacy')
      expect(result.time).toBe('2026-02-10T08:00:00.000Z')
      expect(result.updated_at).toBe('2026-02-10T08:00:00.000Z')
    })

    test('normalizes URL (trim trailing slash) [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/path': {
            url: 'https://example.com/path',
            description: 'X',
            tags: [],
            time: '2026-02-14T12:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'h'
          }
        }
      })
      const result = await service.getBookmarkForUrl('https://example.com/path/')
      expect(result.url).toBe('https://example.com/path')
      expect(result.description).toBe('X')
    })
  })

  describe('saveBookmark', () => {
    test('saves new bookmark and returns success [REQ-FILE_BOOKMARK_STORAGE] [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      const result = await service.saveBookmark({
        url: 'https://example.com/new',
        description: 'New Page',
        tags: ['tag1']
      })
      expect(result).toEqual({ success: true, code: 'done', message: 'Operation completed' })

      const data = await adapter.readBookmarksFile()
      expect(data.bookmarks['https://example.com/new']).toBeDefined()
      expect(data.bookmarks['https://example.com/new'].description).toBe('New Page')
      expect(data.bookmarks['https://example.com/new'].tags).toEqual(['tag1'])
      expect(data.bookmarks['https://example.com/new'].time).toBeDefined()
      expect(data.bookmarks['https://example.com/new'].updated_at).toBeDefined()
      expect(data.bookmarks['https://example.com/new'].time).toBe(data.bookmarks['https://example.com/new'].updated_at)
      expect(data.bookmarks['https://example.com/new'].hash).toMatch(/^file-/)
    })

    test('rejects when URL is missing [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const result = await service.saveBookmark({ description: 'No URL' })
      expect(result).toEqual({ success: false, code: 'invalid', message: 'URL is required' })
    })

    test('updates existing bookmark [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await service.saveBookmark({
        url: 'https://example.com/update',
        description: 'First',
        tags: ['a']
      })
      await service.saveBookmark({
        url: 'https://example.com/update',
        description: 'Second',
        tags: ['a', 'b']
      })
      const b = await service.getBookmarkForUrl('https://example.com/update')
      expect(b.description).toBe('Second')
      expect(b.tags).toEqual(['a', 'b'])
    })

    test('update preserves create time and sets new updated_at [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      await service.saveBookmark({ url: 'https://example.com/ut', description: 'First', tags: [] })
      const afterFirst = await service.getBookmarkForUrl('https://example.com/ut')
      const createTime = afterFirst.time
      expect(createTime).toBeTruthy()
      expect(afterFirst.updated_at).toBe(createTime)
      await new Promise(r => setTimeout(r, 5))
      await service.saveBookmark({ url: 'https://example.com/ut', description: 'Second', tags: ['x'] })
      const afterSecond = await service.getBookmarkForUrl('https://example.com/ut')
      expect(afterSecond.time).toBe(createTime)
      expect(afterSecond.updated_at).toBeTruthy()
      expect(afterSecond.updated_at).not.toBe(createTime)
    })

    test('create with payload time/updated_at preserves them [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      const time = '2024-06-15T10:00:00.000Z'
      const updatedAt = '2024-06-16T11:00:00.000Z'
      await service.saveBookmark({
        url: 'https://example.com/import-times',
        description: 'Imported',
        tags: [],
        time,
        updated_at: updatedAt
      })
      const b = await service.getBookmarkForUrl('https://example.com/import-times')
      expect(b.time).toBe(time)
      expect(b.updated_at).toBe(updatedAt)
    })
  })

  describe('deleteBookmark', () => {
    test('removes bookmark and returns success [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      await service.saveBookmark({ url: 'https://example.com/del', description: 'To delete' })
      const result = await service.deleteBookmark('https://example.com/del')
      expect(result).toEqual({ success: true, code: 'done', message: 'Operation completed' })
      const b = await service.getBookmarkForUrl('https://example.com/del')
      expect(b.time).toBe('')
      expect(b.description).toBe('')
    })

    test('idempotent when URL not found [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const result = await service.deleteBookmark('https://example.com/nonexistent')
      expect(result).toEqual({ success: true, code: 'done', message: 'Operation completed' })
    })
  })

  describe('getRecentBookmarks', () => {
    test('returns list sorted by time descending [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/old': { url: 'https://example.com/old', description: 'Old', tags: [], time: '2026-02-14T10:00:00.000Z', updated_at: '2026-02-14T10:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-o' },
          'https://example.com/new': { url: 'https://example.com/new', description: 'New', tags: [], time: '2026-02-14T12:00:00.000Z', updated_at: '2026-02-14T12:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-n' }
        }
      })
      const list = await service.getRecentBookmarks(10)
      expect(list.length).toBe(2)
      expect(list[0].url).toBe('https://example.com/new')
      expect(list[1].url).toBe('https://example.com/old')
    })

    test('respects count limit [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      for (let i = 0; i < 5; i++) {
        await service.saveBookmark({
          url: `https://example.com/page${i}`,
          description: `Page ${i}`,
          time: `2026-02-14T${10 + i}:00:00.000Z`
        })
      }
      const list = await service.getRecentBookmarks(2)
      expect(list.length).toBe(2)
    })

    test('returns empty array when file empty [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const list = await service.getRecentBookmarks(15)
      expect(list).toEqual([])
    })
  })

  describe('saveTag and deleteTag', () => {
    test('saveTag adds tag and persists [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      await service.saveBookmark({ url: 'https://example.com/t', description: 'T', tags: [] })
      await service.saveTag({ url: 'https://example.com/t', value: 'newtag' })
      const b = await service.getBookmarkForUrl('https://example.com/t')
      expect(b.tags).toContain('newtag')
    })

    test('deleteTag removes tag [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await service.saveBookmark({ url: 'https://example.com/t2', description: 'T2', tags: ['x', 'y'] })
      await service.deleteTag({ url: 'https://example.com/t2', value: 'x' })
      const b = await service.getBookmarkForUrl('https://example.com/t2')
      expect(b.tags).toEqual(['y'])
    })
  })

  describe('edge cases', () => {
    test('handles empty file (adapter returns empty bookmarks) [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const b = await service.getBookmarkForUrl('https://any.com')
      expect(b.url).toBe('https://any.com')
      expect(b.tags).toEqual([])
    })

    test('handles tags as space-separated string in stored data [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/str': {
            url: 'https://example.com/str',
            description: 'S',
            tags: 'foo bar',
            time: '2026-02-14T12:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'h'
          }
        }
      })
      const b = await service.getBookmarkForUrl('https://example.com/str')
      expect(b.tags).toEqual(['foo', 'bar'])
    })

    test('testConnection returns true when adapter read succeeds [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      const ok = await service.testConnection()
      expect(ok).toBe(true)
    })
  })

  describe('getAllBookmarks', () => {
    test('returns full list sorted by time descending [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/a': { url: 'https://example.com/a', description: 'A', tags: [], time: '2026-02-14T09:00:00.000Z', updated_at: '2026-02-14T09:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-a' },
          'https://example.com/b': { url: 'https://example.com/b', description: 'B', tags: [], time: '2026-02-14T11:00:00.000Z', updated_at: '2026-02-14T11:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-b' }
        }
      })
      const list = await service.getAllBookmarks()
      expect(list.length).toBe(2)
      expect(list[0].url).toBe('https://example.com/b')
      expect(list[1].url).toBe('https://example.com/a')
    })
  })
})
