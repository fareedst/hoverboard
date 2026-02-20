/**
 * Local Bookmarks Index storage filter logic - [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Pure functions: matchStorageFilter (legacy), matchStoresFilter, time range, exclude tags, delete confirmation message.
 * Time column integration: formatters used by index for Time column display.
 */

import {
  matchStorageFilter,
  matchStoresFilter,
  parseTimeRangeValue,
  getBookmarkTimeMs,
  inTimeRange,
  matchExcludeTags,
  buildDeleteConfirmMessage,
  getShowOnlyDefaultState
} from '../../src/ui/bookmarks-table/bookmarks-table-filter.js'
import { formatTimeAbsolute, formatTimeAge } from '../../src/ui/bookmarks-table/bookmarks-table-time.js'
import { setTableDisplayStickyHeight } from '../../src/ui/bookmarks-table/bookmarks-table-sticky.js'

describe('matchStorageFilter [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns true for any bookmark when value is empty (All)', () => {
    expect(matchStorageFilter({ storage: 'local' }, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'file' }, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'sync' }, '')).toBe(true)
    expect(matchStorageFilter({}, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, '   ')).toBe(true)
  })

  test('returns true only when storage matches value for local', () => {
    expect(matchStorageFilter({ storage: 'local' }, 'local')).toBe(true)
    expect(matchStorageFilter({ storage: 'file' }, 'local')).toBe(false)
    expect(matchStorageFilter({ storage: 'sync' }, 'local')).toBe(false)
    expect(matchStorageFilter({}, 'local')).toBe(true)
  })

  test('returns true only when storage matches value for file', () => {
    expect(matchStorageFilter({ storage: 'file' }, 'file')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, 'file')).toBe(false)
    expect(matchStorageFilter({ storage: 'sync' }, 'file')).toBe(false)
  })

  test('returns true only when storage matches value for sync', () => {
    expect(matchStorageFilter({ storage: 'sync' }, 'sync')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, 'sync')).toBe(false)
    expect(matchStorageFilter({ storage: 'file' }, 'sync')).toBe(false)
  })

  test('is case-insensitive', () => {
    expect(matchStorageFilter({ storage: 'Local' }, 'local')).toBe(true)
    expect(matchStorageFilter({ storage: 'FILE' }, 'file')).toBe(true)
    expect(matchStorageFilter({ storage: 'Sync' }, 'SYNC')).toBe(true)
  })
})

describe('matchStoresFilter [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns false for all bookmarks when allowedStores is empty', () => {
    const empty = new Set()
    expect(matchStoresFilter({ storage: 'local' }, empty)).toBe(false)
    expect(matchStoresFilter({ storage: 'file' }, empty)).toBe(false)
    expect(matchStoresFilter({ storage: 'sync' }, empty)).toBe(false)
  })

  test('returns false when allowedStores is null or undefined', () => {
    expect(matchStoresFilter({ storage: 'local' }, null)).toBe(false)
    expect(matchStoresFilter({ storage: 'local' }, undefined)).toBe(false)
  })

  test('returns true only when bookmark storage is in allowedStores', () => {
    const localOnly = new Set(['local'])
    expect(matchStoresFilter({ storage: 'local' }, localOnly)).toBe(true)
    expect(matchStoresFilter({ storage: 'file' }, localOnly)).toBe(false)
    expect(matchStoresFilter({ storage: 'sync' }, localOnly)).toBe(false)

    const fileAndSync = new Set(['file', 'sync'])
    expect(matchStoresFilter({ storage: 'local' }, fileAndSync)).toBe(false)
    expect(matchStoresFilter({ storage: 'file' }, fileAndSync)).toBe(true)
    expect(matchStoresFilter({ storage: 'sync' }, fileAndSync)).toBe(true)
  })

  test('defaults missing storage to local and is case-insensitive', () => {
    const localOnly = new Set(['local'])
    expect(matchStoresFilter({}, localOnly)).toBe(true)
    expect(matchStoresFilter({ storage: 'Local' }, new Set(['local']))).toBe(true)
    expect(matchStoresFilter({ storage: 'FILE' }, new Set(['file']))).toBe(true)
  })
})

describe('parseTimeRangeValue and getBookmarkTimeMs [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('parseTimeRangeValue returns null for empty or invalid', () => {
    expect(parseTimeRangeValue('')).toBe(null)
    expect(parseTimeRangeValue('   ')).toBe(null)
    expect(parseTimeRangeValue('invalid')).toBe(null)
  })

  test('parseTimeRangeValue parses ISO and datetime-local style', () => {
    const ms = parseTimeRangeValue('2025-06-10T12:00')
    expect(ms).not.toBe(null)
    expect(new Date(ms).getFullYear()).toBe(2025)
    expect(new Date(ms).getMonth()).toBe(5)
  })

  test('getBookmarkTimeMs returns ms for time or updated_at', () => {
    const b = { time: '2025-06-10T10:00:00.000Z', updated_at: '2025-06-12T14:00:00.000Z' }
    expect(getBookmarkTimeMs(b, 'time')).not.toBe(null)
    expect(getBookmarkTimeMs(b, 'updated_at')).not.toBe(null)
    expect(getBookmarkTimeMs(b, 'updated_at')).toBeGreaterThan(getBookmarkTimeMs(b, 'time'))
  })

  test('getBookmarkTimeMs returns null when missing', () => {
    expect(getBookmarkTimeMs({}, 'time')).toBe(null)
    expect(getBookmarkTimeMs({ time: 'bad' }, 'time')).toBe(null)
  })
})

