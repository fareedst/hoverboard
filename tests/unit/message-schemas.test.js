/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Unit tests for Zod message envelope and data validation (message-schemas.js).
 */

import {
  validateMessageEnvelope,
  validateMessageData
} from '../../src/shared/message-schemas.js'

describe('[IMPL-RUNTIME_VALIDATION] Message envelope validation', () => {
  test('accepts valid envelope with type and data', () => {
    const result = validateMessageEnvelope({ type: 'getCurrentBookmark', data: { url: 'https://example.com' } })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ type: 'getCurrentBookmark', data: { url: 'https://example.com' } })
  })

  test('accepts valid envelope with type only', () => {
    const result = validateMessageEnvelope({ type: 'getLocalBookmarksForIndex' })
    expect(result.success).toBe(true)
    expect(result.data.type).toBe('getLocalBookmarksForIndex')
    expect(result.data.data).toBeUndefined()
  })

  test('rejects missing type', () => {
    const result = validateMessageEnvelope({ data: {} })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  test('rejects non-object message', () => {
    const result = validateMessageEnvelope(null)
    expect(result.success).toBe(false)
    const result2 = validateMessageEnvelope('string')
    expect(result2.success).toBe(false)
  })

  test('rejects envelope when data is not a plain object [IMPL-RUNTIME_VALIDATION]', () => {
    expect(validateMessageEnvelope({ type: 'getCurrentBookmark', data: [] }).success).toBe(false)
    expect(validateMessageEnvelope({ type: 'getCurrentBookmark', data: 'x' }).success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] getCurrentBookmark data', () => {
  test('accepts undefined or empty data', () => {
    expect(validateMessageData('getCurrentBookmark', undefined).success).toBe(true)
    expect(validateMessageData('getCurrentBookmark', {}).success).toBe(true)
  })
  test('accepts optional url string', () => {
    const result = validateMessageData('getCurrentBookmark', { url: 'https://a.com' })
    expect(result.success).toBe(true)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] getTagsForUrl data', () => {
  test('accepts data with url', () => {
    const result = validateMessageData('getTagsForUrl', { url: 'https://example.com' })
    expect(result.success).toBe(true)
    expect(result.data.url).toBe('https://example.com')
  })
  test('rejects missing url', () => {
    const result = validateMessageData('getTagsForUrl', {})
    expect(result.success).toBe(false)
  })
  test('rejects empty url', () => {
    const result = validateMessageData('getTagsForUrl', { url: '' })
    expect(result.success).toBe(false)
  })
  test('rejects undefined data [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('getTagsForUrl', undefined)
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] saveBookmark data', () => {
  test('accepts url with optional tags and other fields', () => {
    const result = validateMessageData('saveBookmark', { url: 'https://x.com', tags: ['a', 'b'], description: 'd' })
    expect(result.success).toBe(true)
    expect(result.data.url).toBe('https://x.com')
  })
  test('accepts tags as string', () => {
    const result = validateMessageData('saveBookmark', { url: 'https://x.com', tags: 'a b c' })
    expect(result.success).toBe(true)
  })
  test('rejects missing url', () => {
    const result = validateMessageData('saveBookmark', { tags: ['a'] })
    expect(result.success).toBe(false)
  })
  test('rejects undefined data [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('saveBookmark', undefined)
    expect(result.success).toBe(false)
  })
  test('accepts shared/toread as Pinboard-style strings yes/no when saving to local storage [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('saveBookmark', { url: 'https://example.com', shared: 'yes', toread: 'no' })
    expect(result.success).toBe(true)
    expect(result.data.shared).toBe('yes')
    expect(result.data.toread).toBe('no')
  })
  test('rejects empty url', () => {
    const result = validateMessageData('saveBookmark', { url: '' })
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] deleteBookmark data', () => {
  test('accepts data with url', () => {
    const result = validateMessageData('deleteBookmark', { url: 'https://example.com' })
    expect(result.success).toBe(true)
  })
  test('rejects missing url', () => {
    const result = validateMessageData('deleteBookmark', {})
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] saveTag data', () => {
  test('accepts url and value', () => {
    const result = validateMessageData('saveTag', { url: 'https://x.com', value: 'mytag' })
    expect(result.success).toBe(true)
  })
  test('rejects missing value', () => {
    const result = validateMessageData('saveTag', { url: 'https://x.com' })
    expect(result.success).toBe(false)
  })
  test('rejects empty value', () => {
    const result = validateMessageData('saveTag', { url: 'https://x.com', value: '' })
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] deleteTag data', () => {
  test('accepts url and value', () => {
    const result = validateMessageData('deleteTag', { url: 'https://x.com', value: 'mytag' })
    expect(result.success).toBe(true)
  })
  test('rejects missing url', () => {
    const result = validateMessageData('deleteTag', { value: 't' })
    expect(result.success).toBe(false)
  })
  test('rejects missing value [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('deleteTag', { url: 'https://x.com' })
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] moveBookmarkToStorage data', () => {
  test('accepts url and targetBackend', () => {
    const result = validateMessageData('moveBookmarkToStorage', { url: 'https://example.com', targetBackend: 'local' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ url: 'https://example.com', targetBackend: 'local' })
  })
  test('rejects missing url', () => {
    const result = validateMessageData('moveBookmarkToStorage', { targetBackend: 'local' })
    expect(result.success).toBe(false)
  })
  test('rejects missing targetBackend', () => {
    const result = validateMessageData('moveBookmarkToStorage', { url: 'https://example.com' })
    expect(result.success).toBe(false)
  })
  test('rejects empty targetBackend', () => {
    const result = validateMessageData('moveBookmarkToStorage', { url: 'https://example.com', targetBackend: '' })
    expect(result.success).toBe(false)
  })
  test('rejects undefined data [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('moveBookmarkToStorage', undefined)
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] Unknown type passes through', () => {
  test('returns success with original data when no schema for type', () => {
    const result = validateMessageData('unknownType', { anything: 123 })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ anything: 123 })
  })
})
