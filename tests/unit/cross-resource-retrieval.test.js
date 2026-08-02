/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Unit tests for the read-only, source-aware retrieval contract.
 */
/**
 * ## NORMALIZE_RETRIEVAL_QUERY
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: normalize query text, explicit source scopes, result cap, and offset before any source is read.
 * - Contract:
 *   - INPUT: query text, optional scopes, optional limit, optional offset
 *   - PRE: query is string-like; scopes, when supplied, are from the supported source set
 *   - OUTPUT: normalized query request | { error: InvalidQuery | InvalidScope | InvalidPagination }
 *   - POST:
 *     - success => query is trimmed and case-folded for matching; scopes are explicit and ordered; limit is between 1 and 100; offset is non-negative
 *     - error => no source adapter is called
 *   - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_RETRIEVAL_QUERY
 *   - IF query is absent or not string-like: RETURN InvalidQuery
 *   - normalizedText = collapseWhitespace(trim(query))
 *   - selectedScopes = scopes OR all supported sources in canonical order
 *   - IF selectedScopes contains an unsupported source: RETURN InvalidScope
 *   - limitValue = limit OR 25
 *   - offsetValue = offset OR 0
 *   - IF limitValue < 1 OR limitValue > 100 OR offsetValue < 0: RETURN InvalidPagination
 *   - RETURN { text: normalizedText, scopes: selectedScopes, limit: limitValue, offset: offsetValue }
 *
 * ## VALIDATE_RETRIEVAL_SCOPES
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: validate requested scopes against the canonical source registry before bounded reads while preserving permission-denied sources for isolated source-state reporting.
 * - Contract:
 *   - INPUT: requested scopes, source registry
 *   - PRE: source registry declares each supported source and its privacy boundary; permission state is applied by READ_RETRIEVAL_SOURCE
 *   - OUTPUT: validated source list | { error: InvalidScope }
 *   - POST:
 *     - success => every selected source is declared in the registry and remains in canonical order; denied sources remain selected for READ_RETRIEVAL_SOURCE
 *     - error => no unsupported source is queried
 *   - FAILURE_MODES: InvalidScope
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_RETRIEVAL_SCOPES
 *   - IF requested scopes are absent, empty, or not a list: RETURN InvalidScope
 *   - FOR source IN requested scopes:
 *     - IF source is not in source registry: RETURN InvalidScope
 *   - RETURN unique sources in canonical order
 *
 * ## MATCH_AND_RANK_RETRIEVAL_RESULTS
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: match only bounded source fields, deduplicate exact source identities, and apply stable ranking, cap, and offset pagination.
 * - Contract:
 *   - INPUT: normalized query request, source result candidates
 *   - PRE: candidates contain source identity and bounded display fields; archive candidates contain snippet only
 *   - OUTPUT: deterministic result page with total and next offset
 *   - POST:
 *     - success => results are ordered by match kind, source priority, position, recency, and stable identity; page size does not exceed limit
 *     - error => no candidate is mutated
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MATCH_AND_RANK_RETRIEVAL_RESULTS
 *   - FOR candidate IN candidates:
 *     - fields = sourceAllowedFields(candidate.source)
 *     - match = matchNormalizedText(candidate.displayFields, request.text, fields)
 *     - IF match exists: candidate.rank = { matchKind, sourcePriority, position, recency, stableIdentity }; keep candidate
 *   - candidates = DEDUPE_BY_EXACT_SOURCE_IDENTITY(candidates)
 *   - SORT candidates BY rank ascending, then stableIdentity ascending
 *   - page = candidates[request.offset through request.offset + request.limit]
 *   - RETURN { results: page, total: candidates.length, nextOffset: request.offset + page.length when more remain }
 *
 * ## MAP_RETRIEVAL_ACTION
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: map each source to an action that preserves its navigation semantics and backend/archive identity.
 * - Contract:
 *   - INPUT: source result candidate
 *   - PRE: candidate source is one of bookmark, archive, tabs, browserBookmarks, visitHistory
 *   - OUTPUT: discriminated action
 *   - POST: action kind matches source and contains only the fields needed for navigation
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAP_RETRIEVAL_ACTION
 *   - IF source = bookmark: RETURN { kind: openBookmark, url, backend }
 *   - IF source = archive: RETURN { kind: openReader, readerTarget, backend, archiveId }
 *   - IF source = tabs: RETURN { kind: focusTab, tabId }
 *   - IF source = browserBookmarks: RETURN { kind: openBrowserBookmarks, targetId }
 *   - IF source = visitHistory: RETURN { kind: openVisitHistory, url }
 *
 * ## READ_RETRIEVAL_SOURCE
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: call one read-only source adapter and convert permission, availability, staleness, and failure outcomes into source state without aborting other adapters.
 * - Contract:
 *   - INPUT: source, normalized query request, adapter, permission state
 *   - PRE: adapter implements a read-only query boundary and bounded output
 *   - OUTPUT: source candidates and source state
 *   - POST:
 *     - success => candidates are source-attributed and bounded
 *     - failure => unavailable or permissionDenied state has no candidates; stale may retain bounded candidates
 *   - FAILURE_MODES: SourceUnavailable, SourceStale, PermissionDenied, SourceFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: READ_RETRIEVAL_SOURCE
 *   - IF permission state denies source: RETURN { candidates: [], state: permissionDenied }
 *   - IF adapter is absent or does not expose read: RETURN { candidates: [], state: unavailable }
 *   - result = AWAIT adapter.read(request)
 *   - IF result.permissionDenied: RETURN { candidates: [], state: permissionDenied }
 *   - IF result.unavailable: RETURN { candidates: [], state: unavailable }
 *   - IF result.stale: RETURN { candidates: result.candidates, state: stale }
 *   - IF result.failed: RETURN { candidates: [], state: unavailable, error: SourceFailed }
 *   - RETURN { candidates: result.candidates, state: available }
 *
 * ## QUERY_CROSS_RESOURCES
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: execute validated read-only adapters with bounded fan-out, isolate source failures, then merge and rank the resulting candidates.
 * - Contract:
 *   - INPUT: retrieval query, source adapters, permission state
 *   - PRE: adapters are wired to BookmarkRouter/Index, ArchiveContentSearch, Tabs, Browser Bookmarks (page), and Visit History (page) boundaries
 *   - OUTPUT: { results, sourceStates, total, nextOffset } | { error: InvalidQuery | InvalidScope | InvalidPagination }
 *   - POST:
 *     - success => available source results are returned; failed sources are represented in sourceStates; archive payloads contain snippets not HTML; history is local-only
 *     - error => no write occurs in any source
 *   - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
 *   - DATA: read-only source adapters and candidate list
 *   - DATA_TRANSITION: source state is assembled in memory only; no bookmark, archive, tab, or history state is changed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: QUERY_CROSS_RESOURCES
 *   - request = NORMALIZE_RETRIEVAL_QUERY(input)
 *   - IF request is error: RETURN request
 *   - sources = VALIDATE_RETRIEVAL_SCOPES(request.scopes, SUPPORTED_RETRIEVAL_SOURCES)
 *   - IF sources is error: RETURN sources
 *   - sourceResults = AWAIT boundedParallelMap(sources, READ_RETRIEVAL_SOURCE)
 *   - candidates = CONCAT sourceResults.candidates
 *   - FOR candidate IN candidates: candidate.action = MAP_RETRIEVAL_ACTION(candidate)
 *   - page = MATCH_AND_RANK_RETRIEVAL_RESULTS(request, candidates)
 *   - RETURN { ...page, sourceStates: sourceResults.states }
 *
 * ## SEARCH_LIBRARY_RESOURCES_MESSAGE
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: expose the query contract through a new message while keeping SEARCH_TITLE compatibility explicit.
 * - Contract:
 *   - INPUT: message with type SEARCH_LIBRARY_RESOURCES and query data
 *   - PRE: message handler has the retrieval service and response channel
 *   - OUTPUT: retrieval result or structured error response
 *   - POST: one response is returned; no source write occurs
 *   - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SEARCH_LIBRARY_RESOURCES_MESSAGE
 *   - response = AWAIT QUERY_CROSS_RESOURCES(message.data)
 *   - RETURN response
 *   - SEARCH_TITLE remains a compatibility route returning its documented legacy shape until a separate deprecation change updates callers and tests
 *   - Local Bookmarks Index ALL_RESOURCES scope sets the read-only control gate: disable selection, mutation, CSV export, and package import/export controls while the scope is active
 */
