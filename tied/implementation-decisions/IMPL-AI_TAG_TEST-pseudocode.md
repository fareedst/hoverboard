# [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG]
# Minimal API request to verify key; return { ok } or { ok, error }; used by Options and Popup Test button.

# Contract: inputs = apiKey and provider; output = success or error result.
INPUT: apiKey (string), provider ('openai' | 'gemini')
OUTPUT: { ok: boolean, error?: string }

# Validate key/provider; per-provider fetch (OpenAI GET models, Gemini GET models); map status to invalid-key or generic error; never log key.
testAiApiKey(apiKey, provider):
  IF !apiKey or !provider RETURN { ok: false, error: 'Missing key or provider' }
  IF provider === 'openai':
    res = fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + apiKey } })
    IF res.ok RETURN { ok: true }
    IF res.status === 401 or 403 RETURN { ok: false, error: 'Invalid API key' }
    RETURN { ok: false, error: res.statusText or 'Request failed' }
  IF provider === 'gemini':
    res = fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
    IF res.ok RETURN { ok: true }
    IF res.status === 400 or 403 RETURN { ok: false, error: 'Invalid API key' }
    RETURN { ok: false, error: res.statusText or 'Request failed' }
  RETURN { ok: false, error: 'Unknown provider' }
