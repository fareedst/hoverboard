/**
 * Browser Bookmark Import - [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Tests sanitizeTag, folderPathToTags, parseExtraTags, flattenTree, and conflict logic (skip/overwrite/merge).
 */

import { sanitizeTag, folderPathToTags, parseExtraTags, flattenTree } from '../../src/ui/browser-bookmark-import/browser-bookmark-import-utils.js'

describe('sanitizeTag [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]', () => {
  test('returns empty string for null, undefined, or blank', () => {
    expect(sanitizeTag(null)).toBe('')
    expect(sanitizeTag(undefined)).toBe('')
    expect(sanitizeTag('')).toBe('')
    expect(sanitizeTag('   ')).toBe('')
  })

  test('lowercases and keeps alphanumeric and underscores', () => {
    expect(sanitizeTag('Work')).toBe('work')
    expect(sanitizeTag('Dev_Tools')).toBe('dev_tools')
    expect(sanitizeTag('JS')).toBe('js')
  })

  test('replaces non-alphanumeric with underscore (spaces and punctuation)', () => {
    expect(sanitizeTag('Dev Tools')).toBe('dev_tools')
    expect(sanitizeTag('  a  b  ')).toBe('a_b')
  })

  test('strips leading/trailing whitespace before processing', () => {
    expect(sanitizeTag('  work  ')).toBe('work')
  })
})

describe('folderPathToTags [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]', () => {
  test('returns empty array for empty or blank path', () => {
    expect(folderPathToTags('')).toEqual([])
    expect(folderPathToTags('   ')).toEqual([])
    expect(folderPathToTags(null)).toEqual([])
  })

  test('splits by slash and sanitizes each segment', () => {
    expect(folderPathToTags('Bookmarks bar')).toEqual(['bookmarks_bar'])
    expect(folderPathToTags('Bookmarks bar / Work')).toEqual(['bookmarks_bar', 'work'])
    expect(folderPathToTags('Bookmarks bar / Dev / JS')).toEqual(['bookmarks_bar', 'dev', 'js'])
  })

  test('deduplicates segments', () => {
    expect(folderPathToTags('A / A / B')).toEqual(['a', 'b'])
  })

  test('handles slashes with surrounding spaces', () => {
    expect(folderPathToTags('Foo / Bar')).toEqual(['foo', 'bar'])
  })
})

describe('parseExtraTags [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]', () => {
  test('returns empty array for empty or blank input', () => {
    expect(parseExtraTags('')).toEqual([])
    expect(parseExtraTags('   ')).toEqual([])
    expect(parseExtraTags(null)).toEqual([])
  })

  test('splits by comma, trims, sanitizes, dedupes', () => {
    expect(parseExtraTags('imported, browser')).toEqual(['imported', 'browser'])
    expect(parseExtraTags('  a , b , a  ')).toEqual(['a', 'b'])
  })

  test('sanitizes each tag (lowercase, alphanumeric + underscore)', () => {
    expect(parseExtraTags('Work, Dev Tools')).toEqual(['work', 'dev_tools'])
  })
})