import {
  SUPPORTED_RETRIEVAL_SOURCES,
  normalizeRetrievalQuery,
  validateRetrievalScopes,
  mapRetrievalAction,
  queryCrossResources
} from '../../src/features/search/cross-resource-retrieval.js'

describe('[REQ-CROSS_RESOURCE_RETRIEVAL] cross-resource retrieval', () => {
  test('normalizes bounded queries and canonical source scopes', () => {
    expect(normalizeRetrievalQuery({
      query: '  Offline   Reading ',
      scopes: ['tabs', 'bookmark'],
      limit: 5,
      offset: 2
    })).toEqual({
      text: 'offline reading',
      scopes: ['bookmark', 'tabs'],
      limit: 5,
      offset: 2
    })
    expect(SUPPORTED_RETRIEVAL_SOURCES).toEqual([
      'bookmark', 'archive', 'tabs', 'browserBookmarks', 'visitHistory'
    ])
  })

  test('rejects invalid pagination before adapters are read', () => {
    expect(normalizeRetrievalQuery({ query: 'x', limit: 101 })).toEqual({
      error: 'InvalidPagination'
    })
  })

  test('rejects empty queries and unsupported or empty scopes', () => {
    expect(normalizeRetrievalQuery({ query: '   ' })).toEqual({ error: 'InvalidQuery' })
    expect(normalizeRetrievalQuery({ query: 'x', scopes: [] })).toEqual({ error: 'InvalidScope' })
    expect(normalizeRetrievalQuery({ query: 'x', scopes: ['unknown'] })).toEqual({ error: 'InvalidScope' })
  })

  test('validates scopes against the canonical registry before reads', () => {
    expect(validateRetrievalScopes(['tabs', 'bookmark', 'tabs'])).toEqual(['bookmark', 'tabs'])
    expect(validateRetrievalScopes([], SUPPORTED_RETRIEVAL_SOURCES)).toEqual({ error: 'InvalidScope' })
    expect(validateRetrievalScopes(['unknown'], SUPPORTED_RETRIEVAL_SOURCES)).toEqual({ error: 'InvalidScope' })
  })

  test('merges deterministic source results while preserving source identity', async () => {
    const reads = []
    const adapters = Object.fromEntries(SUPPORTED_RETRIEVAL_SOURCES.map(source => [
      source,
      {
        async read () {
          reads.push(source)
          if (source === 'archive') {
            return [{
              source,
              backend: 'local',
              archiveId: 'a-1',
              url: 'https://example.test/page',
              title: 'Offline Reading',
              snippet: 'Saved offline reading',
              html: '<script>must not escape</script>'
            }]
          }
          if (source === 'visitHistory') {
            return [{
              source,
              url: 'https://example.test/page',
              title: 'Offline Reading',
              visitedAt: '2026-08-01T10:00:00.000Z',
              remoteAnalytics: 'must not be copied'
            }]
          }
          return [{
            source,
            url: 'https://example.test/page',
            title: 'Offline Reading',
            backend: source === 'bookmark' ? 'local' : undefined
          }]
        }
      }
    ]))

    const result = await queryCrossResources(
      { query: 'offline', limit: 10 },
      { adapters, concurrency: 2 }
    )

    expect(reads).toHaveLength(5)
    expect(result.results.map(item => item.source)).toEqual([
      'bookmark', 'archive', 'tabs', 'browserBookmarks', 'visitHistory'
    ])
    expect(result.results.find(item => item.source === 'archive')).toMatchObject({
      snippet: 'Saved offline reading',
      action: {
        kind: 'openReader',
        backend: 'local',
        archiveId: 'a-1'
      }
    })
    expect(result.results.find(item => item.source === 'archive')).not.toHaveProperty('html')
    expect(result.results.find(item => item.source === 'visitHistory')).not.toHaveProperty('remoteAnalytics')
  })

  test('isolates source failures and does not write source state', async () => {
    const historyAdapter = jest.fn().mockRejectedValue(new Error('history unavailable'))
    const tabsAdapter = jest.fn().mockResolvedValue([])
    const result = await queryCrossResources(
      { query: 'x', scopes: ['visitHistory', 'tabs'] },
      {
        adapters: {
          visitHistory: { read: historyAdapter },
          tabs: { read: tabsAdapter }
        }
      }
    )

    expect(result.results).toEqual([])
    expect(result.sourceStates.visitHistory).toMatchObject({ state: 'unavailable' })
    expect(result.sourceStates.tabs).toMatchObject({ state: 'available' })
  })

  test('isolates permission-denied and stale source states', async () => {
    const deniedRead = jest.fn()
    const result = await queryCrossResources(
      { query: 'offline', scopes: ['tabs', 'archive'] },
      {
        permissionState: { tabs: false },
        adapters: {
          tabs: { read: deniedRead },
          archive: {
            read: async () => ({
              state: 'stale',
              candidates: [{
                url: 'https://example.test/archive',
                title: 'Offline archive',
                snippet: 'offline'
              }]
            })
          }
        }
      }
    )

    expect(deniedRead).not.toHaveBeenCalled()
    expect(result.sourceStates.tabs).toEqual({ state: 'permissionDenied' })
    expect(result.sourceStates.archive).toEqual({ state: 'stale' })
    expect(result.results).toHaveLength(1)
  })

  test('maps adapter permission, unavailable, and failed outcomes to isolated states', async () => {
    const result = await queryCrossResources(
      { query: 'offline', scopes: ['tabs', 'archive', 'visitHistory'] },
      {
        adapters: {
          tabs: { read: async () => ({ permissionDenied: true }) },
          archive: { read: async () => ({ unavailable: true }) },
          visitHistory: { read: async () => ({ failed: true }) }
        }
      }
    )

    expect(result.results).toEqual([])
    expect(result.sourceStates).toEqual({
      tabs: { state: 'permissionDenied' },
      archive: { state: 'unavailable' },
      visitHistory: { state: 'unavailable', error: 'SourceFailed' }
    })
  })

  test('deduplicates within a source and returns stable pagination', async () => {
    const adapters = {
      bookmark: {
        read: async () => [
          { url: 'https://example.test/a', title: 'Needle A', backend: 'local' },
          { url: 'https://example.test/a', title: 'Needle A duplicate', backend: 'local' },
          { url: 'https://example.test/a', title: 'Needle A file', backend: 'file' }
        ]
      }
    }
    const result = await queryCrossResources(
      { query: 'needle', scopes: ['bookmark'], limit: 1 },
      { adapters }
    )

    expect(result.total).toBe(2)
    expect(result.results).toHaveLength(1)
    expect(result.nextOffset).toBe(1)
    expect(result.results[0].backend).toBe('file')
    const nextPage = await queryCrossResources(
      { query: 'needle', scopes: ['bookmark'], limit: 1, offset: 1 },
      { adapters }
    )
    expect(nextPage.results[0].backend).toBe('local')
    expect(nextPage.nextOffset).toBeNull()
  })

  test('maps each source to its source-specific navigation action', () => {
    expect(mapRetrievalAction({
      source: 'bookmark',
      url: 'https://example.test',
      storage: 'file'
    })).toEqual({
      kind: 'openBookmark',
      url: 'https://example.test',
      backend: 'file'
    })
    expect(mapRetrievalAction({
      source: 'archive',
      archiveId: 'archive-1',
      readerTarget: 'reader.html',
      backend: 'local'
    })).toEqual({
      kind: 'openReader',
      readerTarget: 'reader.html',
      backend: 'local',
      archiveId: 'archive-1'
    })
    expect(mapRetrievalAction({
      source: 'tabs',
      tabId: 42,
      url: 'https://example.test'
    })).toEqual({ kind: 'focusTab', tabId: 42 })
    expect(mapRetrievalAction({
      source: 'browserBookmarks',
      targetId: 'bookmark-node'
    })).toEqual({ kind: 'openBrowserBookmarks', targetId: 'bookmark-node' })
    expect(mapRetrievalAction({
      source: 'visitHistory',
      url: 'https://example.test'
    })).toEqual({ kind: 'openVisitHistory', url: 'https://example.test' })
    expect(mapRetrievalAction({ source: 'unsupported' })).toEqual({ kind: 'unsupported' })
  })

  test('adapts browser resources and archive search through the service boundary', async () => {
    const archiveSearch = {
      seed: jest.fn().mockResolvedValue(undefined),
      queryArchivedContent: jest.fn().mockResolvedValue([{
        url: 'https://example.test/archive',
        title: 'Offline archive',
        snippet: 'offline'
      }])
    }
    const browserApi = {
      tabs: { query: jest.fn().mockResolvedValue([{ tabId: 3, title: 'Offline tab' }]) },
      bookmarks: { search: jest.fn().mockResolvedValue([{ id: 'b-1', title: 'Offline bookmark' }]) },
      history: { search: jest.fn().mockResolvedValue([{ url: 'https://example.test/history', title: 'Offline history' }]) }
    }
    const { CrossResourceRetrievalService } = await import('../../src/features/search/cross-resource-retrieval.js')
    const service = new CrossResourceRetrievalService({
      bookmarkReader: { getAllBookmarks: jest.fn().mockResolvedValue([]) },
      archiveStore: { listArchives: jest.fn().mockResolvedValue([]) },
      archiveSearch,
      browserApi
    })
    const result = await service.query({
      query: 'offline',
      scopes: ['archive', 'tabs', 'browserBookmarks', 'visitHistory']
    })

    expect(archiveSearch.seed).toHaveBeenCalled()
    expect(browserApi.tabs.query).toHaveBeenCalledWith({})
    expect(browserApi.bookmarks.search).toHaveBeenCalledWith({ query: 'offline' })
    expect(browserApi.history.search).toHaveBeenCalledWith({ text: 'offline', maxResults: 100 })
    expect(result.results.map(item => item.source)).toEqual([
      'archive', 'tabs', 'browserBookmarks', 'visitHistory'
    ])
  })
})