describe('inTimeRange [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('includes bookmark when within start and end', () => {
    const b = { time: '2025-06-11T12:00:00.000Z', updated_at: '2025-06-11T12:00:00.000Z' }
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, end)).toBe(true)
    expect(inTimeRange(b, 'updated_at', start, end)).toBe(true)
  })

  test('excludes bookmark when before start', () => {
    const b = { time: '2025-06-09T12:00:00.000Z' }
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, end)).toBe(false)
  })

  test('excludes bookmark when after end', () => {
    const b = { time: '2025-06-16T12:00:00.000Z' }
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, end)).toBe(false)
  })

  test('null start or end skips that bound', () => {
    const b = { time: '2025-06-11T12:00:00.000Z' }
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', null, end)).toBe(true)
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, null)).toBe(true)
  })

  test('returns false when bookmark has no valid time', () => {
    expect(inTimeRange({}, 'time', 0, 9999999999999)).toBe(false)
  })
})

describe('matchExcludeTags [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns true when exclude string is empty (keep all)', () => {
    expect(matchExcludeTags({ tags: ['work'] }, '')).toBe(true)
    expect(matchExcludeTags({ tags: ['work'] }, '   ')).toBe(true)
  })

  test('excludes bookmark that has any of the exclude tags', () => {
    expect(matchExcludeTags({ tags: ['work', 'dev'] }, 'archive')).toBe(true)
    expect(matchExcludeTags({ tags: ['work', 'archive'] }, 'archive')).toBe(false)
    expect(matchExcludeTags({ tags: ['work', 'archive'] }, 'archive, done')).toBe(false)
  })

  test('is case-insensitive', () => {
    expect(matchExcludeTags({ tags: ['Work'] }, 'work')).toBe(false)
    expect(matchExcludeTags({ tags: ['archive'] }, 'ARCHIVE')).toBe(false)
  })

  test('handles empty tags array', () => {
    expect(matchExcludeTags({ tags: [] }, 'work')).toBe(true)
    expect(matchExcludeTags({}, 'work')).toBe(true)
  })
})

describe('buildDeleteConfirmMessage [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('includes count in message', () => {
    expect(buildDeleteConfirmMessage(1, [])).toContain('Delete 1 bookmark?')
    expect(buildDeleteConfirmMessage(3, [])).toContain('Delete 3 bookmarks?')
  })

  test('includes titles when count <= 8', () => {
    const msg = buildDeleteConfirmMessage(2, ['Title A', 'Title B'])
    expect(msg).toContain('Delete 2 bookmarks?')
    expect(msg).toContain('Title A')
    expect(msg).toContain('Title B')
  })

  test('does not add title list when count > 8', () => {
    const titles = Array(10).fill('x')
    const msg = buildDeleteConfirmMessage(10, titles)
    expect(msg).toContain('Delete 10 bookmarks?')
    expect(msg).not.toContain('x')
  })

  test('uses (no title) for empty title', () => {
    const msg = buildDeleteConfirmMessage(1, [''])
    expect(msg).toContain('(no title)')
  })

  test('exactly 8 selected includes titles in message', () => {
    const titles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const msg = buildDeleteConfirmMessage(8, titles)
    expect(msg).toContain('Delete 8 bookmarks?')
    expect(msg).toContain('A')
    expect(msg).toContain('H')
  })

  test('9 selected does not include title list', () => {
    const titles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
    const msg = buildDeleteConfirmMessage(9, titles)
    expect(msg).toContain('Delete 9 bookmarks?')
    expect(msg).not.toContain('A')
    expect(msg).not.toContain('I')
  })

  test('empty titles array still shows count only', () => {
    const msg = buildDeleteConfirmMessage(3, [])
    expect(msg).toContain('Delete 3 bookmarks?')
    expect(msg).not.toMatch(/\n\n/)
  })
})

