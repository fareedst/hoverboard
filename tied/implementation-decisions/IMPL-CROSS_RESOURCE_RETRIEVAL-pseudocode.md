# [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
# One read-only query contract normalizes, scopes, adapts, ranks, and pages results across existing local resources.

## NORMALIZE_RETRIEVAL_QUERY
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: normalize query text, explicit source scopes, result cap, and offset before any source is read.
- Contract:
  - INPUT: query text, optional scopes, optional limit, optional offset
  - PRE: query is string-like; scopes, when supplied, are from the supported source set
  - OUTPUT: normalized query request | { error: InvalidQuery | InvalidScope | InvalidPagination }
  - POST:
    - success => query is trimmed and case-folded for matching; scopes are explicit and ordered; limit is between 1 and 100; offset is non-negative
    - error => no source adapter is called
  - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: NORMALIZE_RETRIEVAL_QUERY
  - IF query is absent or not string-like: RETURN InvalidQuery
  - normalizedText = collapseWhitespace(trim(query))
  - selectedScopes = scopes OR all supported sources in canonical order
  - IF selectedScopes contains an unsupported source: RETURN InvalidScope
  - limitValue = limit OR 25
  - offsetValue = offset OR 0
  - IF limitValue < 1 OR limitValue > 100 OR offsetValue < 0: RETURN InvalidPagination
  - RETURN { text: normalizedText, scopes: selectedScopes, limit: limitValue, offset: offsetValue }

## VALIDATE_RETRIEVAL_SCOPES
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: validate requested scopes against the canonical source registry before bounded reads while preserving permission-denied sources for isolated source-state reporting.
- Contract:
  - INPUT: requested scopes, source registry
  - PRE: source registry declares each supported source and its privacy boundary; permission state is applied by READ_RETRIEVAL_SOURCE
  - OUTPUT: validated source list | { error: InvalidScope }
  - POST:
    - success => every selected source is declared in the registry and remains in canonical order; denied sources remain selected for READ_RETRIEVAL_SOURCE
    - error => no unsupported source is queried
  - FAILURE_MODES: InvalidScope
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: VALIDATE_RETRIEVAL_SCOPES
  - IF requested scopes are absent, empty, or not a list: RETURN InvalidScope
  - FOR source IN requested scopes:
    - IF source is not in source registry: RETURN InvalidScope
  - RETURN unique sources in canonical order

## MATCH_AND_RANK_RETRIEVAL_RESULTS
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: match only bounded source fields, deduplicate exact source identities, and apply stable ranking, cap, and offset pagination.
- Contract:
  - INPUT: normalized query request, source result candidates
  - PRE: candidates contain source identity and bounded display fields; archive candidates contain snippet only
  - OUTPUT: deterministic result page with total and next offset
  - POST:
    - success => results are ordered by match kind, source priority, position, recency, and stable identity; page size does not exceed limit
    - error => no candidate is mutated
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: MATCH_AND_RANK_RETRIEVAL_RESULTS
  - FOR candidate IN candidates:
    - fields = sourceAllowedFields(candidate.source)
    - match = matchNormalizedText(candidate.displayFields, request.text, fields)
    - IF match exists: candidate.rank = { matchKind, sourcePriority, position, recency, stableIdentity }; keep candidate
  - candidates = DEDUPE_BY_EXACT_SOURCE_IDENTITY(candidates)
  - SORT candidates BY rank ascending, then stableIdentity ascending
  - page = candidates[request.offset through request.offset + request.limit]
  - RETURN { results: page, total: candidates.length, nextOffset: request.offset + page.length when more remain }

## MAP_RETRIEVAL_ACTION
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: map each source to an action that preserves its navigation semantics and backend/archive identity.
- Contract:
  - INPUT: source result candidate
  - PRE: candidate source is one of bookmark, archive, tabs, browserBookmarks, visitHistory
  - OUTPUT: discriminated action
  - POST: action kind matches source and contains only the fields needed for navigation
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: MAP_RETRIEVAL_ACTION
  - IF source = bookmark: RETURN { kind: openBookmark, url, backend }
  - IF source = archive: RETURN { kind: openReader, readerTarget, backend, archiveId }
  - IF source = tabs: RETURN { kind: focusTab, tabId }
  - IF source = browserBookmarks: RETURN { kind: openBrowserBookmarks, targetId }
  - IF source = visitHistory: RETURN { kind: openVisitHistory, url }

