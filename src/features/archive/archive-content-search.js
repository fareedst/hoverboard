/**
 * === IMPL-FULL-BLOCK: IMPL-ARCHIVED_CONTENT_SEARCH ===
 * Search extracted text from Local/File archives without changing metadata search.
 *
 * ## REPLACE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: synchronize one extracted-text entry with successful archive capture and remove it when text is empty.
 * - Contract:
 *   - INPUT: url, archive entry
 *   - PRE: url is normalizable; entry may be absent or have empty text
 *   - OUTPUT: none
 *   - POST:
 *     - non-empty entry => normalized URL maps to one normalized search entry
 *     - missing/empty entry => normalized URL is absent from the index
 *   - DATA: ArchiveTextIndex
 *   - DATA_TRANSITION: replace updates one URL; empty input removes one URL
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_ARCHIVED_CONTENT
 *   - IF entry is missing or text is empty: REMOVE_ARCHIVED_CONTENT(url); RETURN
 *   - index[normalize(url)] = normalizeEntry(entry)
 *
 * ## REMOVE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: remove derived search state when an archive is deleted or compensation removes the current archive.
 * - Contract:
 *   - INPUT: url
 *   - PRE: url is normalizable
 *   - OUTPUT: none
 *   - POST: normalized URL is absent from ArchiveTextIndex
 *   - DATA: ArchiveTextIndex
 *   - DATA_TRANSITION: one normalized URL is deleted
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: REMOVE_ARCHIVED_CONTENT
 *   - DELETE index[normalize(url)]
 *
 * ## QUERY_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: return bounded deterministic snippets for explicit non-empty archive-content queries without mutating metadata or the index.
 * - Contract:
 *   - INPUT: query (string), ArchiveTextIndex
 *   - PRE: index entries came from successful archive captures
 *   - OUTPUT: list of { url, title, snippet, archiveStatus, readerTarget }
 *   - POST:
 *     - success => each result has a bounded snippet and deterministic order
 *     - empty query => empty list; index remains unchanged
 *   - DATA: ArchiveTextIndex
 *   - DATA_TRANSITION: query is read-only
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: QUERY_ARCHIVED_CONTENT
 *   - needle = normalizeQuery(query)
 *   - IF needle is empty: RETURN []
 *   - results = []
 *   - FOR each entry IN index:
 *     - position = findCaseInsensitive(entry.text, needle)
 *     - IF position >= 0: append result with bounded snippet and Reader target
 *   - SORT results BY position ASCENDING, capturedAt DESCENDING, url ASCENDING
 *   - RETURN results
 *
 * ## APPLY_ARCHIVE_CONTENT_SCOPE
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: keep archive browse/search independent from metadata filtering and rebuild derived entries from persisted artifacts before reading.
 * - Contract:
 *   - INPUT: scope ('metadata' | 'archive'), query, archiveStore, archiveSearch
 *   - PRE: scope is explicit; archiveStore and archiveSearch are available
 *   - OUTPUT: metadata filter result | archive result list
 *   - POST:
 *     - metadata scope => archive text is not queried
 *     - archive scope => metadata rows and metadata actions are not mutated
 *     - empty archive query => deterministic browse rows
 *   - FAILURE_MODES: StorageFailed, SearchFailed
 *   - DATA: persisted archives, ArchiveTextIndex, metadata rows
 *   - DATA_TRANSITION: archive scope rebuilds derived entries; metadata state remains unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_ARCHIVE_CONTENT_SCOPE
 *   - IF scope is not archive: RETURN APPLY_METADATA_SEARCH(query)
 *   - archives = AWAIT archiveStore.listArchives()
 *   - AWAIT archiveSearch.seed(archives)
 *   - IF normalizeQuery(query) is empty: RETURN BROWSE_ARCHIVED_CONTENT(archives, archiveSearch)
 *   - RETURN QUERY_ARCHIVED_CONTENT(query)
 *
 * ## BROWSE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: map persisted archives to deterministic browse rows with bounded snippets and extension-resolvable Reader targets.
 * - Contract:
 *   - INPUT: persisted archive list, archiveSearch
 *   - PRE: archiveSearch is available; each archive has a URL or is discarded
 *   - OUTPUT: deterministic rows with title, snippet, status, storage, capturedAt, readerTarget
 *   - POST: each readerTarget resolves to the extension Reader page
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BROWSE_ARCHIVED_CONTENT
 *   - rows = archiveSearch.browseArchivedContent(archives)
 *   - FOR each row IN rows:
 *     - row.readerTarget = extensionRuntimeUrl('src/ui/reader/reader.html', { url: row.url })
 *   - RETURN rows
 *
 * ## OPEN_READER_FROM_ARCHIVE_RESULT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: open a stored archive result in Offline Reader rather than the live page.
 * - Contract:
 *   - INPUT: archive search result with readerTarget
 *   - PRE: readerTarget is non-empty and generated by BROWSE_ARCHIVED_CONTENT or QUERY_ARCHIVED_CONTENT
 *   - OUTPUT: extension navigation target
 *   - POST: target opens Reader with URL/archiveId query and performs no live-page fetch
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_READER_FROM_ARCHIVE_RESULT
 *   - RETURN result.readerTarget
 *
 * === END IMPL-FULL-BLOCK: IMPL-ARCHIVED_CONTENT_SEARCH ===
 */
