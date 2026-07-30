/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
 * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] — PopupController handlers await messages; StateManager and UIManager updates; no window.close. Contract: user actions and GET_OVERLAY_STATE; popup open and state/UI in sync.
 *
 * ## MAIN
 *
 * - [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] How: Logical block for IMPL-POPUP_SESSION.
 * - Contract:
 *   - INPUT: user actions (show overlay, toggle private, save, etc.); GET_OVERLAY_STATE fallback
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup stays open; state and UI updated; no window.close
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: StateManager (overlay visible, bookmark, etc.); UIManager (button states, labels)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Await message; update state and UI; inline notification; do not close.
 *   - 1. PopupController handler (e.g. handleShowHoverboard):
 *   - 2.   AWAIT send message (e.g. TOGGLE_OVERLAY)
 *   - 3.   StateManager.update(...); UIManager.updateShowHoverButtonState(...)
 *   - 4.   INLINE notification if needed; DO NOT call window.close
 *   - How (sub-block): On open sync overlay state to StateManager and UIManager.
 *   - 5. ON popup open: SEND GET_OVERLAY_STATE; SYNC state to StateManager and UIManager
 *
 * ## CLASSIFY_SCRIPT_INJECTION_URL
 *
 * - [IMPL-POPUP_SESSION] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Shared pure classifier in src/shared/script-injection-eligibility.js for browser-forbidden (non-scriptable) URLs vs injectable http(s). Distinct from user inhibit URLs (IMPL-URL_INHIBITION). Used by canInjectIntoTab, loadSuggestedTags, updateOverlayState, injectContentScript.
 * - Contract:
 *   - INPUT: url (string | unknown); optional error object for classifyScriptInjectionError
 *   - PRE: true (total on any input shape)
 *   - OUTPUT: { injectable: boolean, reason: missing_url | restricted_scheme | extensions_gallery | ok } | classifyScriptInjectionError -> reason | null
 *   - POST:
 *     - success => reason codes are closed-set; injectable true only when reason is ok
 *     - restricted schemes / gallery hosts / missing url => injectable false
 *   - FAILURE_MODES: none (total, no throw)
 *   - DATA: gallery host allowlist (chromewebstore.google.com; chrome.google.com/webstore; microsoftedge.microsoft.com/addons)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CLASSIFY_SCRIPT_INJECTION_URL
 *   - IF url not non-empty string: RETURN { injectable: false, reason: missing_url }
 *   - IF scheme in chrome:// | chrome-extension:// | edge:// | about: | devtools:// | view-source: OR not http(s): RETURN { injectable: false, reason: restricted_scheme }
 *   - IF isExtensionsGalleryUrl(url): RETURN { injectable: false, reason: extensions_gallery }
 *   - RETURN { injectable: true, reason: ok }
 *   - How (sub-block): classifyScriptInjectionError(error) maps Chrome rejection text to extensions_gallery | restricted_scheme | null (unexpected).
 *
 * ## SKIP_NON_SCRIPTABLE_INJECT
 *
 * - [IMPL-POPUP_SESSION] [IMPL-UI_INSPECTOR] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-UI_INSPECTION] How: Precheck before suggested-tags / overlay-state / content inject — CLASSIFY_SCRIPT_INJECTION_URL; non-scriptable → skip scripting, recordAction injectionOutcome, debugLog/warn (not debugError); unexpected failures remain debugError.
 * - Contract:
 *   - INPUT: currentTab.url; phase (suggested_tags | overlay_state | inject); optional refresh trigger/surface
 *   - PRE: classifier available; ui-inspector may be disabled (recordAction no-ops)
 *   - OUTPUT: skip (empty suggested / false overlay / no inject) | proceed to scripting | { error: UnexpectedInjectFailed }
 *   - POST:
 *     - expected skip => injectionOutcome recorded; no chrome.scripting call; no debugError
 *     - injectable ok => scripting may proceed
 *   - FAILURE_MODES: UnexpectedInjectFailed
 *   - DATA: _refreshTrigger, _refreshSurface for inspector attribution
 *   - DATA_TRANSITION: on skip, suggested tags cleared or overlay button forced off as phase dictates; else unchanged until inject path runs
 *   - EFFECTS: IO, State, Async
 *   - TERMINATION: total
 * - PROCEDURE: SKIP_NON_SCRIPTABLE_INJECT
 *   - classif = classifyScriptInjectionUrl(tab.url)
 *   - IF NOT classif.injectable:
 *   -   recordAction injectionOutcome { phase, reason: classif.reason, injectable: false, trigger, surface }
 *   -   debugLog/warn; APPLY phase skip; RETURN
 *   - TRY scripting path
 *   - CATCH err:
 *   -   expected = classifyScriptInjectionError(err)
 *   -   IF expected: recordAction injectionOutcome { reason: expected }; debugWarn; RETURN
 *   -   debugError; RETURN error UnexpectedInjectFailed
 *
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *
 * - [IMPL-POPUP_SESSION] [IMPL-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-POPUP_PERSISTENT_SESSION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: setupRealTimeUpdates BOOKMARK_UPDATED watcher is an observer listener (see IMPL-MESSAGE_HANDLING UNWRAP_MESSAGE_RESPONSE / IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH): sync function, return undefined, detached refreshPopupData then updateOverlayState.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope
 *   - PRE: setupRealTimeUpdates registered
 *   - OUTPUT: undefined; refresh may run asynchronously
 *   - POST:
 *     - success => response channel not claimed
 *   - FAILURE_MODES: RefreshFailed (caught in detached chain)
 *   - DATA: PopupController session
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, This Page + overlay state refreshed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refresh (refreshPopupData then updateOverlayState); CATCH → debugError
 *   -   RETURN undefined
 *
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SUGGESTED_TAGS ===
 * [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] — Summary: Suggested tags from page — overlay TagService.extractSuggestedTagsFromContent; Chromium popup via MAIN-world snippet global and IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags (inject, normalize, filter, UIManager handoff).
 *
 * ## EXTRACT_SUGGESTED_TAGS
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL: Popup path depends on IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags; ordering invariant — executeScript file (snippet) then func (global extractor); shared data — raw array from page world; post — NORMALIZE_SUGGESTED_ROWS then filters then updateSuggestedTags(rows); on error or non-scriptable URL (IMPL-POPUP_SESSION CLASSIFY_SCRIPT_INJECTION_URL: restricted_scheme / extensions_gallery / missing_url) — updateSuggestedTags([]) + injectionOutcome; no debugError for expected skips. How — composed_with IMPL-SELECTION_TO_TAG_INPUT: pre — suggested chips rendered in UIManager; post — selection/tag-input add flows attach to chip DOM per IMPL-SELECTION_TO_TAG_INPUT (shared surface only; no ordering constraint on extraction).
 * - Contract:
 *   - INPUT: active page document (implicit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number }; tag sanitized by snippet inline rules; canonical case per pickBetterSuggestedOriginalCase rank
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: noise set; delimiter regex MUST match TagService tokenization (ARCH-SUGGESTED_TAGS tokenizer sync)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_SUGGESTED_TAGS
 *   - IF document invalid THEN RETURN []
 *   - TRY:
 *   - allTexts = GATHER_SOURCES(document, url)
 *   - IF allTexts empty THEN RETURN []
 *   - words = TOKENIZE(join allTexts) using shared delimiter regex
 *   - FOR each token: increment wordFrequency(lower); update originalCaseMap with pickBetterSuggestedOriginalCase
 *   - sortedEntries = SORT wordFrequency by count desc then key asc
 *   - sortedWords = PLUCK canonical string per key from originalCaseMap
 *   - How (sub-block): # [IMPL-SUGGESTED_TAGS] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION]
 *   - How (sub-block): # How — map each candidate through TagService.sanitizeTag (overlay path delegates to IMPL-TAG_SYSTEM).
 *   - sanitized = MAP each sortedWord through SANITIZE_OVERLAY (= TagService.sanitizeTag)
 *   - unique = DEDUPE exact adjacent duplicates preserving order
 *   - RETURN slice(unique, 0, limit)
 *   - CATCH:
 *   - RETURN []
 *   - How (sub-block): How — Cross-path note (S06.3): overlay sanitizeTag vs snippet inline sanitizer may differ on edge characters; tokenizer must remain identical. See ARCH-SUGGESTED_TAGS.
 *   - How (sub-block): How — Popup inject eligibility is CLASSIFY_SCRIPT_INJECTION_URL in IMPL-POPUP_SESSION (shared module); this EXTRACT block covers page-world extraction only.
 *
 * === END IMPL-FULL-BLOCK: IMPL-SUGGESTED_TAGS ===
 */
export function classifyScriptInjectionUrl (url) {
  if (typeof url !== 'string') {
    return { injectable: false, reason: 'missing_url' }
  }
  const trimmed = url.trim()
  if (!trimmed) {
    return { injectable: false, reason: 'missing_url' }
  }

  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('chrome://') ||
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('edge://') ||
    lower.startsWith('about:') ||
    lower.startsWith('devtools://') ||
    lower.startsWith('view-source:')
  ) {
    return { injectable: false, reason: 'restricted_scheme' }
  }

  if (isExtensionsGalleryUrl(trimmed)) {
    return { injectable: false, reason: 'extensions_gallery' }
  }

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return { injectable: false, reason: 'restricted_scheme' }
  }

  return { injectable: true, reason: 'ok' }
}

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isScriptInjectableUrl (url) {
  return classifyScriptInjectionUrl(url).injectable
}

