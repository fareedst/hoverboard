/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAG_TEST ===
 * [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] — Minimal API request to verify key; return { ok } or { ok, error }; used by Options and Popup Test button.
 * 
 * ## TEST_AI_API_KEY
 * 
 * - [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements testAiApiKey(apiKey, provider) behavior for IMPL-AI_TAG_TEST.
 * - Contract:
 *   - INPUT: apiKey (string), provider ('openai' | 'gemini')
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { ok: boolean, error?: string } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http
 *   - TERMINATION: total
 * - PROCEDURE: TEST_AI_API_KEY
 *   - IF !apiKey or !provider RETURN { ok: false, error: 'Missing key or provider' }
 *   - IF provider === 'openai':
 *   - res = fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + apiKey } })
 *   - IF res.ok RETURN { ok: true }
 *   - IF res.status === 401 or 403 RETURN { ok: false, error: 'Invalid API key' }
 *   - RETURN { ok: false, error: res.statusText or 'Request failed' }
 *   - IF provider === 'gemini':
 *   - res = fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
 *   - IF res.ok RETURN { ok: true }
 *   - IF res.status === 400 or 403 RETURN { ok: false, error: 'Invalid API key' }
 *   - RETURN { ok: false, error: res.statusText or 'Request failed' }
 *   - RETURN { ok: false, error: 'Unknown provider' }
 * 
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAG_TEST ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
 * [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] — Popup "Tag with AI" flow: get page content, get AI tags, split by session, create/update bookmark with default backend, update suggested tags.
 * 
 * ## ON_TAG_WITH_AI_CLICK
 * 
 * - [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] How: Implements onTagWithAiClick() behavior for IMPL-AI_TAGGING_POPUP_UI.
 * - Contract:
 *   - INPUT: user click "Tag with AI"
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark updated; suggested tags updated | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ON_TAG_WITH_AI_CLICK
 *   - IF !config.aiApiKey or !currentTab.url.startsWith('http') THEN show message; RETURN
 *   - content = await sendToSW({ type: 'GET_PAGE_CONTENT', data: { tabId } })  // SW uses scripting.executeScript in tab
 *   - IF !content?.textContent THEN show (content.error if content.success === false else generic error); RETURN
 *   - aiTags = await sendToSW({ type: 'GET_AI_TAGS', data: { text: content.textContent, limit: config.aiTagLimit } })
 *   - sessionSet = new Set(await sendToSW({ type: 'getSessionTags' }))
 *   - inSession = aiTags.filter(t => sessionSet.has(t.toLowerCase()))
 *   - suggested = aiTags.filter(t => !sessionSet.has(t.toLowerCase()))
 *   - bookmark = await getCurrentBookmark()
 *   - defaultBackend = await configManager.getStorageMode()
 *   - IF !bookmark?.time:
 *   - create bookmark with url, title, tags: inSession, preferredBackend: defaultBackend
 *   - ELSE:
 *   - merged = merge(bookmark.tags, inSession)  // dedupe case-insensitive
 *   - saveBookmark({ ...bookmark, tags: merged, preferredBackend: bookmark backend or defaultBackend })
 *   - updateSuggestedTags(suggested)  // so AI tags appear first in Suggested section
 *   - refresh bookmark state / badge
 * 
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_PROVIDER ===
 * [IMPL-AI_TAGGING_PROVIDER] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-TAG_INPUT_SANITIZATION] — Call provider API (OpenAI or Gemini) with prompt + text; parse lines, sanitizeTag each, dedupe, slice to limit.
 * 
 * ## REQUEST_AI_TAGS
 * 
 * - [IMPL-AI_TAGGING_PROVIDER] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-TAG_INPUT_SANITIZATION] How: Implements requestAiTags(provider, apiKey, text, limit) behavior for IMPL-AI_TAGGING_PROVIDER.
 * - Contract:
 *   - INPUT: provider, apiKey, text (string), limit (number)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: string[] (sanitized tags, max length limit)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Async, Http
 *   - TERMINATION: total
 * - PROCEDURE: REQUEST_AI_TAGS
 *   - prompt = "Return only a list of up to " + limit + " tags for this page, one tag per line. No numbering or explanation.\n\nPage content:\n" + text.slice(0, 12000)
 *   - IF provider === 'openai':
 *   - body = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 1024 }
 *   - res = fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }, body: JSON.stringify(body) })
 *   - data = await res.json()
 *   - raw = data.choices[0].message.content
 *   - IF provider === 'gemini':
 *   - body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1024 } }
 *   - res = fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
 *   - data = await res.json()
 *   - raw = data.candidates[0].content.parts[0].text
 *   - lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
 *   - tags = []
 *   - seen = new Set()
 *   - FOR line IN lines:
 *   - tag = sanitizeTag(line)
 *   - IF tag && !seen.has(tag.toLowerCase()): tags.push(tag); seen.add(tag.toLowerCase())
 *   - IF tags.length >= limit BREAK
 *   - RETURN tags
 * 
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_PROVIDER ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
 * [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — Extract main content from document: Readability when available, else title + body.innerText; cap at maxLength.
 * 
 * ## EXTRACT_PAGE_CONTENT
 * 
 * - [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements extractPageContent(document) behavior for IMPL-AI_TAGGING_READABILITY.
 * - Contract:
 *   - INPUT: document (or run in page context)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { title: string, textContent: string }
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: maxLength (e.g. 16000)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_PAGE_CONTENT
 *   - clone = document.cloneNode(true)
 *   - result = Readability.parse(clone)  // @mozilla/readability
 *   - IF result:
 *   - title = result.title ?? document.title
 *   - text = result.textContent ?? ''
 *   - ELSE:
 *   - title = document.title
 *   - text = document.body ? document.body.innerText : ''
 *   - IF text.length > maxLength THEN text = text.slice(0, maxLength)
 *   - RETURN { title, textContent: text }
 * 
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
 */
import { testAiApiKey } from '../../src/features/ai/ai-api-test.js'

describe('ai-api-test [IMPL-AI_TAG_TEST]', () => {
  let mockFetch

  beforeEach(() => {
    mockFetch = jest.fn()
  })

  // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Tests input contract: missing key or unknown provider.
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

  // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Tests OpenAI: 200 → ok, 401/403 → invalid key, network error.
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

  // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Tests Gemini: 200 → ok, 400/403 → invalid key.
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
