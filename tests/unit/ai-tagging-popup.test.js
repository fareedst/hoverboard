/**
 * [REQ-AI_TAGGING_POPUP] [IMPL-AI_TAGGING_POPUP_UI] Unit tests for AI tagging popup helpers
 */

import { splitAiTagsBySession } from '../../src/features/ai/ai-tagging-popup-utils.js'

describe('ai-tagging-popup-utils [IMPL-AI_TAGGING_POPUP_UI]', () => {
  describe('splitAiTagsBySession', () => {
    test('splits tags into inSession and suggested by session set', () => {
      const aiTags = ['javascript', 'react', 'tutorial', 'webdev']
      const sessionTags = new Set(['javascript', 'tutorial'])
      const { inSession, suggested } = splitAiTagsBySession(aiTags, sessionTags)
      expect(inSession.sort()).toEqual(['javascript', 'tutorial'])
      expect(suggested.sort()).toEqual(['react', 'webdev'])
    })

    test('session comparison is case-insensitive', () => {
      const aiTags = ['JavaScript', 'REACT']
      const sessionTags = new Set(['javascript', 'react'])
      const { inSession, suggested } = splitAiTagsBySession(aiTags, sessionTags)
      expect(inSession).toEqual(['JavaScript', 'REACT'])
      expect(suggested).toEqual([])
    })

    test('accepts session tags as array', () => {
      const aiTags = ['a', 'b', 'c']
      const { inSession, suggested } = splitAiTagsBySession(aiTags, ['a', 'c'])
      expect(inSession.sort()).toEqual(['a', 'c'])
      expect(suggested).toEqual(['b'])
    })

    test('handles empty aiTags', () => {
      const { inSession, suggested } = splitAiTagsBySession([], new Set(['x']))
      expect(inSession).toEqual([])
      expect(suggested).toEqual([])
    })

    test('handles empty session set', () => {
      const aiTags = ['a', 'b']
      const { inSession, suggested } = splitAiTagsBySession(aiTags, new Set())
      expect(inSession).toEqual([])
      expect(suggested).toEqual(['a', 'b'])
    })

    test('skips empty string tags', () => {
      const aiTags = ['ok', '', '  ', 'x']
      const { inSession, suggested } = splitAiTagsBySession(aiTags, new Set())
      expect(suggested).toEqual(['ok', 'x'])
    })

    test('[REQ-AI_TAGGING_POPUP] when all AI tags are in session, suggested is empty', () => {
      const aiTags = ['a', 'b', 'c']
      const sessionTags = new Set(['a', 'b', 'c'])
      const { inSession, suggested } = splitAiTagsBySession(aiTags, sessionTags)
      expect(inSession.sort()).toEqual(['a', 'b', 'c'])
      expect(suggested).toEqual([])
    })
  })
})
