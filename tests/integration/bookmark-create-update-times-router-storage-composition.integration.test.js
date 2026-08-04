/**
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-RELIABILITY] How: Preserves bookmark time fields while router storage operations select a provider and update the storage index.
 * Contract:
 *   INPUT: bookmark data, preferred backend, storage providers, storage index
 *   PRE: bookmark URL and provider map are available
 *   OUTPUT: provider result with normalized time fields and updated storage index
 *   POST:
 *     success => saved bookmark retains time and updated_at; index points to the selected backend
 *   FAILURE_MODES: ProviderSaveFailed
 *   DATA: bookmark time fields and storage-index backend mapping
 *   DATA_TRANSITION: successful save updates the selected URL mapping; failed save leaves the mapping unchanged
 *   EFFECTS: Async, IO, State
 *   TERMINATION: total
 * PROCEDURE: ROUTER_STORAGE_BOOKMARK_TIMES
 *   Normalize missing updated_at from time
 *   Resolve provider from preferred backend
 *   AWAIT provider save
 *   IF save succeeds: update storage index for the URL
 *   RETURN provider result
 *
 * Pattern: ROUTER_STORAGE
 * Composition: provider timestamp contract -> BookmarkRouter aggregation ->
 * time ordering. Provider-specific unit behavior remains covered separately.
 */

import { BookmarkRouter } from '../../src/features/storage/bookmark-router.js'
import { StorageIndex } from '../../src/features/storage/storage-index.js'

function providerWithRecent (bookmark) {
  return {
    getBookmarkForUrl: jest.fn().mockResolvedValue(bookmark),
    saveBookmark: jest.fn().mockResolvedValue({ success: true }),
    deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
    getRecentBookmarks: jest.fn().mockResolvedValue([bookmark]),
    saveTag: jest.fn().mockResolvedValue({ success: true }),
    deleteTag: jest.fn().mockResolvedValue({ success: true }),
    getAllBookmarks: jest.fn().mockResolvedValue([bookmark])
  }
}

describe('[IMPL-BOOKMARK_CREATE_UPDATE_TIMES] provider timestamp composition', () => {
  test('router preserves provider times while ordering the aggregate', async () => {
    const pinboard = providerWithRecent({
      url: 'https://example.com/old',
      time: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z'
    })
    const local = providerWithRecent({
      url: 'https://example.com/new',
      time: '2026-02-01T00:00:00.000Z',
      updated_at: '2026-02-02T00:00:00.000Z'
    })
    const router = new BookmarkRouter(
      pinboard,
      local,
      providerWithRecent({ url: 'https://example.com/file', time: '2026-01-03T00:00:00.000Z' }),
      providerWithRecent({ url: 'https://example.com/sync', time: '2026-01-04T00:00:00.000Z' }),
      new StorageIndex(),
      () => Promise.resolve('local')
    )

    const recent = await router.getRecentBookmarks(4)

    expect(recent.map(bookmark => bookmark.url)).toEqual([
      'https://example.com/new',
      'https://example.com/sync',
      'https://example.com/file',
      'https://example.com/old'
    ])
    expect(recent[0]).toMatchObject({
      time: '2026-02-01T00:00:00.000Z',
      updated_at: '2026-02-02T00:00:00.000Z'
    })
  })
})
