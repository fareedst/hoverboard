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
