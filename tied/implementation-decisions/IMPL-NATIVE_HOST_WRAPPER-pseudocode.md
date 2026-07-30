# [IMPL-NATIVE_HOST_WRAPPER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] — Length-prefixed JSON on stdin/stdout; ping/pong; delegate to helper for other messages. Contract: stdin length+JSON in; stdout length+JSON out; helper path from install dir.

## LOOP

- [IMPL-NATIVE_HOST_WRAPPER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] How: Implements loop behavior for IMPL-NATIVE_HOST_WRAPPER.
- Contract:
  - INPUT: stdin — 4-byte length (native byte order) then UTF-8 JSON message (max 64 MiB from Chrome)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: stdout — 4-byte length then UTF-8 JSON response (max 1 MB to Chrome); stderr for debug/TRACE
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: install_dir = dir of executable; helper = helper.sh (Unix) or helper.exe then helper.ps1 (Windows)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: LOOP
  - READ 4-byte length L
  - READ L bytes UTF-8 into message
  - PARSE message as JSON
  - How (sub-block): # Respond to ping with pong.
  - IF message.type === "ping":
  - WRITE length-prefixed JSON {"type":"pong"} to stdout
  - CONTINUE
  - How (sub-block): # Resolve helper; if missing echo request or pong per product rule.
  - RESOLVE helper path from install_dir (helper.sh or helper.ps1/helper.exe)
  - IF no helper:
  - ECHO request or pong to stdout (per product rule)
  - CONTINUE
  - How (sub-block): # Invoke helper; read single JSON from stdout; write length-prefixed to stdout.
  - INVOKE helper with message JSON on stdin
  - READ helper stdout as single JSON object
  - WRITE length-prefixed response to stdout
