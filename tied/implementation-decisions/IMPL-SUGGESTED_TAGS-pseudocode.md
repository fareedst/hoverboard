# [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION]
# Summary: Suggested tags from page — overlay TagService.extractSuggestedTagsFromContent; Chromium popup via MAIN-world snippet global and IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags (inject, normalize, filter, UIManager handoff).

# [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT]
# How — cross-IMPL: Popup path depends on IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags; ordering invariant — executeScript file (snippet) then func (global extractor); shared data — raw array from page world; post — NORMALIZE_SUGGESTED_ROWS then filters then updateSuggestedTags(rows); on error or non-http(s) — updateSuggestedTags([]).

# [IMPL-SUGGESTED_TAGS] [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SUGGESTED_TAGS]
# How — composed_with IMPL-SELECTION_TO_TAG_INPUT: pre — suggested chips rendered in UIManager; post — selection/tag-input add flows attach to chip DOM per IMPL-SELECTION_TO_TAG_INPUT (shared surface only; no ordering constraint on extraction).

# How — MAIN-world extractor contract (implementation: suggested-tags-main-world-snippet.js; tier rules live only there).
INPUT: active page document (implicit)
OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number }; tag sanitized by snippet inline rules; canonical case per pickBetterSuggestedOriginalCase rank
DATA: noise set; delimiter regex MUST match TagService tokenization (ARCH-SUGGESTED_TAGS tokenizer sync)

# How — Overlay pipeline contract (TagService.extractSuggestedTagsFromContent).
INPUT: document, url, limit
OUTPUT: list of tag strings; frequency-ordered; one canonical spelling per lowercase key; exact-deduped; at most limit items
DATA: multi-source capped texts; noise; delimiter; wordFrequency + originalCaseMap with pickBetterSuggestedOriginalCase
CONTROL: IF document null OR no querySelectorAll THEN RETURN []

# How — extractSuggestedTags overlay body through sortedWords (same token set as summary).
extractSuggestedTags(document, url, limit):
  IF document invalid THEN RETURN []
  TRY:
    allTexts = GATHER_SOURCES(document, url)
    IF allTexts empty THEN RETURN []
    words = TOKENIZE(join allTexts) using shared delimiter regex
    FOR each token: increment wordFrequency(lower); update originalCaseMap with pickBetterSuggestedOriginalCase
    sortedEntries = SORT wordFrequency by count desc then key asc
    sortedWords = PLUCK canonical string per key from originalCaseMap

    # [IMPL-SUGGESTED_TAGS] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION]
    # How — map each candidate through TagService.sanitizeTag (overlay path delegates to IMPL-TAG_SYSTEM).

    sanitized = MAP each sortedWord through SANITIZE_OVERLAY (= TagService.sanitizeTag)
    unique = DEDUPE exact adjacent duplicates preserving order
    RETURN slice(unique, 0, limit)
  CATCH:
    RETURN []

# How — Cross-path note (S06.3): overlay sanitizeTag vs snippet inline sanitizer may differ on edge characters; tokenizer must remain identical. See ARCH-SUGGESTED_TAGS.
