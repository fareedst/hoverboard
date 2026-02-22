/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
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
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Build CSV with Time (create) and Updated (most-recent-update-time).
 * Columns: Title, URL, Tags, Time, Updated, Storage, Shared, To read, Notes.
 * Storage column: Local | File | Sync.
 */
export function buildCsv (bookmarks) {
  const header = 'Title,URL,Tags,Time,Updated,Storage,Shared,To read,Notes'
  const rows = bookmarks.map(b => {
    const title = b.description ?? ''
    const url = b.url ?? ''
    const tags = Array.isArray(b.tags) ? b.tags.join(', ') : String(b.tags ?? '')
    const time = b.time ? new Date(b.time).toISOString() : ''
    const updated = (b.updated_at ?? b.time) ? new Date(b.updated_at ?? b.time).toISOString() : ''
    const storage = b.storage === 'sync' ? 'Sync' : (b.storage === 'file' ? 'File' : 'Local')
    const shared = b.shared === 'no' ? 'Private' : 'Public'
    const toread = b.toread === 'yes' ? 'Yes' : 'No'
    const notes = b.extended ?? ''
    return [escapeCsvField(title), escapeCsvField(url), escapeCsvField(tags), escapeCsvField(time), escapeCsvField(updated), escapeCsvField(storage), escapeCsvField(shared), escapeCsvField(toread), escapeCsvField(notes)].join(',')
  })
  return [header, ...rows].join('\r\n')
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Parse CSV (with or without Updated column); default updated_at = time when missing.
 * Columns: Title, URL, Tags, Time, [Updated], Storage, Shared, To read, Notes.
 * Handles quoted fields and "" as escaped quote. Skips header row; skips rows with empty URL.
 * @param {string} csvString - Full CSV text (header + data rows)
 * @returns {Array<{ description: string, url: string, tags: string[], time: string, updated_at?: string, shared: string, toread: string, extended: string }>}
 */
export function parseCsv (csvString) {
  if (!csvString || typeof csvString !== 'string') return []
  const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []
  const out = []
  const header = lines[0]
  const skipHeader = header.trim().toLowerCase().startsWith('title,url')
  const hasUpdatedColumn = header.trim().toLowerCase().includes('updated')
  const dataLines = skipHeader ? lines.slice(1) : lines
  for (const line of dataLines) {
    const fields = parseCsvLine(line)
    if (fields.length < 2) continue
    const time = (fields[3] || '').trim()
    let updatedAt = time
    let _storage, sharedStr, toreadStr, notes
    if (hasUpdatedColumn && fields.length >= 9) {
      updatedAt = (fields[4] || '').trim() || time
      _storage = fields[5]
      sharedStr = fields[6]
      toreadStr = fields[7]
      notes = fields[8]
    } else {
      _storage = fields[4]
      sharedStr = fields[5]
      toreadStr = fields[6]
      notes = fields[7]
    }
    const [title, url, tagsStr] = [fields[0], fields[1], fields[2]]
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
      time,
      updated_at: updatedAt,
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