## READ_RETRIEVAL_SOURCE
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: call one read-only source adapter and convert permission, availability, staleness, and failure outcomes into source state without aborting other adapters.
- Contract:
  - INPUT: source, normalized query request, adapter, permission state
  - PRE: adapter implements a read-only query boundary and bounded output
  - OUTPUT: source candidates and source state
  - POST:
    - success => candidates are source-attributed and bounded
    - failure => unavailable or permissionDenied state has no candidates; stale may retain bounded candidates
  - FAILURE_MODES: SourceUnavailable, SourceStale, PermissionDenied, SourceFailed
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: READ_RETRIEVAL_SOURCE
  - IF permission state denies source: RETURN { candidates: [], state: permissionDenied }
  - IF adapter is absent or does not expose read: RETURN { candidates: [], state: unavailable }
  - result = AWAIT adapter.read(request)
  - IF result.permissionDenied: RETURN { candidates: [], state: permissionDenied }
  - IF result.unavailable: RETURN { candidates: [], state: unavailable }
  - IF result.stale: RETURN { candidates: result.candidates, state: stale }
  - IF result.failed: RETURN { candidates: [], state: unavailable, error: SourceFailed }
  - RETURN { candidates: result.candidates, state: available }

## QUERY_CROSS_RESOURCES
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: execute validated read-only adapters with bounded fan-out, isolate source failures, then merge and rank the resulting candidates.
- Contract:
  - INPUT: retrieval query, source adapters, permission state
  - PRE: adapters are wired to BookmarkRouter/Index, ArchiveContentSearch, Tabs, Browser Bookmarks (page), and Visit History (page) boundaries
  - OUTPUT: { results, sourceStates, total, nextOffset } | { error: InvalidQuery | InvalidScope | InvalidPagination }
  - POST:
    - success => available source results are returned; failed sources are represented in sourceStates; archive payloads contain snippets not HTML; history is local-only
    - error => no write occurs in any source
  - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
  - DATA: read-only source adapters and candidate list
  - DATA_TRANSITION: source state is assembled in memory only; no bookmark, archive, tab, or history state is changed
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: QUERY_CROSS_RESOURCES
  - request = NORMALIZE_RETRIEVAL_QUERY(input)
  - IF request is error: RETURN request
  - sources = VALIDATE_RETRIEVAL_SCOPES(request.scopes, SUPPORTED_RETRIEVAL_SOURCES)
  - IF sources is error: RETURN sources
  - sourceResults = AWAIT boundedParallelMap(sources, READ_RETRIEVAL_SOURCE)
  - candidates = CONCAT sourceResults.candidates
  - FOR candidate IN candidates: candidate.action = MAP_RETRIEVAL_ACTION(candidate)
  - page = MATCH_AND_RANK_RETRIEVAL_RESULTS(request, candidates)
  - RETURN { ...page, sourceStates: sourceResults.states }

## SEARCH_LIBRARY_RESOURCES_MESSAGE
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: expose the query contract through a new message while keeping SEARCH_TITLE compatibility explicit.
- Contract:
  - INPUT: message with type SEARCH_LIBRARY_RESOURCES and query data
  - PRE: message handler has the retrieval service and response channel
  - OUTPUT: retrieval result or structured error response
  - POST: one response is returned; no source write occurs
  - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: SEARCH_LIBRARY_RESOURCES_MESSAGE
  - response = AWAIT QUERY_CROSS_RESOURCES(message.data)
  - RETURN response
  - SEARCH_TITLE remains a compatibility route returning its documented legacy shape until a separate deprecation change updates callers and tests
  - Local Bookmarks Index ALL_RESOURCES scope sets the read-only control gate: disable selection, mutation, CSV export, and package import/export controls while the scope is active

## APPLY_ALL_RESOURCES_READ_ONLY_CONTROL_GATE
- [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: keep the Local Bookmarks Index All resources result surface read-only while preserving source-aware navigation.
- Contract:
  - INPUT: active Index search scope, selection and mutation controls, CSV controls, library package controls
  - PRE: scope value is available to the Index control-state orchestrator
  - OUTPUT: controls disabled when scope is all-resources; ordinary metadata controls otherwise
  - POST:
    - all-resources => selection, mutation, CSV export, and package import/export controls are disabled
    - other scope => controls retain their ordinary enabled-state rules
  - DATA: Index control disabled states
  - DATA_TRANSITION: only control disabled states change; bookmark and source data remain unchanged
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: APPLY_ALL_RESOURCES_READ_ONLY_CONTROL_GATE
  - readOnly = active scope is archive or all-resources
  - IF readOnly: disable selection, mutation, CSV export, and package import/export controls
  - ELSE: apply ordinary control-state rules
