/**
 * Local Bookmarks Index storage filter logic - [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Pure functions: matchStorageFilter (legacy), matchStoresFilter, time range, exclude tags, delete confirmation message.
 * Add tags: [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] parseTagsInput, mergeTags, buildAddTagsPayload, removeTags, buildRemoveTagsPayload.
 * Time column integration: formatters used by index for Time column display.
 */

import fs from 'fs'
import path from 'path'
import {
  matchStorageFilter,
  matchStoresFilter,
  parseTimeRangeValue,
  getBookmarkTimeMs,
  inTimeRange,
  matchExcludeTags,
  buildDeleteConfirmMessage,
  getShowOnlyDefaultState,
  parseTagsInput,
  mergeTags,
  buildAddTagsPayload,
  removeTags,
  buildRemoveTagsPayload,
  buildAddTagsConfirmMessage,
  buildRemoveTagsConfirmMessage,
  selectionStillVisible
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

describe('buildAddTagsConfirmMessage [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('includes tag list and count', () => {
    expect(buildAddTagsConfirmMessage(['work', 'review'], 2)).toContain('work, review')
    expect(buildAddTagsConfirmMessage(['work', 'review'], 2)).toContain('2 bookmarks')
    expect(buildAddTagsConfirmMessage(['x'], 1)).toContain('1 bookmark')
  })
  test('empty tag list shows (none)', () => {
    expect(buildAddTagsConfirmMessage([], 3)).toContain('(none)')
    expect(buildAddTagsConfirmMessage([], 3)).toContain('3 bookmarks')
  })
})

describe('buildRemoveTagsConfirmMessage [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('includes tag list and count', () => {
    expect(buildRemoveTagsConfirmMessage(['work', 'review'], 2)).toContain('work, review')
    expect(buildRemoveTagsConfirmMessage(['work', 'review'], 2)).toContain('Remove')
    expect(buildRemoveTagsConfirmMessage(['work', 'review'], 2)).toContain('2 bookmarks')
    expect(buildRemoveTagsConfirmMessage(['x'], 1)).toContain('1 bookmark')
  })
  test('empty tag list shows (none)', () => {
    expect(buildRemoveTagsConfirmMessage([], 3)).toContain('(none)')
    expect(buildRemoveTagsConfirmMessage([], 3)).toContain('3 bookmarks')
  })
})

describe('selectionStillVisible [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns intersection of selected URLs and displayed bookmark URLs', () => {
    const selected = new Set(['https://a.com', 'https://b.com', 'https://c.com'])
    const filtered = [
      { url: 'https://a.com', description: 'A' },
      { url: 'https://c.com', description: 'C' }
    ]
    const result = selectionStillVisible(selected, filtered)
    expect(result.size).toBe(2)
    expect(result.has('https://a.com')).toBe(true)
    expect(result.has('https://c.com')).toBe(true)
    expect(result.has('https://b.com')).toBe(false)
  })
  test('empty selectedUrls returns empty Set', () => {
    const filtered = [{ url: 'https://x.com' }]
    expect(selectionStillVisible(new Set(), filtered)).toEqual(new Set())
  })
  test('empty filteredBookmarks returns empty Set', () => {
    const selected = new Set(['https://a.com'])
    expect(selectionStillVisible(selected, [])).toEqual(new Set())
  })
  test('all selected visible returns same URLs', () => {
    const selected = new Set(['u1', 'u2'])
    const filtered = [{ url: 'u1' }, { url: 'u2' }]
    const result = selectionStillVisible(selected, filtered)
    expect(result.size).toBe(2)
    expect(result.has('u1')).toBe(true)
    expect(result.has('u2')).toBe(true)
  })
  test('ignores bookmarks with missing or falsy url', () => {
    const selected = new Set(['u1', 'u2'])
    const filtered = [{ url: 'u1' }, {}, { url: null }, { url: 'u2' }]
    const result = selectionStillVisible(selected, filtered)
    expect(result.size).toBe(2)
    expect(result.has('u1')).toBe(true)
    expect(result.has('u2')).toBe(true)
  })
  test('non-array filteredBookmarks treated as empty', () => {
    const selected = new Set(['u1'])
    expect(selectionStillVisible(selected, null)).toEqual(new Set())
    expect(selectionStillVisible(selected, undefined)).toEqual(new Set())
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

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] Bookmark count at bottom of page: row count must be the last content in the page container.
 * Validates that the index HTML has .footer-info as the last block in .container and contains #row-count.
 */
describe('bookmark count at bottom of page [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  test('index HTML has footer-info with row-count as last content in container', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('class="footer-info"')
    expect(html).toContain('id="row-count"')
    const containerStart = html.indexOf('<div class="container">')
    expect(containerStart).toBeGreaterThan(-1)
    const afterContainer = html.slice(containerStart)
    const lastFooterInfo = afterContainer.lastIndexOf('class="footer-info"')
    const lastRowCount = afterContainer.lastIndexOf('id="row-count"')
    expect(lastFooterInfo).toBeGreaterThan(-1)
    expect(lastRowCount).toBeGreaterThan(lastFooterInfo)
    const scriptTag = afterContainer.indexOf('<script')
    expect(scriptTag).toBeGreaterThan(lastRowCount)
  })

  test('index HTML has footer-spacer before footer-info for short-page layout [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('class="footer-spacer"')
    const spacerPos = html.indexOf('footer-spacer')
    const footerInfoPos = html.indexOf('footer-info')
    expect(spacerPos).toBeGreaterThan(-1)
    expect(footerInfoPos).toBeGreaterThan(spacerPos)
  })

  test('index CSS has footer-info sticky at bottom so count stays visible when scrolling [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
    const cssPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.css')
    const css = fs.readFileSync(cssPath, 'utf8')
    expect(css).toContain('.footer-info')
    expect(css).toMatch(/position:\s*sticky/)
    expect(css).toMatch(/bottom:\s*0/)
  })
})

