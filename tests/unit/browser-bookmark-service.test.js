/**
 * === IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_SERVICE ===
 * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.bookmarks provider; same duck-typed contract as LocalBookmarkService; folder path ↔ tags with Chrome root strip; URL collapse. Contract: url/bookmark/tag inputs and provider-shaped outputs; native Chrome tree as backing store.
 * 
 * ## CLEAN_URL
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize URL the same way as other providers (trim, strip trailing slash).
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: CLEAN_URL
 *   - RETURN trim(url) without trailing slashes
 * 
 * ## LOAD_FLAT_ITEMS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Flatten chrome.bookmarks.getTree to URL items with folderPath and parentIds; strip root segments via ids 1/2 (fallback titles).
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_FLAT_ITEMS
 *   - tree = chrome.bookmarks.getTree()
 *   - items = flattenTree(tree)  # { id, url, title, dateAdded, folderPath, parentId }
 *   - FOR each item:
 *   - item.tags = folderPathToTags(item.folderPath, { stripRoots: true })
 *   - RETURN items
 * 
 * ## COLLAPSE_BY_URL
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Collapse duplicate URLs into one pin-shaped bookmark; merge tags; use earliest dateAdded for time; description from first title.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: COLLAPSE_BY_URL
 *   - map = {}
 *   - FOR each item IN items WHERE item.url:
 *   - key = cleanUrl(item.url)
 *   - IF map lacks key:
 *   - map[key] = pinShape(item)  # description=title, time=ISO(dateAdded), tags=item.tags, shared='yes', toread='no', extended='', nodeIds=[item.id]
 *   - ELSE:
 *   - merge tags into map[key].tags (dedupe)
 *   - append item.id to map[key].nodeIds
 *   - IF item.dateAdded earlier: map[key].time = ISO(item.dateAdded)
 *   - RETURN values(map)
 * 
 * ## GET_BOOKMARK_FOR_URL
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Lookup by URL; return collapsed pin or empty stub.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - items = LOAD_FLAT_ITEMS filtered by cleanUrl(url)
 *   - IF items empty: RETURN emptyStub(url, title)
 *   - collapsed = collapseByUrl(items)
 *   - RETURN collapsed[0]
 * 
 * ## GET_ALL_BOOKMARKS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: All URL bookmarks for index aggregation (router tags storage='browser').
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALL_BOOKMARKS
 *   - RETURN collapseByUrl(LOAD_FLAT_ITEMS)
 * 
 * ## GET_RECENT_BOOKMARKS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Recent by dateAdded descending.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - list = getAllBookmarks(); SORT BY time DESCENDING; RETURN list[0..count-1]
 * 
 * ## SAVE_BOOKMARK
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Ensure folder chain under Other Bookmarks (id 2) from tags; create or update all nodes for URL; ignore shared/toread/extended writes.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - key = cleanUrl(data.url)
 *   - parentId = ENSURE_TAG_FOLDERS(data.tags)  # nested under id "2"; empty tags → parent id "2"
 *   - existing = chrome.bookmarks.search({ url: data.url }) matching key
 *   - IF existing empty:
 *   - chrome.bookmarks.create({ parentId, title: data.description or '', url: data.url })
 *   - ELSE:
 *   - FOR each node IN existing:
 *   - chrome.bookmarks.update(node.id, { title: data.description or node.title })
 *   - IF node.parentId != parentId AND data.tags provided: chrome.bookmarks.move(node.id, { parentId })
 *   - How (sub-block): # shared, toread, extended: no-op (Chrome has no equivalents)
 *   - RETURN { success: true }
 * 
 * ## DELETE_BOOKMARK
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Remove every Chrome node whose URL matches.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - key = cleanUrl(url)
 *   - nodes = search matching key
 *   - FOR each node: chrome.bookmarks.remove(node.id)
 *   - RETURN { success: true }
 * 
 * ## SAVE_TAG
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Tag ops mutate folder placement via saveBookmark with updated tags.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG
 *   - bookmark = getBookmarkForUrl(tagData.url)
 *   - UPDATE bookmark.tags per tagData
 *   - RETURN saveBookmark(bookmark)
 * 
 * ## TEST_CONNECTION
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Always available when bookmarks permission present.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: TEST_CONNECTION
 *   - RETURN true
 * 
 * ## ENSURE_TAG_FOLDERS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Get-or-create nested folders under Other Bookmarks for each tag segment; return leaf folder id.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: ENSURE_TAG_FOLDERS
 *   - parentId = "2"  # Other Bookmarks
 *   - FOR each tag IN tags:
 *   - child = find folder under parentId titled tag OR create folder
 *   - parentId = child.id
 *   - RETURN parentId
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_SERVICE ===
 */
