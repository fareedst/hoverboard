/**
 * Local Bookmarks Index export (CSV) - [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Tests escapeCsvField, buildCsv, and export scope logic (selected = allBookmarks filtered by selectedUrls).
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
  test('returns header only for empty array', () => {
    const csv = buildCsv([])
    expect(csv).toBe('Title,URL,Tags,Time,Storage,Shared,To read,Notes')
  })

  test('outputs one row with Local storage', () => {
    const bookmarks = [
      { description: 'Foo', url: 'https://foo.com', tags: [], time: '2026-01-01T12:00:00.000Z', storage: 'local', shared: 'yes', toread: 'no', extended: '' }
    ]
    const csv = buildCsv(bookmarks)
    expect(csv).toContain('Title,URL,Tags,Time,Storage,Shared,To read,Notes')
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
