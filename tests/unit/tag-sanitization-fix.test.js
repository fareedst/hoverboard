/**
 * [TEST-FIX-001-SANITIZE] - Tag sanitization fix validation tests
 * Tests the fixed tag sanitization logic
 */

import { TagService } from '../../src/features/tagging/tag-service.js'

describe('[TEST-FIX-001-SANITIZE] Tag Sanitization Fix Validation', () => {
  let tagService

  beforeEach(() => {
    // [TEST-FIX-001-SANITIZE] - Create tag service instance
    tagService = new TagService()
  })

  describe('[TEST-FIX-001-SANITIZE] HTML Tag Sanitization', () => {
    test('[TEST-FIX-001-SANITIZE] should properly sanitize HTML tags', () => {
      // [TEST-FIX-001-SANITIZE] - Test HTML tag sanitization
      const result = tagService.sanitizeTag('<script>alert("xss")</script>')
      expect(result).toBe('scriptalertxss')
    })

    test('[TEST-FIX-001-SANITIZE] should handle multiple HTML tags', () => {
      // [TEST-FIX-001-SANITIZE] - Test multiple HTML tags
      const result = tagService.sanitizeTag('<div><span>content</span></div>')
      expect(result).toBe('divspancontentspan')
    })

    test('[TEST-FIX-001-SANITIZE] should handle nested HTML tags', () => {
      // [TEST-FIX-001-SANITIZE] - Test nested HTML tags
      const result = tagService.sanitizeTag('<p><strong><em>text</em></strong></p>')
      expect(result).toBe('pstrongemtextemstrong')
    })

    test('[TEST-FIX-001-SANITIZE] should handle HTML tags with attributes', () => {
      // [TEST-FIX-001-SANITIZE] - Test HTML tags with attributes
      const result = tagService.sanitizeTag('<a href="https://example.com">link</a>')
      expect(result).toBe('alink')
    })
  })

  describe('[TEST-FIX-001-SANITIZE] Special Character Removal', () => {
    test('[TEST-FIX-001-SANITIZE] should remove special characters', () => {
      // [TEST-FIX-001-SANITIZE] - Test special character removal
      const result = tagService.sanitizeTag('tag@#$%^&*()')
      expect(result).toBe('tag')
    })

    test('[TEST-FIX-001-SANITIZE] should preserve valid characters', () => {
      // [TEST-FIX-001-SANITIZE] - Test valid character preservation
      const result = tagService.sanitizeTag('valid-tag_123')
      expect(result).toBe('valid-tag_123')
    })

    test('[TEST-FIX-001-SANITIZE] should handle mixed content', () => {
      // [TEST-FIX-001-SANITIZE] - Test mixed content
      const result = tagService.sanitizeTag('<script>alert("xss")</script>@#$%^&*()')
      expect(result).toBe('scriptalertxss')
    })
  })

  describe('[TEST-FIX-001-SANITIZE] Length Limitation', () => {
    test('[TEST-FIX-001-SANITIZE] should limit tag length to 50 characters', () => {
      // [TEST-FIX-001-SANITIZE] - Test length limitation
      const longTag = 'a'.repeat(100)
      const result = tagService.sanitizeTag(longTag)
      expect(result.length).toBeLessThanOrEqual(50)
    })

    test('[TEST-FIX-001-SANITIZE] should handle tags exactly 50 characters', () => {
      // [TEST-FIX-001-SANITIZE] - Test exact length
      const exactTag = 'a'.repeat(50)
      const result = tagService.sanitizeTag(exactTag)
      expect(result.length).toBe(50)
    })
  })

  describe('[TEST-FIX-001-SANITIZE] Invalid Input Handling', () => {
    test('[TEST-FIX-001-SANITIZE] should handle empty string', () => {
      // [TEST-FIX-001-SANITIZE] - Test empty string
      const result = tagService.sanitizeTag('')
      expect(result).toBe(null)
    })

    test('[TEST-FIX-001-SANITIZE] should handle null input', () => {
      // [TEST-FIX-001-SANITIZE] - Test null input
      const result = tagService.sanitizeTag(null)
      expect(result).toBe(null)
    })

    test('[TEST-FIX-001-SANITIZE] should handle undefined input', () => {
      // [TEST-FIX-001-SANITIZE] - Test undefined input
      const result = tagService.sanitizeTag(undefined)
      expect(result).toBe(null)
    })

    test('[TEST-FIX-001-SANITIZE] should handle non-string input', () => {
      // [TEST-FIX-001-SANITIZE] - Test non-string input
      const result = tagService.sanitizeTag(123)
      expect(result).toBe(null)
    })

    test('[TEST-FIX-001-SANITIZE] should handle whitespace-only input', () => {
      // [TEST-FIX-001-SANITIZE] - Test whitespace-only input
      const result = tagService.sanitizeTag('   ')
      expect(result).toBe(null)
    })
  })

  describe('[TEST-FIX-001-SANITIZE] Edge Cases', () => {
    test('[TEST-FIX-001-SANITIZE] should handle single character tags', () => {
      // [TEST-FIX-001-SANITIZE] - Test single character
      const result = tagService.sanitizeTag('a')
      expect(result).toBe('a')
    })

    test('[TEST-FIX-001-SANITIZE] should handle tags with only HTML', () => {
      // [TEST-FIX-001-SANITIZE] - Test tags with only HTML
      const result = tagService.sanitizeTag('<div></div>')
      expect(result).toBe('div')
    })

    test('[TEST-FIX-001-SANITIZE] should handle self-closing tags', () => {
      // [TEST-FIX-001-SANITIZE] - Test self-closing tags
      const result = tagService.sanitizeTag('<br/>')
      expect(result).toBe('br')
    })

    test('[TEST-FIX-001-SANITIZE] should handle complex HTML structures', () => {
      // [TEST-FIX-001-SANITIZE] - Test complex HTML
      const result = tagService.sanitizeTag('<div class="container"><p>Hello <strong>World</strong>!</p></div>')
      expect(result).toBe('divclasscontainerpHelloWorld')
    })
  })

  describe('[TEST-FIX-001-SANITIZE] Security Validation', () => {
    test('[TEST-FIX-001-SANITIZE] should prevent XSS attacks', () => {
      // [TEST-FIX-001-SANITIZE] - Test XSS prevention
      const maliciousInputs = [
        '<img src="x" onerror="alert(\'xss\')">',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '<svg onload="alert(\'xss\')"></svg>'
      ]

      maliciousInputs.forEach(input => {
        const result = tagService.sanitizeTag(input)
        expect(result).not.toContain('<script>')
        expect(result).not.toContain('alert')
        expect(result).not.toContain('javascript:')
      })
    })

    test('[TEST-FIX-001-SANITIZE] should handle encoded HTML', () => {
      // [TEST-FIX-001-SANITIZE] - Test encoded HTML
      const result = tagService.sanitizeTag('&lt;script&gt;alert("xss")&lt;/script&gt;')
      expect(result).toBe('ltscriptgtalertxssltscriptgt')
    })
  })
}) 