import { normalizeArchiveUrl } from './page-capture.js'

const DEFAULT_SNIPPET_LENGTH = 180

function normalizeQuery (query) {
  return String(query || '').trim().toLowerCase()
}

function snippetAround (text, position, length) {
  const source = String(text || '')
  const start = Math.max(0, position - Math.floor(length / 3))
  const end = Math.min(source.length, start + length)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < source.length ? '…' : ''
  return `${prefix}${source.slice(start, end).trim()}${suffix}`
}

export class ArchiveContentSearch {
  constructor ({ snippetLength = DEFAULT_SNIPPET_LENGTH } = {}) {
    this.entries = new Map()
    this.snippetLength = snippetLength
  }

  /**
   * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
   * Replace one search entry after successful archive capture or remove it when text is empty.
   */
  async replaceArchivedContent (url, archive) {
    const key = normalizeArchiveUrl(url)
    if (!key || !archive?.textContent) {
      await this.removeArchivedContent(key)
      return
    }
    this.entries.set(key, {
      url: key,
      title: archive.sourceTitle || archive.title || key,
      textContent: String(archive.textContent),
      capturedAt: archive.capturedAt || '',
      status: archive.status || 'available',
      archiveId: archive.archiveId || '',
      storage: archive.storage || ''
    })
  }

  /**
   * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
   * Remove derived search state when archive content is deleted.
   */
  async removeArchivedContent (url) {
    this.entries.delete(normalizeArchiveUrl(url))
  }

  /**
   * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
   * Return bounded snippets ordered by match position, capture time, then URL.
   */
  queryArchivedContent (query) {
    const needle = normalizeQuery(query)
    if (!needle) return []
    const results = []
    for (const entry of this.entries.values()) {
      const position = entry.textContent.toLowerCase().indexOf(needle)
      if (position < 0) continue
      results.push({
        url: entry.url,
        title: entry.title,
        snippet: snippetAround(entry.textContent, position, this.snippetLength),
        archiveStatus: entry.status,
        storage: entry.storage,
        readerTarget: `src/ui/reader/reader.html?url=${encodeURIComponent(entry.url)}`,
        capturedAt: entry.capturedAt,
        position
      })
    }
    return results.sort((a, b) => (
      a.position - b.position ||
      String(b.capturedAt).localeCompare(String(a.capturedAt)) ||
      a.url.localeCompare(b.url)
    ))
  }

  /**
   * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
   * List stored archives for explicit archive scope when no text query is entered.
   */
  browseArchivedContent (archives = []) {
    return (Array.isArray(archives) ? archives : [])
      .filter(archive => archive?.url)
      .map(archive => {
        const url = normalizeArchiveUrl(archive.url)
        const text = String(archive.textContent || '')
        return {
          url,
          title: archive.sourceTitle || archive.title || url,
          snippet: text ? snippetAround(text, 0, this.snippetLength) : '(archived page)',
          archiveStatus: archive.status || 'available',
          storage: archive.storage || '',
          readerTarget: `src/ui/reader/reader.html?url=${encodeURIComponent(url)}`,
          capturedAt: archive.capturedAt || '',
          position: 0
        }
      })
      .sort((a, b) => (
        String(b.capturedAt).localeCompare(String(a.capturedAt)) ||
        a.url.localeCompare(b.url)
      ))
  }

  seed (archives = []) {
    this.entries.clear()
    for (const archive of archives) {
      if (archive?.url) this.replaceArchivedContent(archive.url, archive)
    }
  }
}

export { DEFAULT_SNIPPET_LENGTH, normalizeQuery, snippetAround }
