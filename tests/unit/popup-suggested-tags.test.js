/**
 * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-THIS_PAGE_TAG_SORT]
 * Unit tests for popup suggested-tags: restricted-URL skip and injectable-URL extraction.
 * String results from MAIN extract are normalized to { tag, relevance, inPageFrequency } for UIManager / sort.
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] — Placeholder screenshot flow: seed storage, fake tab params, data-screenshot-ready, handleGetCurrentBookmark prefers data.url. Contract: URL params and seed; placeholder UI and script capture.
 * 
 * ## MAIN
 * 
 * - [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] How: Rich placeholder data: 15+ bookmarks so index and By Tag tree look robust; hero Pinboard entry with 6+ tags and non-empty extended for This Page view. Side panel: open with ?screenshot=1&url=screenshotPopupUrl&title=screenshotPopupTitle so Bookmark tab shows Pinboard bookmark (same doc, PopupController reads window.location.search).
 * - Contract:
 *   - INPUT: ?screenshot=1&url=...&title=... (popup/side panel); seed JSON (local bookmarks, storage index, theme); optional --seed=path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup/index/side panel rendered with placeholder data; data-screenshot-ready attribute; script can capture screenshot
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: PopupController._screenshotMode; handleGetCurrentBookmark prefers data.url when http(s); placeholderStorageSeed
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. localBookmarks: BUILD object keyed by URL; Pinboard entry HAS tags.length >= 6, extended non-empty, toread 'yes'; total entries >= 15; mix of toread yes/no; storageIndex one key per localBookmarks URL, value 'local'
 *   - How (sub-block): Await seed; open popup/index; wait for ready; check store-local for index; capture.
 *   - 2. Script: SEED chrome.storage.local/sync (await set); optional LOAD seed from file; OPEN popup or index; WAIT for [data-screenshot-ready="true"]; CHECK #store-local for index; CAPTURE screenshot
 *   - How (sub-block): Use URL params as fake tab; set data-screenshot-ready in finally.
 *   - 3. Popup load: IF screenshot=1 and url param: USE param as fake tab url/title; SKIP getCurrentTab; IN finally SET data-screenshot-ready on #mainInterface
 *   - How (sub-block): Prefer data.url as targetUrl when http(s) so popup-as-tab gets correct bookmark.
 *   - 4. handleGetCurrentBookmark: IF data.url present and http(s): USE as targetUrl so popup-as-tab gets bookmark for screenshot URL
 *   - 5. Side panel URL: GOTO side-panel.html?screenshot=1&url=encode(screenshotPopupUrl)&title=encode(screenshotPopupTitle); SET viewport width 360 (or 240); WAIT for tab content; CAPTURE screenshot (This Page, then By Tag, Tabs, etc.); output side-panel-bookmark.png, side-panel-tags-tree.png, side-panel-tabs.png
 *   - 6. record-demo-side-panel-this-page: SEED chrome.storage.local with placeholderStorageSeed via options page; GOTO side-panel.html?screenshot=1&url=...&title=...; record frames; assemble GIF
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
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
/**
 * === IMPL-FULL-BLOCK: IMPL-THIS_PAGE_TAG_SORT ===
 * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] — Summary: Three-way chip sort when tagSortToggle present; frequency map from storage; popup suggested rows from two-step MAIN inject; uses tag-chip-sort.sortTagChipRows.
 * 
 * ## REFRESH_TAG_FREQUENCY_MAP_FOR_SORT
 * 
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL depends on IMPL-UIManager_SCOPED_ROOT: tagSortToggle and chip containers resolve under scoped container in side panel; pre — UIManager constructed with container=bookmarkPanel and cacheElements completed; post — non-null elements.tagSortToggle enables sort UI; shared data — this.elements from IMPL-UIManager_SCOPED_ROOT. How — cross-IMPL depends on IMPL-SUGGESTED_TAGS MAIN-world path: snippet registers global; ordering — loadSuggestedTags runs file inject then func inject before NORMALIZE; shared data — raw extraction array; post — filtered rows passed to UIManager.updateSuggestedTags. How — NORMALIZE_SUGGESTED_ROWS + FILTER_INVALID_ROWS: PopupController maps MAIN extract to rows; trim string/object tags; omit entries empty after trim; then FILTER_NOT_ON_CURRENT_BOOKMARK. How — FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentTagsNormalizedLower): drop row where lower(row.tag) in set.
 * - Contract:
 *   - INPUT: raw (array of strings and/or objects from page world)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tagFrequencyMap (tag string -> count from hoverboard_tag_frequency); suggested rows { tag, relevance?, inPageFrequency? } after normalize
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_TAG_FREQUENCY_MAP_FOR_SORT
 *   - IF NOT chrome.storage.local THEN RETURN
 *   - TRY:
 *   - AWAIT get hoverboard_tag_frequency
 *   - map = _normalizeHoverboardTagFrequencyMap(raw)
 *   - uiManager.setTagFrequencyMapForSort(map)
 *   - CATCH:
 *   - debugError; RETURN
 *   - How (sub-block): How — loadSuggestedTags (invokes IMPL-SUGGESTED_TAGS page-world contract; ordering explicit).
 * 
 * ## LOAD_SUGGESTED_TAGS
 * 
 * - [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Implements loadSuggestedTags() behavior for IMPL-THIS_PAGE_TAG_SORT.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_SUGGESTED_TAGS
 *   - IF no tab id THEN updateSuggestedTags([]); RETURN
 *   - classif = classifyScriptInjectionUrl(tab.url)
 *   - IF NOT classif.injectable THEN recordAction injectionOutcome(phase=suggested_tags, reason=classif.reason); updateSuggestedTags([]); RETURN
 *   - TRY:
 *   - TRY executeScript MAIN files [suggested-tags-main-world-snippet.js]; ON fileErr log non-fatal CONTINUE
 *   - AWAIT executeScript MAIN func -> globalThis.__hoverboardExtractSuggestedTagsWithRelevance()
 *   - rows = NORMALIZE_SUGGESTED_ROWS(result)
 *   - rows = FILTER_INVALID_ROWS(rows)
 *   - rows = FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentPinTagsLowerSet)
 *   - updateSuggestedTags(rows)
 *   - CATCH scriptError:
 *   - expected = classifyScriptInjectionError(scriptError)
 *   - IF expected: recordAction injectionOutcome(reason=expected); updateSuggestedTags([]); RETURN
 *   - debugError; updateSuggestedTags([])
 *   - How (sub-block): How — setTagFrequencyMapForSort: merge into tagFrequencyMap; caller redraws.
 *   - How (sub-block): How — getEffectiveTagSortMode: IF no tagSortToggle element THEN RETURN null; ELSE RETURN mode from segment state.
 *   - How (sub-block): How — updateCurrentTags / updateRecentTags / _paintSuggestedTags: IF getEffectiveTagSortMode() null THEN paint source order; ELSE build rows with displayKey=tagChipDisplayAndAddValue, bookmarkFreq, suggested relevance; sortTagChipRows(mode); paint.
 *   - How (sub-block): How — Comparators (tag-chip-sort): alphabetical by displayKey localeCompare lower tie stableIndex; frequency by bookmarkFreq desc; relevance by relevance desc then bookmarkFreq then inPageFrequency.
 *   - How (sub-block): How — loadInitialData: AWAIT refreshTagFrequencyMapForSort before first updateCurrentTags; AWAIT loadRecentTags before AWAIT loadSuggestedTags (PopupController orchestration binding).
 *   - How (sub-block): How — setupEventListeners: click [data-sort-mode] under tagSortToggle -> setTagSortMode if isTagChipSortMode.
 * 
 * ## SIDE_PANEL_TAG_SORT_TOOLBAR_E2E
 * 
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] How: How — E2E-only surface (phase_h_e2e_only_surface): Playwright chrome-extension:// side panel; complements JSDOM composition tests.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SIDE_PANEL_TAG_SORT_TOOLBAR_E2E
 *   - PRE: open side-panel.html; bookmarkPanel visible
 *   - ASSERT tagSortToggle visible
 *   - ON click frequency segment: aria-pressed matches selection
 * 
 * === END IMPL-FULL-BLOCK: IMPL-THIS_PAGE_TAG_SORT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
 * [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] — Popup "Tag with AI" flow: get page content, get AI tags, split by session, create/update bookmark with default backend, update suggested tags.
 * 
 * ## ON_TAG_WITH_AI_CLICK
 * 
 * - [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] How: Implements onTagWithAiClick() behavior for IMPL-AI_TAGGING_POPUP_UI.
 * - Contract:
 *   - INPUT: user click "Tag with AI"
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark updated; suggested tags updated | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ON_TAG_WITH_AI_CLICK
 *   - IF !config.aiApiKey or !currentTab.url.startsWith('http') THEN show message; RETURN
 *   - content = await sendToSW({ type: 'GET_PAGE_CONTENT', data: { tabId } })  // SW uses scripting.executeScript in tab
 *   - IF !content?.textContent THEN show (content.error if content.success === false else generic error); RETURN
 *   - aiTags = await sendToSW({ type: 'GET_AI_TAGS', data: { text: content.textContent, limit: config.aiTagLimit } })
 *   - sessionSet = new Set(await sendToSW({ type: 'getSessionTags' }))
 *   - inSession = aiTags.filter(t => sessionSet.has(t.toLowerCase()))
 *   - suggested = aiTags.filter(t => !sessionSet.has(t.toLowerCase()))
 *   - bookmark = await getCurrentBookmark()
 *   - defaultBackend = await configManager.getStorageMode()
 *   - IF !bookmark?.time:
 *   - create bookmark with url, title, tags: inSession, preferredBackend: defaultBackend
 *   - ELSE:
 *   - merged = merge(bookmark.tags, inSession)  // dedupe case-insensitive
 *   - saveBookmark({ ...bookmark, tags: merged, preferredBackend: bookmark backend or defaultBackend })
 *   - updateSuggestedTags(suggested)  // so AI tags appear first in Suggested section
 *   - refresh bookmark state / badge
 * 
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
 */
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
import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'
import { debugLog, debugError } from '../../src/shared/utils.js'

