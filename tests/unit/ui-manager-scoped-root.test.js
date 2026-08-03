/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK ===
 * [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] — This block defines the Bookmark tab content and init: markup with data-popup-ref, PopupController + UIManager with container, and "By Tag" → switch tab. Implements REQ by providing popup-equivalent in panel; implements ARCH by scoped root.
 * 
 * ## CREATE_POPUP
 * 
 * - [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT] How: Markup: #bookmarkPanel contains elements with data-popup-ref="mainInterface", data-popup-ref="loadingState", etc. Same structure as popup (quick actions, storage, tag management, search). Implements "Bookmark tab shows functional equivalent of popup UI". createPopup({ container }): when container provided, UIManager uses container for cacheElements (querySelector by data-popup-ref). PopupController receives that UIManager; loadInitialData gets current tab and bookmark; setupEventListeners binds same events. Implements reuse of popup stack with scoped root.
 * - Contract:
 *   - INPUT: User selects Bookmark tab; side-panel.js calls createPopup({ container: bookmarkPanel })
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_POPUP
 *   - uiManager = new UIManager({ ..., container })  // UIManager.cacheElements uses container if set
 *   - controller = new PopupController({ uiManager, ... })
 *   - RETURN { controller, uiManager, ... }
 * 
 * ## BLOCK_2
 * 
 * - [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] How: "By Tag" in panel: when in side panel context, do not send OPEN_SIDE_PANEL; instead call switchToTagsTreeTab() (or emit so side-panel.js switches tab). Implements "By Tag switches to By Tag tab" in panel. When switching to Bookmark tab and it was already inited, call controller.refreshPopupData() so getCurrentTab and getBookmarkData run for the active tab; content then reflects current tab's bookmark state (same as badge). Implements "Bookmark tab reflects current tab when selected". Prompt refresh (like badge): when Bookmark tab is visible, refresh on tabs.onActivated and on tabs.onUpdated (when updated tab is active and status complete). refreshBookmarkTabIfVisible() calls controller.refreshPopupData() only when activeTab === "bookmark" and controller exists. Implements "Bookmark tab refreshes promptly when active tab changes or completes".
 * - Contract:
 *   - INPUT: User selects Bookmark tab; side-panel.js calls createPopup({ container: bookmarkPanel })
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. ON "By Tag" click in This Page tab:
 *   - 2.   IF inPanelContext: switchToTagsTreeTab()  // e.g. callback from side-panel.js or global
 *   - 3.   ELSE: send OPEN_SIDE_PANEL  // popup context
 *   - 4. ON switchTab("bookmark"): IF bookmarkTabInited already true AND popupComponents.controller: controller.refreshPopupData()
 *   - 5. bindTabChangeRefresh(): chrome.tabs.onActivated → refreshBookmarkTabIfVisible(); chrome.tabs.onUpdated(tabId, changeInfo, tab) → IF changeInfo.status === "complete" AND tab.url AND updated tab is current window active tab: refreshBookmarkTabIfVisible()
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UIManager_SCOPED_ROOT ===
 * [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] — Summary: Scoped DOM resolution so UIManager runs in popup (document) or side-panel Bookmark subtree (container) without duplicate ids.
 * 
 * ## CACHE_ELEMENTS
 * 
 * - [IMPL-UIManager_SCOPED_ROOT] [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: How — composed_with IMPL-SIDE_PANEL_BOOKMARK: pre — Bookmark panel subtree mounted with data-popup-ref values matching popup element keys; ordering — container passed into UIManager constructor before cacheElements; post — this.elements[key] reference nodes under container (or null if missing); shared data — elementKeys and data-popup-ref attribute names align with popup ids.
 * - Contract:
 *   - INPUT: constructor options { container?: Element }; cacheElements() at init; updateSectionLabelsVisibility(showLabels: boolean)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: this.elements populated; section title nodes toggled visible/hidden | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: container (optional); elementKeys; data-popup-ref attribute names matching popup ids
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CACHE_ELEMENTS
 *   - FOR each key in elementKeys:
 *   - IF this.container:
 *   - this.elements[key] = this.container.querySelector('[data-popup-ref="' + key + '"]')
 *   - ELSE:
 *   - this.elements[key] = document.getElementById(key)
 *   - How (sub-block): How — section labels: scope query to container or document; no throw on empty NodeList.
 * 
 * ## UPDATE_SECTION_LABELS_VISIBILITY
 * 
 * - [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] How: Implements updateSectionLabelsVisibility(showLabels) behavior for IMPL-UIManager_SCOPED_ROOT.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_SECTION_LABELS_VISIBILITY
 *   - root = this.container || document
 *   - sectionTitles = root.querySelectorAll('.section-title')
 *   - FOR each title in sectionTitles:
 *   - IF showLabels THEN title.style.display = ''
 *   - ELSE title.style.display = 'none'
 * 
 * === END IMPL-FULL-BLOCK: IMPL-UIManager_SCOPED_ROOT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STATUS_UI ===
 * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] — Normalize and display selected-backend archive artifact status in shared popup/This Page UI; derive Offline Reader availability only from a readable archive.
 *
 * ## MAIN
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Coordinate fail-closed normalization, backend-scoped queries, scoped DOM application, context resets, and capture refreshes without changing archive handlers.
 * - Contract:
 *   - INPUT: current tab URL, selected backend, archive/screenshot query responses, capture results, scoped UI root
 *   - PRE: PopupController and UIManager are initialized; selected backend is resolved from the current bookmark/context
 *   - OUTPUT: independent archiveSaved and screenshotSaved indicators plus readerAvailable = archiveSaved
 *   - POST: positive state exists only when the selected backend returns a valid persisted artifact; stale readable archive remains available
 *   - FAILURE_MODES: unsupported backend, rejected message, malformed response, missing artifact identity, stale context
 *   - DATA: currentUrl, selectedBackend, archiveSaved, screenshotSaved, readerAvailable, statusContextKey
 *   - DATA_TRANSITION: context changes clear all status before new query; successful query replaces only the matching status snapshot
 *   - EFFECTS: Async, IO, State, DOM
 *   - TERMINATION: total
 *
 * ## NORMALIZE_ARCHIVE_ARTIFACT_STATUS
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Convert raw GET_PAGE_ARCHIVE and GET_PAGE_SCREENSHOTS results to a bounded all-false or positive status object; never infer persisted presence from metadata or defaults.
 * - Contract:
 *   - INPUT: artifactKind, backend, response
 *   - PRE: artifactKind is archive or screenshot
 *   - OUTPUT: { saved: boolean, readable: boolean, artifactId: string|null, backend: string|null }
 *   - POST: saved is true only for an accepted selected-backend persisted artifact; archive stale status remains readable
 *   - FAILURE_MODES: unsupported backend, success false, malformed payload, empty screenshot list, missing identity
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_ARCHIVE_ARTIFACT_STATUS
 *   - IF backend is not local or file: RETURN all-false
 *   - IF response is rejected, response.success is false, or response.data is malformed: RETURN all-false
 *   - IF artifactKind is archive:
 *   -   archive = response.data.archive OR response.archive OR response.data
 *   -   IF archive lacks persisted identity or non-empty readable content: RETURN all-false
 *   -   RETURN { saved: true, readable: true, artifactId: archive.id OR archive.archiveId, backend }
 *   - IF artifactKind is screenshot:
 *   -   screenshots = response.data.screenshots OR response.screenshots OR []
 *   -   artifact = first screenshot with id OR artifactId OR hash
 *   -   IF no artifact: RETURN all-false
 *   -   RETURN { saved: true, readable: false, artifactId: artifact.id OR artifact.artifactId OR artifact.hash, backend }
 *
 * ## QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Query each artifact leg only for local/file and always pass the selected backend, then normalize independently.
 * - Contract:
 *   - INPUT: currentUrl, selectedBackend, sendMessage
 *   - PRE: currentUrl is non-empty and status context is current
 *   - OUTPUT: normalized archive and screenshot status
 *   - POST: unsupported backend produces all-false without sending archive messages; query failures remain all-false
 *   - FAILURE_MODES: unsupported backend, message rejection, stale response
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *   - IF selectedBackend is not local or file: RETURN all-false
 *   - archiveResponse, screenshotResponse = AWAIT IN PARALLEL:
 *   -   sendMessage({ type: GET_PAGE_ARCHIVE, data: { url: currentUrl, backend: selectedBackend } })
 *   -   sendMessage({ type: GET_PAGE_SCREENSHOTS, data: { url: currentUrl, backend: selectedBackend } })
 *   - IF statusContextKey changed while awaiting: DISCARD both results
 *   - RETURN NORMALIZE archiveResponse and screenshotResponse independently
 *
 * ## APPLY_ARCHIVE_STATUS_UI
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Apply the normalized snapshot to the current popup or scoped This Page root with non-color accessibility cues and independent recapture controls.
 * - Contract:
 *   - INPUT: normalized status, UIManager element cache
 *   - PRE: elements may be absent in optional contexts
 *   - OUTPUT: DOM reflects archiveSaved, screenshotSaved, and readerAvailable
 *   - POST: capture buttons remain enabled on archive-capable backends; Reader is visible but disabled with an explanation when unavailable
 *   - FAILURE_MODES: absent optional element
 *   - DATA_TRANSITION: set root archive/screenshot/Reader/backend datasets, set data-archive-saved/data-screenshot-saved and active classes independently, and synchronize the Reader status description visibility and aria-describedby hook
 *   - EFFECTS: DOM, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_ARCHIVE_STATUS_UI
 *   - archiveButton = elements.captureArchiveBtn; screenshotButton = elements.captureScreenshotBtn; readerButton = elements.openReaderBtn
 *   - root = elements.mainInterface OR scoped container
 *   - SET root data-archive-saved, data-screenshot-saved, data-reader-available, and data-archive-backend
 *   - SET archiveButton active and aria-label/title from archiveSaved; preserve disabled = false for local/file recapture
 *   - SET screenshotButton active and aria-label/title from screenshotSaved; preserve disabled = false for local/file recapture
 *   - SET readerButton disabled = NOT readerAvailable; SET aria-disabled and explanatory title/label when unavailable
 *   - SET archiveStatusDescription hidden = readerAvailable and text to the unavailable explanation when Reader is unavailable
 *   - SET readerButton aria-describedby to archiveStatusDescription when that element has an id
 *   - SET data attributes on each button and shared status state
 *
 * ## REFRESH_ARCHIVE_STATUS_AFTER_CAPTURE
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Refresh only the successful capture leg after a successful archive or screenshot command, preserving the other leg.
 * - Contract:
 *   - INPUT: captureKind, currentUrl, selectedBackend, captureResult
 *   - PRE: captureResult is successful and context is current
 *   - OUTPUT: updated independent status snapshot
 *   - POST: failed capture does not create a positive indicator
 *   - FAILURE_MODES: capture failure, context change, status query failure
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_ARCHIVE_STATUS_AFTER_CAPTURE
 *   - IF captureResult.success is not true: RETURN current status
 *   - QUERY matching artifact leg with selected backend
 *   - APPLY matching normalized status while preserving the other leg
 *
 * ## RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Clear persisted status before any new URL or selected-backend context can display it, preventing cross-tab/backend leakage.
 * - Contract:
 *   - INPUT: nextUrl, nextBackend, previous status context
 *   - PRE: context change is observable
 *   - OUTPUT: cleared status snapshot and new statusContextKey
 *   - POST: archiveSaved, screenshotSaved, and readerAvailable are false until the new context is queried
 *   - EFFECTS: State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE
 *   - IF `${nextUrl}|${nextBackend}` equals statusContextKey: RETURN unchanged
 *   - SET statusContextKey = `${nextUrl}|${nextBackend}`
 *   - APPLY all-false status immediately
 *   - IF nextUrl is non-empty AND nextBackend is local or file: QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STATUS_UI ===
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
import { UIManager } from '../../src/ui/popup/UIManager.js'

