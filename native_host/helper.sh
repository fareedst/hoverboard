#!/usr/bin/env sh
# [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] Minimal helper: read JSON from stdin, echo as JSON to stdout.
# Wrapper passes message bytes (no length prefix); we output valid JSON for the response.
if command -v jq >/dev/null 2>&1; then
  cat | jq -c 'if .type then . else {type: "echo", payload: .} end'
else
  cat
fi
