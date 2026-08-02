/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Read-only retrieval across existing library resources with bounded fan-out and stable results.
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
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: preserve explicit source scope boundaries and prevent an aggregate query from crossing unsupported sources; per-source permission denial remains an isolated source state.
 * - Contract:
 *   - INPUT: requested scopes, source registry, permission state
 *   - PRE: source registry declares each supported adapter and its privacy boundary
 *   - OUTPUT: validated source list | { error: InvalidScope }
 *   - POST:
 *     - success => every selected source has a declared adapter; denied sources are represented as permissionDenied by READ_RETRIEVAL_SOURCE
 *     - error => no unsupported source is queried
 *   - FAILURE_MODES: InvalidScope
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_RETRIEVAL_SCOPES
 *   - FOR source IN requested scopes:
 *     - IF source is not in source registry: RETURN InvalidScope
 *     - IF permission state denies source: READ_RETRIEVAL_SOURCE returns permissionDenied without calling the adapter
 *   - RETURN sources in canonical order
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

export const SUPPORTED_RETRIEVAL_SOURCES = Object.freeze([
  'bookmark',
  'archive',
  'tabs',
  'browserBookmarks',
  'visitHistory'
])

const SOURCE_PRIORITY = Object.freeze(
  Object.fromEntries(SUPPORTED_RETRIEVAL_SOURCES.map((source, index) => [source, index]))
)

const SOURCE_FIELDS = Object.freeze({
  bookmark: ['url', 'title', 'tags', 'description', 'backend', 'storage', 'time', 'updated_at'],
  archive: ['url', 'title', 'snippet', 'archiveStatus', 'storage', 'backend', 'archiveId', 'readerTarget', 'capturedAt', 'position'],
  tabs: ['tabId', 'url', 'title', 'windowId', 'active'],
  browserBookmarks: ['targetId', 'url', 'title', 'parentId'],
  visitHistory: ['url', 'title', 'visitedAt', 'lastVisitTime', 'visitCount']
})

function collapseWhitespace (value) {
  return String(value).trim().replace(/\s+/g, ' ')
}

/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Normalize query text, explicit source scopes, caps, and pagination before any adapter is read.
 */
export function normalizeRetrievalQuery (input = {}) {
  const rawQuery = input.query ?? input.text
  if (typeof rawQuery !== 'string') return { error: 'InvalidQuery' }

  const text = collapseWhitespace(rawQuery).toLowerCase()
  if (!text) return { error: 'InvalidQuery' }

  const requestedScopes = input.scopes == null
    ? [...SUPPORTED_RETRIEVAL_SOURCES]
    : input.scopes
  if (!Array.isArray(requestedScopes) || requestedScopes.length === 0) {
    return { error: 'InvalidScope' }
  }

  const scopes = [...new Set(requestedScopes)]
  if (scopes.some(source => !SUPPORTED_RETRIEVAL_SOURCES.includes(source))) {
    return { error: 'InvalidScope' }
  }
  scopes.sort((left, right) => SOURCE_PRIORITY[left] - SOURCE_PRIORITY[right])

  const limit = input.limit == null ? 25 : Number(input.limit)
  const offset = input.offset == null ? 0 : Number(input.offset)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isInteger(offset) || offset < 0) {
    return { error: 'InvalidPagination' }
  }

  return { text, scopes, limit, offset }
}

/**
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
 */
export function validateRetrievalScopes (
  requestedScopes,
  registry = SUPPORTED_RETRIEVAL_SOURCES
) {
  if (!Array.isArray(requestedScopes) || requestedScopes.length === 0) {
    return { error: 'InvalidScope' }
  }
  const registryValues = registry instanceof Set
    ? [...registry]
    : Array.isArray(registry)
      ? registry
      : Object.keys(registry || {})
  const scopes = [...new Set(requestedScopes)]
  if (scopes.some(source => !registryValues.includes(source))) {
    return { error: 'InvalidScope' }
  }
  scopes.sort((left, right) => (
    (SOURCE_PRIORITY[left] ?? Number.MAX_SAFE_INTEGER) -
    (SOURCE_PRIORITY[right] ?? Number.MAX_SAFE_INTEGER)
  ))
  return scopes
}

