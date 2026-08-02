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
import {
  prefillSearchFromQuery,
  buildCrossResourceSearchMessage,
  mapCrossResourceResults
} from '../../src/ui/bookmarks-table/bookmarks-table-library-search.js'

describe('[REQ-LIBRARY_SEARCH_ENTRY] prefillSearchFromQuery', () => {
  test('sets input from q param', () => {
    const input = document.createElement('input')
    const applied = prefillSearchFromQuery(new URLSearchParams('q=hello%20world'), input)
    expect(applied).toBe('hello world')
    expect(input.value).toBe('hello world')
  })

  test('empty q leaves input unchanged', () => {
    const input = document.createElement('input')
    input.value = 'prior'
    expect(prefillSearchFromQuery(new URLSearchParams(''), input)).toBe('')
    expect(input.value).toBe('prior')
  })

  test('null input is a no-op', () => {
    expect(prefillSearchFromQuery(new URLSearchParams('q=x'), null)).toBe('')
  })

  /**
   * ## APPLY_ALL_RESOURCES_READ_ONLY_CONTROL_GATE
   * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: keep the Local Bookmarks Index All resources result surface read-only while preserving source-aware navigation.
   */
  test('[REQ-CROSS_RESOURCE_RETRIEVAL] builds a read-only aggregate search message', () => {
    expect(buildCrossResourceSearchMessage(' offline ')).toEqual({
      type: 'searchLibraryResources',
      data: { query: 'offline' }
    })
  })

  test('[REQ-CROSS_RESOURCE_RETRIEVAL] maps source identity and actions without exposing archive HTML', () => {
    expect(mapCrossResourceResults([{
      source: 'archive',
      url: 'https://example.test',
      title: 'Saved page',
      snippet: 'bounded text',
      backend: 'local',
      archiveId: 'a-1',
      action: { kind: 'openReader', readerTarget: 'reader.html?archiveId=a-1' },
      html: '<script>secret</script>'
    }])).toEqual([expect.objectContaining({
      source: 'archive',
      description: 'Saved page',
      archiveSnippet: 'bounded text',
      readerTarget: 'reader.html?archiveId=a-1',
      storage: 'local'
    })])
    expect(mapCrossResourceResults([{
      source: 'archive',
      html: '<script>secret</script>'
    }])[0]).not.toHaveProperty('html')
  })
})
