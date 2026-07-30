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
import { TagService } from '../../src/features/tagging/tag-service.js'
import { tagChipDisplayAndAddValue } from '../../src/shared/tag-case-folding.js'
import { pickBetterSuggestedOriginalCase } from '../../src/shared/suggested-tag-original-case.js'

describe('[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] suggested tag canonical case', () => {
  describe('pickBetterSuggestedOriginalCase', () => {
    test('prefers Apple over apple', () => {
      expect(pickBetterSuggestedOriginalCase('apple', 'Apple')).toBe('Apple')
      expect(pickBetterSuggestedOriginalCase('Apple', 'apple')).toBe('Apple')
    })

    test('keeps all-lowercase when no better variant', () => {
      expect(pickBetterSuggestedOriginalCase('apple', 'apple')).toBe('apple')
    })

    test('prefers mixed case over ALLCAPS on tie rank', () => {
      expect(pickBetterSuggestedOriginalCase('APPLE', 'Apple')).toBe('Apple')
      expect(pickBetterSuggestedOriginalCase('Apple', 'APPLE')).toBe('Apple')
    })
  })

  describe('TagService.extractSuggestedTagsFromContent', () => {
    let tagService

    beforeEach(() => {
      tagService = new TagService()
    })

    test('one suggestion Apple for apple+Apple in title (no separate apple chip)', () => {
      const doc = document.implementation.createHTMLDocument('')
      doc.title = 'apple pie Apple tart'
      const tags = tagService.extractSuggestedTagsFromContent(doc, 'https://example.com/foo', 30)
      const appleish = tags.filter(t => t.toLowerCase() === 'apple')
      expect(appleish).toEqual(['Apple'])
    })

    test('JavaScript appears once as JavaScript (no lowercase duplicate)', () => {
      const doc = document.implementation.createHTMLDocument('')
      doc.title = 'Learning JavaScript'
      const tags = tagService.extractSuggestedTagsFromContent(doc, 'https://example.com/', 30)
      const js = tags.filter(t => t.toLowerCase() === 'javascript')
      expect(js).toEqual(['JavaScript'])
    })
  })

  describe('tagChipDisplayAndAddValue (upper mode)', () => {
    test('Apple → APPLE for display and add', () => {
      const { display, addValue } = tagChipDisplayAndAddValue('Apple', 'upper')
      expect(display).toBe('APPLE')
      expect(addValue).toBe('APPLE')
    })
  })
})
