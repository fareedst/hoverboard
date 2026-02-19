/**
 * Local Bookmarks Index import (CSV parse, only-new vs overwrite) - [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Tests parseCsv, round-trip with buildCsv, and "only new" filtering logic.
 */

import { parseCsv, buildCsv } from '../../src/ui/bookmarks-table/bookmarks-table-csv.js'

describe('parseCsv [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]', () => {
  test('returns empty array for empty or invalid input', () => {
    expect(parseCsv('')).toEqual([])
    expect(parseCsv(null)).toEqual([])
    expect(parseCsv(undefined)).toEqual([])
    expect(parseCsv('Title,URL,Tags,Time,Updated,Storage,Shared,To read,Notes')).toEqual([])
  })

  test('parses one data row with header (8-column legacy: updated_at defaults to time) [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
    const csv = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes\n"Foo","https://foo.com","","2026-01-01T12:00:00.000Z","Local","Public","No",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      description: 'Foo',
      url: 'https://foo.com',
      tags: [],
      time: '2026-01-01T12:00:00.000Z',
      updated_at: '2026-01-01T12:00:00.000Z',
      shared: 'yes',
      toread: 'no',
      extended: ''
    })
  })

  test('maps Shared Private to shared no and To read Yes to toread yes', () => {
    const csv = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes\n"P","https://p.com","","","Local","Private","Yes",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].shared).toBe('no')
    expect(out[0].toread).toBe('yes')
  })

  test('parses tags from comma-separated string into array', () => {
    const csv = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes\n"T","https://t.com","a, b, c","","Local","Public","No",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].tags).toEqual(['a', 'b', 'c'])
  })

  test('skips rows with empty URL', () => {
    const csv = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes\n"No URL","","","","Local","Public","No",""\n"Has URL","https://u.com","","","Local","Public","No",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://u.com')
  })

  test('handles quoted field with escaped double quote', () => {
    const csv = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes\n"Say ""hi""","https://q.com","","","Local","Public","No",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].description).toBe('Say "hi"')
  })

  test('parses multiple rows', () => {
    const csv = [
      'Title,URL,Tags,Time,Storage,Shared,To read,Notes',
      '"A","https://a.com","","","Local","Public","No",""',
      '"B","https://b.com","x","","File","Private","Yes","note"'
    ].join('\r\n')
    const out = parseCsv(csv)
    expect(out).toHaveLength(2)
    expect(out[0].description).toBe('A')
    expect(out[0].url).toBe('https://a.com')
    expect(out[1].description).toBe('B')
    expect(out[1].url).toBe('https://b.com')
    expect(out[1].tags).toEqual(['x'])
    expect(out[1].shared).toBe('no')
    expect(out[1].toread).toBe('yes')
    expect(out[1].extended).toBe('note')
  })

  test('round-trip: parseCsv(buildCsv(bookmarks)) yields equivalent bookmark-like objects [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
    const bookmarks = [
      { description: 'One', url: 'https://one.com', tags: ['a', 'b'], time: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z', storage: 'local', shared: 'yes', toread: 'no', extended: 'notes one' },
      { description: 'Two', url: 'https://two.com', tags: [], time: '', updated_at: '', storage: 'file', shared: 'no', toread: 'yes', extended: '' }
    ]
    const csv = buildCsv(bookmarks)
    const parsed = parseCsv(csv)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].url).toBe(bookmarks[0].url)
    expect(parsed[0].description).toBe(bookmarks[0].description)
    expect(parsed[0].tags).toEqual(bookmarks[0].tags)
    expect(parsed[0].time).toBe(bookmarks[0].time)
    expect(parsed[0].updated_at).toBe(bookmarks[0].updated_at)
    expect(parsed[0].shared).toBe(bookmarks[0].shared)
    expect(parsed[0].toread).toBe(bookmarks[0].toread)
    expect(parsed[0].extended).toBe(bookmarks[0].extended)
    expect(parsed[1].url).toBe(bookmarks[1].url)
    expect(parsed[1].shared).toBe('no')
    expect(parsed[1].toread).toBe('yes')
  })

  test('parses CSV with LF-only line endings (no CR)', () => {
    const csv = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes\n"A","https://a.com","","","Local","Public","No",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://a.com')
    expect(out[0].description).toBe('A')
  })

  test('accepts header with different casing (title,url...)', () => {
    const csv = 'title,url,tags,time,storage,shared,to read,notes\n"X","https://x.com","","","local","public","no",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://x.com')
  })

  test('parses row with comma inside quoted Notes field', () => {
    const csv = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes\n"N","https://n.com","","","Local","Public","No","Note, with comma"'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].extended).toBe('Note, with comma')
  })

  test('parses 9-column CSV with Updated column [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
    const csv = 'Title,URL,Tags,Time,Updated,Storage,Shared,To read,Notes\n"R","https://r.com","","2026-01-01T00:00:00.000Z","2026-01-02T00:00:00.000Z","Local","Public","No",""'
    const out = parseCsv(csv)
    expect(out).toHaveLength(1)
    expect(out[0].time).toBe('2026-01-01T00:00:00.000Z')
    expect(out[0].updated_at).toBe('2026-01-02T00:00:00.000Z')
  })
})