import { BrowserBookmarkService } from '../../src/features/storage/browser-bookmark-service.js'
import {
  folderPathToTags,
  stripChromeRootSegments,
  collapseByUrl
} from '../../src/ui/browser-bookmark-import/browser-bookmark-import-utils.js'

describe('folderPathToTags stripRoots [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BROWSER_BOOKMARK_SERVICE]', () => {
  test('strips Bookmarks Bar and Other bookmarks root titles', () => {
    expect(folderPathToTags('Bookmarks Bar / Work / Dev', { stripRoots: true })).toEqual(['work', 'dev'])
    expect(folderPathToTags('Other bookmarks / Archive', { stripRoots: true })).toEqual(['archive'])
  })

  test('without stripRoots keeps root segment (import compat)', () => {
    expect(folderPathToTags('Bookmarks Bar / Work')).toEqual(['bookmarks_bar', 'work'])
  })
})

describe('stripChromeRootSegments [REQ-BROWSER_BOOKMARK_STORAGE]', () => {
  test('removes known root titles from path segments', () => {
    expect(stripChromeRootSegments(['Bookmarks Bar', 'Work'])).toEqual(['Work'])
    expect(stripChromeRootSegments(['Other Bookmarks', 'A', 'B'])).toEqual(['A', 'B'])
  })
})

describe('collapseByUrl [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BROWSER_BOOKMARK_SERVICE]', () => {
  test('merges tags from duplicate URL nodes', () => {
    const items = [
      { id: '10', url: 'https://dup.com', title: 'A', dateAdded: 1000, tags: ['work'] },
      { id: '11', url: 'https://dup.com/', title: 'A', dateAdded: 2000, tags: ['personal'] }
    ]
    const collapsed = collapseByUrl(items)
    expect(collapsed).toHaveLength(1)
    expect(collapsed[0].url).toBe('https://dup.com')
    expect(collapsed[0].tags.sort()).toEqual(['personal', 'work'])
    expect(collapsed[0].nodeIds).toEqual(['10', '11'])
  })
})

