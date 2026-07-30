# [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — getLogLevel from environment; production => warn, else debug; used by shouldLog. Contract: no input; returns current log level; env and defaults.

## GET_LOG_LEVEL

- [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements getLogLevel() behavior for IMPL-LOG_LEVEL_CONFIG.
- Contract:
  - INPUT: none (reads environment)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: current log level (e.g. "debug" | "info" | "warn" | "error") | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: NODE_ENV or browser equivalent; production => warn, else => debug
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: GET_LOG_LEVEL
  - env = read NODE_ENV or process.env (browser fallback)
  - IF env = "production": RETURN "warn"
  - RETURN "debug" (or override from config)
  - How (sub-block): Logger.shouldLog(level): emit only if level >= getLogLevel().
  - 1. Used by Logger.shouldLog(level): IF level >= getLogLevel() then emit else skip.
