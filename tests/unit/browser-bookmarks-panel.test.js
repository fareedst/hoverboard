/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_BOOKMARKS ===
 * [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] — This block defines the browser bookmarks panel: data fetch, flatten, folder tree, filter, UI, click to open. Implements REQ by listing Chrome bookmarks with folder path and favicon; real-time search; folder filter; implements ARCH by direct chrome.bookmarks tree UX. Boundary: this panel is NOT Store B / IMPL-BROWSER_BOOKMARK_SERVICE (BookmarkRouter peer). Panel owns direct tree UI; Store B is the fifth router backend for Index/Save-to/move.
 * 
 * ## FLATTEN_BOOKMARK_TREE
 * 
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: Data fetch: panel calls chrome.bookmarks.getTree; flatten to list. Implements "list all Chrome bookmarks". flattenBookmarkTree(nodes, parentPath): pure. For each node: if node.url push { id, url, title, dateAdded, folderPath: parentPath, parentId }; if node.children recurse with path = parentPath ? parentPath + ' / ' + node.title : node.title. Return flat list. Implements "folder path per bookmark".
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks = flattenBookmarkTree(tree), visibleBookmarks = filterBrowserBookmarks(allBookmarks, searchQuery, selectedFolderId)
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: FLATTEN_BOOKMARK_TREE
 *   - list = []
 *   - FOR each node in nodes:
 *   - path = parentPath ? parentPath + ' / ' + (node.title || 'Unnamed') : (node.title || 'Unnamed')
 *   - IF node.url: list.push({ id: node.id, url: node.url, title: node.title || '', dateAdded: node.dateAdded ?? 0, folderPath: parentPath, parentId: node.parentId })
 *   - IF node.children: list.push(...flattenBookmarkTree(node.children, path))
 *   - RETURN list
 * 
 * ## BUILD_FOLDER_TREE
 * 
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: buildFolderTree(nodes, parentPath): pure. Returns [{ id, title, path, count, children }]. count = number of direct bookmarks (node.url) in this folder; children = recurse on node.children. Implements "folder tree with bookmark counts".
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks = flattenBookmarkTree(tree), visibleBookmarks = filterBrowserBookmarks(allBookmarks, searchQuery, selectedFolderId)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_FOLDER_TREE
 *   - result = []
 *   - FOR each node in nodes:
 *   - path = parentPath ? parentPath + ' / ' + (node.title || 'Unnamed') : (node.title || 'Unnamed')
 *   - directCount = (node.children ?? []).filter(c => c.url).length
 *   - childFolders = buildFolderTree((node.children ?? []).filter(c => !c.url), path)
 *   - result.push({ id: node.id, title: node.title || 'Unnamed', path, count: directCount, children: childFolders })
 *   - RETURN result
 * 
 * ## FILTER_BROWSER_BOOKMARKS
 * 
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: filterBrowserBookmarks(bookmarks, query, folderId): pure. Empty query returns all. If folderId: filter where parentId === folderId. Then filter by query: case-insensitive substring match on title, url, folderPath. Implements "real-time search" and "folder filter".
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks = flattenBookmarkTree(tree), visibleBookmarks = filterBrowserBookmarks(allBookmarks, searchQuery, selectedFolderId)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BROWSER_BOOKMARKS
 *   - filtered = bookmarks
 *   - IF folderId: filtered = filtered.filter(b => b.parentId === folderId)
 *   - q = String(query).trim().toLowerCase()
 *   - IF q === '': RETURN filtered
 *   - RETURN filtered.filter(b => (b.title??'').toLowerCase().includes(q) OR (b.url??'').toLowerCase().includes(q) OR (b.folderPath??'').toLowerCase().includes(q))
 * 
 * ## BLOCK_4
 * 
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: UI: search input; folder dropdown/sidebar; list section; match count. Each row: favicon, title, url, folder path. Click url: chrome.tabs.create({ url }) for http(s). Implements "match count", "click URL opens in new tab". Bulk selection and button state: selectedIds Set; renderList outputs checkbox per row; checkbox change toggles selectedIds; updateBulkButtonStates disables Open/Copy/Move/Delete/Export when selectedIds.size === 0. Select all / Deselect all buttons. Bulk actions: Open in tabs (getSelectedBookmarks, chrome.tabs.create per URL); Open in window (chrome.windows.create); Copy (buildUrlListForCopy, navigator.clipboard.writeText); Move (move select value, chrome.bookmarks.move); Delete (confirm, chrome.bookmarks.remove, push undo stack, showUndoMessage). Undo: undoStack array; UNDO_STACK_LIMIT 50; showUndoMessage(count) renders #browserBookmarksUndoBar with "Undo" button and setTimeout(UNDO_MESSAGE_DURATION_MS) to hide; on Undo click pop entry, chrome.bookmarks.create per bookmark, loadBookmarks. Export: buildBookmarksHtml/buildBookmarksCsv(selected|allBookmarks); Blob; downloadBlob. Export selected/all buttons disabled when no selection or no data. Import: populateImportFolderSelect from folderTree; file input; on Import read file.text(), parse by extension (parseBookmarksHtml|parseBookmarksCsv); get existing URLs via getSubTree(targetId)+flatten; for each row skip or overwrite per conflict; chrome.bookmarks.create; progress; loadBookmarks. Inline edit: double-click [data-field="title"] or [data-field="url"]; startInlineEdit(el): create input, replace el, focus; on blur/Enter finishEdit: chrome.bookmarks.update(id, { title }|{ url }), update allBookmarks, applyFilter(); Escape restore currentVal and applyFilter(). Keyboard: document keydown; if panel hidden return; if target in input/select/textarea and Escape blur and return; if Escape clear selectedIds and applyFilter(); if Ctrl+F preventDefault and focus searchInput. Layout: Undo bar #browserBookmarksUndoBar; import section with Import to folder, Conflict select, file input, Import button, progress; populateMoveSelect and populateImportFolderSelect mirror folder tree. Panel layout: same as Tags tree. #browserBookmarksPanel scroll container; .browser-bookmarks-above-list (flex none) with header, search, folder selector; .browser-bookmarks-list-section (min-height 100%, overflow-y auto) with #browserBookmarksList.
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: selectedIds = Set(), lastVisible = filtered+sorted list
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_4
 *   - 1. RENDER: FOR each b in visibleBookmarks: display row with favicon, title, url (clickable), folderPath; show "N bookmarks" count
 *   - 2. ON search input: searchQuery = value; applyFilter(); renderList()
 *   - 3. ON folder select: selectedFolderId = value; applyFilter(); renderList()
 *   - 4. ON sort select: sortValue = value; applyFilter(); chrome.storage.local.set({ hoverboard_browser_bookmarks_sort: sortValue })
 *   - 5. sortBrowserBookmarks(visible, sortBy, sortAsc): IF sortBy === 'default' RETURN copy; IF sortBy === 'date' sort by dateAdded; IF sortBy === 'name' sort by title; sortAsc controls direction
 *   - 6. ON url click: IF url starts with http(s): chrome.tabs.create({ url: b.url })
 *   - 7. getSelectedBookmarks() = lastVisible.filter(b => selectedIds.has(b.id))
 *   - 8. ON Select all: FOR b in lastVisible selectedIds.add(b.id); applyFilter()
 *   - 9. ON Deselect all: selectedIds.clear(); applyFilter()
 *   - 10. ON Open in tabs: FOR url in getSelectedBookmarks().map(b => b.url): chrome.tabs.create({ url })
 *   - 11. ON Open in window: chrome.windows.create({ url: getSelectedBookmarks().map(b => b.url) })
 *   - 12. ON Copy URLs: navigator.clipboard.writeText(buildUrlListForCopy(getSelectedBookmarks()))
 *   - 13. ON Move: targetId = moveSelect.value; FOR b in getSelectedBookmarks(): chrome.bookmarks.move(b.id, { parentId: targetId }); loadBookmarks()
 *   - 14. ON Delete: confirm; FOR b in getSelectedBookmarks(): chrome.bookmarks.remove(b.id); push to undoStack { bookmarks: [{ parentId, url, title }] }; showUndoMessage(count)
 *   - 15. showUndoMessage(deletedCount): render undo bar "Deleted N bookmarks. Undo"; setTimeout(hide, UNDO_MESSAGE_DURATION_MS)
 *   - 16. ON Undo click: entry = undoStack.pop(); FOR b in entry.bookmarks: chrome.bookmarks.create({ parentId: b.parentId||'1', url, title, index: 0 }); loadBookmarks()
 *   - 17. ON Export selected HTML/CSV: buildBookmarksHtml|buildBookmarksCsv(getSelectedBookmarks()); downloadBlob(blob, filename)
 *   - 18. ON Export all HTML/CSV: buildBookmarksHtml|buildBookmarksCsv(allBookmarks); downloadBlob(blob, filename)
 *   - 19. ON Import: list = parseBookmarksHtml(text)|parseBookmarksCsv(text); existingUrls = flatten(getSubTree(targetId)); FOR b in list: IF conflict skip skip; ELSE IF overwrite find and chrome.bookmarks.update OR create; ELSE chrome.bookmarks.create; update progress; loadBookmarks()
 *   - 20. ON double-click title|url: startInlineEdit(el); input.onblur|Enter => finishEdit (update then applyFilter); Escape => applyFilter (restore view)
 *   - 21. handleBookmarksKeydown(e): IF panel hidden RETURN; IF target in input|select|textarea AND Escape THEN blur; RETURN; IF Escape THEN selectedIds.clear(); applyFilter(); IF Ctrl+F THEN preventDefault; searchInput.focus()
 *   - 22. PANEL LAYOUT: above-list includes undo bar, bulk actions, import section; populateMoveSelect() and populateImportFolderSelect() from folderTree
 *   - 23. PANEL LAYOUT: browserBookmarksPanel = scroll container; above-list = header + search + folder + sort + bulk + undo + import; list-section = #browserBookmarksList
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_BOOKMARKS ===
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
