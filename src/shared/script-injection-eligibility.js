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
 * [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] — Summary: Suggested tags from page — canonical source extraction, case-insensitive Current Tags conflict handling, and Suggested Tags-only case-converted render/action values.
 *
 * ## EXTRACT_SUGGESTED_TAGS
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL: Popup path depends on IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags; ordering invariant — executeScript file (snippet) then func (global extractor); shared data — raw canonical source-cased array from page world; post — NORMALIZE_SUGGESTED_ROWS then filters then Suggested Tags-only display/action conversion in UIManager; on error or non-scriptable URL (IMPL-POPUP_SESSION CLASSIFY_SCRIPT_INJECTION_URL: restricted_scheme / extensions_gallery / missing_url) — updateSuggestedTags([]) + injectionOutcome; no debugError for expected skips. How — composed_with IMPL-SELECTION_TO_TAG_INPUT: pre — Suggested Tags rendered in UIManager; post — selection/tag-input add flows attach to chip DOM per IMPL-SELECTION_TO_TAG_INPUT (shared surface only; no ordering constraint on extraction).
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
 * ## CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: Sanitize the raw page suggestion, apply the active Suggested Tags label conversion, and classify the adjusted value against authoritative Current Tags for the side-panel This Page surface while leaving popup and overlay filtering behavior unchanged.
 * - Contract:
 *   - INPUT: suggestedTag string; comparisonTag string adjusted by Tag labels mode; currentTags array or tag string
 *   - PRE: suggestedTag is page-derived input; comparisonTag is the active display/action value; currentTags may contain source-cased persisted tags
 *   - OUTPUT: null for invalid input, otherwise `{ state: "absent" | "case-match" | "case-mismatch", suggestedTag: string, matchedTag: string | null }`; comparisonTag is an input-only adjusted value
 *   - POST: exact case matches between comparisonTag and Current Tags are classified as case-match; case-insensitive matches with different casing as case-mismatch; no case-insensitive match as absent
 *   - FAILURE_MODES: invalid or unsafe suggested tag
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE
 *   - sanitizedSource = SANITIZE_SUGGESTED_TAG(suggestedTag); IF sanitizedSource is null THEN RETURN null
 *   - sanitizedComparison = SANITIZE_SUGGESTED_TAG(comparisonTag); IF sanitizedComparison is null THEN RETURN null
 *   - current = NORMALIZE_CURRENT_TAGS(currentTags) without changing persisted source casing
 *   - IF current contains sanitizedComparison with exact case THEN RETURN state case-match, suggestedTag sanitizedSource, matchedTag exact match
 *   - IF current contains a tag whose lower-case value equals sanitizedComparison lower-case value THEN RETURN state case-mismatch, suggestedTag sanitizedSource, matchedTag first case-insensitive match
 *   - RETURN state absent, suggestedTag sanitizedSource, matchedTag null
 *
 * ## REPLACE_SUGGESTED_TAG_IN_PLACE
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-TAG_SYSTEM] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] How: Atomically replace the matched persisted tag with the clicked case-converted Suggested Tag value at the first matching position, remove duplicate case variants of that tag, and preserve every unrelated tag and its order.
 * - Contract:
 *   - INPUT: currentTags array; matchedTag string; replacementTag string
 *   - PRE: currentTags is the authoritative snapshot used for the save; replacementTag is page-derived and must pass suggested-tag sanitization
 *   - OUTPUT: `{ ok: boolean, tags: array, replacedTag?: string, reason?: string }`
 *   - POST: success changes only the matching case-insensitive tag group and preserves its first position; failure returns a copy with no mutation
 *   - FAILURE_MODES: invalid replacement, invalid tag collection, or no matching tag
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_SUGGESTED_TAG_IN_PLACE
 *   - original = shallow copy currentTags when currentTags is an array; otherwise RETURN `{ ok: false, tags: [], reason: invalid_tags }`
 *   - replacement = SANITIZE_SUGGESTED_TAG(replacementTag); IF replacement is null THEN RETURN `{ ok: false, tags: original, reason: invalid_replacement }`
 *   - matchKey = lower-case sanitized matchedTag; IF matchKey is empty THEN RETURN `{ ok: false, tags: original, reason: invalid_match }`
 *   - matchingIndexes = indexes of string tags whose trimmed lower-case value equals matchKey
 *   - IF matchingIndexes is empty THEN RETURN `{ ok: false, tags: original, reason: match_not_found }`
 *   - firstIndex = first matchingIndexes value
 *   - output = replace tag at firstIndex with replacement and omit all later matching indexes
 *   - RETURN `{ ok: true, tags: output, replacedTag: original[firstIndex] }`
 *
 * ## LOAD_SIDE_PANEL_SUGGESTED_TAGS
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: Add three-state metadata only for the scoped side-panel UI; preserve canonical source data for identity, apply the active case conversion before conflict classification, apply each state’s background, border, and visible text styling consistently in normal/hover/focus states, and preserve existing popup and overlay filtering/add flow.
 * - Contract:
 *   - INPUT: normalized suggested rows; current bookmark tags; UI surface; active Tag labels mode
 *   - PRE: rows have source-cased tag values; side-panel scope is observable from UIManager container; adjusted display/action values are derived from the active mode
 *   - OUTPUT: side-panel rows with absent, case-match, or case-mismatch state metadata; popup/overlay rows retain their existing shape and filtering
 *   - POST: side-panel absent rows route to add, exact matches route to remove, and mismatches route to replace; the clicked case-converted Suggested Tag value is the add/replace payload while the exact stored match remains the remove identity
 *   - FAILURE_MODES: script extraction failure, unavailable page, invalid row
 *   - EFFECTS: Async, IO, State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_SIDE_PANEL_SUGGESTED_TAGS
 *   - rows = NORMALIZE_SUGGESTED_ROWS(raw)
 *   - IF surface is side-panel THEN
 *     - adjusted = tagChipDisplayAndAddValue(row.tag, tagCaseFoldingMode).addValue
 *     - classified = MAP rows through CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE(row.tag, currentTags, adjusted)
 *     - DROP null classifications only
 *     - RETURN rows enriched with state and matchedTag
 *   - ELSE
 *     - FILTER rows using existing case-insensitive popup/overlay exclusion
 *     - RETURN rows unchanged
 *
 * ## PERSIST_SIDE_PANEL_SUGGESTED_TAG_ACTION
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-TAG_SYSTEM] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] How: Route absent suggestions through the existing add action, exact adjusted-value matches through the existing stored-value removal action, and adjusted-value case-mismatch suggestions through one full-bookmark save using the clicked case-converted Suggested Tag value and REPLACE_SUGGESTED_TAG_IN_PLACE; update UI state only after persistence succeeds.
 * - Contract:
 *   - INPUT: action state; clicked case-converted Suggested Tag value; optional matchedTag; authoritative current bookmark
 *   - PRE: action originated from a rendered side-panel chip; save backend is available
 *   - OUTPUT: one persisted bookmark update and refreshed This Page state
 *   - POST: clicked case-converted Suggested Tag value is persisted; unrelated tags and order are preserved; failed save leaves local bookmark/UI state unchanged
 *   - FAILURE_MODES: invalid action, stale match, save rejection
 *   - EFFECTS: Async, IO, State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: PERSIST_SIDE_PANEL_SUGGESTED_TAG_ACTION
 *   - IF state absent THEN DISPATCH existing add-tag flow with clicked case-converted Suggested Tag value; RETURN
 *   - IF state case-match THEN DISPATCH existing remove-tag flow with matchedTag; RETURN
 *   - IF state case-mismatch THEN
 *     - snapshot = READ authoritative current bookmark
 *     - replacement = REPLACE_SUGGESTED_TAG_IN_PLACE(snapshot.tags, matchedTag, clicked case-converted Suggested Tag value)
 *     - IF replacement.ok is false THEN REFRESH suggestions without saving; RETURN
 *     - AWAIT one full-bookmark save with replacement.tags
 *     - IF save fails THEN preserve snapshot/UI state and report failure
 *     - ELSE APPLY replacement.tags locally and REFRESH current/recent/suggested chips
 *
 * ## PRESERVE_SIDE_PANEL_SCROLL_DURING_SUGGESTED_TAG_ACTION
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: Preserve the scoped This Page container scroll position across Suggested Tag loading, focus, persistence, and chip-redraw effects while leaving standalone popup behavior unchanged.
 * - Contract:
 *   - INPUT: isLoading boolean; optional scoped UIManager container
 *   - PRE: UIManager has applied its element cache; a scoped container, when present, is the This Page bookmark panel scroll container
 *   - OUTPUT: loading visibility and controls updated; scoped container scrollTop restored after a completed loading transition
 *   - POST: when a scoped container exists, the scrollTop captured before the outermost loading transition equals the scrollTop after loading ends, subject to the browser's current scroll range; when no container exists, popup behavior is unchanged
 *   - FAILURE_MODES: missing container, repeated loading transition, or unavailable scrollTop
 *   - DATA: savedScopedScrollTop (number or undefined); loadingTransitionActive (boolean)
 *   - DATA_TRANSITION: capture savedScopedScrollTop only when entering loading; do not overwrite it on repeated loading calls; clear it after restoring on exit
 *   - EFFECTS: DOM, State
 *   - TERMINATION: total
 * - PROCEDURE: SET_LOADING_WITH_SCOPED_SCROLL_RESTORE
 *   - IF isLoading AND NOT loadingTransitionActive AND container exists THEN save container.scrollTop
 *   - APPLY loading-state visibility and interactive-control disabled state
 *   - IF NOT isLoading AND loadingTransitionActive THEN
 *     - SHOW mainInterface
 *     - IF savedScopedScrollTop is a number THEN SET container.scrollTop = savedScopedScrollTop
 *     - CLEAR savedScopedScrollTop and loadingTransitionActive
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
