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
export const TAG_CHIP_SORT_MODES = /** @type {const} */ ([
  'alphabetical',
  'frequency',
  'relevance'
])

/**
 * @param {string} mode
 * @returns {mode is TagChipSortMode}
 */
export function isTagChipSortMode (mode) {
  return TAG_CHIP_SORT_MODES.includes(/** @type {TagChipSortMode} */ (mode))
}

/**
 * @param {Record<string, number> | null | undefined} frequencyMap
 * @param {string} tag
 * @returns {number}
 */
export function lookupBookmarkFrequency (frequencyMap, tag) {
  if (!frequencyMap || tag == null || typeof tag !== 'string') return 0
  const t = tag.trim()
  if (!t) return 0
  const n = frequencyMap[t]
  if (typeof n === 'number' && !Number.isNaN(n)) return n
  const lower = t.toLowerCase()
  for (const k of Object.keys(frequencyMap)) {
    if (k.toLowerCase() === lower) {
      const v = frequencyMap[k]
      return typeof v === 'number' && !Number.isNaN(v) ? v : 0
    }
  }
  return 0
}

/**
 * One row per chip before sort. canonical = stored tag string for add/remove; displayKey = case-folded display for ordering.
 * [IMPL-THIS_PAGE_TAG_SORT] Alphabetical: localeCompare(displayKey lower) then stableIndex.
 * Frequency: bookmarkFreq desc, then displayKey CI, then stableIndex.
 * Relevance: relevance desc; tie bookmarkFreq desc, inPageFreq desc, displayKey CI, stableIndex.
 *
 * @param {Array<{ canonical: string, displayKey: string, stableIndex: number, bookmarkFreq?: number, relevance?: number, inPageFreq?: number }>} rows
 * @param {TagChipSortMode} mode
 * @returns {Array<{ canonical: string, displayKey: string, stableIndex: number, bookmarkFreq?: number, relevance?: number, inPageFreq?: number }>} rows in render order
 */
export function sortTagChipRows (rows, mode) {
  if (!Array.isArray(rows) || rows.length === 0) return []
  const copy = rows.map((r) => ({ ...r }))
  const disp = (r) => (r.displayKey || '').toLowerCase()

  copy.sort((a, b) => {
    if (mode === 'alphabetical') {
      const c = disp(a).localeCompare(disp(b))
      if (c !== 0) return c
      return a.stableIndex - b.stableIndex
    }
    if (mode === 'frequency') {
      const fa = a.bookmarkFreq ?? 0
      const fb = b.bookmarkFreq ?? 0
      if (fb !== fa) return fb - fa
      const c = disp(a).localeCompare(disp(b))
      if (c !== 0) return c
      return a.stableIndex - b.stableIndex
    }
    // relevance
    const ra = a.relevance ?? 0
    const rb = b.relevance ?? 0
    if (rb !== ra) return rb - ra
    const fa = a.bookmarkFreq ?? 0
    const fb = b.bookmarkFreq ?? 0
    if (fb !== fa) return fb - fa
    const ia = a.inPageFreq ?? 0
    const ib = b.inPageFreq ?? 0
    if (ib !== ia) return ib - ia
    const c2 = disp(a).localeCompare(disp(b))
    if (c2 !== 0) return c2
    return a.stableIndex - b.stableIndex
  })

  return copy
}
