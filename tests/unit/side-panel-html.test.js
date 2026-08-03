/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] — Tabbed side panel: tab bar, panels, persist, init This Page / By Tag / browser Tabs; recent-tags refresh on window focus while Bookmark tab active (same loadRecentTags contract as [IMPL-RECENT_TAGS_POPUP_REFRESH]); single page + scoped popup root per ARCH-SIDE_PANEL_TABS.
 *
 * ## GET_TAGS_TREE_INIT_OPTIONS
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] How: pure helper for By Tag init — { currentBookmarkTags } from controller.currentPin.tags via normalizeTags; lives in side-panel-tab-state.js.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_TREE_INIT_OPTIONS
 *   - IF controller missing: RETURN { currentBookmarkTags: [] }
 *   - raw = controller.normalizeTags(controller.currentPin?.tags) || []
 *   - RETURN { currentBookmarkTags: Array.isArray(raw) ? raw : [] }
 *
 * ## BIND_WINDOW_FOCUS_RECENT_TAGS_REFRESH
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH] How: cross-IMPL — invokes PopupController.loadRecentTags() (async; same family as popup). chrome.windows.getCurrent callback does not await the returned promise (fire-and-forget; matches production side-panel.js). Register after bindTabChangeRefresh on panel load. Focus to this window (not WINDOW_ID_NONE), getCurrent id match; sync guards via shouldInvokeLoadRecentTagsOnWindowFocusSync in side-panel-tab-state.js (matches unit tests); no-op without chrome.windows. Phase G: exported for composition tests; setActiveTabForTest sets activeTab in tests only.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BIND_WINDOW_FOCUS_RECENT_TAGS_REFRESH
 *   - hasWindowsApi = !!(onFocusChanged AND getCurrent); IF NOT hasWindowsApi: RETURN
 *   - REGISTER onFocusChanged(windowId):
 *   - IF windowId === WINDOW_ID_NONE: RETURN
 *   - getCurrent → IF runtime.lastError OR window id mismatch: RETURN
 *   - IF NOT shouldInvokeLoadRecentTagsOnWindowFocusSync({ hasWindowsApi, activeTab, isInitialized: controller?.isInitialized, isLoading: controller?.isLoading }): RETURN
 *   - controller.loadRecentTags()  // async; not AWAIT in callback (S09.GREEN LEAP alignment)
 *
 * ## SHOULD_INVOKE_LOAD_RECENT_TAGS_ON_WINDOW_FOCUS_SYNC
 *
 * - --- Phase H E2E-only boundary [REQ-RECENT_TAGS_SYSTEM] [IMPL-SIDE_PANEL_TABS] --- How: Cross-window "return focus to this browser window → Recent Tags refresh" is e2e_only: phase_h_window_focus_recent_tags_cross_window (multi-window + real onFocusChanged). Phase G: tests/integration/window-focus-recent-tags-composition.integration.test.js. This Page Recent Tags mount in chrome-extension:// side-panel.html is e2e_only: phase_h_side_panel_recent_tags_extension_document — tests/playwright/extension-side-panel-recent-tags-e2e.spec.js. How: pure predicate for window-focus recent refresh sync gates (tested in side-panel-tabs.test.js); implementation is single boolean AND (same semantics as chained IFs). Token set aligned with side-panel-tab-state.js and tests (S09.SYNC).
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOULD_INVOKE_LOAD_RECENT_TAGS_ON_WINDOW_FOCUS_SYNC
 *   - RETURN !!(hasWindowsApi AND activeTab === "bookmark" AND isInitialized AND NOT isLoading)
 *
 * ## SWITCH_TAB
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] How: persist activeTab; showPanel; tagsTree branch passes currentBookmarkTags / setSelectedTagsFromCurrentBookmark; returning to bookmark when already inited → refreshPopupData. Tab-change refresh contract is BIND_TAB_CHANGE_REFRESH (below).
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SWITCH_TAB
 *   - wasBookmarkInited = bookmarkTabInited
 *   - activeTab = tabId
 *   - chrome.storage.local.set({ hoverboard_sidepanel_active_tab: tabId })
 *   - showPanel(activeTab)
 *   - IF tabId === "tagsTree": currentTags = controller.normalizeTags(controller.currentPin?.tags) OR []; wasTagsTreeInited = tagsTreeTabInited; initTabIfNeeded(tabId, { currentBookmarkTags: currentTags }); IF wasTagsTreeInited: setSelectedTagsFromCurrentBookmark(currentTags)
 *   - ELSE IF tabId === "browserTabs": initTabIfNeeded("browserTabs")
 *   - ELSE: initTabIfNeeded(tabId)
 *   - IF tabId === "bookmark" AND wasBookmarkInited AND popupComponents.controller: popupComponents.controller.refreshPopupData()
 *
 * ## BIND_TAB_CHANGE_REFRESH
 *
 * - [IMPL-SIDE_PANEL_TABS] [IMPL-POPUP_SESSION] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: onActivated/onUpdated → setRefreshAttribution(trigger=tabChange, surface=side-panel) then refreshPopupData. Bookmark path always refreshes; inject/suggested-tags use CLASSIFY_SCRIPT_INJECTION_URL so gallery/restricted tabs never call chrome.scripting. Exported bindTabChangeRefresh for composition tests (mirror bindWindowFocusRecentTagsRefresh). Observable: ui-inspector injectionOutcome with trigger tabChange.
 * - Contract:
 *   - INPUT: chrome.tabs.onActivated / onUpdated events; PopupController instance
 *   - PRE: controller and tabs APIs available when binding; refresh attribution helpers wired
 *   - OUTPUT: void; This Page refresh scheduled; injectionOutcome when inject skipped
 *   - POST:
 *     - success => refreshPopupData invoked with tabChange attribution
 *     - non-scriptable active tab => no chrome.scripting.executeScript / insertCSS; bookmark fields still update
 *   - FAILURE_MODES: RefreshFailed (controller path; logged)
 *   - DATA: controller._refreshTrigger ("tabChange"); controller._refreshSurface ("side-panel")
 *   - DATA_TRANSITION: on tab change, currentPin/tags refresh; suggested tags empty on expected skip
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BIND_TAB_CHANGE_REFRESH
 *   - ON tabs.onActivated OR (tabs.onUpdated status complete):
 *   -   controller.setRefreshAttribution({ trigger: "tabChange", surface: "side-panel" })
 *   -   AWAIT controller.refreshPopupData()
 *   -   # inject prechecks inside loadSuggestedTags / updateOverlayState / injectContentScript
 *
 * ## SHOW_PANEL
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_BROWSER_TABS] How: toggle visibility of #bookmarkPanel / #tagsTreePanel / #browserTabsPanel so exactly one content panel shows.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOW_PANEL
 *   - IF activeTab === "bookmark": #bookmarkPanel visible, #tagsTreePanel hidden, #browserTabsPanel hidden
 *   - ELSE IF activeTab === "tagsTree": #tagsTreePanel visible, #bookmarkPanel hidden, #browserTabsPanel hidden
 *   - ELSE IF activeTab === "browserTabs": #browserTabsPanel visible, #bookmarkPanel hidden, #tagsTreePanel hidden
 *
 * ## INIT_TAB_IF_NEEDED
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: header row — setSidePanelVersion / initSidePanelVersion; no-op if #side-panel-version missing; guards for tests without chrome.runtime. How: CSS flex column on body + .side-panel-content flex 1 so tab content fills viewport. How: composed_with — single init of popup stack in #bookmarkPanel; pre: DOM ready; post: controller + loadInitialData + setupEventListeners; wires footer By Tag → switchTab("tagsTree").
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_TAB_IF_NEEDED
 *   - IF bookmarkTabInited RETURN
 *   - bookmarkTabInited = true
 *   - uiSystem = AWAIT UISystem.init(); popupComponents = uiSystem.createPopup({ container: document.getElementById('bookmarkPanel'), errorHandler, config })
 *   - AWAIT popupComponents.controller.loadInitialData()
 *   - popupComponents.uiManager.setupEventListeners()
 *   - // Wire "By Tag" in footer to switchTab("tagsTree") when in panel context
 *
 * ## INIT_TAB_IF_NEEDED
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] How: composed_with — lazy initTagsTreeTab(options); currentBookmarkTags aligns selector after loadBookmarks; depends on bookmark tab controller when switching from This Page.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_TAB_IF_NEEDED
 *   - IF tagsTreeTabInited RETURN
 *   - tagsTreeTabInited = true
 *   - initTagsTreeTab(options)  // load getAggregatedBookmarksForIndex; if options.currentBookmarkTags set, apply at end of loadBookmarks
 *
 * ## INIT_TAB_IF_NEEDED
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: composed_with — initBrowserTabsTab once; chrome.tabs list + optional referrers; visibility when activeTab === "browserTabs".
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_TAB_IF_NEEDED
 *   - IF browserTabsTabInited RETURN
 *   - browserTabsTabInited = true
 *   - initBrowserTabsTab()  // load tabs, referrers; render #browserTabsPanel list; bind search input, Copy button, Close button
 *   - How (sub-block): Phase G: switchTabForTest(tabId) and resetBrowserTabsTabInitedForTest() exported for composition tests — same switchTab → initTabIfNeeded("browserTabs") path without clicking .side-panel-tab (no UI).
 *
 * ## BLOCK_9
 *
 * - --- Composition: composed_with [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TAGS_TREE] --- How: Ordering: runInitialTabInit may await initBookmarkTab before By Tag so controller exists for getTagsTreeInitOptions. Shared DATA: popupComponents.controller (currentPin, normalizeTags) for both This Page and By Tag sync. Collision: bindTabChangeRefresh refreshPopupData and bindWindowFocusRecentTagsRefresh loadRecentTags can run close together — both read currentPin; safe (idempotent UI updates). Cross-IMPL: loadRecentTags matches  message path to  / .
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_9
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
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
 *   - How (sub-block): How — updateCurrentTags / updateRecentTags / _paintSuggestedTags: IF getEffectiveTagSortMode() null THEN paint source order; ELSE build Current/Recent rows with source-cased displayKey and Suggested rows with case-converted displayKey=tagChipDisplayAndAddValue; sortTagChipRows(mode); paint.
 *   - How (sub-block): How — Comparators (tag-chip-sort): alphabetical by displayKey localeCompare lower tie stableIndex; frequency by bookmarkFreq desc; relevance by relevance desc then bookmarkFreq then inPageFrequency.
 *   - How (sub-block): How — loadInitialData: AWAIT refreshTagFrequencyMapForSort before first updateCurrentTags; AWAIT loadRecentTags before AWAIT loadSuggestedTags (PopupController orchestration binding).
 *   - How (sub-block): How — setupEventListeners: click [data-sort-mode] under tagSortToggle -> setTagSortMode if isTagChipSortMode.
 *
 * ## SIDE_PANEL_SUGGESTED_TAG_CHIP_ACTIONS
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-SUGGESTED_TAGS] [IMPL-UIManager_SCOPED_ROOT] [ARCH-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] How: Apply the active Tag labels conversion before comparing each scoped Suggested Tag with Current Tags; render absent, adjusted-value case-match, and adjusted-value case-mismatch suggestions as explicit accessible chips with distinct state styling and emit add/remove/replace actions without changing popup chip behavior.
 * - Contract:
 *   - INPUT: side-panel suggested rows `{ tag, state, matchedTag }`; active Tag labels mode
 *   - PRE: adjusted comparisonTag is derived from `tag` and the active mode; row state is absent, case-match, or case-mismatch; matchedTag is present for Current Tag states
 *   - OUTPUT: accessible chip with state metadata, distinct state styling, and the correct converted or stored action payload
 *   - POST: absent emits addSuggestedTag; case-match emits removeTag with matchedTag; case-mismatch emits replaceSuggestedTag; state meaning is available through color and non-color cues
 *   - FAILURE_MODES: malformed row or missing scoped container
 *   - EFFECTS: DOM, State
 *   - TERMINATION: total
 * - PROCEDURE: SIDE_PANEL_SUGGESTED_TAG_CHIP_ACTIONS
 *   - FOR each row:
 *     - adjusted = tagChipDisplayAndAddValue(row.tag, activeTagLabelsMode).addValue
 *     - state = CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE(row.tag, currentTags, adjusted)
 *     - IF state absent THEN render “Add” state label and emit addSuggestedTag({ tag: row.tag, state: absent })
 *     - IF state case-match THEN render “Remove” state label and emit removeTag(matchedTag)
 *     - IF state case-mismatch THEN render “Replace” state label and emit replaceSuggestedTag({ tag: row.tag, state: case-mismatch, matchedTag: row.matchedTag })
 *     - APPLY state-specific background and border styling while retaining an accessible text label
 *   - preserve row.tag canonical source casing for identity; use adjusted for classification, display, and add/replace payloads; use matchedTag for exact stored-value removal
 *   - WHEN active Tag labels mode changes THEN reclassify cached Suggested Tags against cached Current Tags before redraw
 *   - IF keyboard Enter or Space THEN emit the same action as click
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
import fs from 'fs'
import path from 'path'