function sourceAllowedFields (source) {
  return SOURCE_FIELDS[source] || []
}

function stableIdentity (candidate) {
  const identity = candidate.archiveId || candidate.tabId || candidate.targetId || candidate.url || candidate.id || JSON.stringify(candidate)
  const backend = candidate.backend || candidate.storage || ''
  return `${candidate.source}:${backend}:${identity}`
}

function sanitizeCandidate (source, candidate) {
  const safe = { source }
  for (const field of sourceAllowedFields(source)) {
    if (candidate?.[field] !== undefined) safe[field] = candidate[field]
  }
  safe.stableIdentity = stableIdentity(safe)
  return safe
}

function matchCandidate (candidate, query) {
  const values = sourceAllowedFields(candidate.source)
    .map(field => candidate[field])
    .filter(value => value != null)
    .map(value => String(value).toLowerCase())
  const exact = values.some(value => value === query)
  const starts = !exact && values.some(value => value.startsWith(query))
  const contains = !exact && !starts && values.some(value => value.includes(query))
  if (!exact && !starts && !contains) return null
  return exact ? 0 : starts ? 1 : 2
}

/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Preserve source-specific navigation semantics without exposing archive HTML or remote history data.
 */
export function mapRetrievalAction (candidate = {}) {
  switch (candidate.source) {
    case 'bookmark':
      return { kind: 'openBookmark', url: candidate.url, backend: candidate.backend || candidate.storage || 'local' }
    case 'archive':
      return {
        kind: 'openReader',
        readerTarget: candidate.readerTarget,
        backend: candidate.backend || candidate.storage || 'local',
        archiveId: candidate.archiveId
      }
    case 'tabs':
      return { kind: 'focusTab', tabId: candidate.tabId }
    case 'browserBookmarks':
      return { kind: 'openBrowserBookmarks', targetId: candidate.targetId }
    case 'visitHistory':
      return { kind: 'openVisitHistory', url: candidate.url }
    default:
      return { kind: 'unsupported' }
  }
}

function rankCandidates (request, candidates) {
  const matched = []
  const identities = new Set()
  for (const input of candidates) {
    const candidate = sanitizeCandidate(input.source, input)
    const matchKind = matchCandidate(candidate, request.text)
    if (matchKind == null || identities.has(candidate.stableIdentity)) continue
    identities.add(candidate.stableIdentity)
    matched.push({
      ...candidate,
      action: mapRetrievalAction(candidate),
      rank: {
        matchKind,
        sourcePriority: SOURCE_PRIORITY[candidate.source],
        position: Number.isFinite(candidate.position) ? candidate.position : Number.MAX_SAFE_INTEGER,
        recency: String(candidate.capturedAt || candidate.lastVisitTime || candidate.visitedAt || candidate.time || ''),
        stableIdentity: candidate.stableIdentity
      }
    })
  }

  matched.sort((left, right) => (
    left.rank.matchKind - right.rank.matchKind ||
    left.rank.sourcePriority - right.rank.sourcePriority ||
    left.rank.position - right.rank.position ||
    right.rank.recency.localeCompare(left.rank.recency) ||
    left.rank.stableIdentity.localeCompare(right.rank.stableIdentity)
  ))
  const results = matched.slice(request.offset, request.offset + request.limit)
    .map(({ rank, stableIdentity: _stableIdentity, ...candidate }) => candidate)
  return {
    results,
    total: matched.length,
    nextOffset: request.offset + results.length < matched.length
      ? request.offset + results.length
      : null
  }
}

