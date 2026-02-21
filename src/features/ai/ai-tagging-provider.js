/**
 * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_PROVIDER] [REQ-TAG_INPUT_SANITIZATION]
 * Request tags from OpenAI or Gemini; parse and sanitize response.
 */

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions'
const GEMINI_GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

function defaultSanitize (str) {
  if (!str || typeof str !== 'string') return null
  const t = str.trim()
  return t.length > 0 ? t : null
}

/**
 * Request up to limit tags from AI provider for the given text.
 * @param {string} provider - 'openai' | 'gemini'
 * @param {string} apiKey - API key
 * @param {string} text - Page text to tag
 * @param {number} limit - Max tags to return (default 64)
 * @param {{ sanitizeTag?: (s: string) => string|null, fetchFn?: typeof fetch }} [options] - Optional sanitizer and fetch
 * @returns {Promise<string[]>}
 */
export async function requestAiTags (provider, apiKey, text, limit = 64, options = {}) {
  const sanitizeTag = options.sanitizeTag || defaultSanitize
  const fetchFn = options.fetchFn || globalThis.fetch
  const safeLimit = Math.max(1, Math.min(Number(limit) || 64, 128))
  const excerpt = (text && String(text).trim()) ? String(text).slice(0, 12000) : ''

  const prompt = `Return only a list of up to ${safeLimit} tags for this page, one tag per line. No numbering or explanation. Only the tags, one per line.\n\nPage content:\n${excerpt}`

  let raw
  if (provider === 'openai') {
    const res = await fetchFn(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024
      })
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(res.statusText || errText || 'OpenAI request failed')
    }
    const data = await res.json()
    raw = data.choices?.[0]?.message?.content || ''
  } else if (provider === 'gemini') {
    const url = `${GEMINI_GENERATE_URL}?key=${encodeURIComponent(apiKey)}`
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024 }
      })
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(res.statusText || errText || 'Gemini request failed')
    }
    const data = await res.json()
    const part = data.candidates?.[0]?.content?.parts?.[0]
    raw = part?.text || ''
  } else {
    return []
  }

  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const tags = []
  const seen = new Set()
  for (const line of lines) {
    const tag = sanitizeTag(line)
    if (tag != null && tag !== '' && !seen.has(tag.toLowerCase())) {
      tags.push(tag)
      seen.add(tag.toLowerCase())
    }
    if (tags.length >= safeLimit) break
  }
  return tags
}