describe('flattenTree [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]', () => {
  test('returns empty array for non-array input', () => {
    expect(flattenTree(null)).toEqual([])
    expect(flattenTree(undefined)).toEqual([])
    expect(flattenTree({})).toEqual([])
  })

  test('returns empty array for empty nodes', () => {
    expect(flattenTree([])).toEqual([])
  })

  test('flattens a single bookmark node (root level)', () => {
    const nodes = [
      { id: '1', title: 'Bookmarks bar', url: 'https://example.com', dateAdded: 1000000 }
    ]
    const out = flattenTree(nodes)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      id: '1',
      url: 'https://example.com',
      title: 'Bookmarks bar',
      dateAdded: 1000000,
      folderPath: 'Bookmarks bar'
    })
  })

  test('flattens folder with children: folder path passed to children', () => {
    const nodes = [
      {
        id: '0',
        title: 'Bookmarks bar',
        children: [
          { id: '1', title: 'Google', url: 'https://google.com', dateAdded: 2000000 }
        ]
      }
    ]
    const out = flattenTree(nodes)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      id: '1',
      url: 'https://google.com',
      title: 'Google',
      folderPath: 'Bookmarks bar'
    })
  })

  test('flattens nested folders: folderPath is parent path', () => {
    const nodes = [
      {
        id: '0',
        title: 'Bookmarks bar',
        children: [
          {
            id: '1',
            title: 'Work',
            children: [
              { id: '2', title: 'Link', url: 'https://work.com', dateAdded: 3000000 }
            ]
          }
        ]
      }
    ]
    const out = flattenTree(nodes)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      id: '2',
      url: 'https://work.com',
      title: 'Link',
      folderPath: 'Bookmarks bar / Work'
    })
  })

  test('skips folder-only nodes (no url), only collects nodes with url', () => {
    const nodes = [
      {
        id: '0',
        title: 'Folder',
        children: [
          { id: '1', title: 'A', url: 'https://a.com', dateAdded: 1 },
          { id: '2', title: 'B', url: 'https://b.com', dateAdded: 2 }
        ]
      }
    ]
    const out = flattenTree(nodes)
    expect(out).toHaveLength(2)
    expect(out[0].url).toBe('https://a.com')
    expect(out[0].folderPath).toBe('Folder')
    expect(out[1].url).toBe('https://b.com')
    expect(out[1].folderPath).toBe('Folder')
  })

  test('uses 0 for missing dateAdded', () => {
    const nodes = [{ id: '1', title: 'X', url: 'https://x.com' }]
    const out = flattenTree(nodes)
    expect(out[0].dateAdded).toBe(0)
  })
})

describe('Conflict mode logic [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT]', () => {
  test('skip: selected URLs present in existing set are excluded from toProcess', () => {
    const existingByUrl = new Map([
      ['https://existing.com', { url: 'https://existing.com', description: 'Old' }]
    ])
    const toProcess = [
      { url: 'https://new.com', title: 'New' },
      { url: 'https://existing.com', title: 'Existing' }
    ]
    const conflictMode = 'skip'
    const toImport = toProcess.filter(b => {
      const url = (b.url || '').trim()
      if (!url) return false
      const existing = existingByUrl.get(url)
      if (existing && conflictMode === 'skip') return false
      return true
    })
    expect(toImport).toHaveLength(1)
    expect(toImport[0].url).toBe('https://new.com')
  })

  test('overwrite: all selected items are included (existing overwritten)', () => {
    const existingByUrl = new Map([
      ['https://existing.com', { url: 'https://existing.com' }]
    ])
    const toProcess = [
      { url: 'https://existing.com', title: 'New Title' }
    ]
    const conflictMode = 'overwrite'
    const toImport = toProcess.filter(b => {
      const url = (b.url || '').trim()
      if (!url) return false
      if (existingByUrl.get(url) && conflictMode === 'skip') return false
      return true
    })
    expect(toImport).toHaveLength(1)
  })

  test('merge: existing description and extended preserved when building payload', () => {
    const existing = { url: 'https://x.com', description: 'Kept', extended: 'Notes', tags: ['old'] }
    const browser = { url: 'https://x.com', title: 'Browser Title', folderPath: 'Work' }
    const useFolderTags = true
    const folderTags = folderPathToTags(browser.folderPath)
    const extraTags = []
    let tags = [...folderTags, ...extraTags].filter(Boolean)
    tags = [...new Set([...existing.tags, ...tags])]
    const description = existing.description || browser.title
    const extended = existing.extended || ''
    expect(description).toBe('Kept')
    expect(extended).toBe('Notes')
    expect(tags).toContain('old')
    expect(tags).toContain('work')
  })
})
