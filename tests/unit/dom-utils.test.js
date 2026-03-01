/**
 * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
 * Unit tests for newPin and minEmpty (createPinFromFormData / validatePinFormData-style helpers in utils.js).
 */

import { newPin, minEmpty } from '../../src/shared/utils.js'

describe('[IMPL-DOM_UTILITIES] newPin and minEmpty', () => {
  describe('newPin', () => {
    test('returns pin shape with defaults when no args', () => {
      const pin = newPin()
      expect(pin).toHaveProperty('url', '')
      expect(pin).toHaveProperty('description', '')
      expect(pin).toHaveProperty('tags', '')
      expect(pin).toHaveProperty('dt')
      expect(pin).toHaveProperty('shared', 'yes')
      expect(pin).toHaveProperty('toread', 'no')
    })

    test('merges existing and additional over defaults', () => {
      const pin = newPin({ url: 'https://a.com' }, { description: 'Desc' })
      expect(pin.url).toBe('https://a.com')
      expect(pin.description).toBe('Desc')
      expect(pin.shared).toBe('yes')
    })
  })

  describe('minEmpty', () => {
    test('returns minimal bookmark with fallback title when data empty', () => {
      const out = minEmpty(null, 'Fallback')
      expect(out.url).toBe('')
      expect(out.description).toBe('Fallback')
      expect(out.tags).toBe('')
      expect(out.shared).toBe('yes')
      expect(out.toread).toBe('no')
    })

    test('uses data when provided', () => {
      const out = minEmpty({ url: 'https://x.com', description: 'D', tags: 'a b' })
      expect(out.url).toBe('https://x.com')
      expect(out.description).toBe('D')
      expect(out.tags).toBe('a b')
    })
  })
})
