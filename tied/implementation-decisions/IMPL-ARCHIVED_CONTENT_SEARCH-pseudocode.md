# [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
# Search extracted text from Local/File archives without changing metadata search.

## REPLACE_ARCHIVED_CONTENT
- [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: synchronize one backend-scoped extracted-text entry with successful archive capture and remove it when text is empty.
- Contract:
  - INPUT: url, backend, archive entry
  - PRE: url is normalizable; entry may be absent or have empty text
  - OUTPUT: none
  - POST:
    - non-empty entry => backend plus normalized URL maps to one normalized search entry
    - missing/empty entry => the selected backend plus normalized URL is absent from the index
  - DATA: ArchiveTextIndex keyed by backend plus normalized URL
  - DATA_TRANSITION: replace updates one backend-scoped entry; empty input removes one backend-scoped entry
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: REPLACE_ARCHIVED_CONTENT
  - storage = normalizeStorage(backend OR entry.storage OR local)
  - key = ARCHIVE_ENTRY_KEY(normalize(url), storage)
  - IF entry is missing or text is empty: REMOVE_ARCHIVED_CONTENT(url, storage); RETURN
  - index[key] = normalizeEntry(entry with storage and archiveId)

## ARCHIVE_ENTRY_KEY
- [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: keep Local and File archive records distinct when they share a normalized URL.
- Contract:
  - INPUT: normalized URL, backend
  - PRE: URL is normalized; backend is local or file or defaults to local for legacy entries
  - OUTPUT: stable search key
  - POST: distinct backend/URL pairs produce distinct keys
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: ARCHIVE_ENTRY_KEY
  - storage = normalizeStorage(backend)
  - RETURN `${storage}:${normalized URL}`

## REMOVE_ARCHIVED_CONTENT
- [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: remove selected-backend derived search state when an archive is deleted or compensation removes the current archive.
- Contract:
  - INPUT: url, optional backend
  - PRE: url is normalizable
  - OUTPUT: none
  - POST: selected backend entry is absent, or all backend entries for the URL are absent when backend is omitted
  - DATA: ArchiveTextIndex keyed by backend plus normalized URL
  - DATA_TRANSITION: one or more backend-scoped entries are deleted
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: REMOVE_ARCHIVED_CONTENT
  - IF backend is supplied: DELETE index[ARCHIVE_ENTRY_KEY(normalize(url), backend)]
  - ELSE: DELETE every index entry whose URL is normalize(url)

## QUERY_ARCHIVED_CONTENT
- [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: return bounded deterministic snippets for explicit non-empty archive-content queries without mutating metadata or the index.
- Contract:
  - INPUT: query (string), ArchiveTextIndex
  - PRE: index entries came from successful archive captures
  - OUTPUT: list of { url, title, snippet, archiveStatus, storage, archiveId, readerTarget }
  - POST:
    - success => each result has a bounded snippet and deterministic order
    - empty query => empty list; index remains unchanged
  - DATA: ArchiveTextIndex
  - DATA_TRANSITION: query is read-only
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: QUERY_ARCHIVED_CONTENT
  - needle = normalizeQuery(query)
  - IF needle is empty: RETURN []
  - results = []
  - FOR each entry IN index:
    - position = findCaseInsensitive(entry.text, needle)
    - IF position >= 0: append result with bounded snippet and Reader target
  - SORT results BY position ASCENDING, capturedAt DESCENDING, storage ASCENDING, url ASCENDING
  - RETURN results

## APPLY_ARCHIVE_CONTENT_SCOPE
- [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: keep archive browse/search independent from metadata filtering and rebuild derived entries from persisted artifacts before reading.
- Contract:
  - INPUT: scope ('metadata' | 'archive'), query, archiveStore, archiveSearch
  - PRE: scope is explicit; archiveStore and archiveSearch are available
  - OUTPUT: metadata filter result | archive result list
  - POST:
    - metadata scope => archive text is not queried
    - archive scope => metadata rows and metadata actions are not mutated
    - empty archive query => deterministic browse rows
  - FAILURE_MODES: StorageFailed, SearchFailed
  - DATA: persisted archives, ArchiveTextIndex, metadata rows
  - DATA_TRANSITION: archive scope rebuilds derived entries; metadata state remains unchanged
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: APPLY_ARCHIVE_CONTENT_SCOPE
  - IF scope is not archive: RETURN APPLY_METADATA_SEARCH(query)
  - archives = AWAIT archiveStore.listArchives()
  - AWAIT archiveSearch.seed(archives)
  - IF normalizeQuery(query) is empty: RETURN BROWSE_ARCHIVED_CONTENT(archives, archiveSearch)
  - RETURN QUERY_ARCHIVED_CONTENT(query)

## BROWSE_ARCHIVED_CONTENT
- [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: map persisted archives to deterministic browse rows with bounded snippets and extension-resolvable Reader targets.
- Contract:
  - INPUT: persisted archive list, archiveSearch
  - PRE: archiveSearch is available; each archive has a URL or is discarded
  - OUTPUT: deterministic rows with title, snippet, status, storage, archiveId, capturedAt, readerTarget
  - POST: each readerTarget resolves to the selected backend archive in the extension Reader page
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: BROWSE_ARCHIVED_CONTENT
  - rows = archiveSearch.browseArchivedContent(archives)
  - FOR each row IN rows:
    - row.readerTarget = extensionRuntimeUrl('src/ui/reader/reader.html', { url: row.url, backend: row.storage, archiveId: row.archiveId })
  - RETURN rows

## OPEN_READER_FROM_ARCHIVE_RESULT
- [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: open a stored archive result in Offline Reader rather than the live page.
- Contract:
  - INPUT: archive search result with readerTarget
  - PRE: readerTarget is non-empty and generated by BROWSE_ARCHIVED_CONTENT or QUERY_ARCHIVED_CONTENT
  - OUTPUT: extension navigation target
  - POST: target opens Reader with URL/archiveId query and performs no live-page fetch
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: OPEN_READER_FROM_ARCHIVE_RESULT
  - RETURN result.readerTarget
