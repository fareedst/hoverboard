/**
 * [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Unit tests for extractPageContent
 */

jest.mock('@mozilla/readability', () => ({
  Readability: class MockReadability {
    parse () {
      return {
        title: 'Mock Article Title',
        textContent: 'This is the main article text. '.repeat(100)
      }
    }
  }
}))

import { extractPageContent } from '../../src/features/ai/readability-extract.js'

describe('readability-extract [IMPL-AI_TAGGING_READABILITY]', () => {
  // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Readability parse result: title and textContent.
  test('returns title and textContent from Readability parse result', () => {
    const doc = {
      cloneNode: () => ({}),
      title: 'Page Title',
      body: { innerText: 'Fallback' }
    }
    const result = extractPageContent(doc)
    expect(result.title).toBe('Mock Article Title')
    expect(result.textContent).toContain('This is the main article text')
  })

  // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Cap textContent at maxLength.
  test('caps textContent at maxLength', () => {
    const doc = {
      cloneNode: () => ({}),
      title: 'Page',
      body: { innerText: 'Fallback' }
    }
    const result = extractPageContent(doc, { maxLength: 50 })
    expect(result.textContent.length).toBeLessThanOrEqual(50)
  })

  // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Null or invalid document returns empty strings.
  test('returns empty strings when document is null', () => {
    const result = extractPageContent(null)
    expect(result).toEqual({ title: '', textContent: '' })
  })

  // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Document without cloneNode → empty result.
  test('returns empty strings when document has no cloneNode', () => {
    const result = extractPageContent({})
    expect(result).toEqual({ title: '', textContent: '' })
  })
})
