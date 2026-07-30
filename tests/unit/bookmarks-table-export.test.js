/**
 * Local Bookmarks Index export (CSV) - [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Tests escapeCsvField, buildCsv, and export scope logic (selected = allBookmarks filtered by selectedUrls).
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.
 * 
 * ## PINBOARD
 * 
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
 * - Contract:
 *   - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark with time and updated_at set per provider and context
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: time = create time; updated_at = last update time
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PINBOARD
 *   - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
 *   - SEND to API: do NOT include updated_at
 *   - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
 *   - 1. Normalize (url-tags-manager, display, move, export/import):
 *   - IF bookmark has no updated_at: SET updated_at = time   // legacy
 *   - ELSE: keep updated_at
 *   - Include updated_at in payload/CSV/JSON
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] — Export all/displayed/selected to CSV; buildCsv and programmatic download. Contract: scope and bookmark sets; CSV download and column shape.
 * 
 * ## EXPORT_BOOKMARKS
 * 
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] How: Implements exportBookmarks(scope) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.
 * - Contract:
 *   - INPUT: scope ('all' | 'displayed' | 'selected'), allBookmarks, filteredBookmarks, selectedUrls (set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: CSV file download (Blob -> object URL -> <a download> click -> revoke)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: CSV header + rows; columns description, url, tags, time, storage, shared, toread, extended
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: EXPORT_BOOKMARKS
 *   - IF scope = 'all': source = allBookmarks
 *   - IF scope = 'displayed': source = filteredBookmarks
 *   - IF scope = 'selected': source = allBookmarks FILTER url IN selectedUrls
 *   - csvString = buildCsv(source)   // header row + one row per bookmark; escape quotes; storage Local|File|Sync|Browser
 *   - filename = "hoverboard-bookmarks-{scope}-{ISO date}.csv"
 *   - blob = new Blob([csvString]); url = createObjectURL(blob)
 *   - trigger <a download=filename href=url> click; revokeObjectURL(url)
 *   - How (sub-block): Disable export buttons when scope has no data.
 * 
 * ## UPDATE_EXPORT_BUTTON_STATE
 * 
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] How: Implements updateExportButtonState() behavior for IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.
 * - Contract:
 *   - INPUT: scope ('all' | 'displayed' | 'selected'), allBookmarks, filteredBookmarks, selectedUrls (set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: CSV file download (Blob -> object URL -> <a download> click -> revoke)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: CSV header + rows; columns description, url, tags, time, storage, shared, toread, extended
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_EXPORT_BUTTON_STATE
 *   - DISABLE "Export selected" when selectedUrls.size === 0
 *   - DISABLE "Export displayed" when filteredBookmarks.length === 0
 *   - DISABLE "Export all" when allBookmarks.length === 0
 *   - (called when selection or filter changes, e.g. from updateMoveControlsState)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT ===
 */
import { escapeCsvField, buildCsv } from '../../src/ui/bookmarks-table/bookmarks-table-csv.js'

describe('escapeCsvField [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]', () => {
  test('returns "" for null and undefined', () => {
    expect(escapeCsvField(null)).toBe('""')
    expect(escapeCsvField(undefined)).toBe('""')
  })

  test('wraps string in double quotes', () => {
    expect(escapeCsvField('')).toBe('""')
    expect(escapeCsvField('a')).toBe('"a"')
    expect(escapeCsvField('hello')).toBe('"hello"')
  })

  test('escapes internal double quotes as ""', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvField('""')).toBe('""""""')
  })
})

describe('buildCsv [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]', () => {
  test('returns header only for empty array [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
    const csv = buildCsv([])
    expect(csv).toBe('Title,URL,Tags,Time,Updated,Storage,Shared,To read,Notes')
  })

  test('outputs one row with Local storage', () => {
    const bookmarks = [
      { description: 'Foo', url: 'https://foo.com', tags: [], time: '2026-01-01T12:00:00.000Z', storage: 'local', shared: 'yes', toread: 'no', extended: '' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('Title,URL,Tags,Time,Updated,Storage,Shared,To read,Notes')
    expect(csv).toContain('"Foo"')
    expect(csv).toContain('"https://foo.com"')
    expect(csv).toContain('"Local"')
    expect(csv).toContain('"Public"')
    expect(csv).toContain('"No"')
  })

  test('outputs Storage column as File when storage is file', () => {
    const bookmarks = [
      { description: 'F', url: 'https://f.com', storage: 'file' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('"File"')
  })

  test('outputs Storage column as Sync when storage is sync', () => {
    const bookmarks = [
      { description: 'S', url: 'https://s.com', storage: 'sync' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('"Sync"')
  })

  test('outputs Storage column as Browser when storage is browser [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]', () => {
    const bookmarks = [
      { description: 'B', url: 'https://b.com', storage: 'browser' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('"Browser"')
    expect(csv).not.toContain('"Local"')
  })

  test('joins tags with comma and space', () => {
    const bookmarks = [
      { description: 'T', url: 'https://t.com', tags: ['a', 'b'], storage: 'local' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('"a, b"')
  })

  test('includes extended as Notes column', () => {
    const bookmarks = [
      { description: 'N', url: 'https://n.com', extended: 'my notes', storage: 'local' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('"my notes"')
  })

  test('private and to-read map correctly', () => {
    const bookmarks = [
      { description: 'P', url: 'https://p.com', shared: 'no', toread: 'yes', storage: 'local' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('"Private"')
    expect(csv).toContain('"Yes"')
  })

  test('selected scope: buildCsv receives only bookmarks whose url is in selectedUrls [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]', () => {
    const allBookmarks = [
      { description: 'One', url: 'https://one.com', storage: 'local' },
      { description: 'Two', url: 'https://two.com', storage: 'file' },
      { description: 'Three', url: 'https://three.com', storage: 'sync' }
    ]
    const selectedUrls = new Set(['https://two.com', 'https://three.com'])
    const selectedList = allBookmarks.filter(b => selectedUrls.has(b.url || ''))
    expect(selectedList).toHaveLength(2)
    expect(selectedList.map(b => b.description)).toEqual(['Two', 'Three'])
    const csv = buildCsv(selectedList)
    expect(csv).toContain('"Two"')
    expect(csv).toContain('"Three"')
    expect(csv).not.toContain('"One"')
    expect(csv).toContain('"File"')
    expect(csv).toContain('"Sync"')
  })

  test('uses CRLF line endings', () => {
    const bookmarks = [
      { description: 'A', url: 'https://a.com', storage: 'local' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toMatch(/\r\n/)
  })
})
