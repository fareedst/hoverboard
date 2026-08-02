/**
 * === IMPL-FULL-BLOCK: IMPL-LIBRARY_SEARCH_ENTRY ===
 * [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] — Capture UI Search Bookmarks opens Index with ?q=; distinct from Search tabs.
 *
 * ## Build Index URL with query
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: Pure URL builder shared by SW and tests; append encoded q.
 * - Contract:
 *   - INPUT: baseUrl (string), query (string)
 *   - PRE: baseUrl may be empty
 *   - OUTPUT: baseUrl unchanged when query empty; else baseUrl + ?q= or &q= encodeURIComponent(query)
 *   - POST:
 *     - success => empty query returns baseUrl; non-empty query includes encoded q
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY
 *   - 1. q = trim(query)
 *   - 2. IF baseUrl empty THEN RETURN ""
 *   - 3. IF q empty THEN RETURN baseUrl
 *   - 4. sep = IF baseUrl contains "?" THEN "&" ELSE "?"
 *   - 5. RETURN baseUrl + sep + "q=" + encodeURIComponent(q)
 *
 * ## Open library search from capture UI
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: Read Search Bookmarks input; send OPEN_BOOKMARKS_INDEX with q (does not replace Search tabs).
 * - Contract:
 *   - INPUT: librarySearchInput value (string)
 *   - PRE: sendMessage available
 *   - OUTPUT: OPEN_BOOKMARKS_INDEX message with data.q
 *   - POST:
 *     - success => SW opens Index tab; Index search prefilled when q non-empty
 *   - EFFECTS: Async, State
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_LIBRARY_SEARCH
 *   - 1. q = trim(librarySearchInput.value)
 *   - 2. SEND OPEN_BOOKMARKS_INDEX { q }
 *   - 3. (SW) OPEN_BOOKMARKS_INDEX_TAB(q) via BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY then REQUEST_SIDE_PANEL_CLOSE
 *
 * ## Prefill Index search from URL
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: On Index load, set search field from ?q= via prefillSearchFromQuery; filter applied later by loadBookmarks / applySearchAndFilter.
 * - Contract:
 *   - INPUT: window.location.search; searchInput
 *   - PRE: Index DOM search input exists (or helper no-ops when null)
 *   - OUTPUT: search input value set when q present; empty q leaves prior value
 *   - POST:
 *     - success => searchInput.value equals decoded q when q non-empty; subsequent applySearchAndFilter uses that value
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: PREFILL_INDEX_SEARCH_FROM_QUERY
 *   - 1. CALL prefillSearchFromQuery(URLSearchParams(location.search), searchInput)  // bookmarks-table-library-search.js
 *   - 2. ON loadBookmarks / applySearchAndFilter: filter uses searchInput.value (including prefilled q)
 *
 * === END IMPL-FULL-BLOCK: IMPL-LIBRARY_SEARCH_ENTRY ===
 */
export function prefillSearchFromQuery (searchParams, searchInput) {
  if (!searchInput || !searchParams || typeof searchParams.get !== 'function') {
    return ''
  }
  const q = searchParams.get('q')
  if (q == null || q === '') {
    return ''
  }
  searchInput.value = q
  return q
}

/**
 * ## APPLY_ALL_RESOURCES_READ_ONLY_CONTROL_GATE
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: keep the Local Bookmarks Index All resources result surface read-only while preserving source-aware navigation.
 */
/**
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
/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Build the Local Bookmarks Index message for the read-only aggregate query surface.
 */
export function buildCrossResourceSearchMessage (query) {
  return {
    type: 'searchLibraryResources',
    data: { query: String(query || '').trim() }
  }
}

/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
 * Map source-aware results to the existing table shape while retaining source actions and bounded snippets.
 */
export function mapCrossResourceResults (results = []) {
  return (Array.isArray(results) ? results : []).map(result => {
    const action = result?.action || {}
    return {
      source: result?.source || '',
      url: result?.url || '',
      description: result?.title || result?.url || '(untitled result)',
      tags: Array.isArray(result?.tags) ? result.tags : [],
      extended: result?.snippet || '',
      archiveSnippet: result?.source === 'archive' ? (result.snippet || '') : '',
      archiveStatus: result?.archiveStatus || '',
      storage: result?.backend || result?.storage || result?.source || '',
      archiveId: result?.archiveId || '',
      readerTarget: action.kind === 'openReader' ? (action.readerTarget || result?.readerTarget || '') : '',
      retrievalAction: action
    }
  })
}
