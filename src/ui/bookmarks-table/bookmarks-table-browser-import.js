/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Pure live Browser-tree import helpers used by the Local Bookmarks Index.
 */
import { flattenTree, folderPathToTags, parseExtraTags, sanitizeTag } from '../browser-bookmark-import/browser-bookmark-import-utils.js'

function cleanUrl (url) {
  if (!url) return ''
  return String(url).trim().replace(/\/+$/, '')
}

function uniqueStrings (values) {
  return [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))]
}

/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Flatten the live Chrome tree, collapse duplicate cleaned URLs, preserve the
 * earliest date, and union folder-derived tags for one import row per URL.
 */
export function normalizeBrowserImportRecords (tree) {
  const flattened = flattenTree(tree)
  const byUrl = new Map()

  for (const item of flattened) {
    const url = cleanUrl(item.url)
    if (!url) continue

    const folderPath = String(item.folderPath || '').trim()
    const folderPaths = folderPath ? [folderPath] : []
    const tags = folderPathToTags(folderPath, { stripRoots: true })
    const dateAdded = typeof item.dateAdded === 'number' ? item.dateAdded : 0
    const existing = byUrl.get(url)

    if (!existing) {
      byUrl.set(url, {
        id: item.id,
        url,
        title: item.title || '',
        dateAdded,
        folderPath,
        folderPaths,
        tags,
        sourceIds: item.id != null ? [String(item.id)] : []
      })
      continue
    }

    existing.folderPaths = uniqueStrings([...existing.folderPaths, ...folderPaths])
    existing.folderPath = existing.folderPaths.join(' | ')
    existing.tags = uniqueStrings([...existing.tags, ...tags])
    existing.sourceIds = uniqueStrings([...existing.sourceIds, item.id])
    if (dateAdded && (!existing.dateAdded || dateAdded < existing.dateAdded)) {
      existing.dateAdded = dateAdded
    }
    if (!existing.title && item.title) existing.title = item.title
  }

  return [...byUrl.values()]
}

/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Build the full-folder choices from collapsed live Browser-tree records.
 */
export function buildBrowserImportFolderList (records) {
  return [...new Set((records || []).flatMap(record => record.folderPaths || [record.folderPath]))]
    .map(path => String(path || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Filter live Browser-tree rows by title, URL, folder path, and exact folder.
 */
export function filterBrowserImportRecords (records, query = '', folderPath = '') {
  const q = String(query || '').trim().toLowerCase()
  const folder = String(folderPath || '').trim()
  return (records || []).filter(record => {
    const folderPaths = record.folderPaths || [record.folderPath || '']
    if (folder && !folderPaths.includes(folder)) return false
    if (!q) return true
    const searchable = [
      record.title,
      record.url,
      record.folderPath,
      ...folderPaths
    ].map(value => String(value || '').toLowerCase())
    return searchable.some(value => value.includes(q))
  })
}

/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Create a target payload. Merge preserves target metadata while adding
 * root-stripped folder tags and optional sanitized extra tags.
 */
export function buildBrowserImportPayload (record, {
  conflictMode = 'skip',
  existing = null,
  useFolderTags = false,
  extraTags = ''
} = {}) {
  const folderPaths = record.folderPaths || [record.folderPath || '']
  const folderTags = useFolderTags
    ? folderPaths.flatMap(path => folderPathToTags(path, { stripRoots: true }))
    : []
  const tags = uniqueStrings([
    ...(existing && conflictMode === 'merge' ? normalizeTags(existing.tags) : []),
    ...folderTags,
    ...parseExtraTags(extraTags)
  ].map(sanitizeTag))

  const description = existing && conflictMode === 'merge'
    ? (existing.description || record.title || '')
    : (record.title || '')
  const extended = existing && conflictMode === 'merge'
    ? (existing.extended || '')
    : ''
  const time = record.dateAdded
    ? new Date(record.dateAdded).toISOString()
    : new Date().toISOString()

  return {
    url: cleanUrl(record.url),
    description,
    extended,
    tags,
    time,
    shared: existing && conflictMode === 'merge' ? (existing.shared || 'yes') : 'yes',
    toread: existing && conflictMode === 'merge' ? (existing.toread || 'no') : 'no'
  }
}

/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Keep conflict lookup scoped to the selected target backend. Browser source
 * rows must never make their own live import appear to be a conflict.
 */
export function buildTargetBookmarksByUrl (bookmarks, targetBackend) {
  const byUrl = new Map()
  for (const bookmark of bookmarks || []) {
    if (String(bookmark?.storage || '').trim().toLowerCase() !== targetBackend) continue
    const url = cleanUrl(bookmark.url)
    if (url) byUrl.set(url, bookmark)
  }
  return byUrl
}

function normalizeTags (tags) {
  if (Array.isArray(tags)) return tags
  return String(tags || '').split(/\s+/).filter(Boolean)
}
