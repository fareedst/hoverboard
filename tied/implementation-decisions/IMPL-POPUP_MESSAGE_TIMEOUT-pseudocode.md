# [IMPL-POPUP_MESSAGE_TIMEOUT] — Promise-based send with timeout; reject on timeout or error. Contract: message and timeout in; Promise resolve/reject out.

## SEND_WITH_TIMEOUT

- [IMPL-POPUP_MESSAGE_TIMEOUT] How: Implements sendWithTimeout(message, timeoutMs) behavior for IMPL-POPUP_MESSAGE_TIMEOUT.
- Contract:
  - INPUT: message (type, payload); timeout (ms)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise that resolves with response or rejects on timeout/error | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: timeout handle; optional test mock for timeout value
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: SEND_WITH_TIMEOUT
  - promise = SEND message (Promise from message service)
  - timeoutId = SET timeout for timeoutMs -> REJECT with timeout error
  - ON promise resolve/reject: CLEAR timeoutId; RETURN promise result
  - RETURN promise (race with timeout)
