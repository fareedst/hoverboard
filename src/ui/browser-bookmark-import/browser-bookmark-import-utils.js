/**
 * Browser Bookmark Import utilities - [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Pure functions for tag sanitization, folder-path-to-tags, extra tags parsing, and tree flattening. Used by browser-bookmark-import.js and unit tests.
 */

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
 * [IMPL-BROWSER_BOOKMARK_IMPORT] Derive tags from folder path: each segment becomes a tag (sanitized).
 */
export function folderPathToTags (folderPath) {
  if (!folderPath || !folderPath.trim()) return []
  const segments = folderPath.split(/\s*\/\s*/).filter(Boolean)
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
        folderPath: parentPath || (node.title || '')
      })
    }
    if (node.children && node.children.length) {
      list.push(...flattenTree(node.children, path))
    }
  }
  return list
}
