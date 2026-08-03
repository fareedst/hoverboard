/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Tag chip case folding helpers (This Page)
 */

import {
  currentTagDisplayLabel,
  isEmptyOrWhitespaceOnlyTag,
  isTagCaseFoldingMode,
  tagChipDisplayAndAddValue
} from '../../src/shared/tag-case-folding.js'

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] tag-case-folding', () => {
  test('isTagCaseFoldingMode accepts only original, lower, upper', () => {
    expect(isTagCaseFoldingMode('original')).toBe(true)
    expect(isTagCaseFoldingMode('lower')).toBe(true)
    expect(isTagCaseFoldingMode('upper')).toBe(true)
    expect(isTagCaseFoldingMode('mixed')).toBe(false)
    expect(isTagCaseFoldingMode('')).toBe(false)
  })

  test('isEmptyOrWhitespaceOnlyTag', () => {
    expect(isEmptyOrWhitespaceOnlyTag('')).toBe(true)
    expect(isEmptyOrWhitespaceOnlyTag('   ')).toBe(true)
    expect(isEmptyOrWhitespaceOnlyTag(null)).toBe(true)
    expect(isEmptyOrWhitespaceOnlyTag('a')).toBe(false)
    expect(isEmptyOrWhitespaceOnlyTag('  b  ')).toBe(false)
  })

  test('original mode preserves trimmed casing for display and add', () => {
    const r = tagChipDisplayAndAddValue('ReadLater', 'original')
    expect(r.display).toBe('ReadLater')
    expect(r.addValue).toBe('ReadLater')
  })

  test('lower mode maps ReadLater to readlater for display and add', () => {
    const r = tagChipDisplayAndAddValue('ReadLater', 'lower')
    expect(r.display).toBe('readlater')
    expect(r.addValue).toBe('readlater')
  })

  test('upper mode maps api to API for display and add', () => {
    const r = tagChipDisplayAndAddValue('api', 'upper')
    expect(r.display).toBe('API')
    expect(r.addValue).toBe('API')
  })

  test('currentTagDisplayLabel preserves stored/source casing for current tags', () => {
    expect(currentTagDisplayLabel('ReadLater', 'original')).toBe('ReadLater')
    expect(currentTagDisplayLabel('ReadLater', 'lower')).toBe('ReadLater')
    expect(currentTagDisplayLabel('ReadLater', 'upper')).toBe('ReadLater')
  })
})
