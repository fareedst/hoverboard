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
 * ## Match inhibit list
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] [IMPL-URL_INHIBITION] How: Pure substring match aligned with ConfigManager.isUrlAllowed (protocol stripped).
 * - Contract:
 *   - INPUT: url (string), inhibitUrls (string[])
 *   - PRE: inhibitUrls may be empty/null
 *   - OUTPUT: boolean (true = inhibited / skip fetch)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: URL_MATCHES_INHIBIT_LIST
 *   - 1. IF url empty THEN RETURN false
 *   - 2. normalized = strip https?:// from url
 *   - 3. FOR each entry IN inhibitUrls (trim; skip empty):
 *   - 4.   IF normalized includes entry OR entry includes normalized THEN RETURN true
 *   - 5. RETURN false
 *
 * ## Fetch with link-health timeout
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: AbortController-bounded fetch; do not read response body (status only).
 * - Contract:
 *   - INPUT: url, init (method/redirect), timeoutMs (default LINK_HEALTH_FETCH_TIMEOUT_MS)
 *   - PRE: fetch available
 *   - OUTPUT: Response
 *   - FAILURE_MODES: abort → Error name AbortError message "timeout"; network errors propagate
 *   - EFFECTS: Http, Async
 *   - TERMINATION: total
 * - PROCEDURE: FETCH_WITH_LINK_HEALTH_TIMEOUT
 *   - 1. controller = new AbortController; timer = abort after timeoutMs
 *   - 2. TRY: RETURN fetch(url, { ...init, redirect: follow, signal: controller.signal })
 *   - 3. CATCH abort: THROW timeout AbortError
 *   - 4. FINALLY: clearTimeout(timer)
 *
 * ## Check link health batch
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: SW CHECK_LINK_HEALTH; inhibit skip; HEAD then GET on 405/501 with timeout; merge into chrome.storage.local.
 * - Contract:
 *   - INPUT: urls[] (http/https only; max 50)
 *   - PRE: chrome.storage.local available; fetch available; ConfigManager inhibit list readable
 *   - OUTPUT: { success, results, checked }
 *   - POST:
 *     - success => hoverboard_link_health updated for each checked URL
 *     - inhibited URLs => no fetch; unreachable record error "inhibited"
 *     - timeout => unreachable record error "timeout"
 *   - FAILURE_MODES: network error → unreachable; abort → timeout; inhibit → skip fetch
 *   - EFFECTS: Http, IO, State, Async
 *   - DATA: hoverboard_link_health; hoverboard_inhibit_urls (read)
 *   - DATA_TRANSITION: map[url] = health record
 *   - TERMINATION: total
 * - PROCEDURE: CHECK_LINK_HEALTH
 *   - 1. IF NOT IS_LINK_HEALTH_CHECKS_ENABLED(ConfigManager.getConfig()) THEN RETURN { success: false, error: "Link health checks disabled" }
 *   - 2. list = filter http(s) urls; slice(0, 50)
 *   - 3. inhibitUrls = ConfigManager.getInhibitUrls()
 *   - 4. map = READ hoverboard_link_health OR {}
 *   - 5. FOR each url IN list:
 *   - 6.   IF URL_MATCHES_INHIBIT_LIST(url, inhibitUrls) THEN record = BUILD_HEALTH_RECORD({ error: "inhibited" }); GOTO merge
 *   - 7.   TRY: res = FETCH_WITH_LINK_HEALTH_TIMEOUT(url, HEAD); IF status 405 or 501 THEN res = FETCH_WITH_LINK_HEALTH_TIMEOUT(url, GET)
 *   - 8.        DO NOT read body; record = BUILD_HEALTH_RECORD({ status: res.status, ok: res.ok })
 *   - 9.   CATCH: record = BUILD_HEALTH_RECORD({ error: message or "timeout" })
 *   - 10.  merge: map = MERGE_HEALTH_MAP(map, url, record)
 *   - 11. WRITE hoverboard_link_health = map
 *   - 12. RETURN { success: true, results, checked: list.length }
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
 * ## Link health checks enabled flag
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Privacy-first opt-in; config key linkHealthChecksEnabled defaults false.
 * - Contract:
 *   - INPUT: config (MergedConfig|null)
 *   - OUTPUT: boolean (true only when linkHealthChecksEnabled === true)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_LINK_HEALTH_CHECKS_ENABLED
 *   - 1. RETURN config.linkHealthChecksEnabled === true
 *
 * ## Format capture-UI health hint
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Compact This Page/popup label from stored record when enabled.
 * - Contract:
 *   - INPUT: rec (health record|null), { enabled }
 *   - PRE: enabled false or missing record => empty string
 *   - OUTPUT: "" | "Health: {status}" | "Health: {status} ({httpStatus})"
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FORMAT_LINK_HEALTH_HINT
 *   - 1. IF NOT enabled OR NOT rec.status THEN RETURN ""
 *   - 2. IF httpStatus != null THEN RETURN "Health: {status} ({httpStatus})"
 *   - 3. RETURN "Health: {status}"
 *
 * ## Gate Index check controls
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Hide/disable Check link health controls when opt-in off; Health column may remain read-only.
 * - Contract:
 *   - INPUT: enabled (boolean), checkButton (element|null)
 *   - EFFECTS: State (DOM hidden/disabled)
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_LINK_HEALTH_CONTROLS_GATE
 *   - 1. IF checkButton null THEN RETURN
 *   - 2. checkButton.hidden = NOT enabled; checkButton.disabled = NOT enabled
 *
 * ## Index Check link health UI
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Index orchestrator runCheckLinkHealth (bookmarks-table-link-health.js) for composition tests; applySearchAndFilter uses FILTER_BOOKMARKS_BY_HEALTH; Health cell via formatHealthCellLabel; gated by linkHealthChecksEnabled.
 * - Contract:
 *   - INPUT: selectedUrls OR filteredBookmarks urls; sendMessage; resultEl; onResults; enabled?
 *   - PRE: sendMessage available; urls may be empty
 *   - OUTPUT: status text; linkHealthMap merge; table refresh on success
 *   - POST:
 *     - success => onResults called with results; resultEl shows Checked N
 *     - empty urls => resultEl "No URLs to check"; no sendMessage
 *     - enabled === false => resultEl "Link health checks disabled"; no sendMessage
 *   - FAILURE_MODES: EmptyUrls, Disabled, CheckFailed, SendThrow
 *   - EFFECTS: Async, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_CHECK_LINK_HEALTH_UI
 *   - 1. IF enabled === false THEN set resultEl; RETURN failure Disabled
 *   - 2. urls = selected OR filtered URLs
 *   - 3. CALL runCheckLinkHealth({ urls, sendMessage, resultEl, onResults })
 *   - 4. onResults: merge into linkHealthMap; applySearchAndFilter
 *
 * ## Capture UI link health hint
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Popup/This Page reads GET_LINK_HEALTH for current URL when opt-in on; apply hint text to DOM.
 * - Contract:
 *   - INPUT: currentUrl; config; sendMessage GET_LINK_HEALTH; hintEl
 *   - PRE: IS_LINK_HEALTH_CHECKS_ENABLED(config)
 *   - OUTPUT: hintEl text/hidden
 *   - EFFECTS: Async, State, IO
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_UI_LINK_HEALTH_HINT
 *   - 1. IF NOT IS_LINK_HEALTH_CHECKS_ENABLED(config) THEN clear hintEl; RETURN
 *   - 2. map = GET_LINK_HEALTH
 *   - 3. text = FORMAT_LINK_HEALTH_HINT(map[currentUrl], { enabled: true })
 *   - 4. APPLY hintEl = text (hidden when empty)
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
    // R1b: opt-in default is false; enable for existing CHECK path tests
    jest.spyOn(sw.configManager, 'getConfig').mockResolvedValue({ linkHealthChecksEnabled: true })
    jest.spyOn(sw.configManager, 'getInhibitUrls').mockResolvedValue([])
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

  test('inhibit-list URL skips fetch and records unreachable/inhibited', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    jest.spyOn(sw.configManager, 'getInhibitUrls').mockResolvedValue(['private.example'])
    const result = await sw._checkLinkHealth([
      'https://private.example/secret',
      'https://public.example/'
    ])
    expect(result.success).toBe(true)
    expect(result.checked).toBe(2)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://public.example/',
      expect.objectContaining({ method: 'HEAD', signal: expect.any(AbortSignal) })
    )
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://private.example/secret'].status).toBe('unreachable')
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://private.example/secret'].error).toBe('inhibited')
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://public.example/'].status).toBe('ok')
  })

  test('fetch abort/timeout records unreachable/timeout', async () => {
    global.fetch = jest.fn((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const err = new Error('The operation was aborted')
        err.name = 'AbortError'
        reject(err)
      })
    }))
    jest.spyOn(sw.configManager, 'getInhibitUrls').mockResolvedValue([])
    const result = await sw._checkLinkHealth(['https://hang.example/'], { timeoutMs: 15 })
    expect(result.success).toBe(true)
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://hang.example/'].status).toBe('unreachable')
    expect(storage[LINK_HEALTH_STORAGE_KEY]['https://hang.example/'].error).toBe('timeout')
  })

  test('opt-in off rejects CHECK without fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
    sw.configManager.getConfig.mockResolvedValue({ linkHealthChecksEnabled: false })
    const result = await sw._checkLinkHealth(['https://blocked.example/'])
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/disabled/i)
    expect(global.fetch).not.toHaveBeenCalled()
    expect(storage[LINK_HEALTH_STORAGE_KEY]).toBeUndefined()
  })
})
