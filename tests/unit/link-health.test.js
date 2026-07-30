/**
 * === IMPL-FULL-BLOCK: IMPL-LINK_HEALTH ===
 * [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] — Index batch link health via SW fetch HEAD→GET; store hoverboard_link_health; Health column/filter.
 *
 * ## Classify HTTP status
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Map numeric status to ok|redirect|client_error|server_error|unknown.
 * - Contract:
 *   - INPUT: status (number)
 *   - PRE: status may be non-finite
 *   - OUTPUT: status class string
 *   - POST:
 *     - success => 2xx ok; 3xx redirect; 4xx client_error; 5xx server_error; else unknown
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CLASSIFY_HTTP_STATUS
 *   - 1. IF status not finite or <= 0 THEN RETURN "unknown"
 *   - 2. IF 200..299 THEN RETURN "ok"
 *   - 3. IF 300..399 THEN RETURN "redirect"
 *   - 4. IF 400..499 THEN RETURN "client_error"
 *   - 5. IF 500..599 THEN RETURN "server_error"
 *   - 6. RETURN "unknown"
 *
 * ## Build health record
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Normalize fetch result into persisted record with checkedAt.
 * - Contract:
 *   - INPUT: { ok?, status?, error? }
 *   - OUTPUT: { status, httpStatus, error, checkedAt }
 *   - EFFECTS: pure (clock for checkedAt)
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_HEALTH_RECORD
 *   - 1. checkedAt = now ISO
 *   - 2. IF error THEN RETURN { status: "unreachable", httpStatus: null, error, checkedAt }
 *   - 3. RETURN { status: CLASSIFY_HTTP_STATUS(status), httpStatus, error: null, checkedAt }
 *
 * ## Check link health batch
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: SW CHECK_LINK_HEALTH; HEAD then GET on 405/501; merge into chrome.storage.local.
 * - Contract:
 *   - INPUT: urls[] (http/https only; max 50)
 *   - PRE: chrome.storage.local available; fetch available
 *   - OUTPUT: { success, results, checked }
 *   - POST:
 *     - success => hoverboard_link_health updated for each checked URL
 *   - FAILURE_MODES: network error → unreachable record
 *   - EFFECTS: Http, IO, State, Async
 *   - DATA: hoverboard_link_health
 *   - DATA_TRANSITION: map[url] = health record
 *   - TERMINATION: total
 * - PROCEDURE: CHECK_LINK_HEALTH
 *   - 1. list = filter http(s) urls; slice(0, 50)
 *   - 2. map = READ hoverboard_link_health OR {}
 *   - 3. FOR each url IN list:
 *   - 4.   TRY: res = fetch HEAD; IF status 405 or 501 THEN res = fetch GET
 *   - 5.        record = BUILD_HEALTH_RECORD({ status: res.status, ok: res.ok })
 *   - 6.   CATCH: record = BUILD_HEALTH_RECORD({ error })
 *   - 7.   map = MERGE_HEALTH_MAP(map, url, record)
 *   - 8. WRITE hoverboard_link_health = map
 *   - 9. RETURN { success: true, results, checked: list.length }
 *
 * ## Get link health map
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: GET_LINK_HEALTH reads stored map for Index column/filter.
 * - Contract:
 *   - INPUT: none
 *   - OUTPUT: health map object
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_LINK_HEALTH
 *   - 1. RETURN chrome.storage.local[hoverboard_link_health] OR {}
 *
 * ## Filter Index by health
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Pure filter for Health column status filter.
 * - Contract:
 *   - INPUT: bookmarks[], healthMap, statusFilter
 *   - OUTPUT: filtered bookmarks
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BOOKMARKS_BY_HEALTH
 *   - 1. IF statusFilter empty THEN RETURN bookmarks
 *   - 2. KEEP rows where (healthMap[url].status OR "unknown") == statusFilter
 *
 * ## Index Check link health UI
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Index orchestrator runCheckLinkHealth (bookmarks-table-link-health.js) for composition tests; applySearchAndFilter uses FILTER_BOOKMARKS_BY_HEALTH; Health cell via formatHealthCellLabel.
 * - Contract:
 *   - INPUT: selectedUrls OR filteredBookmarks urls; sendMessage; resultEl; onResults
 *   - PRE: sendMessage available; urls may be empty
 *   - OUTPUT: status text; linkHealthMap merge; table refresh on success
 *   - POST:
 *     - success => onResults called with results; resultEl shows Checked N
 *     - empty urls => resultEl "No URLs to check"; no sendMessage
 *   - FAILURE_MODES: EmptyUrls, CheckFailed, SendThrow
 *   - EFFECTS: Async, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_CHECK_LINK_HEALTH_UI
 *   - 1. urls = selected OR filtered URLs
 *   - 2. CALL runCheckLinkHealth({ urls, sendMessage, resultEl, onResults })
 *   - 3. onResults: merge into linkHealthMap; applySearchAndFilter
 *
 * === END IMPL-FULL-BLOCK: IMPL-LINK_HEALTH ===
 */
import {
  classifyHttpStatus,
  buildHealthRecord,
  mergeHealthMap,
  filterBookmarksByHealth
} from '../../src/shared/link-health.js'

describe('[REQ-LINK_HEALTH] classifyHttpStatus', () => {
  test('classes', () => {
    expect(classifyHttpStatus(200)).toBe('ok')
    expect(classifyHttpStatus(301)).toBe('redirect')
    expect(classifyHttpStatus(404)).toBe('client_error')
    expect(classifyHttpStatus(503)).toBe('server_error')
  })
})

describe('[REQ-LINK_HEALTH] buildHealthRecord / filter', () => {
  test('unreachable on error', () => {
    const r = buildHealthRecord({ error: 'Failed to fetch' })
    expect(r.status).toBe('unreachable')
    expect(r.error).toContain('Failed')
  })

  test('merge and filter', () => {
    const map = mergeHealthMap({}, 'https://a.test/', buildHealthRecord({ status: 404 }))
    const list = filterBookmarksByHealth(
      [{ url: 'https://a.test/' }, { url: 'https://b.test/' }],
      map,
      'client_error'
    )
    expect(list).toHaveLength(1)
    expect(list[0].url).toBe('https://a.test/')
  })
})
