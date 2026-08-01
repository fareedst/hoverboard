/**
 * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
 * Keep archive-content result mapping separate from the existing metadata filter pipeline.
 */
export function buildArchiveSearchMessage (query) {
  return { type: 'SEARCH_ARCHIVED_CONTENT', data: { query: String(query || '') } }
}

function buildReaderTarget (url, fallback = '') {
  const encodedUrl = encodeURIComponent(String(url || ''))
  const readerPath = `src/ui/reader/reader.html?url=${encodedUrl}`
  const runtime = globalThis.chrome?.runtime || globalThis.browser?.runtime
  if (typeof runtime?.getURL === 'function') return runtime.getURL(readerPath)
  return fallback || readerPath
}

export function mapArchiveSearchResults (results = []) {
  return (Array.isArray(results) ? results : []).map(result => ({
    url: result.url || '',
    description: result.title || result.url || '(untitled archive)',
    extended: result.snippet || '',
    archiveSnippet: result.snippet || '',
    archiveStatus: result.archiveStatus || 'available',
    // [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] Resolve Reader navigation from the extension runtime so Index links do not resolve relative to the bookmarks-table directory.
    readerTarget: buildReaderTarget(result.url, result.readerTarget),
    capturedAt: result.capturedAt || '',
    time: result.capturedAt || '',
    updated_at: result.capturedAt || '',
    storage: result.storage || 'local',
    tags: []
  }))
}
