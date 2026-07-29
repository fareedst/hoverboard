# [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG]
# Options page exposes and persists AI API key, provider, and tag limit; load/save from config; no key = feature disabled elsewhere.

# How: inputs = user edits in form; outputs = persisted config and Test result.
INPUT: user edits in options (apiKey, provider, optional limit)
OUTPUT: persisted config; Test result (ok or error message)

# How: getDefaultConfiguration provides aiApiKey (''), aiProvider ('openai'), aiTagLimit (64) so options and storage share one default source.
getDefaultConfiguration() includes:
  aiApiKey '', aiProvider 'openai', aiTagLimit 64

# How: populate form from stored config (aiApiKey, aiProvider, aiTagLimit).
loadSettings():
  settings = getStoredSettings()
  SET aiApiKey input = settings.aiApiKey ?? ''
  SET provider select = settings.aiProvider ?? 'openai'
  SET limit input = settings.aiTagLimit ?? 64

# How: collect trim/number from form and persist via updateConfig.
saveSettings():
  settings = { aiApiKey: trim(aiApiKey input), aiProvider: provider select value, aiTagLimit: number(limit input) }
  updateConfig(settings)

# [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG]
# Nested block: options-page "Test API key" button; require key, call testAiApiKey(apiKey, provider), show "API key OK" or error.
on Test click:
  apiKey = trim(aiApiKey input)
  provider = provider select value
  IF !apiKey THEN show error; RETURN
  result = testAiApiKey(apiKey, provider)  // or send message to SW
  IF result.ok THEN show success ELSE show result.error
