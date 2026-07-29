# [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY]
# How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.
INPUT: raw chrome.runtime messages; merged config objects from storage
OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails
DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage

# [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY]
# How: validate envelope then per-type data schema before handler body runs.
VALIDATE_INCOMING_MESSAGE(message):
  envelope = validateMessageEnvelope(message)
  IF envelope fails: RETURN error
  data = validateMessageData(message.type, message.data)
  IF data fails: RETURN error
  RETURN { type, data }

# How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.
VALIDATE_MERGED_CONFIG(merged):
  parsed = configSchema.safeParse(merged)
  IF NOT parsed.success: LOG; RETURN fallback OR error
  RETURN parsed.data
