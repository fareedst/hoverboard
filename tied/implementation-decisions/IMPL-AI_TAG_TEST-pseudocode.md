# [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] — Minimal API request to verify key; return { ok } or { ok, error }; used by Options and Popup Test button.

## TEST_AI_API_KEY

- [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements testAiApiKey(apiKey, provider) behavior for IMPL-AI_TAG_TEST.
- Contract:
  - INPUT: apiKey (string), provider ('openai' | 'gemini')
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: { ok: boolean, error?: string } | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: Http
  - TERMINATION: total
- PROCEDURE: TEST_AI_API_KEY
  - IF !apiKey or !provider RETURN { ok: false, error: 'Missing key or provider' }
  - IF provider === 'openai':
  - res = fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + apiKey } })
  - IF res.ok RETURN { ok: true }
  - IF res.status === 401 or 403 RETURN { ok: false, error: 'Invalid API key' }
  - RETURN { ok: false, error: res.statusText or 'Request failed' }
  - IF provider === 'gemini':
  - res = fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
  - IF res.ok RETURN { ok: true }
  - IF res.status === 400 or 403 RETURN { ok: false, error: 'Invalid API key' }
  - RETURN { ok: false, error: res.statusText or 'Request failed' }
  - RETURN { ok: false, error: 'Unknown provider' }