describe('BrowserBookmarkService [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BROWSER_BOOKMARK_SERVICE]', () => {
  let service
  let nodesById
  let nextId

  function buildTree () {
    return [{
      id: '0',
      title: '',
      children: [
        {
          id: '1',
          title: 'Bookmarks Bar',
          children: [
            {
              id: '3',
              title: 'Work',
              children: [
                { id: '10', title: 'Example', url: 'https://example.com', dateAdded: Date.parse('2026-01-01T00:00:00.000Z'), parentId: '3' }
              ]
            }
          ]
        },
        {
          id: '2',
          title: 'Other bookmarks',
          children: [
            { id: '20', title: 'Other copy', url: 'https://example.com', dateAdded: Date.parse('2026-02-01T00:00:00.000Z'), parentId: '2' },
            { id: '21', title: 'Solo', url: 'https://solo.com', dateAdded: Date.parse('2026-03-01T00:00:00.000Z'), parentId: '2' }
          ]
        }
      ]
    }]
  }

  function reindex (node, parentId) {
    nodesById[node.id] = { ...node, parentId: parentId || node.parentId }
    if (node.children) {
      for (const c of node.children) reindex(c, node.id)
    }
  }

  beforeEach(() => {
    nextId = 100
    nodesById = {}
    const tree = buildTree()
    reindex(tree[0])

    global.chrome.bookmarks = {
      getTree: jest.fn(async () => {
        // rebuild tree from nodesById roots
        const root = { id: '0', title: '', children: [] }
        const bar = nodesById['1']
        const other = nodesById['2']
        const rebuild = (id) => {
          const n = nodesById[id]
          if (!n) return null
          const copy = { id: n.id, title: n.title, url: n.url, dateAdded: n.dateAdded, parentId: n.parentId }
          if (!n.url) {
            copy.children = Object.values(nodesById)
              .filter(c => c.parentId === id && c.id !== id)
              .map(c => rebuild(c.id))
              .filter(Boolean)
          }
          return copy
        }
        root.children = [rebuild('1'), rebuild('2')].filter(Boolean)
        // Ensure bar/other folder structure from initial + mutations
        void bar
        void other
        return [root]
      }),
      search: jest.fn(async (query) => {
        const url = typeof query === 'string' ? query : query.url
        if (!url) return []
        const key = url.replace(/\/+$/, '')
        return Object.values(nodesById).filter(n => n.url && n.url.replace(/\/+$/, '') === key)
      }),
      create: jest.fn(async (create) => {
        const id = String(nextId++)
        const node = {
          id,
          title: create.title || '',
          url: create.url,
          parentId: create.parentId || '2',
          dateAdded: Date.now(),
          children: create.url ? undefined : []
        }
        nodesById[id] = node
        return node
      }),
      update: jest.fn(async (id, changes) => {
        const n = nodesById[id]
        if (changes.title != null) n.title = changes.title
        if (changes.url != null) n.url = changes.url
        return n
      }),
      move: jest.fn(async (id, destination) => {
        nodesById[id].parentId = destination.parentId
        return nodesById[id]
      }),
      remove: jest.fn(async (id) => {
        delete nodesById[id]
      }),
      getChildren: jest.fn(async (id) => {
        return Object.values(nodesById).filter(n => n.parentId === id)
      }),
      get: jest.fn(async (id) => {
        const n = nodesById[id]
        return n ? [n] : []
      })
    }

    service = new BrowserBookmarkService(null)
  })

  test('getBookmarkForUrl collapses duplicate URLs and strips root tags', async () => {
    const b = await service.getBookmarkForUrl('https://example.com')
    expect(b.url).toBe('https://example.com')
    expect(b.description).toBeTruthy()
    expect(b.tags).toContain('work')
    expect(b.tags).not.toContain('bookmarks_bar')
    expect(b.tags).not.toContain('other_bookmarks')
    expect(b.shared).toBe('yes')
    expect(b.toread).toBe('no')
    expect(b.extended).toBe('')
    expect(b.time).toBeTruthy()
  })

  test('getAllBookmarks returns collapsed browser bookmarks', async () => {
    const list = await service.getAllBookmarks()
    expect(list.some(b => b.url === 'https://example.com')).toBe(true)
    expect(list.some(b => b.url === 'https://solo.com')).toBe(true)
    expect(list.filter(b => b.url === 'https://example.com')).toHaveLength(1)
  })

  test('saveBookmark creates under Other Bookmarks when new', async () => {
    const result = await service.saveBookmark({
      url: 'https://new.com',
      description: 'New',
      tags: ['alpha', 'beta']
    })
    expect(result.success).toBe(true)
    expect(chrome.bookmarks.create).toHaveBeenCalled()
    const created = chrome.bookmarks.create.mock.calls.find(c => c[0].url === 'https://new.com')
    expect(created).toBeTruthy()
  })

  test('deleteBookmark removes all nodes for URL', async () => {
    const result = await service.deleteBookmark('https://example.com')
    expect(result.success).toBe(true)
    expect(chrome.bookmarks.remove).toHaveBeenCalled()
    const b = await service.getBookmarkForUrl('https://example.com')
    expect(b.description).toBe('')
    expect(b.tags).toEqual([])
  })

  test('testConnection returns true', async () => {
    expect(await service.testConnection()).toBe(true)
  })
})
