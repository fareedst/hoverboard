/**
 * [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [IMPL-SUGGESTED_TAGS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Canonical spelling per lowercase key; no duplicate lowercase-only suggestion; UI upper mode still shows ALL CAPS.
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
