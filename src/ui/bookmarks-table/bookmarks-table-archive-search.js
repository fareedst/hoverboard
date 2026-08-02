/**
 * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
 * Keep archive-content result mapping separate from the existing metadata filter pipeline.
 */
export function buildArchiveSearchMessage (query) {
  return { type: 'SEARCH_ARCHIVED_CONTENT', data: { query: String(query || '') } }
}

function buildReaderTarget (result = {}, fallback = '') {
  const params = new URLSearchParams()
  params.set('url', String(result.url || ''))
  if (result.storage) params.set('backend', String(result.storage))
  if (result.archiveId) params.set('archiveId', String(result.archiveId))
  const readerPath = `src/ui/reader/reader.html?${params.toString()}`
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
    readerTarget: buildReaderTarget(result, result.readerTarget),
    archiveId: result.archiveId || '',
    capturedAt: result.capturedAt || '',
    time: result.capturedAt || '',
    updated_at: result.capturedAt || '',
    storage: result.storage || 'local',
    tags: []
  }))
}
