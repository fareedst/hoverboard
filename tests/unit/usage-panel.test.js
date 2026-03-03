/**
 * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Unit tests: buildMostVisitedList, buildRecentlyVisitedList, buildNavigationGraphGroups for Usage tab.
 */

import {
  buildMostVisitedList,
  buildRecentlyVisitedList,
  buildNavigationGraphGroups
} from '../../src/ui/side-panel/usage-panel.js'

describe('[REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] buildMostVisitedList', () => {
  test('returns array of items with url, visitCount, lastVisitedAt from stats.mostFrequent', () => {
    const stats = {
      mostFrequent: [
        { url: 'https://example.com/a', visitCount: 10, lastVisitedAt: '2026-03-03T12:00:00.000Z' },
        { url: 'https://example.com/b', visitCount: 5, lastVisitedAt: '2026-03-02T10:00:00.000Z' }
      ]
    }
    const result = buildMostVisitedList(stats)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ url: 'https://example.com/a', visitCount: 10, lastVisitedAt: '2026-03-03T12:00:00.000Z' })
    expect(result[1]).toEqual({ url: 'https://example.com/b', visitCount: 5, lastVisitedAt: '2026-03-02T10:00:00.000Z' })
  })

  test('returns empty array when stats is null or missing mostFrequent', () => {
    expect(buildMostVisitedList(null)).toEqual([])
    expect(buildMostVisitedList({})).toEqual([])
    expect(buildMostVisitedList({ mostRecent: [] })).toEqual([])
  })
})

describe('[REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] buildRecentlyVisitedList', () => {
  test('returns array of items from stats.mostRecent', () => {
    const stats = {
      mostRecent: [
        { url: 'https://example.com/new', visitCount: 1, lastVisitedAt: '2026-03-03T14:00:00.000Z' }
      ]
    }
    const result = buildRecentlyVisitedList(stats)
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('https://example.com/new')
    expect(result[0].visitCount).toBe(1)
  })

  test('returns empty array when stats is null or missing mostRecent', () => {
    expect(buildRecentlyVisitedList(null)).toEqual([])
    expect(buildRecentlyVisitedList({ mostFrequent: [] })).toEqual([])
  })
})

describe('[REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] buildNavigationGraphGroups', () => {
  test('groups edges by sourceUrl and sorts groups by total count descending', () => {
    const edges = [
      { sourceUrl: 'https://a.com', targetUrl: 'https://b.com', count: 5 },
      { sourceUrl: 'https://a.com', targetUrl: 'https://c.com', count: 3 },
      { sourceUrl: 'https://x.com', targetUrl: 'https://y.com', count: 10 }
    ]
    const result = buildNavigationGraphGroups(edges)
    expect(result).toHaveLength(2)
    const aGroup = result.find((g) => g.sourceUrl === 'https://a.com')
    const xGroup = result.find((g) => g.sourceUrl === 'https://x.com')
    expect(aGroup).toBeDefined()
    expect(aGroup.edges).toHaveLength(2)
    expect(aGroup.edges[0].targetUrl).toBe('https://b.com')
    expect(aGroup.edges[0].count).toBe(5)
    expect(aGroup.edges[1].targetUrl).toBe('https://c.com')
    expect(aGroup.edges[1].count).toBe(3)
    expect(xGroup).toBeDefined()
    expect(xGroup.edges).toHaveLength(1)
    expect(xGroup.edges[0].count).toBe(10)
    expect(result[0].sourceUrl).toBe('https://x.com')
    expect(result[1].sourceUrl).toBe('https://a.com')
  })

  test('sorts edges within group by count descending', () => {
    const edges = [
      { sourceUrl: 'https://s.com', targetUrl: 'https://low.com', count: 1 },
      { sourceUrl: 'https://s.com', targetUrl: 'https://high.com', count: 10 }
    ]
    const result = buildNavigationGraphGroups(edges)
    expect(result[0].edges[0].targetUrl).toBe('https://high.com')
    expect(result[0].edges[1].targetUrl).toBe('https://low.com')
  })

  test('returns empty array for empty or null edges', () => {
    expect(buildNavigationGraphGroups([])).toEqual([])
    expect(buildNavigationGraphGroups(null)).toEqual([])
  })

  test('respects limit option', () => {
    const edges = [
      { sourceUrl: 'https://1.com', targetUrl: 'https://a.com', count: 10 },
      { sourceUrl: 'https://2.com', targetUrl: 'https://b.com', count: 5 },
      { sourceUrl: 'https://3.com', targetUrl: 'https://c.com', count: 1 }
    ]
    const result = buildNavigationGraphGroups(edges, { limit: 2 })
    expect(result).toHaveLength(2)
  })
})
