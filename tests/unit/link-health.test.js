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
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Resolve the effective link-health setting with an enabled-by-absence default while preserving an explicit false opt-out.
 * - Contract:
 *   - INPUT: config (MergedConfig|null|undefined)
 *   - PRE: missing linkHealthChecksEnabled means no explicit user choice; false is an explicit opt-out
 *   - OUTPUT: boolean (true when linkHealthChecksEnabled is absent or true; false only when explicitly false)
 *   - POST:
 *     - null, undefined, or absent setting => true
 *     - explicit false => false
 *     - any other present value => true
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_LINK_HEALTH_CHECKS_ENABLED
 *   - 1. IF config is null or linkHealthChecksEnabled is absent THEN RETURN true
 *   - 2. RETURN config.linkHealthChecksEnabled !== false
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
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Hide/disable Check link health controls only when the effective setting is false; Health column may remain read-only.
 * - Contract:
 *   - INPUT: enabled (boolean), checkButton (element|null)
 *   - PRE: enabled is the effective setting; checkButton may be null
 *   - OUTPUT: control state with hidden and disabled values
 *   - POST:
 *     - null button => no DOM mutation
 *     - button present => hidden and disabled equal NOT enabled
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
import {
  classifyHttpStatus,
  buildHealthRecord,
  mergeHealthMap,
  filterBookmarksByHealth,
  urlMatchesInhibitList,
  fetchWithLinkHealthTimeout,
  isLinkHealthChecksEnabled,
  formatLinkHealthHint,
  applyLinkHealthHint,
  applyLinkHealthControlsGate,
  LINK_HEALTH_INHIBITED_ERROR,
  LINK_HEALTH_TIMEOUT_ERROR,
  LINK_HEALTH_FETCH_TIMEOUT_MS
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
    expect(r.httpStatus).toBeNull()
  })

  test('ok status classifies httpStatus and clears error', () => {
    const r = buildHealthRecord({ status: 200, ok: true })
    expect(r.status).toBe('ok')
    expect(r.httpStatus).toBe(200)
    expect(r.error).toBeNull()
    expect(typeof r.checkedAt).toBe('string')
  })

  test('timeout and inhibited errors persist as unreachable', () => {
    expect(buildHealthRecord({ error: LINK_HEALTH_TIMEOUT_ERROR })).toMatchObject({
      status: 'unreachable',
      error: 'timeout',
      httpStatus: null
    })
    expect(buildHealthRecord({ error: LINK_HEALTH_INHIBITED_ERROR })).toMatchObject({
      status: 'unreachable',
      error: 'inhibited',
      httpStatus: null
    })
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

describe('[REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] URL_MATCHES_INHIBIT_LIST', () => {
  test('matches inhibit entry as substring (protocol stripped)', () => {
    expect(urlMatchesInhibitList('https://secret.example/path', ['secret.example'])).toBe(true)
    expect(urlMatchesInhibitList('http://ok.example/', ['secret.example'])).toBe(false)
  })

  test('empty inhibit list and empty url', () => {
    expect(urlMatchesInhibitList('https://a.test/', [])).toBe(false)
    expect(urlMatchesInhibitList('https://a.test/', null)).toBe(false)
    expect(urlMatchesInhibitList('', ['a.test'])).toBe(false)
  })
})

describe('[REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] FETCH_WITH_LINK_HEALTH_TIMEOUT', () => {
  test('exports default timeout constant', () => {
    expect(LINK_HEALTH_FETCH_TIMEOUT_MS).toBeGreaterThan(0)
    expect(LINK_HEALTH_INHIBITED_ERROR).toBe('inhibited')
    expect(LINK_HEALTH_TIMEOUT_ERROR).toBe('timeout')
  })

  test('aborts slow fetch and throws timeout AbortError', async () => {
    const fetchFn = jest.fn((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const err = new Error('The operation was aborted')
        err.name = 'AbortError'
        reject(err)
      })
    }))
    await expect(
      fetchWithLinkHealthTimeout('https://slow.example/', { method: 'HEAD' }, { fetchFn, timeoutMs: 20 })
    ).rejects.toMatchObject({ name: 'AbortError', message: LINK_HEALTH_TIMEOUT_ERROR })
    expect(fetchFn).toHaveBeenCalledWith(
      'https://slow.example/',
      expect.objectContaining({ method: 'HEAD', redirect: 'follow', signal: expect.any(AbortSignal) })
    )
  })

  test('returns response on success without reading body', async () => {
    const res = { ok: true, status: 200, text: jest.fn() }
    const fetchFn = jest.fn().mockResolvedValue(res)
    const out = await fetchWithLinkHealthTimeout('https://ok.example/', { method: 'GET' }, { fetchFn, timeoutMs: 1000 })
    expect(out).toBe(res)
    expect(res.text).not.toHaveBeenCalled()
  })
})

describe('[REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] effective setting + hint helpers', () => {
  test('isLinkHealthChecksEnabled enables absent setting and preserves explicit false', () => {
    expect(isLinkHealthChecksEnabled(undefined)).toBe(true)
    expect(isLinkHealthChecksEnabled({})).toBe(true)
    expect(isLinkHealthChecksEnabled({ linkHealthChecksEnabled: false })).toBe(false)
    expect(isLinkHealthChecksEnabled({ linkHealthChecksEnabled: true })).toBe(true)
  })

  test('formatLinkHealthHint empty when disabled or missing', () => {
    expect(formatLinkHealthHint({ status: 'ok', httpStatus: 200 }, { enabled: false })).toBe('')
    expect(formatLinkHealthHint(null, { enabled: true })).toBe('')
    expect(formatLinkHealthHint({ status: 'ok', httpStatus: 200 }, { enabled: true })).toBe('Health: ok (200)')
    expect(formatLinkHealthHint({ status: 'unreachable' }, { enabled: true })).toBe('Health: unreachable')
  })

  test('applyLinkHealthHint hides when empty', () => {
    document.body.innerHTML = '<span id="h"></span>'
    const el = document.getElementById('h')
    applyLinkHealthHint(el, 'Health: ok (200)')
    expect(el.hidden).toBe(false)
    expect(el.textContent).toBe('Health: ok (200)')
    applyLinkHealthHint(el, '')
    expect(el.hidden).toBe(true)
    expect(el.textContent).toBe('')
  })

  test('applyLinkHealthControlsGate hides and disables check button', () => {
    document.body.innerHTML = '<button id="check-link-health">Check</button>'
    const btn = document.getElementById('check-link-health')
    applyLinkHealthControlsGate(false, btn)
    expect(btn.hidden).toBe(true)
    expect(btn.disabled).toBe(true)
    applyLinkHealthControlsGate(true, btn)
    expect(btn.hidden).toBe(false)
    expect(btn.disabled).toBe(false)
  })
})
