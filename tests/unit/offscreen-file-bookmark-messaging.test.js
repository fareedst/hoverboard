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
/**
 * === IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] — Central message allowlist + validation + handler dispatch; recent-tag message types delegate to [IMPL-TAG_SYSTEM] TagService and SW recentTagsMemory policy per ARCH-TAG_SYSTEM. Contract: Promise result or reject on validation; recent handlers return safe shapes on internal failure.
 * 
 * ## SEND
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: client-side validate type/payload; dispatch to background; return Promise (path for popup/content/offscreen callers).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SEND
 *   - VALIDATE message.type in allowlist
 *   - VALIDATE payload shape
 *   - ROUTE to handler for message.type
 *   - handler(message) -> result; RETURN Promise.resolve(result)
 *   - ON error: RETURN Promise.reject; optional log
 * 
 * ## UNWRAP_MESSAGE_RESPONSE
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-UI_INSPECTION] How: shared null-tolerant unwrap for runtime replies (src/shared/message-response.js), because any extension context can win the response-channel race and answer null (Chrome 144+ promise-returning listeners / observer listeners that return promises). Callers must not dereference response.success. Observer BOOKMARK_UPDATED paths are IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL and IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH.
 * - Contract:
 *   - INPUT: response from runtime.sendMessage — { success, data } wrapper, plain payload, or null/undefined missing response; optional type + surface for readMessageResponse
 *   - PRE: caller awaited the send and handled thrown transport errors separately
 *   - OUTPUT: unwrapMessageResponse -> payload | null; isMissingMessageResponse -> boolean; readMessageResponse -> payload | null (records messageResponseMissing when missing)
 *   - POST:
 *     - success => wrapper returns response.data; non-wrapper object returns response as-is
 *     - missing response => returns null; readMessageResponse records messageResponseMissing; caller keeps defaults
 *   - FAILURE_MODES: none (total, no throw)
 *   - DATA: src/shared/message-response.js; callers in content-main (getTabId, getOptions, getCurrentBookmark)
 *   - EFFECTS: pure for unwrap/isMissing; State when readMessageResponse records inspector action
 *   - TERMINATION: total
 * - PROCEDURE: UNWRAP_MESSAGE_RESPONSE
 *   - IF isMissingMessageResponse(response): RETURN null
 *   - IF response is object AND 'success' in response: RETURN response.success ? response.data : response
 *   - RETURN response
 *   - How (sub-block): caller guard — missing response is observable, never a crash.
 *   - 1. CALLER: actual = readMessageResponse(response, type[, surface])
 *   - 2.   # readMessageResponse = unwrap + IF missing: recordAction messageResponseMissing; debugWarn
 *   - 3.   IF actual == null: KEEP defaults; RETURN
 * 
 * ## HANDLE_GET_RECENT_BOOKMARKS
 * 
 * - How: SW entry resolves handler by message.type; missing handler → reject or structured error per router; AWAIT handler(data, senderUrl); optional BOOKMARK_UPDATED broadcast after mutating handlers ([REQ-BOOKMARK_STATE_SYNCHRONIZATION]).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_RECENT_BOOKMARKS
 *   - recentTags = AWAIT tagService.getUserRecentTagsExcludingCurrent(data?.currentTags OR [])
 *   - RETURN { ...data, recentTags }
 *   - How (sub-block): How: addTagToRecent — validate tagName + currentSiteUrl; tagService.addTagToUserRecentList; structured { success } / error (same REQ/ARCH/IMPL cross-IMPL set as handleGetRecentBookmarks).
 * 
 * ## HANDLE_ADD_TAG_TO_RECENT
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleAddTagToRecent(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ADD_TAG_TO_RECENT
 *   - VALIDATE tagName AND currentSiteUrl present
 *   - success = AWAIT tagService.addTagToUserRecentList(tagName, currentSiteUrl)
 *   - RETURN { success } OR { success: false, error: message }
 *   - How (sub-block): How: getUserRecentTags message — raw policy list for diagnostics/tools; TRY/CATCH → { recentTags: [], error } on failure.
 * 
 * ## HANDLE_GET_USER_RECENT_TAGS
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleGetUserRecentTags(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_USER_RECENT_TAGS
 *   - TRY: RETURN { recentTags: AWAIT tagService.getUserRecentTags() }
 *   - CATCH: LOG; RETURN { recentTags: [], error }
 * 
 * ## BLOCK_5
 * 
 * - --- Composition: composed_with [IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-BOOKMARK_STATE_SYNC] --- How: Ordering: client send may apply timeout/retry () before this IMPL’s send completes. Post successful bookmark mutations,  may broadcast; recent-tag handlers are read/mutation for user-recent only unless caller chains. Shared DATA: single MessageHandler TagService reference; no second recentTagsMemory writer.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_5
 *   - How (sub-block): --- Cross-IMPL ---
 * 
 * === END IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 */
