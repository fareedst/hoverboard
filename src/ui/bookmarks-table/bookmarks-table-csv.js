/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * CSV helpers for Local Bookmarks Index export and import (all, displayed, selected).
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

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Parse CSV string (export format) into array of bookmark-like objects.
 * Columns: Title, URL, Tags, Time, Storage, Shared, To read, Notes.
 * Handles quoted fields and "" as escaped quote. Skips header row; skips rows with empty URL.
 * @param {string} csvString - Full CSV text (header + data rows)
 * @returns {Array<{ description: string, url: string, tags: string[], time: string, shared: string, toread: string, extended: string }>}
 */
export function parseCsv (csvString) {
  if (!csvString || typeof csvString !== 'string') return []
  const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []
  const out = []
  const header = lines[0]
  const skipHeader = header.trim().toLowerCase().startsWith('title,url')
  const dataLines = skipHeader ? lines.slice(1) : lines
  for (const line of dataLines) {
    const fields = parseCsvLine(line)
    if (fields.length < 2) continue
    const [title, url, tagsStr, time, _storage, sharedStr, toreadStr, notes] = fields
    const urlTrim = (url || '').trim()
    if (!urlTrim) continue
    const tags = (tagsStr || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    const shared = (sharedStr || '').toLowerCase().includes('private') ? 'no' : 'yes'
    const toread = (toreadStr || '').toLowerCase().includes('yes') ? 'yes' : 'no'
    out.push({
      description: (title || '').trim(),
      url: urlTrim,
      tags,
      time: (time || '').trim(),
      shared,
      toread,
      extended: (notes || '').trim()
    })
  }
  return out
}

/**
 * Parse a single CSV line into fields. Handles quoted fields and "" escape.
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine (line) {
  const fields = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let value = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            value += '"'
            i += 2
          } else {
            i++
            break
          }
        } else {
          value += line[i]
          i++
        }
      }
      fields.push(value)
      if (line[i] === ',') i++
    } else {
      let value = ''
      while (i < line.length && line[i] !== ',') {
        value += line[i]
        i++
      }
      fields.push(value.trim())
      if (line[i] === ',') i++
    }
  }
  return fields
}
