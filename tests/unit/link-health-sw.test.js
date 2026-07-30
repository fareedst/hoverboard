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
jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'
import { LINK_HEALTH_STORAGE_KEY } from '../../src/shared/link-health.js'

describe('[REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] SW _checkLinkHealth', () => {
  let sw
  let storage

  beforeEach(() => {
    jest.clearAllMocks()
    storage = {}
    global.chrome.storage.local.get.mockImplementation(async (key) => {
      const k = typeof key === 'string' ? key : Object.keys(key || {})[0]
      return { [k]: storage[k] }
    })
    global.chrome.storage.local.set.mockImplementation(async (obj) => {
      Object.assign(storage, obj)
    })
    sw = new HoverboardServiceWorker()
  })

  test('MESSAGE_TYPES include CHECK_LINK_HEALTH and GET_LINK_HEALTH', () => {
    expect(MESSAGE_TYPES.CHECK_LINK_HEALTH).toBe('CHECK_LINK_HEALTH')
    expect(MESSAGE_TYPES.GET_LINK_HEALTH).toBe('GET_LINK_HEALTH')
  })

  test('HEAD success persists ok record', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    const result = await sw._checkLinkHealth(['https://ok.example/'])
    expect(result.success).toBe(true)
    expect(result.checked).toBe(1)
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://ok.example/'].status).toBe('ok')
    expect(global.fetch).toHaveBeenCalledWith('https://ok.example/', expect.objectContaining({ method: 'HEAD' }))
  })

  test('HEAD 405 falls back to GET', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 405 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
    const result = await sw._checkLinkHealth(['https://get.example/'])
    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://get.example/', expect.objectContaining({ method: 'HEAD' }))
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://get.example/', expect.objectContaining({ method: 'GET' }))
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://get.example/'].status).toBe('ok')
  })

  test('fetch error records unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))
    await sw._checkLinkHealth(['https://down.example/'])
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://down.example/'].status).toBe('unreachable')
  })

  test('batch cap slices to 50 http(s) URLs', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    const urls = Array.from({ length: 55 }, (_, i) => `https://batch.example/${i}`)
    const result = await sw._checkLinkHealth(urls)
    expect(result.checked).toBe(50)
    expect(global.fetch).toHaveBeenCalledTimes(50)
    expect(Object.keys(storage[LINK_HEALTH_STORAGE_KEY])).toHaveLength(50)
  })

  test('non-http URLs and non-strings are filtered out', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    const result = await sw._checkLinkHealth([
      'ftp://x.example/',
      null,
      42,
      'https://keep.example/'
    ])
    expect(result.checked).toBe(1)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://keep.example/'].status).toBe('ok')
  })

  test('HEAD 501 falls back to GET', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 501 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
    await sw._checkLinkHealth(['https://501.example/'])
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://501.example/', expect.objectContaining({ method: 'HEAD' }))
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://501.example/', expect.objectContaining({ method: 'GET' }))
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://501.example/'].status).toBe('ok')
  })

  test('HEAD 404 does not fall back to GET', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 })
    await sw._checkLinkHealth(['https://404.example/'])
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith('https://404.example/', expect.objectContaining({ method: 'HEAD' }))
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://404.example/'].status).toBe('client_error')
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://404.example/'].httpStatus).toBe(404)
  })

  test('_getLinkHealthMap returns empty object when unset', async () => {
    const map = await sw._getLinkHealthMap()
    expect(map).toEqual({})
  })

  test('_getLinkHealthMap returns stored map', async () => {
    storage[LINK_HEALTH_STORAGE_KEY] = {
      'https://stored.example/': { status: 'ok', httpStatus: 200 }
    }
    const map = await sw._getLinkHealthMap()
    expect(map['https://stored.example/'].status).toBe('ok')
  })
})
