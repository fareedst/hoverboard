# [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT]
# Summary: Three-way chip sort when tagSortToggle present; frequency map from storage; popup suggested rows from two-step MAIN inject; uses tag-chip-sort.sortTagChipRows.

# [IMPL-THIS_PAGE_TAG_SORT] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-THIS_PAGE_TAG_SORT]
# How — cross-IMPL depends on IMPL-UIManager_SCOPED_ROOT: tagSortToggle and chip containers resolve under scoped container in side panel; pre — UIManager constructed with container=bookmarkPanel and cacheElements completed; post — non-null elements.tagSortToggle enables sort UI; shared data — this.elements from IMPL-UIManager_SCOPED_ROOT.

# [IMPL-THIS_PAGE_TAG_SORT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION]
# How — cross-IMPL depends on IMPL-SUGGESTED_TAGS MAIN-world path: snippet registers global; ordering — loadSuggestedTags runs file inject then func inject before NORMALIZE; shared data — raw extraction array; post — filtered rows passed to UIManager.updateSuggestedTags.

# How — Shared DATA contract (same top-level tokens).
DATA: tagFrequencyMap (tag string -> count from hoverboard_tag_frequency); suggested rows { tag, relevance?, inPageFrequency? } after normalize

# [IMPL-THIS_PAGE_TAG_SORT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT]
# How — NORMALIZE_SUGGESTED_ROWS + FILTER_INVALID_ROWS: PopupController maps MAIN extract to rows; trim string/object tags; omit entries empty after trim; then FILTER_NOT_ON_CURRENT_BOOKMARK.
INPUT: raw (array of strings and/or objects from page world)
OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number }
FOR each item in raw:
  IF typeof item is string AND trim non-empty: PUSH { tag: trim, relevance: 0, inPageFrequency: 0 }
  ELSE IF object AND item.tag is non-empty string after trim:
    rel = number item.relevance or 0; freq = number item.inPageFrequency or item.frequency or 0
    PUSH { tag: trim(item.tag), relevance: rel, inPageFrequency: freq }
  ELSE: omit (invalid / whitespace-only tag)
RETURN built list

# [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_DEDUPLICATION]
# How — FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentTagsNormalizedLower): drop row where lower(row.tag) in set.

# How — refreshTagFrequencyMapForSort
refreshTagFrequencyMapForSort():
  IF NOT chrome.storage.local THEN RETURN
  TRY:
    AWAIT get hoverboard_tag_frequency
    map = _normalizeHoverboardTagFrequencyMap(raw)
    uiManager.setTagFrequencyMapForSort(map)
  CATCH:
    debugError; RETURN

# How — loadSuggestedTags (invokes IMPL-SUGGESTED_TAGS page-world contract; ordering explicit).
loadSuggestedTags():
  IF no tab id OR url not http(s) THEN updateSuggestedTags([]); RETURN
  TRY:
    TRY executeScript MAIN files [suggested-tags-main-world-snippet.js]; ON fileErr log non-fatal CONTINUE
    AWAIT executeScript MAIN func -> globalThis.__hoverboardExtractSuggestedTagsWithRelevance()
    rows = NORMALIZE_SUGGESTED_ROWS(result)
    rows = FILTER_INVALID_ROWS(rows)
    rows = FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentPinTagsLowerSet)
    updateSuggestedTags(rows)
  CATCH scriptError:
    debugError; updateSuggestedTags([])

# How — setTagFrequencyMapForSort: merge into tagFrequencyMap; caller redraws.

# How — getEffectiveTagSortMode: IF no tagSortToggle element THEN RETURN null; ELSE RETURN mode from segment state.

# How — updateCurrentTags / updateRecentTags / _paintSuggestedTags: IF getEffectiveTagSortMode() null THEN paint source order; ELSE build rows with displayKey=tagChipDisplayAndAddValue, bookmarkFreq, suggested relevance; sortTagChipRows(mode); paint.

# How — Comparators (tag-chip-sort): alphabetical by displayKey localeCompare lower tie stableIndex; frequency by bookmarkFreq desc; relevance by relevance desc then bookmarkFreq then inPageFrequency.

# How — loadInitialData: AWAIT refreshTagFrequencyMapForSort before first updateCurrentTags; AWAIT loadRecentTags before AWAIT loadSuggestedTags (PopupController orchestration binding).

# How — setupEventListeners: click [data-sort-mode] under tagSortToggle -> setTagSortMode if isTagChipSortMode.

# [IMPL-THIS_PAGE_TAG_SORT] [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
# How — E2E-only surface (phase_h_e2e_only_surface): Playwright chrome-extension:// side panel; complements JSDOM composition tests.
side_panel_tag_sort_toolbar_e2e():
  PRE: open side-panel.html; bookmarkPanel visible
  ASSERT tagSortToggle visible
  ON click frequency segment: aria-pressed matches selection