jest.mock('../../src/shared/utils.js', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
  browser: { runtime: { lastError: null } }
}))

global.chrome = {
  runtime: { sendMessage: jest.fn(), onMessage: { addListener: jest.fn() }, getManifest: jest.fn(() => ({ version: '1.0.0' })) },
  tabs: { query: jest.fn(), sendMessage: jest.fn() },
  scripting: { executeScript: jest.fn(), insertCSS: jest.fn() },
  storage: { local: { get: jest.fn() } }
}

jest.mock('../../src/features/tagging/tag-service.js', () => ({
  TagService: jest.fn().mockImplementation(() => ({}))
}))

describe('[IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Popup suggested tags', () => {
  let popupController
  let uiManager
  let errorHandler
  let stateManager

  beforeEach(() => {
    jest.clearAllMocks()
    errorHandler = new ErrorHandler()
    stateManager = new StateManager()
    uiManager = new UIManager({ errorHandler, stateManager, config: {} })
    uiManager.updateSuggestedTags = jest.fn()
    uiManager.updateRecentTags = jest.fn()
    popupController = new PopupController({
      errorHandler,
      stateManager,
      uiManager
    })
  })

  describe('loadSuggestedTags restricted-URL skip [REQ-SUGGESTED_TAGS_FROM_CONTENT]', () => {
    test('skips injection and shows empty suggestions when currentTab is null', async () => {
      popupController.currentTab = null
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection and shows empty suggestions when currentTab has no id', async () => {
      popupController.currentTab = { url: 'https://example.com' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is chrome-extension://', async () => {
      popupController.currentTab = {
        id: 1,
        url: 'chrome-extension://pmghkjjcieaijgcnediaphahnhifgkme/src/ui/bookmarks-table/bookmarks-table.html'
      }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is chrome://', async () => {
      popupController.currentTab = { id: 2, url: 'chrome://extensions/' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is file://', async () => {
      popupController.currentTab = { id: 3, url: 'file:///tmp/page.html' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is empty', async () => {
      popupController.currentTab = { id: 4, url: '' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is Chrome Web Store (extensions gallery)', async () => {
      popupController.currentTab = {
        id: 5,
        url: 'https://chrome.google.com/webstore/detail/foo/abcdef'
      }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is chromewebstore.google.com', async () => {
      popupController.currentTab = {
        id: 6,
        url: 'https://chromewebstore.google.com/detail/foo/abcdef'
      }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })
  })

  describe('loadSuggestedTags injectable URL [REQ-SUGGESTED_TAGS_FROM_CONTENT]', () => {
    /** MAIN file inject then func inject — loadSuggestedTags awaits both. */
    function mockMainWorldExtract (rawResult) {
      chrome.scripting.executeScript
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ result: rawResult }])
    }

    test('calls executeScript and updates UI when currentTab.url is https://', async () => {
      popupController.currentTab = { id: 10, url: 'https://example.com/page' }
      popupController.currentPin = { tags: [] }
      popupController.normalizeTags = jest.fn((tags) => tags || [])
      mockMainWorldExtract(['suggested1', 'suggested2'])

      await popupController.loadSuggestedTags()

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({ target: { tabId: 10 } })
      )
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([
        { tag: 'suggested1', relevance: 0, inPageFrequency: 0 },
        { tag: 'suggested2', relevance: 0, inPageFrequency: 0 }
      ])
    })

    test('calls executeScript when currentTab.url is http://', async () => {
      popupController.currentTab = { id: 11, url: 'http://example.org' }
      popupController.currentPin = { tags: [] }
      popupController.normalizeTags = jest.fn((tags) => tags || [])
      mockMainWorldExtract(['httpTag'])

      await popupController.loadSuggestedTags()

      expect(chrome.scripting.executeScript).toHaveBeenCalled()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([
        { tag: 'httpTag', relevance: 0, inPageFrequency: 0 }
      ])
    })

    test('deduplicates suggested tags against current bookmark tags (case-insensitive)', async () => {
      popupController.currentTab = { id: 12, url: 'https://example.com' }
      popupController.currentPin = { tags: ['existing', 'Suggested1'] }
      popupController.normalizeTags = jest.fn((tags) => tags || [])
      mockMainWorldExtract(['suggested1', 'suggested2', 'existing'])

      await popupController.loadSuggestedTags()

      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([
        { tag: 'suggested2', relevance: 0, inPageFrequency: 0 }
      ])
    })
  })

  /**
   * [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT]
   * Three-way sync: same token set as IMPL-THIS_PAGE_TAG_SORT essence_pseudocode (NORMALIZE_SUGGESTED_ROWS + FILTER_INVALID_ROWS) and PopupController._normalizeSuggestedRowsFromMainWorld.
   * Validates trim + omit empty-after-trim before FILTER_NOT_ON_CURRENT_BOOKMARK; OUTPUT to updateSuggestedTags.
   */
  describe('loadSuggestedTags FILTER_INVALID_ROWS [REQ-SUGGESTED_TAGS_FROM_CONTENT]', () => {
    function mockMainWorldExtract (rawResult) {
      chrome.scripting.executeScript
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ result: rawResult }])
    }

    test('drops string entries and object rows whose tag is whitespace-only after trim', async () => {
      popupController.currentTab = { id: 20, url: 'https://example.com/x' }
      popupController.currentPin = { tags: [] }
      popupController.normalizeTags = jest.fn((tags) => tags || [])
      mockMainWorldExtract([
        '  good  ',
        '   ',
        '\t',
        { tag: 'also-good', relevance: 2, inPageFrequency: 1 },
        { tag: '     ', relevance: 9, inPageFrequency: 9 }
      ])

      await popupController.loadSuggestedTags()

      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([
        { tag: 'good', relevance: 0, inPageFrequency: 0 },
        { tag: 'also-good', relevance: 2, inPageFrequency: 1 }
      ])
    })
  })

  describe('loadDemoSuggestedTagsIfScreenshotMode [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT]', () => {
    test('calls updateSuggestedTags with stored hoverboard_demo_suggested_tags when non-empty array', async () => {
      const demoTags = ['bookmarks', 'reading', 'reference']
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_suggested_tags: demoTags })
      })

      await popupController.loadDemoSuggestedTagsIfScreenshotMode()

      expect(chrome.storage.local.get).toHaveBeenCalledWith('hoverboard_demo_suggested_tags', expect.any(Function))
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith(demoTags)
    })

    test('does not call updateSuggestedTags when storage returns empty array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_suggested_tags: [] })
      })

      await popupController.loadDemoSuggestedTagsIfScreenshotMode()

      expect(uiManager.updateSuggestedTags).not.toHaveBeenCalled()
    })

    test('does not call updateSuggestedTags when storage returns missing or non-array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({})
      })

      await popupController.loadDemoSuggestedTagsIfScreenshotMode()

      expect(uiManager.updateSuggestedTags).not.toHaveBeenCalled()
    })
  })

  describe('loadDemoRecentTagsIfScreenshotMode [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM]', () => {
    test('calls updateRecentTags with stored tags excluding current bookmark tags', async () => {
      popupController.currentPin = { tags: ['bookmarks', 'reading'] }
      popupController.normalizeTags = jest.fn((tags) => (Array.isArray(tags) ? tags : []).map(t => String(t).trim()).filter(Boolean))
      const demoTags = ['demo', 'reading', 'tools', 'reference', 'bookmarks']
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_recent_tags: demoTags })
      })

      const applied = await popupController.loadDemoRecentTagsIfScreenshotMode()

      expect(applied).toBe(true)
      expect(chrome.storage.local.get).toHaveBeenCalledWith('hoverboard_demo_recent_tags', expect.any(Function))
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith(['demo', 'tools', 'reference'])
    })

    test('does not call updateRecentTags when storage returns empty array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_recent_tags: [] })
      })

      const applied = await popupController.loadDemoRecentTagsIfScreenshotMode()

      expect(applied).toBe(false)
      expect(uiManager.updateRecentTags).not.toHaveBeenCalled()
    })

    test('does not call updateRecentTags when storage returns missing or non-array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({})
      })

      const applied = await popupController.loadDemoRecentTagsIfScreenshotMode()

      expect(applied).toBe(false)
      expect(uiManager.updateRecentTags).not.toHaveBeenCalled()
    })
  })
})
