/**
 * ## COUNT_INDEX_ROWS_BY_STORE
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize provider storage values, count rows directly, and derive filtered / total counts before applying Store checkbox selection.
 * - Contract:
 *   - INPUT: allBookmarks (provider-row[]), metadataFilteredBookmarks (provider-row[])
 *   - PRE: arrays may be empty; rows may omit storage; storage values may vary in case or contain whitespace; duplicate URLs remain distinct rows
 *   - OUTPUT: { local: { filtered, total }, file: { filtered, total }, sync: { filtered, total }, browser: { filtered, total } }
 *   - POST:
 *     - success => total counts include every loaded row assigned to a known Store
 *     - success => filtered counts include rows surviving search, Show only, Hide, and Health filters, before Store checkbox selection
 *     - success => unknown storage is not attributed to a named Store; missing storage uses Local only for Local fallback rows
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: COUNT_INDEX_ROWS_BY_STORE
 *   - 1. INITIALIZE counts for local, file, sync, browser with filtered = 0 and total = 0
 *   - 2. FOR each row IN allBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].total += 1
 *   - 3. FOR each row IN metadataFilteredBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].filtered += 1
 *   - 4. RETURN counts
 *   - How (sub-block): NORMALIZE_INDEX_STORAGE trims and lowercases local|file|sync|browser; missing storage becomes local only for explicitly marked Local fallback rows; unknown values remain unassigned.
 */

import {
  normalizeIndexStorage,
  getIndexStoreCounts
} from '../../src/ui/bookmarks-table/bookmarks-table-filter.js'

describe('[REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Store counts', () => {
  test('counts Local, File, Sync, and Browser rows without deduplicating URLs', () => {
    const rows = [
      { url: 'https://same.example/', storage: 'LOCAL' },
      { url: 'https://same.example/', storage: ' local ' },
      { url: 'https://file.example/', storage: 'FILE' },
      { url: 'https://sync.example/', storage: 'sync' },
      { url: 'https://browser.example/', storage: 'Browser' },
      { url: 'https://unknown.example/', storage: 'pinboard' }
    ]

    expect(getIndexStoreCounts(rows, rows)).toEqual({
      local: { filtered: 2, total: 2 },
      file: { filtered: 1, total: 1 },
      sync: { filtered: 1, total: 1 },
      browser: { filtered: 1, total: 1 }
    })
  })

  test('keeps filtered counts separate from totals before Store selection', () => {
    const rows = [
      { url: 'https://local-1.example/', storage: 'local' },
      { url: 'https://local-2.example/', storage: 'local' },
      { url: 'https://file.example/', storage: 'file' },
      { url: 'https://browser.example/', storage: 'browser' }
    ]
    const metadataFilteredRows = [rows[1], rows[2]]

    expect(getIndexStoreCounts(rows, metadataFilteredRows)).toEqual({
      local: { filtered: 1, total: 2 },
      file: { filtered: 1, total: 1 },
      sync: { filtered: 0, total: 0 },
      browser: { filtered: 0, total: 1 }
    })
  })

  test('normalizes known storage values and does not assign unknown values', () => {
    expect(normalizeIndexStorage('  BROWSER ')).toBe('browser')
    expect(normalizeIndexStorage('pinboard')).toBeNull()
    expect(normalizeIndexStorage('')).toBeNull()
    expect(normalizeIndexStorage(undefined)).toBeNull()
  })

  test('supports Local-only fallback rows when explicitly requested', () => {
    const fallbackRows = [{ url: 'https://fallback.example/' }, { url: 'https://other.example/' }]
    const filteredRows = [fallbackRows[0]]

    expect(normalizeIndexStorage(undefined, { fallbackLocal: true })).toBe('local')
    expect(getIndexStoreCounts(fallbackRows, filteredRows, { fallbackLocal: true })).toEqual({
      local: { filtered: 1, total: 2 },
      file: { filtered: 0, total: 0 },
      sync: { filtered: 0, total: 0 },
      browser: { filtered: 0, total: 0 }
    })
  })

  test('returns zero counts for empty or invalid collections', () => {
    expect(getIndexStoreCounts([], [])).toEqual({
      local: { filtered: 0, total: 0 },
      file: { filtered: 0, total: 0 },
      sync: { filtered: 0, total: 0 },
      browser: { filtered: 0, total: 0 }
    })
    expect(getIndexStoreCounts(null, undefined)).toEqual({
      local: { filtered: 0, total: 0 },
      file: { filtered: 0, total: 0 },
      sync: { filtered: 0, total: 0 },
      browser: { filtered: 0, total: 0 }
    })
  })
})
