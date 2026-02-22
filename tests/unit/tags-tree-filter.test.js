/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Unit tests for side panel filter/sort/group: getDomainFromUrl, filterByTimeRange, filterByTagsInclude,
 * filterByDomains, applyFilters, sortBookmarks, groupBookmarksBy. Validates that selection and display
 * by time, tags, domain implement the requirement.
 */

import {
  getDomainFromUrl,
  filterByTimeRange,
  filterByTagsInclude,
  filterByDomains,
  applyFilters,
  sortBookmarks,
  groupBookmarksBy
} from '../../src/ui/side-panel/tags-tree-filter.js'

describe('getDomainFromUrl [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty string for empty or invalid URL (implements no-throw, empty for invalid)', () => {
    expect(getDomainFromUrl('')).toBe('')
    expect(getDomainFromUrl(null)).toBe('')
    expect(getDomainFromUrl(undefined)).toBe('')
    expect(getDomainFromUrl('   ')).toBe('')
    expect(getDomainFromUrl('not-a-url')).toBe('')
  })

  test('returns hostname for valid http(s) URL (implements domain extraction for filter/group)', () => {
    expect(getDomainFromUrl('https://example.com/path')).toBe('example.com')
    expect(getDomainFromUrl('http://sub.example.org:8080/')).toBe('sub.example.org')
  })

  test('returns lowercase hostname (implements case-insensitive domain match)', () => {
    expect(getDomainFromUrl('https://Example.COM')).toBe('example.com')
  })
})

describe('filterByTimeRange [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty array for non-array input (implements safe input)', () => {
    expect(filterByTimeRange(null, 'time', null, null)).toEqual([])
    expect(filterByTimeRange(undefined, 'updated_at', 0, 100)).toEqual([])
  })

  test('keeps bookmarks within [startMs, endMs] inclusive for field time (implements time range filter)', () => {
    const t1 = new Date('2025-01-15T12:00:00Z').getTime()
    const t2 = new Date('2025-01-20T12:00:00Z').getTime()
    const t3 = new Date('2025-01-25T12:00:00Z').getTime()
    const start = new Date('2025-01-18Z').getTime()
    const end = new Date('2025-01-22Z').getTime()
    const bookmarks = [
      { url: 'u1', time: new Date(t1).toISOString() },
      { url: 'u2', time: new Date(t2).toISOString() },
      { url: 'u3', time: new Date(t3).toISOString() }
    ]
    const out = filterByTimeRange(bookmarks, 'time', start, end)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('u2')
  })

  test('null start or end means no bound (implements optional bounds)', () => {
    const t = new Date('2025-01-20T12:00:00Z').getTime()
    const bookmarks = [{ url: 'u1', time: new Date(t).toISOString() }]
    expect(filterByTimeRange(bookmarks, 'time', null, null)).toHaveLength(1)
    expect(filterByTimeRange(bookmarks, 'time', t - 1, null)).toHaveLength(1)
    expect(filterByTimeRange(bookmarks, 'time', null, t + 1)).toHaveLength(1)
  })

  test('uses updated_at when field is updated_at (implements create vs update time)', () => {
    const time = new Date('2024-01-01Z').toISOString()
    const updated = new Date('2025-06-01Z').toISOString()
    const start = new Date('2025-05-01Z').getTime()
    const end = new Date('2025-07-01Z').getTime()
    const bookmarks = [{ url: 'u1', time, updated_at: updated }]
    const out = filterByTimeRange(bookmarks, 'updated_at', start, end)
    expect(out).toHaveLength(1)
  })
})

describe('filterByTagsInclude [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty array for non-array input (implements safe input)', () => {
    expect(filterByTagsInclude(null, new Set(['a']))).toEqual([])
  })

  test('empty tagSet returns all bookmarks (implements no filter when empty)', () => {
    const bookmarks = [{ url: 'u1', tags: ['x'] }]
    expect(filterByTagsInclude(bookmarks, new Set())).toHaveLength(1)
    expect(filterByTagsInclude(bookmarks, null)).toHaveLength(1)
  })

  test('keeps only bookmarks with at least one tag in set (implements tags include filter)', () => {
    const bookmarks = [
      { url: 'u1', tags: ['a', 'b'] },
      { url: 'u2', tags: ['b', 'c'] },
      { url: 'u3', tags: ['d'] }
    ]
    const out = filterByTagsInclude(bookmarks, new Set(['a', 'c']))
    expect(out).toHaveLength(2)
    expect(out.map(b => b.url)).toEqual(expect.arrayContaining(['u1', 'u2']))
  })

  test('case-insensitive tag match (implements case-insensitive include)', () => {
    const bookmarks = [{ url: 'u1', tags: ['Foo'] }]
    expect(filterByTagsInclude(bookmarks, new Set(['foo']))).toHaveLength(1)
  })
})

describe('filterByDomains [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty array for non-array input (implements safe input)', () => {
    expect(filterByDomains(null, new Set(['example.com']))).toEqual([])
  })

  test('empty domainSet returns all bookmarks (implements no filter when empty)', () => {
    const bookmarks = [{ url: 'https://example.com' }]
    expect(filterByDomains(bookmarks, new Set())).toHaveLength(1)
    expect(filterByDomains(bookmarks, null)).toHaveLength(1)
  })

  test('keeps only bookmarks whose URL hostname in domainSet (implements domain filter)', () => {
    const bookmarks = [
      { url: 'https://a.com/path' },
      { url: 'https://b.com' },
      { url: 'https://c.org' }
    ]
    const out = filterByDomains(bookmarks, new Set(['a.com', 'c.org']))
    expect(out).toHaveLength(2)
    expect(out.map(b => getDomainFromUrl(b.url))).toEqual(expect.arrayContaining(['a.com', 'c.org']))
  })
})

