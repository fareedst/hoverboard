/**
 * [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING]
 * Unit tests for BookmarkUsageTracker: visit recording, deduplication, frequency/recency, referrer edges, graph queries, cleanup.
 */

import { BookmarkUsageTracker } from '../../src/features/storage/bookmark-usage-tracker.js'

describe('BookmarkUsageTracker [IMPL-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING]', () => {
  let tracker
  let stored

  beforeEach(() => {
    stored = {}
    const storage = {
      get: jest.fn(async (keys) => {
        const k = Array.isArray(keys) ? keys : [keys]
        const out = {}
        for (const key of k) {
          if (key === 'hoverboard_bookmark_usage') out[key] = { ...(stored[key] || {}) }
          else if (key === 'hoverboard_bookmark_nav_edges') out[key] = { ...(stored[key] || {}) }
        }
        return out
      }),
      set: jest.fn(async (obj) => {
        for (const [key, value] of Object.entries(obj)) {
          stored[key] = value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : value
        }
      })
    }
    tracker = new BookmarkUsageTracker(storage)
  })

  test('recordVisit creates usage record and getUsage returns it [REQ-BOOKMARK_USAGE_TRACKING]', async () => {
    await tracker.recordVisit('https://example.com/page')
    const u = await tracker.getUsage('https://example.com/page')
    expect(u).not.toBeNull()
    expect(u.url).toBe('https://example.com/page')
    expect(u.visitCount).toBe(1)
    expect(u.lastVisitedAt).toBeTruthy()
    expect(u.firstVisitedAt).toBe(u.lastVisitedAt)
    expect(u.recentVisits).toHaveLength(1)
  })

  test('recordVisit with trailing slash normalizes URL [IMPL-BOOKMARK_USAGE_TRACKING]', async () => {
    await tracker.recordVisit('https://example.com/page/')
    const u = await tracker.getUsage('https://example.com/page')
    expect(u).not.toBeNull()
    expect(u.visitCount).toBe(1)
  })

  test('multiple recordVisit increments visitCount [REQ-BOOKMARK_USAGE_TRACKING]', async () => {
    jest.useFakeTimers()
    await tracker.recordVisit('https://example.com/a')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/a')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/a')
    jest.useRealTimers()
    const u = await tracker.getUsage('https://example.com/a')
    expect(u.visitCount).toBe(3)
    expect(u.recentVisits.length).toBeLessThanOrEqual(10)
  })

  test('recordVisit debounces within 60s [IMPL-BOOKMARK_USAGE_TRACKING]', async () => {
    await tracker.recordVisit('https://example.com/debounce')
    await tracker.recordVisit('https://example.com/debounce')
    await tracker.recordVisit('https://example.com/debounce')
    const u = await tracker.getUsage('https://example.com/debounce')
    expect(u.visitCount).toBe(1)
  })

  test('recordVisit with referrer creates navigation edge [REQ-BOOKMARK_USAGE_TRACKING]', async () => {
    await tracker.recordVisit('https://example.com/target', 'https://example.com/source')
    const inbound = await tracker.getInboundLinks('https://example.com/target')
    expect(inbound).toHaveLength(1)
    expect(inbound[0].sourceUrl).toBe('https://example.com/source')
    expect(inbound[0].targetUrl).toBe('https://example.com/target')
    expect(inbound[0].count).toBe(1)
    const outbound = await tracker.getOutboundLinks('https://example.com/source')
    expect(outbound).toHaveLength(1)
    expect(outbound[0].targetUrl).toBe('https://example.com/target')
  })

  test('recordVisit with same referrer again increments edge count', async () => {
    jest.useFakeTimers()
    await tracker.recordVisit('https://example.com/target', 'https://example.com/source')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/target', 'https://example.com/source')
    jest.useRealTimers()
    const inbound = await tracker.getInboundLinks('https://example.com/target')
    expect(inbound[0].count).toBe(2)
  })

  test('empty or non-http referrer does not create edge [IMPL-BOOKMARK_USAGE_TRACKING]', async () => {
    await tracker.recordVisit('https://example.com/p', '')
    await tracker.recordVisit('https://example.com/q', 'file:///local')
    expect((await tracker.getNavigationGraph()).length).toBe(0)
  })

  test('getMostFrequent returns top by visitCount [REQ-BOOKMARK_USAGE_TRACKING]', async () => {
    jest.useFakeTimers()
    await tracker.recordVisit('https://example.com/lo')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/lo')
    await tracker.recordVisit('https://example.com/hi')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/hi')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/hi')
    jest.useRealTimers()
    const top = await tracker.getMostFrequent(2)
    expect(top[0].url).toBe('https://example.com/hi')
    expect(top[0].visitCount).toBe(3)
    expect(top[1].url).toBe('https://example.com/lo')
    expect(top[1].visitCount).toBe(2)
  })

  test('getMostRecent returns by lastVisitedAt [REQ-BOOKMARK_USAGE_TRACKING]', async () => {
    jest.useFakeTimers()
    await tracker.recordVisit('https://example.com/first')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/second')
    jest.useRealTimers()
    const top = await tracker.getMostRecent(2)
    expect(top[0].url).toBe('https://example.com/second')
  })

  test('getNavigationGraph returns all edges', async () => {
    jest.useFakeTimers()
    await tracker.recordVisit('https://example.com/b', 'https://example.com/a')
    jest.advanceTimersByTime(61000)
    await tracker.recordVisit('https://example.com/c', 'https://example.com/a')
    jest.useRealTimers()
    const graph = await tracker.getNavigationGraph()
    expect(graph.length).toBe(2)
    const fromA = graph.filter(e => e.sourceUrl === 'https://example.com/a')
    expect(fromA.length).toBe(2)
  })

  test('clearUsage removes usage and edges for URL [IMPL-BOOKMARK_USAGE_TRACKING]', async () => {
    await tracker.recordVisit('https://example.com/x', 'https://example.com/y')
    await tracker.recordVisit('https://example.com/y', 'https://example.com/z')
    expect(await tracker.getUsage('https://example.com/x')).not.toBeNull()
    await tracker.clearUsage('https://example.com/x')
    expect(await tracker.getUsage('https://example.com/x')).toBeNull()
    const inboundX = await tracker.getInboundLinks('https://example.com/x')
    expect(inboundX).toHaveLength(0)
    const outboundY = await tracker.getOutboundLinks('https://example.com/y')
    expect(outboundY.some(e => e.targetUrl === 'https://example.com/x')).toBe(false)
  })

  test('getUsage returns null for empty or unknown URL', async () => {
    expect(await tracker.getUsage('')).toBeNull()
    expect(await tracker.getUsage('https://example.com/none')).toBeNull()
  })

  test('getAllUsage returns empty array when no data', async () => {
    const all = await tracker.getAllUsage()
    expect(Array.isArray(all)).toBe(true)
    expect(all.length).toBe(0)
  })
})
