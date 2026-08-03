/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] This Page: three-way tag label casing (original | lower | upper)
 * applies only to Suggested Tags; Current/Recent labels and add-from-chip values stay source-cased;
 * remove uses stored tag.
 * [REQ-THIS_PAGE_TAG_SORT] Shim includes tag sort toggle (side-panel parity).
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

/** Append minimal Bookmark-tab markup as direct children of `container` (scoped querySelector). */
function appendTagCaseShim (container) {
  const html = `
    <div class="tag-case-folding" data-popup-ref="tagCaseFoldingToggle" role="toolbar" aria-label="Tag label casing">
      <span class="tag-case-folding-label" id="tag-case-folding-label-uim-test">Tag labels</span>
      <div class="tag-case-folding-buttons">
        <button type="button" class="tag-case-mode-btn" data-case-mode="original" aria-pressed="true">Original</button>
        <button type="button" class="tag-case-mode-btn" data-case-mode="lower" aria-pressed="false">lower</button>
        <button type="button" class="tag-case-mode-btn" data-case-mode="upper" aria-pressed="false">UPPER</button>
      </div>
    </div>
    <div class="tag-sort-toggle" data-popup-ref="tagSortToggle" role="toolbar" aria-label="Tag list sort">
      <div class="tag-sort-toggle-buttons">
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="alphabetical" aria-pressed="true">A–Z</button>
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="frequency" aria-pressed="false">Frequency</button>
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="relevance" aria-pressed="false">Relevance</button>
      </div>
    </div>
    <div data-popup-ref="currentTagsContainer"></div>
    <div data-popup-ref="recentTagsContainer"></div>
    <section data-popup-ref="suggestedTags" style="display:block">
      <div data-popup-ref="suggestedTagsContainer"></div>
    </section>
  `
  container.insertAdjacentHTML('beforeend', html)
}

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] UIManager tag case folding', () => {
  const noop = () => {}

  /** @type {HTMLDivElement} */
  let container

  beforeEach(() => {
    container = document.createElement('div')
    appendTagCaseShim(container)
    document.body.appendChild(container)
  })

  afterEach(() => {
    container?.remove()
  })

  test('default mode is original; recent chip shows source casing and addTag receives it', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSpy = jest.fn()
    ui.on('addTag', addSpy)
    ui.setupEventListeners()
    ui.updateRecentTags(['ReadLater'])
    const chip = container.querySelector('.tag.recent .tag-text')
    expect(chip?.textContent).toBe('ReadLater')
    chip?.closest('.tag')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSpy).toHaveBeenCalledWith('ReadLater')
  })

  test('lower mode leaves Recent Tags label and add value in source casing', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSpy = jest.fn()
    ui.on('addTag', addSpy)
    ui.setupEventListeners()
    ui.updateRecentTags(['ReadLater'])
    container.querySelector('[data-case-mode="lower"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const chip = container.querySelector('.tag.recent .tag-text')
    expect(chip?.textContent).toBe('ReadLater')
    chip?.closest('.tag')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSpy).toHaveBeenCalledWith('ReadLater')
  })

  test('lower mode converts Suggested Tags label and add value', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSpy = jest.fn()
    ui.on('addTag', addSpy)
    ui.setupEventListeners()
    container.querySelector('[data-case-mode="lower"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    ui.updateSuggestedTags(['ReadLater'])
    const chip = container.querySelector('[data-popup-ref="suggestedTagsContainer"] .tag .tag-text')
    expect(chip?.textContent).toBe('readlater')
    chip?.closest('.tag')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSpy).toHaveBeenCalledWith('readlater')
  })

  test('upper mode on suggested chip: display and add use upper case', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSpy = jest.fn()
    ui.on('addTag', addSpy)
    ui.setupEventListeners()
    ui.updateSuggestedTags(['api'])
    container.querySelector('[data-case-mode="upper"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const chip = container.querySelector('[data-popup-ref="suggestedTagsContainer"] .tag.recent .tag-text')
    expect(chip?.textContent).toBe('API')
    chip?.closest('.tag')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSpy).toHaveBeenCalledWith('API')
  })

  test('[IMPL-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] side-panel state chips use converted values and exact removal identity', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSuggestedSpy = jest.fn()
    const removeSpy = jest.fn()
    const replaceSuggestedSpy = jest.fn()
    ui.on('addSuggestedTag', addSuggestedSpy)
    ui.on('removeTag', removeSpy)
    ui.on('replaceSuggestedTag', replaceSuggestedSpy)
    ui.setupEventListeners()
    ui.updateCurrentTags(['REACT', 'vue'])
    container.querySelector('[data-case-mode="upper"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    ui.updateSuggestedTags([
      { tag: 'JavaScript', state: 'absent', matchedTag: null },
      { tag: 'React', state: 'case-mismatch', matchedTag: 'REACT' },
      { tag: 'Vue', state: 'case-mismatch', matchedTag: 'vue' }
    ])

    const chips = [...container.querySelectorAll('[data-popup-ref="suggestedTagsContainer"] .tag')]
    expect(chips).toHaveLength(3)
    expect(chips[0].dataset.suggestedTagState).toBe('absent')
    expect(chips[0].dataset.suggestedTagValue).toBe('JAVASCRIPT')
    expect(chips[0].querySelector('.tag-text')?.textContent).toBe('JAVASCRIPT')
    expect(chips[0].querySelector('.tag-state-label')?.textContent).toBe('Add')
    expect(chips[0].getAttribute('aria-label')).toBe('Add suggested tag JAVASCRIPT')
    expect(chips[1].dataset.suggestedTagState).toBe('case-match')
    expect(chips[1].dataset.suggestedTagValue).toBe('REACT')
    expect(chips[1].querySelector('.tag-text')?.textContent).toBe('REACT')
    expect(chips[1].querySelector('.tag-state-label')?.textContent).toBe('Remove')
    expect(chips[1].getAttribute('aria-label')).toBe('Remove current tag REACT')
    expect(chips[2].dataset.suggestedTagState).toBe('case-mismatch')
    expect(chips[2].dataset.suggestedTagValue).toBe('VUE')
    expect(chips[2].querySelector('.tag-text')?.textContent).toBe('VUE')
    expect(chips[2].querySelector('.tag-state-label')?.textContent).toBe('Replace')
    expect(chips[2].getAttribute('aria-label')).toBe('Replace current tag vue with suggested tag VUE')

    chips[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    chips[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    chips[2].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSuggestedSpy).toHaveBeenCalledWith({ tag: 'JAVASCRIPT', state: 'absent' })
    expect(removeSpy).toHaveBeenCalledWith('REACT')
    expect(replaceSuggestedSpy).toHaveBeenCalledWith({
      tag: 'VUE',
      state: 'case-mismatch',
      matchedTag: 'vue'
    })
    chips[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(addSuggestedSpy).toHaveBeenCalledTimes(2)
    chips[1].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(removeSpy).toHaveBeenCalledTimes(2)
  })

  test('[REQ-SUGGESTED_TAGS_DEDUPLICATION] reclassifies state when Tag labels conversion changes', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const removeSpy = jest.fn()
    ui.on('removeTag', removeSpy)
    ui.setupEventListeners()
    ui.updateCurrentTags(['REACT'])
    ui.updateSuggestedTags([
      { tag: 'React', state: 'case-mismatch', matchedTag: 'REACT' }
    ])

    let chip = container.querySelector('[data-popup-ref="suggestedTagsContainer"] .tag')
    expect(chip?.dataset.suggestedTagState).toBe('case-mismatch')
    expect(chip?.querySelector('.tag-state-label')?.textContent).toBe('Replace')

    container.querySelector('[data-case-mode="upper"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    chip = container.querySelector('[data-popup-ref="suggestedTagsContainer"] .tag')
    expect(chip?.dataset.suggestedTagState).toBe('case-match')
    expect(chip?.querySelector('.tag-text')?.textContent).toBe('REACT')
    expect(chip?.querySelector('.tag-state-label')?.textContent).toBe('Remove')
    chip?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(removeSpy).toHaveBeenCalledWith('REACT')

    ui.updateCurrentTags([])
    ui.redrawTagChipsFromCache()
    chip = container.querySelector('[data-popup-ref="suggestedTagsContainer"] .tag')
    expect(chip?.dataset.suggestedTagState).toBe('absent')
    expect(chip?.querySelector('.tag-state-label')?.textContent).toBe('Add')
  })

  test('current tag display follows mode; removeTag uses stored string', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const removeSpy = jest.fn()
    ui.on('removeTag', removeSpy)
    ui.setupEventListeners()
    ui.updateCurrentTags(['ReadLater'])
    container.querySelector('[data-case-mode="upper"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const label = container.querySelector('[data-popup-ref="currentTagsContainer"] .tag .tag-text')
    expect(label?.textContent).toBe('ReadLater')
    const removeBtn = container.querySelector('[data-popup-ref="currentTagsContainer"] .tag-remove')
    removeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(removeSpy).toHaveBeenCalledWith('ReadLater')
  })

  test('[IMPL-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] default alphabetical sorts current tags by display (case-insensitive)', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    ui.setupEventListeners()
    ui.updateCurrentTags(['zebra', 'Apple', 'banana'])
    const texts = [...container.querySelectorAll('[data-popup-ref="currentTagsContainer"] .tag .tag-text')].map((n) => n.textContent)
    expect(texts).toEqual(['Apple', 'banana', 'zebra'])
  })

  test('toggle updates aria-pressed and redraws without refetch', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    ui.setupEventListeners()
    ui.updateRecentTags(['MixEd'])
    expect(container.querySelector('.tag.recent .tag-text')?.textContent).toBe('MixEd')
    container.querySelector('[data-case-mode="lower"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(container.querySelector('[data-case-mode="lower"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.tag.recent .tag-text')?.textContent).toBe('MixEd')
  })
})