describe('JSON import contract [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]', () => {
  /** Normalize raw JSON object to bookmark payload (mirrors normalizeJsonBookmark in bookmarks-table.js). */
  function normalizeJsonBookmark (raw) {
    const url = (raw.url || '').trim()
    if (!url) return null
    const tags = raw.tags == null ? [] : Array.isArray(raw.tags) ? raw.tags : String(raw.tags).split(/\s+/).filter(Boolean)
    return {
      url,
      description: (raw.description ?? '').trim(),
      extended: (raw.extended ?? '').trim(),
      tags,
      time: (raw.time ?? '').trim(),
      shared: raw.shared === 'no' ? 'no' : 'yes',
      toread: raw.toread === 'yes' ? 'yes' : 'no'
    }
  }

  test('normalizeJsonBookmark returns null for empty or missing url', () => {
    expect(normalizeJsonBookmark({ description: 'No URL' })).toBeNull()
    expect(normalizeJsonBookmark({ url: '' })).toBeNull()
    expect(normalizeJsonBookmark({ url: '  ' })).toBeNull()
  })

  test('normalizeJsonBookmark maps shared and toread correctly', () => {
    const a = normalizeJsonBookmark({ url: 'https://a.com', shared: 'no', toread: 'yes' })
    expect(a.shared).toBe('no')
    expect(a.toread).toBe('yes')
    const b = normalizeJsonBookmark({ url: 'https://b.com' })
    expect(b.shared).toBe('yes')
    expect(b.toread).toBe('no')
  })

  test('normalizeJsonBookmark normalizes tags to array', () => {
    expect(normalizeJsonBookmark({ url: 'https://u.com', tags: ['a', 'b'] }).tags).toEqual(['a', 'b'])
    expect(normalizeJsonBookmark({ url: 'https://u.com', tags: 'x y z' }).tags).toEqual(['x', 'y', 'z'])
    expect(normalizeJsonBookmark({ url: 'https://u.com' }).tags).toEqual([])
  })

  test('JSON array parse: each item normalized yields valid bookmark payloads', () => {
    const data = [
      { url: 'https://one.com', description: 'One', tags: ['a'], shared: 'no', toread: 'yes' },
      { url: 'https://two.com' },
      { description: 'No URL' }
    ]
    const out = data.map(normalizeJsonBookmark).filter(Boolean)
    expect(out).toHaveLength(2)
    expect(out[0].url).toBe('https://one.com')
    expect(out[0].description).toBe('One')
    expect(out[0].tags).toEqual(['a'])
    expect(out[0].shared).toBe('no')
    expect(out[0].toread).toBe('yes')
    expect(out[1].url).toBe('https://two.com')
  })
})

describe('Import only new vs overwrite [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]', () => {
  test('only new: records whose url is in existingUrls are excluded from toSave', () => {
    const existingUrls = new Set(['https://existing.com', 'https://also.com'])
    const records = [
      { url: 'https://new.com', description: 'New' },
      { url: 'https://existing.com', description: 'Existing' },
      { url: 'https://another-new.com', description: 'Another' }
    ]
    const onlyNew = true
    const toSave = onlyNew ? records.filter(r => !existingUrls.has(r.url)) : records
    expect(toSave).toHaveLength(2)
    expect(toSave.map(r => r.url)).toEqual(['https://new.com', 'https://another-new.com'])
  })

  test('overwrite: all records are included in toSave', () => {
    const existingUrls = new Set(['https://existing.com'])
    const records = [
      { url: 'https://new.com', description: 'New' },
      { url: 'https://existing.com', description: 'Existing' }
    ]
    const onlyNew = false
    const toSave = onlyNew ? records.filter(r => !existingUrls.has(r.url)) : records
    expect(toSave).toHaveLength(2)
    expect(toSave).toEqual(records)
  })
})
