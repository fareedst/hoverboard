/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_BOOKMARKS ===
 * [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] — Standalone Browser Bookmarks page (legacy SIDE_PANEL_ token): data fetch, flatten, folder tree, filter, UI, click to open. Not a side-panel tab. Boundary: NOT Store B / IMPL-BROWSER_BOOKMARK_SERVICE.
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
export function flattenBookmarkTree (nodes, parentPath = '') {
  const list = []
  if (!Array.isArray(nodes)) return list
  for (const node of nodes) {
    const path = parentPath ? `${parentPath} / ${node.title || 'Unnamed'}` : (node.title || 'Unnamed')
    if (node.url) {
      list.push({
        id: node.id,
        url: node.url,
        title: node.title || '',
        dateAdded: node.dateAdded != null ? node.dateAdded : 0,
        folderPath: parentPath,
        parentId: node.parentId
      })
    }
    if (node.children && node.children.length) {
      list.push(...flattenBookmarkTree(node.children, path))
    }
  }
  return list
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Build folder hierarchy with bookmark counts. Returns [{ id, title, path, count, children }]. count = direct bookmarks in folder.
 * @param {chrome.bookmarks.BookmarkTreeNode[]} nodes
 * @param {string} parentPath
 * @returns {{ id: string, title: string, path: string, count: number, children: object[] }[]}
 */
export function buildFolderTree (nodes, parentPath = '') {
  const result = []
  if (!Array.isArray(nodes)) return result
  for (const node of nodes) {
    const path = parentPath ? `${parentPath} / ${node.title || 'Unnamed'}` : (node.title || 'Unnamed')
    const children = node.children || []
    const directCount = children.filter((c) => c.url).length
    const childFolders = buildFolderTree(children.filter((c) => !c.url), path)
    result.push({
      id: node.id,
      title: node.title || 'Unnamed',
      path,
      count: directCount,
      children: childFolders
    })
  }
  return result
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Pure filter by query (title, url, folderPath) and folderId. Empty query returns all. folderId filters by parentId === folderId.
 * Case-insensitive substring match.
 * @param {{ id: string, url?: string, title?: string, folderPath?: string, parentId?: string }[]} bookmarks
 * @param {string} query
 * @param {string|null|undefined} folderId
 * @returns {typeof bookmarks}
 */
export function filterBrowserBookmarks (bookmarks, query, folderId) {
  let filtered = bookmarks || []
  if (folderId) {
    filtered = filtered.filter((b) => b.parentId === folderId)
  }
  const q = (query == null ? '' : String(query)).trim().toLowerCase()
  if (q === '') return filtered
  return filtered.filter((b) => {
    const title = (b.title ?? '').toLowerCase()
    const url = (b.url ?? '').toLowerCase()
    const folderPath = (b.folderPath ?? '').toLowerCase()
    return title.includes(q) || url.includes(q) || folderPath.includes(q)
  })
}

/** [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] Sort options */
export const SORT_BY_DATE = 'date'
export const SORT_BY_NAME = 'name'
export const SORT_BY_DEFAULT = 'default'

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Sort bookmarks by date, name, or default (tree order). Pure function.
 * @param {{ dateAdded?: number, title?: string }[]} bookmarks
 * @param {string} sortBy - 'date' | 'name' | 'default'
 * @param {boolean} sortAsc - true = ascending, false = descending
 * @returns {typeof bookmarks}
 */
export function sortBrowserBookmarks (bookmarks, sortBy, sortAsc) {
  if (!bookmarks || bookmarks.length === 0) return bookmarks
  if (sortBy === SORT_BY_DEFAULT) return [...bookmarks]
  const arr = [...bookmarks]
  if (sortBy === SORT_BY_DATE) {
    arr.sort((a, b) => {
      const da = a.dateAdded ?? 0
      const db = b.dateAdded ?? 0
      return sortAsc ? da - db : db - da
    })
  } else if (sortBy === SORT_BY_NAME) {
    arr.sort((a, b) => {
      const ta = (a.title ?? '').toLowerCase()
      const tb = (b.title ?? '').toLowerCase()
      const cmp = ta.localeCompare(tb)
      return sortAsc ? cmp : -cmp
    })
  }
  return arr
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Build newline-separated URL list from visible bookmarks for clipboard copy.
 * @param {{ url?: string }[]} bookmarks
 * @returns {string}
 */
export function buildUrlListForCopy (bookmarks) {
  return (bookmarks || []).map((b) => b.url ?? '').filter(Boolean).join('\n')
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Build Netscape Bookmark File format HTML from bookmarks. Pure function.
 * @param {{ url?: string, title?: string, dateAdded?: number }[]} bookmarks
 * @returns {string}
 */
export function buildBookmarksHtml (bookmarks) {
  if (!bookmarks || bookmarks.length === 0) return ''
  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>'
  ]
  for (const b of bookmarks) {
    const url = (b.url ?? '').trim()
    if (!url) continue
    const title = escapeHtmlNetscape(b.title ?? url)
    const addDate = b.dateAdded != null ? Math.floor(b.dateAdded / 1000) : Math.floor(Date.now() / 1000)
    const href = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    lines.push(`    <DT><A HREF="${href}" ADD_DATE="${addDate}">${title}</A>`)
  }
  lines.push('</DL><p>')
  return lines.join('\n')
}

function escapeHtmlNetscape (str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Build CSV from bookmarks (title, url, folderPath). Pure function.
 * @param {{ url?: string, title?: string, folderPath?: string }[]} bookmarks
 * @returns {string}
 */
export function buildBookmarksCsv (bookmarks) {
  if (!bookmarks || bookmarks.length === 0) return ''
  const header = 'title,url,folderPath'
  const rows = (bookmarks || []).map((b) => {
    const title = csvEscape(b.title ?? '')
    const url = csvEscape(b.url ?? '')
    const folderPath = csvEscape(b.folderPath ?? '')
    return `${title},${url},${folderPath}`
  })
  return [header, ...rows].join('\n')
}

function csvEscape (str) {
  if (str == null) return '""'
  const s = String(str)
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return '"' + s + '"'
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Parse Netscape Bookmark File HTML to list of { url, title }. Pure function.
 * @param {string} html
 * @returns {{ url: string, title: string }[]}
 */
export function parseBookmarksHtml (html) {
  if (!html || typeof html !== 'string') return []
  const list = []
  const re = /<DT><A\s+HREF="([^"]+)"[^>]*>([\s\S]*?)<\/A>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const url = (m[1] || '').trim()
    const title = (m[2] || '').replace(/<[^>]+>/g, '').trim() || url
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ftp://'))) {
      list.push({ url, title })
    }
  }
  return list
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Parse CSV (title,url,folderPath) to list of { url, title }. Pure function.
 * @param {string} csv
 * @returns {{ url: string, title: string }[]}
 */
export function parseBookmarksCsv (csv) {
  if (!csv || typeof csv !== 'string') return []
  const lines = csv.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const list = []
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i])
    if (row.length >= 2) {
      const title = (row[0] || '').trim()
      const url = (row[1] || '').trim()
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ftp://'))) {
        list.push({ url, title: title || url })
      }
    }
  }
  return list
}

