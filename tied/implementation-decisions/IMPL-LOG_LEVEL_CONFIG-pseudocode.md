# [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING]
# getLogLevel from environment; production => warn, else debug; used by shouldLog.
# Contract: no input; returns current log level; env and defaults.
INPUT: none (reads environment)
OUTPUT: current log level (e.g. "debug" | "info" | "warn" | "error")
DATA: NODE_ENV or browser equivalent; production => warn, else => debug

# Read env and return warn in production else debug (or config override).
getLogLevel():
  env = read NODE_ENV or process.env (browser fallback)
  IF env = "production": RETURN "warn"
  RETURN "debug" (or override from config)

# Logger.shouldLog(level): emit only if level >= getLogLevel().
Used by Logger.shouldLog(level): IF level >= getLogLevel() then emit else skip.
