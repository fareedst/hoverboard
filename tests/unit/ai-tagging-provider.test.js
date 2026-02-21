/**
 * [REQ-AI_TAGGING_POPUP] [IMPL-AI_TAGGING_PROVIDER] Unit tests for requestAiTags
 */

import { requestAiTags } from '../../src/features/ai/ai-tagging-provider.js'

describe('ai-tagging-provider [IMPL-AI_TAGGING_PROVIDER]', () => {
  let mockFetch

  beforeEach(() => {
    mockFetch = jest.fn()
  })

  test('parses OpenAI response into tags (one per line)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'javascript\nwebdev\ntutorial' } }]
      })
    })
    const tags = await requestAiTags('openai', 'sk-key', 'Page about JS.', 64, { fetchFn: mockFetch })
    expect(tags).toEqual(['javascript', 'webdev', 'tutorial'])
  })

  test('parses Gemini response into tags', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'react\nfrontend\nhooks' }] } }]
      })
    })
    const tags = await requestAiTags('gemini', 'key', 'Page about React.', 64, { fetchFn: mockFetch })
    expect(tags).toEqual(['react', 'frontend', 'hooks'])
  })

  test('uses custom sanitizeTag and filters null', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'valid\n<script>\nok' } }]
      })
    })
    const sanitizeTag = (s) => (s.includes('<') ? null : s.trim())
    const tags = await requestAiTags('openai', 'sk-key', 'Text', 64, { fetchFn: mockFetch, sanitizeTag })
    expect(tags).toEqual(['valid', 'ok'])
  })

  test('deduplicates case-insensitively', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Tag\nTAG\ntag' } }]
      })
    })
    const tags = await requestAiTags('openai', 'sk-key', 'Text', 64, { fetchFn: mockFetch })
    expect(tags).toEqual(['Tag'])
  })

  test('respects limit', async () => {
    const longList = Array.from({ length: 20 }, (_, i) => `tag${i}`).join('\n')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: longList } }]
      })
    })
    const tags = await requestAiTags('openai', 'sk-key', 'Text', 5, { fetchFn: mockFetch })
    expect(tags).toHaveLength(5)
  })

  test('throws on OpenAI non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Unauthorized' })
    await expect(requestAiTags('openai', 'bad', 'Text', 64, { fetchFn: mockFetch }))
      .rejects.toThrow()
  })

  test('returns empty array for unknown provider', async () => {
    const tags = await requestAiTags('unknown', 'key', 'Text', 64, { fetchFn: mockFetch })
    expect(tags).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
