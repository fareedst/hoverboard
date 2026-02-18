/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * CSV helpers for Local Bookmarks Index export (all, displayed, selected).
 */

/**
 * Escape a field for CSV: wrap in double quotes, escape internal " as "".
 */
export function escapeCsvField (str) {
  if (str == null) return '""'
  const s = String(str).replace(/"/g, '""')
  return `"${s}"`
}

/**
 * Build CSV string from bookmark array. Columns: Title, URL, Tags, Time, Storage, Shared, To read, Notes.
 * Storage column: Local | File | Sync.
 */
export function buildCsv (bookmarks) {
  const header = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes'
  const rows = bookmarks.map(b => {
    const title = b.description ?? ''
    const url = b.url ?? ''
    const tags = Array.isArray(b.tags) ? b.tags.join(', ') : String(b.tags ?? '')
    const time = b.time ? new Date(b.time).toISOString() : ''
    const storage = b.storage === 'sync' ? 'Sync' : (b.storage === 'file' ? 'File' : 'Local')
    const shared = b.shared === 'no' ? 'Private' : 'Public'
    const toread = b.toread === 'yes' ? 'Yes' : 'No'
    const notes = b.extended ?? ''
    return [escapeCsvField(title), escapeCsvField(url), escapeCsvField(tags), escapeCsvField(time), escapeCsvField(storage), escapeCsvField(shared), escapeCsvField(toread), escapeCsvField(notes)].join(',')
  })
  return [header, ...rows].join('\r\n')
}
