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
const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models'
const GEMINI_MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Test that an API key works for the given provider.
 * @param {string} apiKey - API key (not logged)
 * @param {string} provider - 'openai' | 'gemini'
 * @param {typeof fetch} [fetchFn] - Optional fetch implementation for tests
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function testAiApiKey (apiKey, provider, fetchFn = globalThis.fetch) {
  // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Validation: ensure key and provider present so we never call API with missing params.
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return { ok: false, error: 'Missing API key' }
  }
  const key = apiKey.trim()
  if (!provider || (provider !== 'openai' && provider !== 'gemini')) {
    return { ok: false, error: 'Unknown provider' }
  }

  try {
    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] OpenAI: minimal GET models; 401/403 → invalid key, else request failed.
    if (provider === 'openai') {
      const res = await fetchFn(OPENAI_MODELS_URL, {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` }
      })
      if (res.ok) return { ok: true }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: 'Invalid API key' }
      }
      const text = await res.text()
      return { ok: false, error: res.statusText || text || 'Request failed' }
    }

    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Gemini: minimal GET models; 400/403 → invalid key, else request failed.
    if (provider === 'gemini') {
      const url = `${GEMINI_MODELS_URL}?key=${encodeURIComponent(key)}`
      const res = await fetchFn(url, { method: 'GET' })
      if (res.ok) return { ok: true }
      if (res.status === 400 || res.status === 403) {
        return { ok: false, error: 'Invalid API key' }
      }
      const text = await res.text()
      return { ok: false, error: res.statusText || text || 'Request failed' }
    }
  } catch (err) {
    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Network or other error; return user-facing message, never log key.
    const message = err && typeof err.message === 'string' ? err.message : 'Network error'
    return { ok: false, error: message }
  }

  return { ok: false, error: 'Unknown provider' }
}
