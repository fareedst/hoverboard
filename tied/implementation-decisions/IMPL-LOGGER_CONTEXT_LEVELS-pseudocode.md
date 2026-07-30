# [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — Logger with context, shouldLog, formatMessage, debug/info/warn/error; default logger and createLogger. Contract: context and level/args in; formatted line out; uses getLogLevel.

## LOGGER

- [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements Logger(context) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
- Contract:
  - INPUT: context (string), level (debug|info|warn|error), message/args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: formatted log line to console (or transport); no return
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: LOGGER
  - this.context = context
  - How (sub-block): Compare level to getLogLevel(); return true if should emit.

## SHOULD_LOG

- [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements shouldLog(level) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
- Contract:
  - INPUT: context (string), level (debug|info|warn|error), message/args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: formatted log line to console (or transport); no return
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: SHOULD_LOG
  - minLevel = getLogLevel()
  - RETURN level >= minLevel (by severity order)
  - How (sub-block): Prefix with context and level; format args.

## FORMAT_MESSAGE

- [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements formatMessage(level, ...args) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
- Contract:
  - INPUT: context (string), level (debug|info|warn|error), message/args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: formatted log line to console (or transport); no return
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: FORMAT_MESSAGE
  - RETURN "[context] level: args..." or structured format
  - How (sub-block): Emit only when shouldLog(level); output formatMessage.

## DEBUG

- [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements debug(...), info(...), warn(...), error(...) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
- Contract:
  - INPUT: context (string), level (debug|info|warn|error), message/args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: formatted log line to console (or transport); no return | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: DEBUG
  - IF shouldLog(level): OUTPUT formatMessage(level, ...args)
  - 1. logger = default Logger; createLogger(context) = new Logger(context).
