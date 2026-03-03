/**
 * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Unit tests: mergeUsageIntoBookmarks (merge usage array into bookmarks for Index table Visits/Last Visited columns).
 */

import { mergeUsageIntoBookmarks } from '../../src/ui/bookmarks-table/bookmarks-table-filter.js'

describe('[REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] mergeUsageIntoBookmarks', () => {
  // [ARCH-BOOKMARK_USAGE_TRACKING_UI] Surface 2: merge usage by URL; bookmarks get .visits and .lastVisited
  test('merges usage into bookmarks by URL and sets visits and lastVisited', () => {
    const bookmarks = [
      { url: 'https://example.com/a', description: 'A' },
      { url: 'https://example.com/b', description: 'B' }
    ]
    const usageArray = [
      { url: 'https://example.com/a', visitCount: 5, lastVisitedAt: '2026-03-03T12:00:00.000Z' },
      { url: 'https://example.com/b', visitCount: 2, lastVisitedAt: '2026-03-02T10:00:00.000Z' }
    ]
    const result = mergeUsageIntoBookmarks(bookmarks, usageArray)
    expect(result).toHaveLength(2)
    expect(result[0].visits).toBe(5)
    expect(result[0].lastVisited).toBe('2026-03-03T12:00:00.000Z')
    expect(result[1].visits).toBe(2)
    expect(result[1].lastVisited).toBe('2026-03-02T10:00:00.000Z')
  })

  test('normalizes URL (trim, strip trailing slash) when matching', () => {
    const bookmarks = [{ url: 'https://example.com/page/', description: 'Page' }]
    const usageArray = [{ url: 'https://example.com/page', visitCount: 3, lastVisitedAt: '2026-03-01T00:00:00.000Z' }]
    const result = mergeUsageIntoBookmarks(bookmarks, usageArray)
    expect(result[0].visits).toBe(3)
    expect(result[0].lastVisited).toBe('2026-03-01T00:00:00.000Z')
  })

  test('sets visits 0 and lastVisited empty when bookmark has no usage', () => {
    const bookmarks = [{ url: 'https://example.com/none', description: 'None' }]
    const usageArray = []
    const result = mergeUsageIntoBookmarks(bookmarks, usageArray)
    expect(result[0].visits).toBe(0)
    expect(result[0].lastVisited).toBe('')
  })

  test('handles empty bookmarks array', () => {
    const result = mergeUsageIntoBookmarks([], [{ url: 'https://a.com', visitCount: 1, lastVisitedAt: '2026-03-03T00:00:00.000Z' }])
    expect(result).toEqual([])
  })

  test('handles null or undefined usageArray', () => {
    const bookmarks = [{ url: 'https://example.com/x', description: 'X' }]
    expect(mergeUsageIntoBookmarks(bookmarks, null)[0].visits).toBe(0)
    expect(mergeUsageIntoBookmarks(bookmarks, undefined)[0].visits).toBe(0)
  })

  test('preserves all original bookmark fields', () => {
    const bookmarks = [{ url: 'https://example.com/u', description: 'Title', tags: ['a'], storage: 'local' }]
    const usageArray = [{ url: 'https://example.com/u', visitCount: 1, lastVisitedAt: '2026-03-03T00:00:00.000Z' }]
    const result = mergeUsageIntoBookmarks(bookmarks, usageArray)
    expect(result[0].description).toBe('Title')
    expect(result[0].tags).toEqual(['a'])
    expect(result[0].storage).toBe('local')
    expect(result[0].visits).toBe(1)
    expect(result[0].lastVisited).toBe('2026-03-03T00:00:00.000Z')
  })
})