async function readSource (source, request, adapter, permissionState) {
  if (permissionState?.[source] === false) {
    return { candidates: [], state: 'permissionDenied' }
  }
  if (!adapter || typeof adapter.read !== 'function') {
    return { candidates: [], state: 'unavailable' }
  }
  try {
    const response = await adapter.read(request)
    if (response?.permissionDenied) {
      return { candidates: [], state: 'permissionDenied' }
    }
    if (response?.unavailable) {
      return { candidates: [], state: 'unavailable' }
    }
    if (response?.failed) {
      return { candidates: [], state: 'unavailable', error: 'SourceFailed' }
    }
    const candidates = Array.isArray(response)
      ? response
      : (response?.candidates || response?.results || [])
    const state = response?.state || (response?.stale ? 'stale' : 'available')
    return {
      candidates: Array.isArray(candidates)
        ? candidates.map(candidate => ({ ...candidate, source }))
        : [],
      state
    }
  } catch (error) {
    return { candidates: [], state: 'unavailable', error: error.message || 'SourceFailed' }
  }
}

async function boundedParallelMap (items, worker, concurrency) {
  const results = new Array(items.length)
  let next = 0
  async function consume () {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index])
    }
  }
  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), items.length || 1) },
    () => consume()
  )
  await Promise.all(workers)
  return results
}

/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Fan out read-only adapters, isolate failures, and return deterministic bounded results.
 */
export async function queryCrossResources (input = {}, {
  adapters = {},
  permissionState = {},
  concurrency = 3
} = {}) {
  const request = normalizeRetrievalQuery(input)
  if (request.error) return request

  const sources = validateRetrievalScopes(request.scopes, SUPPORTED_RETRIEVAL_SOURCES)
  if (sources.error) return sources

  const sourceResults = await boundedParallelMap(
    sources,
    source => readSource(source, request, adapters[source], permissionState),
    concurrency
  )
  const candidates = []
  const sourceStates = {}
  sources.forEach((source, index) => {
    const result = sourceResults[index]
    sourceStates[source] = {
      state: result.state,
      ...(result.error ? { error: result.error } : {})
    }
    candidates.push(...result.candidates)
  })
  return { ...rankCandidates(request, candidates), sourceStates }
}

/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Adapt existing bookmark, archive, tab, browser-bookmark, and local history APIs to the query contract.
 */
export class CrossResourceRetrievalService {
  constructor ({
    bookmarkReader = null,
    archiveStore = null,
    archiveSearch = null,
    browserApi = globalThis.browser || globalThis.chrome,
    permissionState = {},
    concurrency = 3
  } = {}) {
    this.bookmarkReader = bookmarkReader
    this.archiveStore = archiveStore
    this.archiveSearch = archiveSearch
    this.browserApi = browserApi
    this.permissionState = permissionState
    this.concurrency = concurrency
  }

  async query (input) {
    const adapters = {
      bookmark: {
        read: async () => {
          const reader = this.bookmarkReader
          if (!reader) return []
          if (typeof reader.getAllBookmarksForIndex === 'function') return reader.getAllBookmarksForIndex()
          if (typeof reader.getAllBookmarks === 'function') return reader.getAllBookmarks()
          return []
        }
      },
      archive: {
        read: async request => {
          const archives = await this.archiveStore?.listArchives?.() || []
          const search = this.archiveSearch || this.archiveStore?.archiveSearch
          if (search) {
            await search.seed(archives)
            return search.queryArchivedContent(request.text)
          }
          return archives.map(archive => ({
            url: archive.url,
            title: archive.sourceTitle || archive.title,
            snippet: String(archive.textContent || '').slice(0, 180),
            archiveStatus: archive.status,
            storage: archive.storage,
            archiveId: archive.archiveId,
            capturedAt: archive.capturedAt,
            readerTarget: archive.readerTarget
          }))
        }
      },
      tabs: {
        read: async () => this.browserApi?.tabs?.query?.({}) || []
      },
      browserBookmarks: {
        read: async request => this.browserApi?.bookmarks?.search
          ? this.browserApi.bookmarks.search({ query: request.text })
          : []
      },
      visitHistory: {
        read: async request => this.browserApi?.history?.search
          ? this.browserApi.history.search({ text: request.text, maxResults: 100 })
          : []
      }
    }
    return queryCrossResources(input, {
      adapters,
      permissionState: this.permissionState,
      concurrency: this.concurrency
    })
  }
}

export { SOURCE_FIELDS, stableIdentity }