describe('applyFilters [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('applies time then tags then domains in sequence (implements filter pipeline order)', () => {
    const t = new Date('2025-01-15T12:00:00Z')
    const bookmarks = [
      { url: 'https://keep.com', tags: ['x'], time: t.toISOString() },
      { url: 'https://drop.com', tags: ['y'], time: t.toISOString() }
    ]
    const config = {
      timeField: 'time',
      timeStart: t.getTime() - 1,
      timeEnd: t.getTime() + 1,
      tagsInclude: new Set(['x']),
      domains: new Set(['keep.com'])
    }
    const out = applyFilters(bookmarks, config)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://keep.com')
  })

  test('returns empty array for non-array bookmarks (implements safe input)', () => {
    expect(applyFilters(null, {})).toEqual([])
  })

  test('all filters empty returns bookmarks that have valid time (null bounds skip range check but time field must exist)', () => {
    const now = new Date().toISOString()
    const bookmarks = [
      { url: 'https://a.com', tags: ['x'], time: now },
      { url: 'https://b.com', tags: ['y'], time: now }
    ]
    const out = applyFilters(bookmarks, { timeField: 'time', timeStart: null, timeEnd: null, tagsInclude: new Set(), domains: new Set() })
    expect(out).toHaveLength(2)
  })
})

describe('sortBookmarks [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('sorts by time ascending/descending (implements sort by create time)', () => {
    const bookmarks = [
      { url: 'u1', time: new Date('2025-01-03Z').toISOString() },
      { url: 'u2', time: new Date('2025-01-01Z').toISOString() },
      { url: 'u3', time: new Date('2025-01-02Z').toISOString() }
    ]
    const asc = sortBookmarks(bookmarks, 'time', true)
    expect(asc[0].url).toBe('u2')
    expect(asc[2].url).toBe('u1')
    const desc = sortBookmarks(bookmarks, 'time', false)
    expect(desc[0].url).toBe('u1')
  })

  test('sorts by domain (implements sort by domain axis)', () => {
    const bookmarks = [
      { url: 'https://z.com' },
      { url: 'https://a.com' },
      { url: 'https://m.com' }
    ]
    const asc = sortBookmarks(bookmarks, 'domain', true)
    expect(getDomainFromUrl(asc[0].url)).toBe('a.com')
    expect(getDomainFromUrl(asc[2].url)).toBe('z.com')
  })

  test('sorts by tag (first tag) (implements sort by tag axis)', () => {
    const bookmarks = [
      { url: 'u1', tags: ['z'] },
      { url: 'u2', tags: ['a'] },
      { url: 'u3', tags: ['m'] }
    ]
    const asc = sortBookmarks(bookmarks, 'tag', true)
    expect(asc[0].url).toBe('u2')
    expect(asc[2].url).toBe('u1')
  })

  test('returns empty array for non-array input (implements safe input)', () => {
    expect(sortBookmarks(null, 'time', true)).toEqual([])
  })
})

describe('groupBookmarksBy [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns null for groupBy none or empty (implements flat list when no group)', () => {
    expect(groupBookmarksBy([], 'none')).toBeNull()
    expect(groupBookmarksBy([{ url: 'u1' }], 'none')).toBeNull()
  })

  test('groups by domain (implements group by domain for sectioned render)', () => {
    const bookmarks = [
      { url: 'https://a.com/1' },
      { url: 'https://a.com/2' },
      { url: 'https://b.com' }
    ]
    const map = groupBookmarksBy(bookmarks, 'domain')
    expect(map).toBeInstanceOf(Map)
    expect(map.get('a.com')).toHaveLength(2)
    expect(map.get('b.com')).toHaveLength(1)
  })

  test('groups by tag (first tag) (implements group by tag)', () => {
    const bookmarks = [
      { url: 'u1', tags: ['x'] },
      { url: 'u2', tags: ['x'] },
      { url: 'u3', tags: ['y'] }
    ]
    const map = groupBookmarksBy(bookmarks, 'tag')
    expect(map.get('x')).toHaveLength(2)
    expect(map.get('y')).toHaveLength(1)
  })

  test('groups by time date bucket (implements group by create date)', () => {
    const bookmarks = [
      { url: 'u1', time: new Date('2025-01-15T10:00:00Z').toISOString() },
      { url: 'u2', time: new Date('2025-01-15T20:00:00Z').toISOString() },
      { url: 'u3', time: new Date('2025-01-16Z').toISOString() }
    ]
    const map = groupBookmarksBy(bookmarks, 'time')
    expect(map.get('2025-01-15')).toHaveLength(2)
    expect(map.get('2025-01-16')).toHaveLength(1)
  })

  test('groups by updated_at date bucket (implements group by update date)', () => {
    const bookmarks = [
      { url: 'u1', updated_at: new Date('2025-02-10T12:00:00Z').toISOString() },
      { url: 'u2', updated_at: new Date('2025-02-10T18:00:00Z').toISOString() },
      { url: 'u3', updated_at: new Date('2025-02-11Z').toISOString() }
    ]
    const map = groupBookmarksBy(bookmarks, 'updated_at')
    expect(map.get('2025-02-10')).toHaveLength(2)
    expect(map.get('2025-02-11')).toHaveLength(1)
  })

  test('returns null for non-array input (implements safe input)', () => {
    expect(groupBookmarksBy(null, 'domain')).toBeNull()
  })
})