function parseCsvLine (line) {
  const result = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let val = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          i++
          if (line[i] === '"') {
            val += '"'
            i++
          } else break
        } else {
          val += line[i]
          i++
        }
      }
      result.push(val)
      if (line[i] === ',') i++
    } else {
      let val = ''
      while (i < line.length && line[i] !== ',') {
        val += line[i]
        i++
      }
      result.push(val.trim())
      if (line[i] === ',') i++
    }
  }
  return result
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Get favicon URL for a bookmark. Uses chrome favicon API or fallback data URI.
 * @param {string} url
 * @returns {string}
 */
export function getFaviconSrc (url) {
  if (!url || !url.trim()) return ''
  try {
    const u = new URL(url)
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=16`
      }
    }
  } catch (_) {}
  return ''
}

/** [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] chrome.storage.local key for sort preference */
const STORAGE_KEY_SORT = 'hoverboard_browser_bookmarks_sort'

/** [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] Undo stack max depth */
const UNDO_STACK_LIMIT = 50

/** [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] Undo message auto-dismiss seconds */
const UNDO_MESSAGE_DURATION_MS = 10000

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Init Browser Bookmarks tab: load bookmarks, render list, bind search, folder filter, sort, click handlers.
 */
export function initBrowserBookmarksTab () {
  const panel = document.getElementById('browserBookmarksPanel')
  if (!panel) return

  const searchInput = document.getElementById('browserBookmarksSearchInput')
  const folderSelect = document.getElementById('browserBookmarksFolderSelect')
  const sortSelect = document.getElementById('browserBookmarksSortSelect')
  const listEl = document.getElementById('browserBookmarksList')
  const countEl = document.getElementById('browserBookmarksCount')
  const messageEl = document.getElementById('browserBookmarksMessage')

  let allBookmarks = []
  let folderTree = []
  let selectedFolderId = null
  /** @type {Set<string>} */
  const selectedIds = new Set()
  /** @type {{ id: string, url?: string, title?: string, folderPath?: string, parentId?: string, dateAdded?: number }[]} */
  let lastVisible = []
  /** @type {{ bookmarks: object[], timestamp: number }[]} Session-scoped undo stack */
  const undoStack = []
  let undoMessageTimeoutId = null

  function parseSortValue (value) {
    if (!value) return { sortBy: SORT_BY_DATE, sortAsc: false }
    if (value === 'default') return { sortBy: SORT_BY_DEFAULT, sortAsc: true }
    const [field, dir] = value.split('-')
    const sortBy = field === 'name' ? SORT_BY_NAME : SORT_BY_DATE
    const sortAsc = dir === 'asc'
    return { sortBy, sortAsc }
  }

  function applyFilter () {
    const query = searchInput?.value ?? ''
    let visible = filterBrowserBookmarks(allBookmarks, query, selectedFolderId || null)
    const sortValue = sortSelect?.value ?? 'date-desc'
    const { sortBy, sortAsc } = parseSortValue(sortValue)
    visible = sortBrowserBookmarks(visible, sortBy, sortAsc)
    lastVisible = visible
    renderList(visible)
    if (countEl) countEl.textContent = `${visible.length} bookmark${visible.length !== 1 ? 's' : ''}`
    updateBulkButtonStates()
  }

  function renderList (visible) {
    if (!listEl) return
    listEl.innerHTML = ''
    for (const b of visible) {
      const row = document.createElement('div')
      row.className = 'browser-bookmarks-row'
      row.dataset.id = b.id
      const checked = selectedIds.has(b.id) ? ' checked' : ''
      const favicon = getFaviconSrc(b.url)
      const faviconHtml = favicon ? `<img class="browser-bookmarks-favicon" src="${escapeHtmlAttr(favicon)}" alt="" width="16" height="16">` : '<span class="browser-bookmarks-favicon-placeholder"></span>'
      const title = escapeHtml(b.title || b.url || 'Untitled')
      const url = escapeHtml(b.url || '')
      const folderPath = escapeHtml(b.folderPath || '')
      row.innerHTML = `
        <div class="browser-bookmarks-row-inner">
          <label class="browser-bookmarks-row-checkbox-wrap">
            <input type="checkbox" class="browser-bookmarks-row-checkbox" data-id="${escapeHtmlAttr(b.id)}"${checked} aria-label="Select ${escapeHtml(b.title || b.url || 'bookmark')}">
          </label>
          ${faviconHtml}
          <div class="browser-bookmarks-row-content">
            <div class="browser-bookmarks-row-title" data-id="${escapeHtmlAttr(b.id)}" data-field="title" title="Double-click to edit">${title}</div>
            <a href="#" class="browser-bookmarks-row-url" data-id="${escapeHtmlAttr(b.id)}" data-url="${escapeHtmlAttr(b.url || '')}" data-field="url" title="Click to open, double-click to edit">${url}</a>
            ${folderPath ? `<div class="browser-bookmarks-row-folder">${folderPath}</div>` : ''}
          </div>
        </div>
      `
      listEl.appendChild(row)
    }
    listEl.querySelectorAll('.browser-bookmarks-row-checkbox').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id
        if (id) {
          if (cb.checked) selectedIds.add(id)
          else selectedIds.delete(id)
          updateBulkButtonStates()
        }
      })
    })
  }

  function getSelectedBookmarks () {
    return lastVisible.filter((b) => selectedIds.has(b.id))
  }

  function updateBulkButtonStates () {
    const n = selectedIds.size
    const openTabsBtn = document.getElementById('browserBookmarksOpenTabsBtn')
    const openWindowBtn = document.getElementById('browserBookmarksOpenWindowBtn')
    const copyBtn = document.getElementById('browserBookmarksCopyBtn')
    const moveBtn = document.getElementById('browserBookmarksMoveBtn')
    const deleteBtn = document.getElementById('browserBookmarksDeleteBtn')
    const exportHtmlBtn = document.getElementById('browserBookmarksExportHtmlBtn')
    const exportCsvBtn = document.getElementById('browserBookmarksExportCsvBtn')
    const disabled = n === 0
    if (openTabsBtn) openTabsBtn.disabled = disabled
    if (openWindowBtn) openWindowBtn.disabled = disabled
    if (copyBtn) copyBtn.disabled = disabled
    if (moveBtn) moveBtn.disabled = disabled
    if (deleteBtn) deleteBtn.disabled = disabled
    if (exportHtmlBtn) exportHtmlBtn.disabled = disabled
    if (exportCsvBtn) exportCsvBtn.disabled = disabled
  }

  function showMessage (msg) {
    if (!messageEl) return
    messageEl.textContent = msg
    messageEl.classList.remove('hidden')
    const t = setTimeout(() => {
      messageEl.classList.add('hidden')
    }, 3000)
    return () => clearTimeout(t)
  }

  function showUndoMessage (deletedCount) {
    const undoBar = document.getElementById('browserBookmarksUndoBar')
    if (!undoBar) return
    if (undoMessageTimeoutId) {
      clearTimeout(undoMessageTimeoutId)
      undoMessageTimeoutId = null
    }
    undoBar.innerHTML = ''
    const span = document.createElement('span')
    span.textContent = `Deleted ${deletedCount} bookmark${deletedCount !== 1 ? 's' : ''}. `
    const undoBtn = document.createElement('button')
    undoBtn.type = 'button'
    undoBtn.className = 'btn btn-secondary browser-bookmarks-undo-btn'
    undoBtn.textContent = 'Undo'
    undoBtn.addEventListener('click', async () => {
      if (undoMessageTimeoutId) {
        clearTimeout(undoMessageTimeoutId)
        undoMessageTimeoutId = null
      }
      undoBar.classList.add('hidden')
      const entry = undoStack.pop()
      if (!entry || typeof chrome === 'undefined' || !chrome.bookmarks) return
      let restored = 0
      for (const b of entry.bookmarks) {
        try {
          await chrome.bookmarks.create({
            parentId: b.parentId || '1',
            url: b.url,
            title: b.title || '',
            index: 0
          })
          restored++
        } catch (_) { /* skip */ }
      }
      showMessage(`Restored ${restored} bookmark${restored !== 1 ? 's' : ''}`)
      await loadBookmarks()
    })
    undoBar.appendChild(span)
    undoBar.appendChild(undoBtn)
    undoBar.classList.remove('hidden')
    undoMessageTimeoutId = setTimeout(() => {
      undoBar.classList.add('hidden')
      undoMessageTimeoutId = null
    }, UNDO_MESSAGE_DURATION_MS)
  }

  function downloadBlob (blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function populateMoveSelect () {
    const moveSelect = document.getElementById('browserBookmarksMoveSelect')
    if (!moveSelect) return
    moveSelect.innerHTML = '<option value="">— Select folder —</option>'
    function addOptions (items, indent = '') {
      for (const item of items) {
        const opt = document.createElement('option')
        opt.value = item.id
        opt.textContent = `${indent}${item.title} (${item.count})`
        moveSelect.appendChild(opt)
        if (item.children && item.children.length) {
          addOptions(item.children, indent + '  ')
        }
      }
    }
    addOptions(folderTree)
  }

  function populateImportFolderSelect () {
    const importSelect = document.getElementById('browserBookmarksImportFolderSelect')
    if (!importSelect) return
    importSelect.innerHTML = ''
    function addOptions (items, indent = '') {
      for (const item of items) {
        const opt = document.createElement('option')
        opt.value = item.id
        opt.textContent = `${indent}${item.title}`
        importSelect.appendChild(opt)
        if (item.children && item.children.length) {
          addOptions(item.children, indent + '  ')
        }
      }
    }
    addOptions(folderTree)
    if (importSelect.options.length === 0) {
      const opt = document.createElement('option')
      opt.value = '1'
      opt.textContent = 'Bookmarks Bar'
      importSelect.appendChild(opt)
    }
  }

  function escapeHtml (str) {
    if (str == null) return ''
    const div = document.createElement('div')
    div.textContent = String(str)
    return div.innerHTML
  }

  function escapeHtmlAttr (str) {
    if (str == null) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function populateFolderSelect () {
    if (!folderSelect) return
    folderSelect.innerHTML = '<option value="">All folders</option>'
    function addOptions (items, indent = '') {
      for (const item of items) {
        const opt = document.createElement('option')
        opt.value = item.id
        opt.textContent = `${indent}${item.title} (${item.count})`
        folderSelect.appendChild(opt)
        if (item.children && item.children.length) {
          addOptions(item.children, indent + '  ')
        }
      }
    }
    addOptions(folderTree)
  }

  async function loadBookmarks () {
    if (messageEl) messageEl.textContent = 'Loading...'
    if (messageEl) messageEl.classList.remove('hidden')
    try {
      const tree = await new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
          chrome.bookmarks.getTree(resolve)
        } else {
          resolve([{ children: [] }])
        }
      })
      const nodes = tree[0]?.children ?? []
      allBookmarks = flattenBookmarkTree(nodes, '')
      folderTree = buildFolderTree(nodes, '')
      populateFolderSelect()
      populateMoveSelect()
      populateImportFolderSelect()
      applyFilter()
      if (messageEl) messageEl.classList.add('hidden')
    } catch (err) {
      if (messageEl) {
        messageEl.textContent = `Error: ${err?.message || 'Failed to load bookmarks'}`
        messageEl.classList.remove('hidden')
      }
    }
  }

  listEl?.addEventListener('click', (e) => {
    const link = e.target.closest('.browser-bookmarks-row-url')
    if (link && link.dataset.url && !link.classList.contains('editing')) {
      e.preventDefault()
      const url = link.dataset.url
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url })
        }
      }
    }
    const editable = e.target.closest('[data-field="title"], [data-field="url"]')
    if (editable && e.detail === 2) {
      e.preventDefault()
      startInlineEdit(editable)
    }
  })

  function startInlineEdit (el) {
    const id = el.dataset.id
    const field = el.dataset.field
    if (!id || !field) return
    const b = lastVisible.find((x) => x.id === id)
    if (!b || (typeof chrome === 'undefined' || !chrome.bookmarks)) return
    const currentVal = field === 'title' ? (b.title || b.url || '') : (b.url || '')
    const input = document.createElement('input')
    input.type = 'text'
    input.value = currentVal
    input.className = 'browser-bookmarks-inline-edit'
    input.dataset.id = id
    input.dataset.field = field
    el.classList.add('editing')
    el.replaceWith(input)
    input.focus()
    input.select()
    function finishEdit () {
      const newVal = input.value.trim()
      if (newVal && newVal !== currentVal) {
        const updates = field === 'title' ? { title: newVal } : { url: newVal }
        chrome.bookmarks.update(id, updates).then(() => {
          const idx = allBookmarks.findIndex((x) => x.id === id)
          if (idx >= 0) {
            allBookmarks[idx] = { ...allBookmarks[idx], ...updates }
          }
          applyFilter()
          showMessage('Updated')
        }).catch(() => showMessage('Update failed'))
      } else {
        applyFilter()
      }
    }
    input.addEventListener('blur', finishEdit)
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault()
        input.blur()
      } else if (ev.key === 'Escape') {
        ev.preventDefault()
        input.value = currentVal
        input.blur()
      }
    })
  }

  searchInput?.addEventListener('input', () => applyFilter())
  folderSelect?.addEventListener('change', () => {
    selectedFolderId = folderSelect.value || null
    applyFilter()
  })
  sortSelect?.addEventListener('change', () => {
    applyFilter()
    const val = sortSelect.value
    if (val && typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY_SORT]: val })
    }
  })

  const refreshBtn = document.getElementById('browserBookmarksRefreshBtn')
  refreshBtn?.addEventListener('click', () => loadBookmarks())

  document.getElementById('browserBookmarksSelectAllBtn')?.addEventListener('click', () => {
    for (const b of lastVisible) selectedIds.add(b.id)
    applyFilter()
    showMessage(`Selected ${lastVisible.length} bookmark${lastVisible.length !== 1 ? 's' : ''}`)
  })
  document.getElementById('browserBookmarksDeselectAllBtn')?.addEventListener('click', () => {
    selectedIds.clear()
    applyFilter()
    showMessage('Selection cleared')
  })

  document.getElementById('browserBookmarksOpenTabsBtn')?.addEventListener('click', async () => {
    const selected = getSelectedBookmarks()
    const urls = selected.map((b) => b.url).filter((u) => u && (u.startsWith('http://') || u.startsWith('https://')))
    if (urls.length === 0) return
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      for (const url of urls) {
        try {
          await chrome.tabs.create({ url })
        } catch (_) { /* skip */ }
      }
      showMessage(`Opened ${urls.length} tab${urls.length !== 1 ? 's' : ''}`)
    }
  })
  document.getElementById('browserBookmarksOpenWindowBtn')?.addEventListener('click', async () => {
    const selected = getSelectedBookmarks()
    const urls = selected.map((b) => b.url).filter((u) => u && (u.startsWith('http://') || u.startsWith('https://')))
    if (urls.length === 0) return
    if (typeof chrome !== 'undefined' && chrome.windows) {
      try {
        await chrome.windows.create({ url: urls })
        showMessage(`Opened ${urls.length} tab${urls.length !== 1 ? 's' : ''} in new window`)
      } catch (_) {
        showMessage('Could not open window')
      }
    }
  })
  document.getElementById('browserBookmarksCopyBtn')?.addEventListener('click', async () => {
    const selected = getSelectedBookmarks()
    const urls = buildUrlListForCopy(selected)
    if (!urls) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(urls)
        showMessage(`Copied ${selected.length} URL${selected.length !== 1 ? 's' : ''}`)
      } else {
        showMessage('Clipboard not available')
      }
    } catch (_) {
      showMessage('Copy failed')
    }
  })
  document.getElementById('browserBookmarksMoveBtn')?.addEventListener('click', async () => {
    const moveSelect = document.getElementById('browserBookmarksMoveSelect')
    const targetId = moveSelect?.value?.trim()
    if (!targetId) {
      showMessage('Select a folder first')
      return
    }
    const selected = getSelectedBookmarks()
    if (selected.length === 0) return
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return
    let moved = 0
    for (const b of selected) {
      try {
        await chrome.bookmarks.move(b.id, { parentId: targetId })
        moved++
        selectedIds.delete(b.id)
      } catch (_) { /* skip */ }
    }
    showMessage(`Moved ${moved} bookmark${moved !== 1 ? 's' : ''}`)
    await loadBookmarks()
  })
  document.getElementById('browserBookmarksDeleteBtn')?.addEventListener('click', async () => {
    const selected = getSelectedBookmarks()
    if (selected.length === 0) return
    if (!confirm(`Delete ${selected.length} bookmark${selected.length !== 1 ? 's' : ''}?`)) return
    if (typeof chrome === 'undefined' || !chrome.bookmarks) return
    const toUndo = selected.map((b) => ({ parentId: b.parentId, url: b.url, title: b.title, index: 0 }))
    let deleted = 0
    for (const b of selected) {
      try {
        await chrome.bookmarks.remove(b.id)
        deleted++
        selectedIds.delete(b.id)
      } catch (_) { /* skip */ }
    }
    if (toUndo.length > 0) {
      while (undoStack.length >= UNDO_STACK_LIMIT) undoStack.shift()
      undoStack.push({ bookmarks: toUndo, timestamp: Date.now() })
      showUndoMessage(deleted)
    }
    showMessage(`Deleted ${deleted} bookmark${deleted !== 1 ? 's' : ''}`)
    await loadBookmarks()
  })
  document.getElementById('browserBookmarksExportHtmlBtn')?.addEventListener('click', () => {
    const selected = getSelectedBookmarks()
    if (selected.length === 0) return
    const html = buildBookmarksHtml(selected)
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `bookmarks-selected-${date}.html`)
    showMessage(`Exported ${selected.length} bookmark${selected.length !== 1 ? 's' : ''} as HTML`)
  })
  document.getElementById('browserBookmarksExportCsvBtn')?.addEventListener('click', () => {
    const selected = getSelectedBookmarks()
    if (selected.length === 0) return
    const csv = buildBookmarksCsv(selected)
    const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' })
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `bookmarks-selected-${date}.csv`)
    showMessage(`Exported ${selected.length} bookmark${selected.length !== 1 ? 's' : ''} as CSV`)
  })
  document.getElementById('browserBookmarksExportAllHtmlBtn')?.addEventListener('click', () => {
    if (allBookmarks.length === 0) return
    const html = buildBookmarksHtml(allBookmarks)
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `bookmarks-all-${date}.html`)
    showMessage(`Exported ${allBookmarks.length} bookmark${allBookmarks.length !== 1 ? 's' : ''} as HTML`)
  })
  document.getElementById('browserBookmarksExportAllCsvBtn')?.addEventListener('click', () => {
    if (allBookmarks.length === 0) return
    const csv = buildBookmarksCsv(allBookmarks)
    const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' })
    const date = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `bookmarks-all-${date}.csv`)
    showMessage(`Exported ${allBookmarks.length} bookmark${allBookmarks.length !== 1 ? 's' : ''} as CSV`)
  })

  const importFileInput = document.getElementById('browserBookmarksImportFileInput')
  const importBtn = document.getElementById('browserBookmarksImportBtn')
  const importProgressEl = document.getElementById('browserBookmarksImportProgress')
  importFileInput?.addEventListener('change', () => {
    if (importBtn) importBtn.disabled = !importFileInput?.files?.length
  })
  importBtn?.addEventListener('click', async () => {
    const file = importFileInput?.files?.[0]
    if (!file || typeof chrome === 'undefined' || !chrome.bookmarks) return
    const targetId = document.getElementById('browserBookmarksImportFolderSelect')?.value || '1'
    const conflictMode = document.getElementById('browserBookmarksConflictMode')?.value || 'skip'
    let list = []
    const name = (file.name || '').toLowerCase()
    try {
      const text = await file.text()
      if (name.endsWith('.csv')) {
        list = parseBookmarksCsv(text)
      } else {
        list = parseBookmarksHtml(text)
      }
    } catch (_) {
      showMessage('Failed to read file')
      return
    }
    if (list.length === 0) {
      showMessage('No bookmarks found in file')
      return
    }
    let existingUrls = new Set()
    if (conflictMode === 'skip' || conflictMode === 'overwrite') {
      try {
        const subtree = await new Promise((resolve) => chrome.bookmarks.getSubTree(targetId, resolve))
        const flat = flattenBookmarkTree(subtree[0]?.children ?? [], '')
        existingUrls = new Set(flat.map((b) => (b.url || '').toLowerCase()))
      } catch (_) { /* ignore */ }
    }
    importBtn.disabled = true
    if (importProgressEl) {
      importProgressEl.textContent = `Importing 0 / ${list.length}...`
      importProgressEl.classList.remove('hidden')
    }
    let created = 0
    let skipped = 0
    let updated = 0
    for (let i = 0; i < list.length; i++) {
      const b = list[i]
      const urlLower = (b.url || '').toLowerCase()
      const exists = existingUrls.has(urlLower)
      if (conflictMode === 'skip' && exists) {
        skipped++
      } else if (conflictMode === 'overwrite' && exists) {
        try {
          const searchRes = await new Promise((resolve) => chrome.bookmarks.search({ url: b.url }, resolve))
          let nodeToUpdate = null
          for (const n of searchRes) {
            if (n.parentId === targetId) {
              nodeToUpdate = n
              break
            }
            if (n.parentId && (await isInFolder(n.parentId, targetId))) {
              nodeToUpdate = n
              break
            }
          }
          if (nodeToUpdate) {
            await chrome.bookmarks.update(nodeToUpdate.id, { title: b.title || b.url })
            updated++
          } else {
            await chrome.bookmarks.create({ parentId: targetId, url: b.url, title: b.title || b.url, index: 0 })
            created++
            existingUrls.add(urlLower)
          }
        } catch (_) {
          await chrome.bookmarks.create({ parentId: targetId, url: b.url, title: b.title || b.url, index: 0 })
          created++
          existingUrls.add(urlLower)
        }
      } else {
        try {
          await chrome.bookmarks.create({ parentId: targetId, url: b.url, title: b.title || b.url, index: 0 })
          created++
          existingUrls.add(urlLower)
        } catch (_) { /* skip */ }
      }
      if (importProgressEl && (i % 10 === 0 || i === list.length - 1)) {
        importProgressEl.textContent = `Importing ${i + 1} / ${list.length}...`
      }
    }
    importBtn.disabled = false
    if (importProgressEl) {
      importProgressEl.textContent = `Imported: ${created} created, ${skipped} skipped, ${updated} updated`
      importProgressEl.classList.remove('hidden')
      setTimeout(() => importProgressEl.classList.add('hidden'), 5000)
    }
    showMessage(`Imported ${created + updated} bookmark${created + updated !== 1 ? 's' : ''}`)
    await loadBookmarks()
  })

  async function isInFolder (folderId, targetId) {
    if (folderId === targetId) return true
    try {
      const nodes = await new Promise((resolve) => chrome.bookmarks.get(folderId, resolve))
      const parentId = nodes[0]?.parentId
      if (!parentId) return false
      return isInFolder(parentId, targetId)
    } catch (_) {
      return false
    }
  }

  async function loadSortPreference () {
    if (!sortSelect || typeof chrome === 'undefined' || !chrome.storage?.local) return
    try {
      const result = await new Promise((resolve) => chrome.storage.local.get([STORAGE_KEY_SORT], resolve))
      const saved = result[STORAGE_KEY_SORT]
      if (saved && sortSelect.querySelector(`option[value="${saved}"]`)) {
        sortSelect.value = saved
      }
    } catch (_) {}
  }

  // [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] Keyboard shortcuts when panel has focus
  function setupKeyboardShortcuts () {
    document.addEventListener('keydown', handleBookmarksKeydown)
  }
  function handleBookmarksKeydown (e) {
    const panel = document.getElementById('browserBookmarksPanel')
    if (!panel || panel.hasAttribute('hidden')) return
    if (e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) {
      if (e.key === 'Escape') (e.target).blur()
      return
    }
    if (e.key === 'Escape') {
      selectedIds.clear()
      applyFilter()
      showMessage('Selection cleared')
      e.preventDefault()
    } else if (e.ctrlKey && e.key === 'f') {
      e.preventDefault()
      searchInput?.focus()
    }
  }
  setupKeyboardShortcuts()

  loadSortPreference().then(() => loadBookmarks())
}
