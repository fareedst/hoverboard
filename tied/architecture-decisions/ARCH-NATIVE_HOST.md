# [ARCH-NATIVE_HOST] Native Host Architecture

## Decision

The native messaging host is implemented as a **thin wrapper** plus **helper** plus **installer**:

- **Wrapper**: Single binary (Go) that speaks the Chrome native messaging protocol (stdio, 4-byte length + JSON). It resolves its install directory from `os.Executable()`, never uses the extension path. For each message it either responds to `ping` with `pong` or invokes a **helper** in the same directory (script or binary) and returns the helper’s JSON response; if no helper is present, it echoes the request or returns pong.
- **Helper**: Minimal script or binary in the same directory as the wrapper (e.g. `helper.sh`, `helper.ps1`, or `helper.exe`). Contract: read JSON from stdin, write JSON to stdout. Installed by the installer next to the wrapper.
- **Installer**: Script(s) that copy wrapper and helper from a source dir (e.g. unpacked extension or build output) to a fixed install path, generate the native messaging manifest with absolute path and `allowed_origins` from the extension ID, and write the manifest to the platform-specific location (macOS/Linux: `NativeMessagingHosts/` under user profile; Windows: manifest path + registry key).

## Rationale

- Chrome does not pass the extension path to the host; the host cannot safely load from the extension folder. Installing to a fixed path and having the wrapper load only from its own directory satisfies the constraint while still allowing “extension-distributed” code to be used after install.
- Go for the wrapper: single codebase, one binary per OS, no runtime dependency, easy stdio and subprocess handling.
- User-level install path by default (`~/.hoverboard/`, `%LOCALAPPDATA%\Hoverboard\`) avoids requiring admin rights.

## Traceability

- **Requirements**: [REQ-NATIVE_HOST_WRAPPER](../requirements/REQ-NATIVE_HOST_WRAPPER.md)
- **Implementation**: [IMPL-NATIVE_HOST_WRAPPER](../implementation-decisions/IMPL-NATIVE_HOST_WRAPPER.md), [IMPL-NATIVE_HOST_INSTALLER](../implementation-decisions/IMPL-NATIVE_HOST_INSTALLER.md)