/**
 * Chrome Web Store / Edge add-ons gallery hosts (https but not scriptable).
 * @param {unknown} url
 * @returns {boolean}
 */
export function isExtensionsGalleryUrl (url) {
  if (typeof url !== 'string' || !url.trim()) return false
  let parsed
  try {
    parsed = new URL(url.trim())
  } catch {
    return false
  }
  const host = parsed.hostname.toLowerCase()
  const path = parsed.pathname.toLowerCase()

  if (host === 'chromewebstore.google.com') return true
  if (host === 'chrome.google.com' && (path === '/webstore' || path.startsWith('/webstore/'))) return true
  if (host === 'microsoftedge.microsoft.com' && (path === '/addons' || path.startsWith('/addons/'))) return true
  return false
}

/**
 * Map Chrome scripting rejection messages to stable reason codes (or null if unexpected).
 * @param {unknown} error
 * @returns {ScriptInjectionReason | null}
 */
export function classifyScriptInjectionError (error) {
  const msg = (error && typeof error === 'object' && 'message' in error)
    ? String(/** @type {{ message?: unknown }} */ (error).message || '')
    : String(error || '')
  const lower = msg.toLowerCase()
  if (lower.includes('extensions gallery cannot be scripted')) {
    return 'extensions_gallery'
  }
  if (
    lower.includes('chrome://') ||
    lower.includes('chrome-extension://') ||
    lower.includes('cannot be scripted') ||
    lower.includes('cannot access contents of url') ||
    lower.includes('extension manifest must request permission')
  ) {
    return 'restricted_scheme'
  }
  return null
}
