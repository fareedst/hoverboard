# [IMPL-AI_TAGGING_PROVIDER] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-TAG_INPUT_SANITIZATION] — Call provider API (OpenAI or Gemini) with prompt + text; parse lines, sanitizeTag each, dedupe, slice to limit.

## REQUEST_AI_TAGS

- [IMPL-AI_TAGGING_PROVIDER] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-TAG_INPUT_SANITIZATION] How: Implements requestAiTags(provider, apiKey, text, limit) behavior for IMPL-AI_TAGGING_PROVIDER.
- Contract:
  - INPUT: provider, apiKey, text (string), limit (number)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: string[] (sanitized tags, max length limit)
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: Async, Http
  - TERMINATION: total
- PROCEDURE: REQUEST_AI_TAGS
  - prompt = "Return only a list of up to " + limit + " tags for this page, one tag per line. No numbering or explanation.\n\nPage content:\n" + text.slice(0, 12000)
  - IF provider === 'openai':
  - body = { model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 1024 }
  - res = fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }, body: JSON.stringify(body) })
  - data = await res.json()
  - raw = data.choices[0].message.content
  - IF provider === 'gemini':
  - body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1024 } }
  - res = fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  - data = await res.json()
  - raw = data.candidates[0].content.parts[0].text
  - lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  - tags = []
  - seen = new Set()
  - FOR line IN lines:
  - tag = sanitizeTag(line)
  - IF tag && !seen.has(tag.toLowerCase()): tags.push(tag); seen.add(tag.toLowerCase())
  - IF tags.length >= limit BREAK
  - RETURN tags
