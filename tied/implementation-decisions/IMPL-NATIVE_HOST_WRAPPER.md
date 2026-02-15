# [IMPL-NATIVE_HOST_WRAPPER] Native Host Wrapper Implementation

## Summary

Thin native messaging host implemented in Go in `native_host/`: reads length-prefixed JSON from stdin, resolves install dir from executable path, handles `ping` with `pong`, otherwise invokes helper in same dir (e.g. `helper.sh` or `helper.ps1` on Windows) and returns helper’s JSON; if no helper, echoes request or pong. Debug/TRACE output to stderr.

## Details

- **Protocol**: 4-byte length (native byte order) + UTF-8 JSON; max 64 MiB from Chrome, 1 MB to Chrome.
- **Install dir**: `filepath.Dir(os.Executable())`.
- **Helper lookup**: Windows: `helper.exe` then `helper.ps1` (run via PowerShell); Unix: `helper.sh`. Helper receives raw JSON on stdin, must output single JSON object to stdout.
- **Ping**: Message `{"type":"ping"}` → response `{"type":"pong"}` without calling helper.
- **Build**: `go build -o native_host .`; cross-build with `GOOS`/`GOARCH` for darwin_arm64, darwin_amd64, linux_amd64, windows_amd64.

## Traceability

- **Architecture**: [ARCH-NATIVE_HOST](../architecture-decisions/ARCH-NATIVE_HOST.md)
- **Requirements**: [REQ-NATIVE_HOST_WRAPPER](../requirements/REQ-NATIVE_HOST_WRAPPER.md)
- **Code**: `native_host/main.go`, `native_host/helper.sh`, `native_host/helper.ps1`
- **Tests**: `native_host/main_test.go` (protocol read/write, findHelper, ping-pong integration); `tests/unit/native-host-ping.test.js` (NATIVE_PING handling and pingNativeHost)
