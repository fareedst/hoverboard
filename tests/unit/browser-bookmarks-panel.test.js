/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Unit tests: flattenBookmarkTree, filterBrowserBookmarks, buildFolderTree, buildUrlListForCopy (pure functions).
 */

import {
  flattenBookmarkTree,
  filterBrowserBookmarks,
  buildFolderTree,
  buildUrlListForCopy,
  getFaviconSrc,
  sortBrowserBookmarks,
  SORT_BY_DATE,
  SORT_BY_NAME,
  SORT_BY_DEFAULT,
  buildBookmarksHtml,
  buildBookmarksCsv,
  parseBookmarksHtml,
  parseBookmarksCsv
} from '../../src/ui/side-panel/browser-bookmarks-panel.js'

const sampleTree = [
  {
    id: '1',
    title: 'Bookmarks Bar',
    parentId: '0',
    children: [
      {
        id: '2',
        title: 'Work',
        parentId: '1',
        children: [
          { id: '3', title: 'Google', url: 'https://google.com', dateAdded: 1000, parentId: '2' },
          { id: '4', title: 'GitHub', url: 'https://github.com', dateAdded: 2000, parentId: '2' }
        ]
      },
      {
        id: '5',
        title: 'Personal',
        parentId: '1',
        children: [
          { id: '6', title: 'Example', url: 'https://example.com', dateAdded: 3000, parentId: '5' }
        ]
      },
      { id: '7', title: 'Direct Link', url: 'https://direct.com', dateAdded: 4000, parentId: '1' }
    ]
  }
]

