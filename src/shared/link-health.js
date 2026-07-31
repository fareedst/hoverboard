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
export const LINK_HEALTH_STORAGE_KEY = 'hoverboard_link_health'

/** Default per-request AbortController timeout for HEAD/GET (ms). */
export const LINK_HEALTH_FETCH_TIMEOUT_MS = 8000

/** Persisted error when URL matches hoverboard_inhibit_urls (no fetch). */
export const LINK_HEALTH_INHIBITED_ERROR = 'inhibited'

/** Persisted error when AbortController aborts a health fetch. */
export const LINK_HEALTH_TIMEOUT_ERROR = 'timeout'

/**
 * [IMPL-LINK_HEALTH] [IMPL-URL_INHIBITION] Pure inhibit match (protocol stripped; substring both ways).
 * @param {string} url
 * @param {string[]|null|undefined} inhibitUrls
 * @returns {boolean}
 */
export function urlMatchesInhibitList (url, inhibitUrls) {
  if (!url || typeof url !== 'string') return false
  const list = Array.isArray(inhibitUrls) ? inhibitUrls : []
  const normalizedUrl = url.replace(/^https?:\/\//i, '')
  return list.some((entry) => {
    const inhibitUrl = String(entry || '').trim()
    if (!inhibitUrl) return false
    return normalizedUrl.includes(inhibitUrl) || inhibitUrl.includes(normalizedUrl)
  })
}

/**
 * [IMPL-LINK_HEALTH] AbortController-bounded fetch; does not read response body.
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {{ fetchFn?: typeof fetch, timeoutMs?: number }} [options]
 * @returns {Promise<Response>}
 */
export async function fetchWithLinkHealthTimeout (url, init = {}, options = {}) {
  const timeoutMs = options.timeoutMs ?? LINK_HEALTH_FETCH_TIMEOUT_MS
  const fetchFn = options.fetchFn ?? globalThis.fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetchFn(url, {
      ...init,
      redirect: init.redirect ?? 'follow',
      signal: controller.signal
    })
  } catch (e) {
    if (e?.name === 'AbortError' || controller.signal.aborted) {
      const err = new Error(LINK_HEALTH_TIMEOUT_ERROR)
      err.name = 'AbortError'
      throw err
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/**
 * [IMPL-LINK_HEALTH] Privacy-first opt-in: true only when config.linkHealthChecksEnabled === true.
 * @param {{ linkHealthChecksEnabled?: boolean }|null|undefined} config
 * @returns {boolean}
 */
export function isLinkHealthChecksEnabled (config) {
  return config?.linkHealthChecksEnabled === true
}

/**
 * Compact This Page/popup hint when opt-in on and a stored record exists.
 * @param {{ status?: string, httpStatus?: number|null }|null|undefined} rec
 * @param {{ enabled?: boolean }} [opts]
 * @returns {string}
 */
export function formatLinkHealthHint (rec, opts = {}) {
  if (!opts.enabled) return ''
  if (!rec || !rec.status) return ''
  if (rec.httpStatus != null) return `Health: ${rec.status} (${rec.httpStatus})`
  return `Health: ${rec.status}`
}

/**
 * Apply hint text to a capture-UI element (hidden when empty).
 * @param {HTMLElement|null|undefined} el
 * @param {string} text
 */
export function applyLinkHealthHint (el, text) {
  if (!el) return
  const t = String(text || '')
  if (!t) {
    el.hidden = true
    el.textContent = ''
    return
  }
  el.hidden = false
  el.textContent = t
}

/**
 * Gate Index Check link health button when opt-in is off.
 * @param {boolean} enabled
 * @param {HTMLButtonElement|HTMLElement|null|undefined} checkButton
 */
export function applyLinkHealthControlsGate (enabled, checkButton) {
  if (!checkButton) return
  const on = !!enabled
  checkButton.hidden = !on
  if ('disabled' in checkButton) checkButton.disabled = !on
}

/**
 * @param {number} status
 * @returns {'ok'|'redirect'|'client_error'|'server_error'|'unknown'}
 */
export function classifyHttpStatus (status) {
  const n = Number(status)
  if (!Number.isFinite(n) || n <= 0) return 'unknown'
  if (n >= 200 && n < 300) return 'ok'
  if (n >= 300 && n < 400) return 'redirect'
  if (n >= 400 && n < 500) return 'client_error'
  if (n >= 500 && n < 600) return 'server_error'
  return 'unknown'
}

/**
 * @param {{ ok?: boolean, status?: number, error?: string }} result
 * @returns {{ status: string, httpStatus: number|null, error: string|null, checkedAt: string }}
 */
export function buildHealthRecord (result = {}) {
  const checkedAt = new Date().toISOString()
  if (result.error) {
    return {
      status: 'unreachable',
      httpStatus: null,
      error: String(result.error),
      checkedAt
    }
  }
  const httpStatus = result.status != null ? Number(result.status) : null
  return {
    status: classifyHttpStatus(httpStatus),
    httpStatus,
    error: null,
    checkedAt
  }
}

/**
 * Merge one URL health into the map.
 * @param {Record<string, object>} map
 * @param {string} url
 * @param {object} record
 */
export function mergeHealthMap (map, url, record) {
  const next = { ...(map || {}) }
  if (!url) return next
  next[url] = record
  return next
}

/**
 * Filter bookmarks by health status class.
 * @param {Array<object>} bookmarks
 * @param {Record<string, object>} healthMap
 * @param {string} statusFilter - '' | ok | redirect | client_error | server_error | unreachable | unknown
 */
export function filterBookmarksByHealth (bookmarks, healthMap, statusFilter) {
  const f = String(statusFilter || '').trim()
  if (!f) return bookmarks || []
  const map = healthMap || {}
  return (bookmarks || []).filter((b) => {
    const rec = map[b.url]
    const st = rec?.status || 'unknown'
    return st === f
  })
}
