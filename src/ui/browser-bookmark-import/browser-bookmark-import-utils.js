/**
 * Browser Bookmark Import utilities - [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Shared helpers also used by BrowserBookmarkService - [REQ-BROWSER_BOOKMARK_STORAGE] [IMPL-BROWSER_BOOKMARK_SERVICE]
 * Pure functions for tag sanitization, folder-path-to-tags, extra tags parsing, tree flattening, root strip, URL collapse.
 */

/** Chrome well-known root folder titles (locale variants). Prefer folder ids '1'/'2' when available. */
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
