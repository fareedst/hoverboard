/**
 * [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_TAG_TEST]
 * Test AI API key with minimal request to OpenAI or Gemini.
 * Returns { ok: boolean, error?: string }. Never logs the key.
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
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return { ok: false, error: 'Missing API key' }
  }
  const key = apiKey.trim()
  if (!provider || (provider !== 'openai' && provider !== 'gemini')) {
    return { ok: false, error: 'Unknown provider' }
  }

  try {
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
    const message = err && typeof err.message === 'string' ? err.message : 'Network error'
    return { ok: false, error: message }
  }

  return { ok: false, error: 'Unknown provider' }
}
