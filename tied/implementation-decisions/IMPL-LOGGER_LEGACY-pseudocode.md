# [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — log() and noisy() for legacy compatibility; log maps to debug; noisy always emits. Contract: context and args in; log line out.

## LOG

- [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements log(context, ...args) behavior for IMPL-LOGGER_LEGACY.
- Contract:
  - INPUT: context (string), ...args (message or interpolated values)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: log line to console
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: log and noisy in same logger module
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: LOG
  - CALL default logger.debug or createLogger(context).debug(...args)
  - (Same as Logger.debug so level filtering applies)
  - How (sub-block): Emit regardless of level; for migration/debug; remove when call sites use Logger.

## NOISY

- [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements noisy(context, ...args) behavior for IMPL-LOGGER_LEGACY.
- Contract:
  - INPUT: context (string), ...args (message or interpolated values)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: log line to console
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: log and noisy in same logger module
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: NOISY
  - EMIT log line regardless of level (or at debug)
  - Used for temporary migration/debug; can be removed when call sites use Logger directly.