import { handleOffscreenMessage } from '../../src/offscreen/file-bookmark-io.js'

describe('[IMPL-FILE_BOOKMARK_SERVICE] Offscreen READ_FILE_BOOKMARKS contract', () => {
  test('returns { error: null, data: { version, bookmarks } } when handle and read succeed', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe(null)
      expect(r.data).toBeDefined()
      expect(r.data).toHaveProperty('version')
      expect(r.data).toHaveProperty('bookmarks')
      expect(typeof r.data.bookmarks).toBe('object')
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({ version: 1, bookmarks: {} }),
      writeFile: () => Promise.resolve()
    }
    const result = handleOffscreenMessage({ type: 'READ_FILE_BOOKMARKS' }, sendResponse, io)
    expect(result).toBe(true)
  })

  test('returns { error: "NO_HANDLE", data: null } when no handle', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe('NO_HANDLE')
      expect(r.data).toBe(null)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve(null),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    }
    handleOffscreenMessage({ type: 'READ_FILE_BOOKMARKS' }, sendResponse, io)
  })

  test('returns { error: string, data: null } on read failure', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBeDefined()
      expect(typeof r.error).toBe('string')
      expect(r.data).toBe(null)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.reject(new Error('READ_FAILED')),
      writeFile: () => Promise.resolve()
    }
    handleOffscreenMessage({ type: 'READ_FILE_BOOKMARKS' }, sendResponse, io)
  })
})

describe('[IMPL-FILE_BOOKMARK_SERVICE] Offscreen WRITE_FILE_BOOKMARKS contract', () => {
  test('returns { error: null, success: true } when handle and write succeed', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe(null)
      expect(r.success).toBe(true)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    }
    const result = handleOffscreenMessage({ type: 'WRITE_FILE_BOOKMARKS', data: { bookmarks: {} } }, sendResponse, io)
    expect(result).toBe(true)
  })

  test('returns { error: "NO_HANDLE", success: false } when no handle', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe('NO_HANDLE')
      expect(r.success).toBe(false)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve(null),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    }
    handleOffscreenMessage({ type: 'WRITE_FILE_BOOKMARKS' }, sendResponse, io)
  })

  test('returns { error: string, success: false } on write failure', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBeDefined()
      expect(r.success).toBe(false)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.reject(new Error('WRITE_FAILED'))
    }
    handleOffscreenMessage({ type: 'WRITE_FILE_BOOKMARKS' }, sendResponse, io)
  })
})

describe('[IMPL-FILE_BOOKMARK_SERVICE] Offscreen unknown type', () => {
  test('returns false for unknown message type (no sendResponse)', () => {
    const sendResponse = jest.fn()
    const result = handleOffscreenMessage({ type: 'UNKNOWN_TYPE' }, sendResponse, {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    })
    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })
})

describe('[IMPL-PAGE_ARCHIVE_STORAGE] Offscreen page archive file contract', () => {
  test('reads and writes the sibling archive artifact file', (done) => {
    const readFile = jest.fn().mockResolvedValue({ version: 1, archives: { 'https://example.com': { textContent: 'x' } }, screenshots: {} })
    const writeFile = jest.fn().mockResolvedValue(undefined)
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile,
      writeFile
    }
    handleOffscreenMessage({ type: 'READ_FILE_ARCHIVES' }, (response) => {
      expect(response.error).toBe(null)
      expect(response.data.archives['https://example.com']).toBeDefined()
      expect(readFile).toHaveBeenCalledWith({}, expect.any(String))
      handleOffscreenMessage({ type: 'WRITE_FILE_ARCHIVES', data: { version: 1, archives: {}, screenshots: {} } }, (writeResponse) => {
        expect(writeResponse).toEqual({ error: null, success: true })
        expect(writeFile).toHaveBeenCalledWith({}, expect.any(Object), expect.any(String))
        done()
      }, io)
    }, io)
  })
})
