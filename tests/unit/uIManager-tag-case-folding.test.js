/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] This Page: three-way tag label casing (original | lower | upper);
 * display and add-from-chip use the same mapped string; remove uses stored tag.
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
 *   - IF no tab id OR url not http(s) THEN updateSuggestedTags([]); RETURN
 *   - TRY:
 *   - TRY executeScript MAIN files [suggested-tags-main-world-snippet.js]; ON fileErr log non-fatal CONTINUE
 *   - AWAIT executeScript MAIN func -> globalThis.__hoverboardExtractSuggestedTagsWithRelevance()
 *   - rows = NORMALIZE_SUGGESTED_ROWS(result)
 *   - rows = FILTER_INVALID_ROWS(rows)
 *   - rows = FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentPinTagsLowerSet)
 *   - updateSuggestedTags(rows)
 *   - CATCH scriptError:
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

  test('lower mode: label lowercases and addTag receives lowercased value', () => {
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
    expect(label?.textContent).toBe('READLATER')
    const removeBtn = container.querySelector('[data-popup-ref="currentTagsContainer"] .tag-remove')
    removeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(removeSpy).toHaveBeenCalledWith('ReadLater')
  })

  test('[REQ-THIS_PAGE_TAG_SORT] default alphabetical sorts current tags by display (case-insensitive)', () => {
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
    expect(container.querySelector('.tag.recent .tag-text')?.textContent).toBe('mixed')
  })
})
