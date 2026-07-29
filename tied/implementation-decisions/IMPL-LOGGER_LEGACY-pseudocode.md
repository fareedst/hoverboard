# [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING]
# log() and noisy() for legacy compatibility; log maps to debug; noisy always emits.
# Contract: context and args in; log line out.
INPUT: context (string), ...args (message or interpolated values)
OUTPUT: log line to console
DATA: log and noisy in same logger module

# Call default logger.debug or createLogger(context).debug; level filtering applies.
log(context, ...args):
  CALL default logger.debug or createLogger(context).debug(...args)
  (Same as Logger.debug so level filtering applies)

# Emit regardless of level; for migration/debug; remove when call sites use Logger.
noisy(context, ...args):
  EMIT log line regardless of level (or at debug)
  Used for temporary migration/debug; can be removed when call sites use Logger directly.