// Resolve from project root (npm test runs from repo root)
const sidePanelHtmlPath = path.join(process.cwd(), 'src/ui/side-panel/side-panel.html')
const sidePanelCssPath = path.join(process.cwd(), 'src/ui/side-panel/side-panel.css')

/**
 * Extract visible label text for a tab button by data-tab value.
 * @param {string} html - side-panel.html content
 * @param {string} dataTab - data-tab value (e.g. "bookmark", "tagsTree")
 * @returns {string} trimmed text between > and </button> for that button
 */
function getTabButtonLabel (html, dataTab) {
  const re = new RegExp(`data-tab="${dataTab}"[^>]*>([^<]+)`, 's')
  const m = html.match(re)
  return m ? m[1].trim() : ''
}

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] Side panel HTML tab labels', () => {
  let html
  let css

  beforeAll(() => {
    html = fs.readFileSync(sidePanelHtmlPath, 'utf8')
    css = fs.readFileSync(sidePanelCssPath, 'utf8')
  })

  test('tab button data-tab=bookmark has display label "This Page"', () => {
    expect(getTabButtonLabel(html, 'bookmark')).toBe('This Page')
  })

  test('tab button data-tab=tagsTree has display label "By Tag"', () => {
    expect(getTabButtonLabel(html, 'tagsTree')).toBe('By Tag')
  })

  test('tab button data-tab=browserTabs has display label "Tabs"', () => {
    expect(getTabButtonLabel(html, 'browserTabs')).toBe('Tabs')
  })

  // [REQ-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR]
  // Browser Bookmarks is a standalone page, not a side-panel tab.
  test('no tab button data-tab=browserBookmarks (standalone Browser Bookmarks page)', () => {
    expect(html).not.toMatch(/data-tab="browserBookmarks"/)
    expect(getTabButtonLabel(html, 'browserBookmarks')).toBe('')
  })

  // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
  // Visit History is a standalone page, not a side-panel tab.
  test('no tab button data-tab=usage (standalone Visit History page)', () => {
    expect(html).not.toMatch(/data-tab="usage"/)
    expect(html).not.toMatch(/id="usagePanel"/)
    expect(getTabButtonLabel(html, 'usage')).toBe('')
  })

  // This Page footer removed from side panel (tools live on tools toolbar / popup).
  test('This Page panel has no popup-footer toolbar', () => {
    expect(html).not.toMatch(/class="popup-footer"/)
  })

  // [REQ-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_SCREENSHOT_ARCHIVE] [REQ-OFFLINE_READER_MODE]
  // [ARCH-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [ARCH-OFFLINE_READER_MODE]
  // [IMPL-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [IMPL-OFFLINE_READER_MODE]
  test('This Page action row exposes archive, screenshot, and Reader controls', () => {
    expect(html).toMatch(/data-popup-ref="captureArchiveBtn"/)
    expect(html).toMatch(/data-popup-ref="captureScreenshotBtn"/)
    expect(html).toMatch(/data-popup-ref="openReaderBtn"/)
  })

  test('[REQ-SUGGESTED_TAGS_DEDUPLICATION] places Suggested Tag labels immediately before Suggested Tags', () => {
    const caseToggleIndex = html.indexOf('data-popup-ref="tagCaseFoldingToggle"')
    const suggestedIndex = html.indexOf('data-popup-ref="suggestedTags"')
    expect(caseToggleIndex).toBeGreaterThan(-1)
    expect(suggestedIndex).toBeGreaterThan(caseToggleIndex)
    expect(html.slice(caseToggleIndex, suggestedIndex)).toContain('Suggested Tag labels')
  })

  test('[REQ-SUGGESTED_TAGS_DEDUPLICATION] preserves distinct state colors for visible text and interactive states', () => {
    const states = ['absent', 'case-match', 'case-mismatch']
    const backgrounds = states.map((state) => {
      const blocks = [...css.matchAll(new RegExp(`^\\.tag\\.suggested-tag-state-${state} \\{([^}]*)\\}`, 'gm'))]
      const block = blocks.map(match => match[1]).find(value => value.includes('background-color:')) ?? ''
      expect(block).toMatch(/background-color:/)
      expect(block).toMatch(/color:/)
      expect(block).toMatch(/border-color:/)
      expect(css).toMatch(new RegExp(`\\.tag\\.suggested-tag-state-${state} \\.tag-text`))
      expect(css).toMatch(new RegExp(`\\.tag\\.suggested-tag-state-${state}:(?:hover|focus-visible)`))
      return block.match(/background-color:\s*([^;]+)/)?.[1]?.trim()
    })

    expect(new Set(backgrounds).size).toBe(3)
  })
})
