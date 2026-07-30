# [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] — How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.

## VALIDATE_INCOMING_MESSAGE

- [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY] How: validate envelope then per-type data schema before handler body runs.
- Contract:
  - INPUT: raw chrome.runtime messages; merged config objects from storage
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: VALIDATE_INCOMING_MESSAGE
  - envelope = validateMessageEnvelope(message)
  - IF envelope fails: RETURN error
  - data = validateMessageData(message.type, message.data)
  - IF data fails: RETURN error
  - RETURN { type, data }
  - How (sub-block): How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.

## VALIDATE_MERGED_CONFIG

- [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] How: Implements VALIDATE_MERGED_CONFIG(merged) behavior for IMPL-RUNTIME_VALIDATION.
- Contract:
  - INPUT: raw chrome.runtime messages; merged config objects from storage
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: VALIDATE_MERGED_CONFIG
  - parsed = configSchema.safeParse(merged)
  - IF NOT parsed.success: LOG; RETURN fallback OR error
  - RETURN parsed.data
