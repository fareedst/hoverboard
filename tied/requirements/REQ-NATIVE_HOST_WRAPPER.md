# [REQ-NATIVE_HOST_WRAPPER] Native Host Wrapper Requirement

## Description

The extension may communicate with a **native messaging host** launched by Chrome. The native host must be a **thin wrapper** that:

- Is started by Chrome from a path specified in the native messaging manifest (e.g. `~/.hoverboard/native_host` or `C:\...\native_host.exe`).
- Does **not** run or load code from the extension’s install directory (the extension cannot expose that path and Chrome does not pass it to the host).
- Calls **helper** code (logic, libs, scripts) that was **distributed with the extension** but **installed next to the wrapper** by a one-time installer. The wrapper resolves its own install directory (e.g. from the executable path) and loads/runs only from that directory (or another known path).

## Rationale

- Chrome starts the host process from a fixed path in the manifest; the host has no way to discover the extension’s filesystem path.
- To still use “extension-distributed” logic, that logic must be copied to a fixed location (e.g. `~/.hoverboard/` or `%LOCALAPPDATA%\Hoverboard\`) by an installer; the wrapper then invokes it from its own install directory.

## Satisfaction criteria

- A native host binary (wrapper) implements the Chrome native messaging protocol (stdio, length-prefixed JSON).
- The wrapper resolves its install directory from its executable path and does not depend on any path from the extension.
- The wrapper delegates to a helper (script or binary) in the same directory when present; otherwise responds with a safe fallback (e.g. ping → pong, or echo).
- An installer script (macOS/Linux and Windows) copies wrapper and helper from a source directory to a fixed install path and writes the native messaging manifest (and on Windows, the registry key) so Chrome can start the host.
- The extension has the `nativeMessaging` permission and can optionally test connectivity (e.g. ping) from the options page or service worker.

## Validation criteria

- Manual: Run installer, load extension, send ping; receive pong or echo.
- Unit tests (optional): Wrapper protocol encode/decode; install-dir resolution.

## Traceability

- **Architecture**: [ARCH-NATIVE_HOST](architecture-decisions/ARCH-NATIVE_HOST.md)
- **Implementation**: [IMPL-NATIVE_HOST_WRAPPER](implementation-decisions/IMPL-NATIVE_HOST_WRAPPER.md), [IMPL-NATIVE_HOST_INSTALLER](implementation-decisions/IMPL-NATIVE_HOST_INSTALLER.md)
