/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING_UI ===
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING] — Block 1: Surface 1 – This Page inline usage section. REQ: UI display of usage; ARCH: three surfaces; IMPL: popup/panel fetch and render.
 * 
 * ## MAIN
 * 
 * - 1c. Else: hide usageStatsSection. [REQ-BOOKMARK_USAGE_TRACKING] satisfaction: UI can query and display. How: 2d. Sort comparator: add visits (numeric), lastVisited (string compare).  display and sort.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Block 2: Surface 2 – Index table Visits and Last Visited columns. ARCH: Index columns; IMPL: merge usage, render, sort.
 *   - How (sub-block): 2a. On load: after getAggregatedBookmarksForIndex, send getBookmarkUsage() (no url) to get all usage array.
 *   - How (sub-block): 2b. Build map url -> usage; for each bookmark b, set b.visits = map[b.url]?.visitCount ?? 0, b.lastVisited = map[b.url]?.lastVisitedAt ?? ''.
 *   - How (sub-block): 2c. renderTableBody: for each row add <td class="col-visits"> and <td class="col-last-visited">; lastVisited uses timeDisplayMode (absolute/age).
 *   - How (sub-block): Block 3: Surface 3 – Usage side-panel tab. ARCH: Usage tab; IMPL: initUsageTab, fetch stats and graph, render.
 *   - How (sub-block): 3a. Tab state: TAB_USAGE = 'usage'; TAB_IDS include it; getVisibilityForTab returns usageVisible for activeTab === TAB_USAGE.
 *   - How (sub-block): 3b. initUsageTab(): send getBookmarkUsageStats({ n: 10 }), getBookmarkNavigationGraph(); render Most Visited list (mostFrequent), Recently Visited list (mostRecent), Navigation Graph (edges grouped by sourceUrl).
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING_UI ===
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