describe('Add tags to selected UI [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('index HTML has add-tags row with label, input and Add tags / Delete tags buttons in Actions for selected', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('id="add-tags-input"')
    expect(html).toContain('id="add-tags-btn"')
    expect(html).toContain('id="delete-tags-btn"')
    expect(html).toContain('New tag(s):')
    expect(html).toContain('Add tags')
    expect(html).toContain('Delete tags')
  })
})

describe('parseTagsInput [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns empty array for empty or whitespace-only input', () => {
    expect(parseTagsInput('')).toEqual([])
    expect(parseTagsInput('   ')).toEqual([])
    expect(parseTagsInput('\t')).toEqual([])
    expect(parseTagsInput(null)).toEqual([])
  })

  test('returns single tag trimmed', () => {
    expect(parseTagsInput('foo')).toEqual(['foo'])
    expect(parseTagsInput('  foo  ')).toEqual(['foo'])
  })

  test('returns multiple comma-separated tags trimmed', () => {
    expect(parseTagsInput('a, b, c')).toEqual(['a', 'b', 'c'])
    expect(parseTagsInput('  a , b , c  ')).toEqual(['a', 'b', 'c'])
  })

  test('filters empty segments', () => {
    expect(parseTagsInput('a, , b')).toEqual(['a', 'b'])
    expect(parseTagsInput(', a, , b,')).toEqual(['a', 'b'])
  })

  test('dedupes case-insensitive within input (keeps first)', () => {
    expect(parseTagsInput('a, A')).toEqual(['a'])
    expect(parseTagsInput('Work, work, WORK')).toEqual(['Work'])
  })
})

describe('mergeTags [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns empty when both empty', () => {
    expect(mergeTags([], [])).toEqual([])
    expect(mergeTags(undefined, [])).toEqual([])
    expect(mergeTags([], undefined)).toEqual([])
  })

  test('returns existing only when new is empty', () => {
    expect(mergeTags(['a', 'b'], [])).toEqual(['a', 'b'])
  })

  test('returns new only when existing is empty', () => {
    expect(mergeTags([], ['x', 'y'])).toEqual(['x', 'y'])
  })

  test('merges with no overlap', () => {
    expect(mergeTags(['a', 'b'], ['x', 'y'])).toEqual(['a', 'b', 'x', 'y'])
  })

  test('merges with overlap case-insensitive (does not duplicate)', () => {
    expect(mergeTags(['a', 'b'], ['b', 'A', 'c'])).toEqual(['a', 'b', 'c'])
  })

  test('preserves existing casing and appends new', () => {
    expect(mergeTags(['Work'], ['Dev'])).toEqual(['Work', 'Dev'])
  })
})

