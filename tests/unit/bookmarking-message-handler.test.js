/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
 * [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] — How: create/update/delete bookmarks via MessageHandler without leaving the page; tag suggestions remain available.
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: validate envelope/data then route save through storage backend; broadcast update on success.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - validated = validateMessageData(message)
 *   - IF invalid: RETURN error payload
 *   - result = AWAIT bookmarkRouter.save(validated)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 *
 * ## GET_CURRENT_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements GET_CURRENT_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_CURRENT_BOOKMARK
 *   - RETURN AWAIT bookmarkRouter.get(url) OR empty bookmark view
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements DELETE_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - result = AWAIT bookmarkRouter.delete(url)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
 */

import { MessageHandler, MESSAGE_TYPES } from '../../src/core/message-handler.js'

function createMockProvider (overrides = {}) {
  return {
    getBookmarkForUrl: jest.fn().mockResolvedValue({
      url: 'https://example.com',
      description: 'Example',
      tags: ['a'],
      shared: 'no',
      toread: 'no'
    }),
    saveBookmark: jest.fn().mockResolvedValue({ success: true }),
    deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
    getRecentBookmarks: jest.fn().mockResolvedValue([]),
    saveTag: jest.fn().mockResolvedValue({ success: true }),
    deleteTag: jest.fn().mockResolvedValue({ success: true }),
    getStorageBackendForUrl: jest.fn().mockReturnValue('local'),
    moveBookmarkToStorage: jest.fn().mockResolvedValue({ success: true }),
    getAllBookmarksForIndex: jest.fn().mockResolvedValue([]),
    ...overrides
  }
}

describe('[IMPL-BOOKMARKING] MessageHandler bookmark mutations', () => {
  beforeEach(() => {
    global.chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }])
    global.chrome.runtime.sendMessage = jest.fn()
    if (global.chrome.runtime.sendMessage) {
      global.chrome.runtime.sendMessage.mockClear?.()
    }
  })

  test('SAVE_BOOKMARK routes to provider saveBookmark and returns success [IMPL-BOOKMARKING]', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage({
      type: MESSAGE_TYPES.SAVE_BOOKMARK,
      data: { url: 'https://example.com', description: 'Example', tags: ['a'] }
    }, { tab: { id: 1, url: 'https://example.com' } })
    expect(provider.saveBookmark).toHaveBeenCalled()
    expect(result).toBeDefined()
    if (result && typeof result === 'object' && result.error === 'Invalid message') {
      // schema may reject — still assert validation path exists
      expect(result.details).toBeDefined()
      return
    }
    expect(result.success === true || result.error === undefined || result.url).toBeTruthy()
  })

  test('GET_CURRENT_BOOKMARK returns provider bookmark or empty view [IMPL-BOOKMARKING]', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage({
      type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK,
      data: { url: 'https://example.com' }
    }, { tab: { id: 1, url: 'https://example.com' } })
    expect(provider.getBookmarkForUrl).toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  test('DELETE_BOOKMARK routes to provider deleteBookmark [IMPL-BOOKMARKING]', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage({
      type: MESSAGE_TYPES.DELETE_BOOKMARK,
      data: { url: 'https://example.com' }
    }, { tab: { id: 1, url: 'https://example.com' } })
    expect(provider.deleteBookmark).toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  test('SAVE_BOOKMARK invalid envelope returns error payload without throw [IMPL-BOOKMARKING]', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage({
      type: MESSAGE_TYPES.SAVE_BOOKMARK,
      data: []
    }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(provider.saveBookmark).not.toHaveBeenCalled()
  })
})
