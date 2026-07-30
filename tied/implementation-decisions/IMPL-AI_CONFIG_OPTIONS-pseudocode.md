# [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] — Options page exposes and persists AI API key, provider, and tag limit; load/save from config; no key = feature disabled elsewhere.

## LOAD_SETTINGS

- [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements loadSettings() behavior for IMPL-AI_CONFIG_OPTIONS.
- Contract:
  - INPUT: user edits in options (apiKey, provider, optional limit)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: Http, IO, State
  - TERMINATION: total
- PROCEDURE: LOAD_SETTINGS
  - settings = getStoredSettings()
  - SET aiApiKey input = settings.aiApiKey ?? ''
  - SET provider select = settings.aiProvider ?? 'openai'
  - SET limit input = settings.aiTagLimit ?? 64
  - How (sub-block): How: collect trim/number from form and persist via updateConfig.

## SAVE_SETTINGS

- [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements saveSettings() behavior for IMPL-AI_CONFIG_OPTIONS.
- Contract:
  - INPUT: user edits in options (apiKey, provider, optional limit)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: Http, IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_SETTINGS
  - settings = { aiApiKey: trim(aiApiKey input), aiProvider: provider select value, aiTagLimit: number(limit input) }
  - updateConfig(settings)

## BLOCK_3

- [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Nested block: options-page "Test API key" button; require key, call testAiApiKey(apiKey, provider), show "API key OK" or error.
- Contract:
  - INPUT: user edits in options (apiKey, provider, optional limit)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: Http, IO, State
  - TERMINATION: total
- PROCEDURE: BLOCK_3
  - 1. on Test click:
  - 2.   apiKey = trim(aiApiKey input)
  - 3.   provider = provider select value
  - 4.   IF !apiKey THEN show error; RETURN
  - 5.   result = testAiApiKey(apiKey, provider)  // or send message to SW
  - 6.   IF result.ok THEN show success ELSE show result.error
