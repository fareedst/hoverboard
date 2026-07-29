# [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING]
# Logger with context, shouldLog, formatMessage, debug/info/warn/error; default logger and createLogger.
# Contract: context and level/args in; formatted line out; uses getLogLevel.
INPUT: context (string), level (debug|info|warn|error), message/args
OUTPUT: formatted log line to console (or transport); no return
DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG

# Store context on instance.
Logger(context):
  this.context = context

# Compare level to getLogLevel(); return true if should emit.
shouldLog(level):
  minLevel = getLogLevel()
  RETURN level >= minLevel (by severity order)

# Prefix with context and level; format args.
formatMessage(level, ...args):
  RETURN "[context] level: args..." or structured format

# Emit only when shouldLog(level); output formatMessage.
debug(...), info(...), warn(...), error(...):
  IF shouldLog(level): OUTPUT formatMessage(level, ...args)

logger = default Logger; createLogger(context) = new Logger(context).