describe('Filter pipeline order [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  const startMs = new Date('2025-06-10T00:00:00Z').getTime()
  const endMs = new Date('2025-06-15T00:00:00Z').getTime()

  function tagInclude (bookmark, includeTags) {
    if (!includeTags || includeTags.length === 0) return true
    const bTags = (bookmark.tags || []).map(t => String(t).toLowerCase())
    return includeTags.some(t => bTags.includes(t.toLowerCase()))
  }

  function toReadPrivate (bookmark, toReadOnly, privateOnly) {
    if (toReadOnly && bookmark.toread !== 'yes') return false
    if (privateOnly && bookmark.shared !== 'no') return false
    return true
  }

  test('applies stores then time range then exclude tags in order', () => {
    const bookmarks = [
      { url: 'u1', storage: 'local', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'u2', storage: 'file', tags: ['work', 'archive'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'u3', storage: 'local', tags: ['dev'], toread: 'no', shared: 'yes', time: '2025-06-12T12:00:00.000Z' },
      { url: 'u4', storage: 'sync', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-08T12:00:00.000Z' },
      { url: 'u5', storage: 'local', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' }
    ]
    const allowedStores = new Set(['local', 'sync'])
    let list = bookmarks.filter(b => matchStoresFilter(b, allowedStores))
    expect(list.map(b => b.url)).toEqual(['u1', 'u3', 'u4', 'u5'])
    list = list.filter(b => inTimeRange(b, 'time', startMs, endMs))
    expect(list.map(b => b.url)).toEqual(['u1', 'u3', 'u5'])
    list = list.filter(b => matchExcludeTags(b, 'archive'))
    expect(list.map(b => b.url)).toEqual(['u1', 'u3', 'u5'])
  })

  test('pipeline with tag include and toread/private (inline) then time range then exclude', () => {
    const bookmarks = [
      { url: 'a', storage: 'local', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'b', storage: 'local', tags: ['dev'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'c', storage: 'local', tags: ['work', 'archive'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' }
    ]
    const allowedStores = new Set(['local'])
    const includeTags = ['work']
    let list = bookmarks.filter(b => matchStoresFilter(b, allowedStores))
    list = list.filter(b => tagInclude(b, includeTags))
    list = list.filter(b => toReadPrivate(b, true, true))
    list = list.filter(b => inTimeRange(b, 'time', startMs, endMs))
    list = list.filter(b => matchExcludeTags(b, 'archive'))
    expect(list.map(b => b.url)).toEqual(['a'])
  })
})

describe('getShowOnlyDefaultState [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns default values for Show only group', () => {
    const def = getShowOnlyDefaultState()
    expect(def).toEqual({
      tags: '',
      toread: false,
      private: false,
      timeRangeStart: '',
      timeRangeEnd: '',
      timeRangeField: 'updated_at'
    })
  })

  test('returns a fresh object each call', () => {
    const a = getShowOnlyDefaultState()
    const b = getShowOnlyDefaultState()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('Time column formatters integration [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('formatTimeAbsolute and formatTimeAge produce display strings for bookmark time/updated_at', () => {
    const bookmark = {
      time: '2025-06-10T10:00:00.000Z',
      updated_at: '2025-06-12T14:30:00.000Z'
    }
    const valueCreate = bookmark.time
    const valueUpdated = bookmark.updated_at
    expect(formatTimeAbsolute(valueCreate)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(formatTimeAbsolute(valueUpdated)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    const now = new Date('2025-06-15T12:00:00.000Z').getTime()
    expect(formatTimeAge(valueCreate, now)).toMatch(/\d+ (day|days|hour|hours|minute|minutes|second|seconds)/)
    expect(formatTimeAge(valueUpdated, now)).toMatch(/\d+ (day|days|hour|hours|minute|minutes|second|seconds)/)
  })
})

describe('setTableDisplayStickyHeight [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('sets --table-display-sticky-height on root to tableDisplayEl offsetHeight in px', () => {
    const root = document.createElement('div')
    const tableDisplayEl = document.createElement('div')
    Object.defineProperty(tableDisplayEl, 'offsetHeight', { value: 72, configurable: true })
    setTableDisplayStickyHeight(tableDisplayEl, root)
    expect(root.style.getPropertyValue('--table-display-sticky-height')).toBe('72px')
  })

  test('updates when offsetHeight changes', () => {
    const root = document.createElement('div')
    let height = 48
    const tableDisplayEl = document.createElement('div')
    Object.defineProperty(tableDisplayEl, 'offsetHeight', {
      get () { return height },
      configurable: true
    })
    setTableDisplayStickyHeight(tableDisplayEl, root)
    expect(root.style.getPropertyValue('--table-display-sticky-height')).toBe('48px')
    height = 96
    setTableDisplayStickyHeight(tableDisplayEl, root)
    expect(root.style.getPropertyValue('--table-display-sticky-height')).toBe('96px')
  })

  test('does nothing when tableDisplayEl is null', () => {
    const root = document.createElement('div')
    setTableDisplayStickyHeight(null, root)
    expect(root.style.getPropertyValue('--table-display-sticky-height')).toBe('')
  })

  test('does nothing when rootEl is null', () => {
    const tableDisplayEl = document.createElement('div')
    Object.defineProperty(tableDisplayEl, 'offsetHeight', { value: 72, configurable: true })
    expect(() => setTableDisplayStickyHeight(tableDisplayEl, null)).not.toThrow()
  })

  test('does nothing when both are null', () => {
    expect(() => setTableDisplayStickyHeight(null, null)).not.toThrow()
  })
})
