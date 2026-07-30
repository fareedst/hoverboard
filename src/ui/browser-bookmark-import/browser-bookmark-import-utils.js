/**
 * === IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_IMPORT ===
 * [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] — getTree, flattenTree, filters, selection, conflict resolution (Skip/Overwrite/Merge), folder+extra tags, saveBookmark per row. Import to is Local|File|Sync only: Browser excluded as target because source is already chrome.bookmarks (distinct from Index Import which allows Store B).
 *
 * ## RUN_IMPORT
 *
 * - [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements runImport() behavior for IMPL-BROWSER_BOOKMARK_IMPORT.
 * - Contract:
 *   - INPUT: chrome.bookmarks.getTree(), user selection (selectedUrls), conflict mode (Skip|Overwrite|Merge), Use folder names as tags, Add tags, Import to (Local|File|Sync; Browser excluded)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: imported/skipped/failed counts; table of browser bookmarks with Select, Title, URL, Folder, Date | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: allBookmarks (flattened), folderList, existingByUrl (from getAggregatedBookmarksForIndex), selectedUrls (set)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_IMPORT
 *   - existingByUrl = getAggregatedBookmarksForIndex() keyed by url (or getLocalBookmarksForIndex)
 *   - folderTags = folderPathToTags(selected folder paths) if "Use folder names as tags"; extraTags = parseExtraTags(input)
 *   - FOR each selected item IN allBookmarks WHERE url IN selectedUrls:
 *   - payload = { url, description: title, time: dateAdded ISO, tags: folderTags + extraTags, preferredBackend }
 *   - IF url IN existingByUrl:
 *   - IF Skip: skip; skipped++
 *   - IF Overwrite: SEND saveBookmark(payload); imported++
 *   - IF Merge: merge tags + keep existing description/extended; SEND saveBookmark(merged); imported++
 *   - ELSE: SEND saveBookmark(payload); imported++ (or failed++ on error)
 *   - SHOW "Imported N, skipped M, K failed"
 *
 * === END IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_IMPORT ===
 */
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
const CHROME_ROOT_TITLES = new Set([
  'bookmarks bar',
  'bookmarks_bar',
  'bookmark bar',
  'other bookmarks',
  'other_bookmarks',
  'other bookmark',
  'mobile bookmarks',
  'mobile_bookmarks'
])

/**
 * [IMPL-BROWSER_BOOKMARK_IMPORT] Sanitize a string to a valid tag: lowercase, alphanumeric and underscores only.
 */
export function sanitizeTag (str) {
  if (str == null || String(str).trim() === '') return ''
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, '_') || ''
}

/**
 * [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BROWSER_BOOKMARK_SERVICE] Strip Chrome root folder titles from path segments.
 * @param {string[]} segments
 * @returns {string[]}
 */
export function stripChromeRootSegments (segments) {
  if (!Array.isArray(segments)) return []
  return segments.filter(seg => {
    const key = String(seg || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const underscored = key.replace(/\s+/g, '_')
    return !CHROME_ROOT_TITLES.has(key) && !CHROME_ROOT_TITLES.has(underscored)
  })
}

/**
 * [IMPL-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BROWSER_BOOKMARK_SERVICE]
 * Derive tags from folder path: each segment becomes a tag (sanitized).
 * @param {string} folderPath
 * @param {{ stripRoots?: boolean }} [options] - when stripRoots true, omit Chrome root labels (provider); default false for import compat
 */
export function folderPathToTags (folderPath, options = {}) {
  if (!folderPath || !folderPath.trim()) return []
  let segments = folderPath.split(/\s*\/\s*/).filter(Boolean)
  if (options.stripRoots) {
    segments = stripChromeRootSegments(segments)
  }
  const tags = []
  const seen = new Set()
  for (const seg of segments) {
    const tag = sanitizeTag(seg)
    if (tag && !seen.has(tag)) {
      seen.add(tag)
      tags.push(tag)
    }
  }
  return tags
}

/**
 * [IMPL-BROWSER_BOOKMARK_IMPORT] Parse extra tags input (comma-separated) and sanitize.
 */
export function parseExtraTags (inputValue) {
  if (!inputValue || !inputValue.trim()) return []
  const raw = inputValue.split(',').map(s => s.trim()).filter(Boolean)
  const tags = []
  const seen = new Set()
  for (const s of raw) {
    const tag = sanitizeTag(s)
    if (tag && !seen.has(tag)) {
      seen.add(tag)
      tags.push(tag)
    }
  }
  return tags
}

/**
 * [IMPL-BROWSER_BOOKMARK_IMPORT] Recursively flatten bookmark tree to list of items with url, title, dateAdded, id, folderPath.
 */
export function flattenTree (nodes, parentPath = '') {
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
        folderPath: parentPath || (node.title || ''),
        parentId: node.parentId
      })
    }
    if (node.children && node.children.length) {
      list.push(...flattenTree(node.children, path))
    }
  }
  return list
}

function cleanUrlKey (url) {
  if (!url) return ''
  return String(url).trim().replace(/\/+$/, '')
}

/**
 * [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BROWSER_BOOKMARK_SERVICE]
 * Collapse duplicate URL items into one pin-shaped bookmark; merge tags; keep nodeIds.
 * @param {Array<{ id?: string, url?: string, title?: string, dateAdded?: number, tags?: string[] }>} items
 * @returns {Array<{ url: string, description: string, extended: string, tags: string[], time: string, updated_at: string, shared: string, toread: string, hash: string, nodeIds: string[] }>}
 */
export function collapseByUrl (items) {
  const map = new Map()
  if (!Array.isArray(items)) return []
  for (const item of items) {
    if (!item || !item.url) continue
    const key = cleanUrlKey(item.url)
    if (!key) continue
    const tags = Array.isArray(item.tags) ? item.tags : []
    const time = item.dateAdded
      ? new Date(item.dateAdded).toISOString()
      : (item.time || '')
    if (!map.has(key)) {
      map.set(key, {
        url: key,
        description: item.title || item.description || '',
        extended: '',
        tags: [...tags],
        time,
        updated_at: time,
        shared: 'yes',
        toread: 'no',
        hash: '',
        nodeIds: item.id != null ? [String(item.id)] : []
      })
    } else {
      const existing = map.get(key)
      const seen = new Set(existing.tags)
      for (const t of tags) {
        if (t && !seen.has(t)) {
          seen.add(t)
          existing.tags.push(t)
        }
      }
      if (item.id != null) existing.nodeIds.push(String(item.id))
      if (time && (!existing.time || time < existing.time)) {
        existing.time = time
        existing.updated_at = time
      }
    }
  }
  return Array.from(map.values())
}
