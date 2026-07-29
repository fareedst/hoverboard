# [IMPL-POPUP_MESSAGE_TIMEOUT]
# Promise-based send with timeout; reject on timeout or error.
# Contract: message and timeout in; Promise resolve/reject out.
INPUT: message (type, payload); timeout (ms)
OUTPUT: Promise that resolves with response or rejects on timeout/error
DATA: timeout handle; optional test mock for timeout value

# Race send Promise with timeout; clear timeout on resolve/reject.
sendWithTimeout(message, timeoutMs):
  promise = SEND message (Promise from message service)
  timeoutId = SET timeout for timeoutMs -> REJECT with timeout error
  ON promise resolve/reject: CLEAR timeoutId; RETURN promise result
  RETURN promise (race with timeout)
