/**
 * [REQ-AI_TAGGING_CONFIG] [IMPL-AI_TAG_TEST] Unit tests for testAiApiKey
 */

import { testAiApiKey } from '../../src/features/ai/ai-api-test.js'

describe('ai-api-test [IMPL-AI_TAG_TEST]', () => {
  let mockFetch

  beforeEach(() => {
    mockFetch = jest.fn()
  })

  describe('validation', () => {
    test('returns error when apiKey is missing', async () => {
      const result = await testAiApiKey('', 'openai', mockFetch)
      expect(result).toEqual({ ok: false, error: 'Missing API key' })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    test('returns error when apiKey is null', async () => {
      const result = await testAiApiKey(null, 'openai', mockFetch)
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Missing')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    test('returns error when provider is unknown', async () => {
      const result = await testAiApiKey('sk-test', 'unknown', mockFetch)
      expect(result).toEqual({ ok: false, error: 'Unknown provider' })
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('OpenAI', () => {
    test('returns ok when OpenAI returns 200', async () => {
      mockFetch.mockResolvedValue({ ok: true })
      const result = await testAiApiKey('sk-test', 'openai', mockFetch)
      expect(result).toEqual({ ok: true })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer sk-test' }
        })
      )
    })

    test('returns invalid key when OpenAI returns 401', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 })
      const result = await testAiApiKey('sk-bad', 'openai', mockFetch)
      expect(result).toEqual({ ok: false, error: 'Invalid API key' })
    })

    test('returns invalid key when OpenAI returns 403', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 })
      const result = await testAiApiKey('sk-bad', 'openai', mockFetch)
      expect(result).toEqual({ ok: false, error: 'Invalid API key' })
    })

    test('returns error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const result = await testAiApiKey('sk-test', 'openai', mockFetch)
      expect(result.ok).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('Gemini', () => {
    test('returns ok when Gemini returns 200', async () => {
      mockFetch.mockResolvedValue({ ok: true })
      const result = await testAiApiKey('gemini-key', 'gemini', mockFetch)
      expect(result).toEqual({ ok: true })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({ method: 'GET' })
      )
      expect(mockFetch.mock.calls[0][0]).toContain('key=gemini-key')
    })

    test('returns invalid key when Gemini returns 400', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 400 })
      const result = await testAiApiKey('bad', 'gemini', mockFetch)
      expect(result).toEqual({ ok: false, error: 'Invalid API key' })
    })

    test('returns invalid key when Gemini returns 403', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 })
      const result = await testAiApiKey('bad', 'gemini', mockFetch)
      expect(result).toEqual({ ok: false, error: 'Invalid API key' })
    })
  })
})