describe('buildAddTagsPayload [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns null when bookmark is null or missing url', () => {
    expect(buildAddTagsPayload(null, ['x'])).toBe(null)
    expect(buildAddTagsPayload({}, ['x'])).toBe(null)
    expect(buildAddTagsPayload({ description: 'No URL' }, ['x'])).toBe(null)
  })

  test('returns payload with merged tags and preferredBackend from bookmark.storage', () => {
    const bookmark = { url: 'https://example.com', description: 'Ex', tags: ['a'], storage: 'file' }
    const payload = buildAddTagsPayload(bookmark, ['b', 'c'])
    expect(payload).not.toBe(null)
    expect(payload.url).toBe('https://example.com')
    expect(payload.tags).toEqual(['a', 'b', 'c'])
    expect(payload.preferredBackend).toBe('file')
  })

  test('defaults preferredBackend to local when storage missing', () => {
    const bookmark = { url: 'https://example.com', description: 'Ex' }
    const payload = buildAddTagsPayload(bookmark, ['x'])
    expect(payload.preferredBackend).toBe('local')
  })

  test('merges new tags with existing (case-insensitive dedupe)', () => {
    const bookmark = { url: 'https://example.com', tags: ['a', 'b'], storage: 'local' }
    const payload = buildAddTagsPayload(bookmark, ['b', 'A', 'c'])
    expect(payload.tags).toEqual(['a', 'b', 'c'])
  })
})

describe('removeTags [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns empty when both empty', () => {
    expect(removeTags([], [])).toEqual([])
    expect(removeTags(undefined, [])).toEqual([])
    expect(removeTags([], undefined)).toEqual([])
  })

  test('returns existing only when toRemove is empty', () => {
    expect(removeTags(['a', 'b'], [])).toEqual(['a', 'b'])
  })

  test('returns empty when toRemove only and existing empty', () => {
    expect(removeTags([], ['x', 'y'])).toEqual([])
  })

  test('removes one tag (case-insensitive)', () => {
    expect(removeTags(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c'])
    expect(removeTags(['a', 'b', 'c'], ['B'])).toEqual(['a', 'c'])
  })

  test('removes multiple tags', () => {
    expect(removeTags(['a', 'b', 'c'], ['a', 'c'])).toEqual(['b'])
  })

  test('preserves casing of remaining tags', () => {
    expect(removeTags(['Work', 'Dev'], ['dev'])).toEqual(['Work'])
  })
})

describe('buildRemoveTagsPayload [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns null when bookmark is null or missing url', () => {
    expect(buildRemoveTagsPayload(null, ['x'])).toBe(null)
    expect(buildRemoveTagsPayload({}, ['x'])).toBe(null)
    expect(buildRemoveTagsPayload({ description: 'No URL' }, ['x'])).toBe(null)
  })

  test('returns payload with reduced tags and preferredBackend from bookmark.storage', () => {
    const bookmark = { url: 'https://example.com', description: 'Ex', tags: ['a', 'b', 'c'], storage: 'file' }
    const payload = buildRemoveTagsPayload(bookmark, ['b'])
    expect(payload).not.toBe(null)
    expect(payload.url).toBe('https://example.com')
    expect(payload.tags).toEqual(['a', 'c'])
    expect(payload.preferredBackend).toBe('file')
  })

  test('defaults preferredBackend to local when storage missing', () => {
    const bookmark = { url: 'https://example.com', tags: ['a'] }
    const payload = buildRemoveTagsPayload(bookmark, [])
    expect(payload.preferredBackend).toBe('local')
  })

  test('removes tags case-insensitive', () => {
    const bookmark = { url: 'https://example.com', tags: ['a', 'b', 'c'], storage: 'local' }
    const payload = buildRemoveTagsPayload(bookmark, ['B', 'A'])
    expect(payload.tags).toEqual(['c'])
  })
})