const flatBookmarks = [
  { id: '3', url: 'https://google.com', title: 'Google', dateAdded: 1000, folderPath: 'Bookmarks Bar / Work', parentId: '2' },
  { id: '4', url: 'https://github.com', title: 'GitHub', dateAdded: 2000, folderPath: 'Bookmarks Bar / Work', parentId: '2' },
  { id: '6', url: 'https://example.com', title: 'Example', dateAdded: 3000, folderPath: 'Bookmarks Bar / Personal', parentId: '5' },
  { id: '7', url: 'https://direct.com', title: 'Direct Link', dateAdded: 4000, folderPath: 'Bookmarks Bar', parentId: '1' }
]

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] flattenBookmarkTree', () => {
  test('flattens tree to list with folderPath and parentId', () => {
    const result = flattenBookmarkTree(sampleTree, '')
    expect(result).toHaveLength(4)
    expect(result.map((b) => b.id)).toEqual(['3', '4', '6', '7'])
    expect(result[0].folderPath).toBe('Bookmarks Bar / Work')
    expect(result[0].parentId).toBe('2')
    expect(result[3].folderPath).toBe('Bookmarks Bar')
    expect(result[3].parentId).toBe('1')
  })

  test('handles empty nodes', () => {
    expect(flattenBookmarkTree([], '')).toEqual([])
    expect(flattenBookmarkTree(null, '')).toEqual([])
    expect(flattenBookmarkTree(undefined, '')).toEqual([])
  })

  test('handles node without url (folder only)', () => {
    const foldersOnly = [{ id: '1', title: 'Folder', children: [] }]
    expect(flattenBookmarkTree(foldersOnly, '')).toEqual([])
  })

  test('preserves dateAdded', () => {
    const result = flattenBookmarkTree(sampleTree, '')
    expect(result.find((b) => b.id === '3').dateAdded).toBe(1000)
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] buildFolderTree', () => {
  test('builds folder hierarchy with counts', () => {
    const result = buildFolderTree(sampleTree, '')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Bookmarks Bar')
    expect(result[0].count).toBe(1) // direct bookmarks: Direct Link
    expect(result[0].children).toHaveLength(2) // Work, Personal
    const work = result[0].children.find((c) => c.title === 'Work')
    expect(work).toBeDefined()
    expect(work.count).toBe(2) // Google, GitHub
    expect(work.children).toHaveLength(0)
  })

  test('handles empty nodes', () => {
    expect(buildFolderTree([], '')).toEqual([])
    expect(buildFolderTree(null, '')).toEqual([])
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] filterBrowserBookmarks', () => {
  test('empty query returns all bookmarks', () => {
    expect(filterBrowserBookmarks(flatBookmarks, '')).toEqual(flatBookmarks)
    expect(filterBrowserBookmarks(flatBookmarks, '   ')).toEqual(flatBookmarks)
    expect(filterBrowserBookmarks(flatBookmarks, null)).toEqual(flatBookmarks)
    expect(filterBrowserBookmarks(flatBookmarks, undefined)).toEqual(flatBookmarks)
  })

  test('case-insensitive match on title', () => {
    const out = filterBrowserBookmarks(flatBookmarks, 'google')
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('3')
    expect(filterBrowserBookmarks(flatBookmarks, 'GITHUB')).toHaveLength(1)
    expect(filterBrowserBookmarks(flatBookmarks, 'Example')).toHaveLength(1)
  })

  test('case-insensitive match on URL', () => {
    expect(filterBrowserBookmarks(flatBookmarks, 'example.com')).toHaveLength(1)
    expect(filterBrowserBookmarks(flatBookmarks, 'github.com')).toHaveLength(1)
    expect(filterBrowserBookmarks(flatBookmarks, 'HTTPS://GOOGLE')).toHaveLength(1)
  })

  test('case-insensitive match on folderPath', () => {
    const out = filterBrowserBookmarks(flatBookmarks, 'Work')
    expect(out.length).toBeGreaterThanOrEqual(1)
    expect(out.every((b) => (b.folderPath || '').toLowerCase().includes('work'))).toBe(true)
  })

  test('no match returns empty array', () => {
    expect(filterBrowserBookmarks(flatBookmarks, 'xyznone')).toEqual([])
  })

  test('folderId filters by parentId', () => {
    const out = filterBrowserBookmarks(flatBookmarks, '', '2')
    expect(out).toHaveLength(2)
    expect(out.every((b) => b.parentId === '2')).toBe(true)
    expect(out.map((b) => b.id)).toContain('3')
    expect(out.map((b) => b.id)).toContain('4')
  })

  test('folderId with query combines filters', () => {
    const out = filterBrowserBookmarks(flatBookmarks, 'google', '2')
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('3')
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] sortBrowserBookmarks', () => {
  test('sorts by date descending (newest first)', () => {
    const result = sortBrowserBookmarks(flatBookmarks, SORT_BY_DATE, false)
    expect(result.map((b) => b.id)).toEqual(['7', '6', '4', '3'])
  })

  test('sorts by date ascending (oldest first)', () => {
    const result = sortBrowserBookmarks(flatBookmarks, SORT_BY_DATE, true)
    expect(result.map((b) => b.id)).toEqual(['3', '4', '6', '7'])
  })

  test('sorts by name A-Z', () => {
    const result = sortBrowserBookmarks(flatBookmarks, SORT_BY_NAME, true)
    expect(result.map((b) => b.title)).toEqual(['Direct Link', 'Example', 'GitHub', 'Google'])
  })

  test('sorts by name Z-A', () => {
    const result = sortBrowserBookmarks(flatBookmarks, SORT_BY_NAME, false)
    expect(result.map((b) => b.title)).toEqual(['Google', 'GitHub', 'Example', 'Direct Link'])
  })

  test('default preserves order', () => {
    const result = sortBrowserBookmarks(flatBookmarks, SORT_BY_DEFAULT, true)
    expect(result.map((b) => b.id)).toEqual(['3', '4', '6', '7'])
  })

  test('handles empty array', () => {
    expect(sortBrowserBookmarks([], SORT_BY_DATE, false)).toEqual([])
  })

  test('handles null/undefined', () => {
    expect(sortBrowserBookmarks(null, SORT_BY_DATE, false)).toBeNull()
    expect(sortBrowserBookmarks(undefined, SORT_BY_NAME, true)).toBeUndefined()
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] buildUrlListForCopy', () => {
  test('builds newline-separated URL list', () => {
    const urls = buildUrlListForCopy(flatBookmarks)
    expect(urls).toContain('https://google.com')
    expect(urls).toContain('https://github.com')
    expect(urls.split('\n')).toHaveLength(4)
  })

  test('handles empty array', () => {
    expect(buildUrlListForCopy([])).toBe('')
  })

  test('skips bookmarks without url', () => {
    const withEmpty = [{ url: 'https://a.com' }, { url: '' }, { url: 'https://b.com' }]
    expect(buildUrlListForCopy(withEmpty)).toBe('https://a.com\nhttps://b.com')
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] buildBookmarksHtml', () => {
  test('produces Netscape format with DOCTYPE and DL', () => {
    const html = buildBookmarksHtml(flatBookmarks)
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
    expect(html).toContain('<DL><p>')
    expect(html).toContain('</DL><p>')
  })
  test('includes HREF and ADD_DATE for each bookmark', () => {
    const html = buildBookmarksHtml(flatBookmarks)
    expect(html).toContain('HREF="https://google.com"')
    expect(html).toContain('ADD_DATE="1"') // 1000/1000
    expect(html).toContain('>Google</A>')
  })
  test('handles empty array', () => {
    expect(buildBookmarksHtml([])).toBe('')
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] buildBookmarksCsv', () => {
  test('produces CSV with title,url,folderPath header', () => {
    const csv = buildBookmarksCsv(flatBookmarks)
    expect(csv).toContain('title,url,folderPath')
    expect(csv).toContain('"Google"')
    expect(csv).toContain('https://google.com')
  })
  test('handles empty array', () => {
    expect(buildBookmarksCsv([])).toBe('')
  })
  test('escapes title or folderPath containing comma or double-quote (csvEscape)', () => {
    const withSpecial = [
      { title: '"Foo", Bar', url: 'https://a.com', folderPath: 'Folder' },
      { title: 'Say "Hi"', url: 'https://b.com', folderPath: 'A / B' }
    ]
    const csv = buildBookmarksCsv(withSpecial)
    expect(csv).toContain('title,url,folderPath')
    expect(csv).toMatch(/"Say ""Hi"""/)
    expect(csv).toContain('https://a.com')
    expect(csv).toContain('https://b.com')
    const lines = csv.split(/\r?\n/)
    expect(lines.length).toBeGreaterThanOrEqual(3)
    expect(lines[1]).toContain('https://a.com')
    expect(lines[2]).toContain('https://b.com')
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] parseBookmarksHtml', () => {
  test('parses Netscape A HREF elements', () => {
    const html = '<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p><DT><A HREF="https://example.com" ADD_DATE="123">Example</A></DT></DL><p>'
    const list = parseBookmarksHtml(html)
    expect(list).toHaveLength(1)
    expect(list[0].url).toBe('https://example.com')
    expect(list[0].title).toBe('Example')
  })
  test('parses two DT A HREF entries', () => {
    const html = '<DL><p><DT><A HREF="https://a.com">First</A></DT><DT><A HREF="https://b.com">Second</A></DT></DL><p>'
    const list = parseBookmarksHtml(html)
    expect(list).toHaveLength(2)
    expect(list[0]).toEqual({ url: 'https://a.com', title: 'First' })
    expect(list[1]).toEqual({ url: 'https://b.com', title: 'Second' })
  })
  test('strips inner HTML in link text to plain text', () => {
    const html = '<DL><p><DT><A HREF="https://example.com">Example <em>Site</em></A></DT></DL><p>'
    const list = parseBookmarksHtml(html)
    expect(list).toHaveLength(1)
    expect(list[0].url).toBe('https://example.com')
    expect(list[0].title).toBe('Example Site')
  })
  test('handles empty input', () => {
    expect(parseBookmarksHtml('')).toEqual([])
    expect(parseBookmarksHtml(null)).toEqual([])
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] parseBookmarksCsv', () => {
  test('parses CSV with title,url,folderPath', () => {
    const csv = 'title,url,folderPath\n"Google","https://google.com","Work"'
    const list = parseBookmarksCsv(csv)
    expect(list).toHaveLength(1)
    expect(list[0].url).toBe('https://google.com')
    expect(list[0].title).toBe('Google')
  })
  test('parses escaped double-quote in quoted field', () => {
    const csv = 'title,url,folderPath\n"Say ""Hi""","https://example.com","Folder"'
    const list = parseBookmarksCsv(csv)
    expect(list).toHaveLength(1)
    expect(list[0].url).toBe('https://example.com')
    expect(list[0].title).toBe('Say "Hi"')
  })
  test('handles empty or short input', () => {
    expect(parseBookmarksCsv('')).toEqual([])
    expect(parseBookmarksCsv('title,url,folderPath')).toEqual([])
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] getFaviconSrc', () => {
  test('returns empty for empty url', () => {
    expect(getFaviconSrc('')).toBe('')
    expect(getFaviconSrc(null)).toBe('')
  })

  test('returns chrome-extension URL for http(s) when chrome.runtime available', () => {
    const orig = globalThis.chrome
    globalThis.chrome = { runtime: { id: 'test-id', getURL: (p) => `chrome-extension://test-id/${p}` } }
    const result = getFaviconSrc('https://example.com')
    globalThis.chrome = orig
    expect(result).toContain('_favicon')
    expect(result).toContain('example.com')
  })

  test('returns empty string for non-http(s) URL (e.g. ftp, javascript:)', () => {
    expect(getFaviconSrc('ftp://example.com')).toBe('')
    expect(getFaviconSrc('javascript:void(0)')).toBe('')
  })
})