describe('[IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] UIManager scoped root', () => {
  /** @type {HTMLDivElement} */
  let container

  const noop = () => {}

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'bookmarkPanel'
    document.body.appendChild(container)
  })

  afterEach(() => {
    container?.remove()
  })

  test('without container uses document.getElementById for mainInterface', () => {
    const mainEl = document.createElement('div')
    mainEl.id = 'mainInterface'
    document.body.appendChild(mainEl)
    const ui = new UIManager({ errorHandler: { handleError: noop }, stateManager: null, config: {} })
    expect(ui.elements.mainInterface).toBe(mainEl)
    mainEl.remove()
  })

  test('with container uses container querySelector data-popup-ref for mainInterface', () => {
    const mainEl = document.createElement('div')
    mainEl.setAttribute('data-popup-ref', 'mainInterface')
    container.appendChild(mainEl)
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    expect(ui.elements.mainInterface).toBe(mainEl)
    expect(ui.container).toBe(container)
  })

  test('with container resolves multiple refs from container subtree', () => {
    const mainEl = document.createElement('div')
    mainEl.setAttribute('data-popup-ref', 'mainInterface')
    const loadingEl = document.createElement('div')
    loadingEl.setAttribute('data-popup-ref', 'loadingState')
    const showHoverBtn = document.createElement('button')
    showHoverBtn.setAttribute('data-popup-ref', 'showHoverBtn')
    container.appendChild(mainEl)
    container.appendChild(loadingEl)
    container.appendChild(showHoverBtn)
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    expect(ui.elements.mainInterface).toBe(mainEl)
    expect(ui.elements.loadingState).toBe(loadingEl)
    expect(ui.elements.showHoverBtn).toBe(showHoverBtn)
  })

  test('with container does not return document-level elements with same id', () => {
    const docMain = document.createElement('div')
    docMain.id = 'mainInterface'
    document.body.appendChild(docMain)
    const scopedMain = document.createElement('div')
    scopedMain.setAttribute('data-popup-ref', 'mainInterface')
    container.appendChild(scopedMain)
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    expect(ui.elements.mainInterface).toBe(scopedMain)
    expect(ui.elements.mainInterface).not.toBe(docMain)
    docMain.remove()
  })

  test('[IMPL-SUGGESTED_TAGS] restores scoped This Page scroll after loading transition', () => {
    // [IMPL-SUGGESTED_TAGS] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: Preserve the scoped This Page container scroll position across Suggested Tag loading, focus, persistence, and chip-redraw effects while leaving standalone popup behavior unchanged.
    const loadingEl = document.createElement('div')
    loadingEl.setAttribute('data-popup-ref', 'loadingState')
    const mainEl = document.createElement('div')
    mainEl.setAttribute('data-popup-ref', 'mainInterface')
    container.append(loadingEl, mainEl)

    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })

    container.scrollTop = 180
    ui.setLoading(true)
    expect(mainEl.classList.contains('hidden')).toBe(true)

    // Simulate the browser clamping the scroll container while mainInterface is hidden.
    container.scrollTop = 0
    ui.setLoading(true)
    ui.setLoading(false)

    expect(mainEl.classList.contains('hidden')).toBe(false)
    expect(container.scrollTop).toBe(180)
  })

  test('[REQ-PAGE_ARCHIVE_STATUS_UI] applies independent saved-state hooks within the scoped root', () => {
    const archiveButton = document.createElement('button')
    archiveButton.setAttribute('data-popup-ref', 'captureArchiveBtn')
    const screenshotButton = document.createElement('button')
    screenshotButton.setAttribute('data-popup-ref', 'captureScreenshotBtn')
    const readerButton = document.createElement('button')
    readerButton.setAttribute('data-popup-ref', 'openReaderBtn')
    container.append(archiveButton, screenshotButton, readerButton)

    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })

    ui.updateArchiveArtifactStatus({
      backend: 'local',
      archiveSaved: true,
      screenshotSaved: false,
      readerAvailable: true,
      archiveArtifactId: 'archive-1',
      screenshotArtifactId: null
    })

    expect(archiveButton.classList.contains('active')).toBe(true)
    expect(archiveButton.dataset.archiveSaved).toBe('true')
    expect(archiveButton.getAttribute('aria-label')).toMatch(/saved/i)
    expect(screenshotButton.classList.contains('active')).toBe(false)
    expect(screenshotButton.dataset.screenshotSaved).toBe('false')
    expect(screenshotButton.disabled).toBe(false)
    expect(readerButton.disabled).toBe(false)
    expect(readerButton.getAttribute('aria-disabled')).toBe('false')
  })

  test('[REQ-PAGE_ARCHIVE_STATUS_UI] disables Reader with an explanation but keeps recapture controls enabled', () => {
    const archiveButton = document.createElement('button')
    archiveButton.setAttribute('data-popup-ref', 'captureArchiveBtn')
    const screenshotButton = document.createElement('button')
    screenshotButton.setAttribute('data-popup-ref', 'captureScreenshotBtn')
    const readerButton = document.createElement('button')
    readerButton.setAttribute('data-popup-ref', 'openReaderBtn')
    container.append(archiveButton, screenshotButton, readerButton)

    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })

    ui.updateArchiveArtifactStatus({
      backend: 'sync',
      archiveSaved: false,
      screenshotSaved: false,
      readerAvailable: false,
      archiveArtifactId: null,
      screenshotArtifactId: null
    })

    expect(archiveButton.disabled).toBe(false)
    expect(screenshotButton.disabled).toBe(false)
    expect(readerButton.disabled).toBe(true)
    expect(readerButton.getAttribute('aria-disabled')).toBe('true')
    expect(readerButton.getAttribute('aria-label')).toMatch(/archive/i)
    expect(readerButton.title).toMatch(/archive/i)
  })
})
