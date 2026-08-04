/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [IMPL-BOOKMARK_ROUTER] [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-STORAGE_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-RELIABILITY] How: Connects selected-bookmark regex replacement to preferred-backend router persistence and storage-index refresh.
 * Contract:
 *   INPUT: selected URLs, bookmark map, regex options, router save operation
 *   PRE: selected URLs and replacement options are available
 *   OUTPUT: refreshed bookmark rows with unchanged selections restored
 *   POST:
 *     success => only changed payloads are sent to the router and the display is reloaded
 *   FAILURE_MODES: InvalidPattern, BookmarkSaveFailed
 *   DATA: selected URL set and displayed bookmark rows
 *   DATA_TRANSITION: changed rows are persisted; selection is cleared during reload and restored for visible URLs
 *   EFFECTS: Async, IO, State
 *   TERMINATION: total
 * PROCEDURE: ROUTER_STORAGE_REGEX_SAVE
 *   Build replacement payload for each selected URL
 *   IF replacement is unchanged: skip router save
 *   AWAIT router save for each changed payload
 *   Reload bookmark rows
 *   Restore visible selections
 *
 * Pattern: ROUTER_STORAGE
 * Composition: index regex transformation -> saveBookmark payload ->
 * BookmarkRouter preferred backend -> LocalBookmarkService. No UI invocation.
 */

import { applyRegexReplace } from '../../src/ui/bookmarks-table/bookmarks-table-filter.js'
import { StorageIndex } from '../../src/features/storage/storage-index.js'
import { BookmarkRouter } from '../../src/features/storage/bookmark-router.js'

function providerStub () {
  return {
    getBookmarkForUrl: jest.fn().mockResolvedValue(null),
    saveBookmark: jest.fn().mockResolvedValue({ success: true }),
    deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
    getRecentBookmarks: jest.fn().mockResolvedValue([]),
    saveTag: jest.fn().mockResolvedValue({ success: true }),
    deleteTag: jest.fn().mockResolvedValue({ success: true }),
    getAllBookmarks: jest.fn().mockResolvedValue([])
  }
}

describe('[IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] router storage composition', () => {
  let localStorage
  let indexStorage

  beforeEach(() => {
    localStorage = {}
    indexStorage = {}
    global.chrome.storage.local.get.mockImplementation(async (keys) => {
      const key = typeof keys === 'object' && !Array.isArray(keys)
        ? Object.keys(keys)[0]
        : (Array.isArray(keys) ? keys[0] : keys)
      if (key === 'hoverboard_local_bookmarks') return { hoverboard_local_bookmarks: { ...localStorage } }
      if (key === 'hoverboard_storage_index') return { hoverboard_storage_index: { ...indexStorage } }
      return {}
    })
    global.chrome.storage.local.set.mockImplementation((obj) => {
      if (obj.hoverboard_local_bookmarks !== undefined) {
        localStorage = { ...obj.hoverboard_local_bookmarks }
      }
      if (obj.hoverboard_storage_index !== undefined) {
        indexStorage = { ...obj.hoverboard_storage_index }
      }
      return Promise.resolve()
    })
  })

  test('changed regex payload is persisted through the preferred local router', async () => {
    const local = providerStub()
    const index = new StorageIndex()
    const router = new BookmarkRouter(
      providerStub(),
      local,
      providerStub(),
      providerStub(),
      index,
      () => Promise.resolve('local')
    )

    const original = {
      url: 'https://example.com/old',
      description: 'Old title',
      tags: ['old'],
      extended: '',
      storage: 'local'
    }
    const replacement = applyRegexReplace(original, 'old', 'new', {
      title: true,
      url: true,
      tags: true
    })

    expect(replacement.error).toBeNull()
    expect(replacement.changed).toBe(true)
    const result = await router.saveBookmark(replacement.payload)

    expect(result.success).toBe(true)
    expect(local.saveBookmark).toHaveBeenCalledWith(replacement.payload)
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
      hoverboard_storage_index: { 'https://example.com/new': 'local' }
    })
  })
})
