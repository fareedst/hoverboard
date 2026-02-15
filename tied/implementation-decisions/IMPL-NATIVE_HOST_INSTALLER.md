# [IMPL-NATIVE_HOST_INSTALLER] Native Host Installer Implementation

## Summary

Install scripts copy the wrapper binary and helper script(s) to a fixed install directory and register the native messaging host with Chrome/Chromium via a generated manifest (and on Windows, registry).

## Details

- **install.sh** (macOS/Linux): Args: `[SOURCE_DIR] [EXTENSION_ID] [BROWSER]`. Install dir: `~/.hoverboard/`. Copies `native_host` (or platform-named binary) and `helper.sh`/`helper.ps1`. Writes manifest to `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.hoverboard.native_host.json` (Chrome) or Chromium equivalent; Linux: `~/.config/google-chrome/NativeMessagingHosts/` or `~/.config/chromium/NativeMessagingHosts/`. Manifest template: `path` = absolute path to wrapper, `allowed_origins` = `["chrome-extension://<EXTENSION_ID>/"]`.
- **install.ps1** (Windows): Params: `-SourceDir`, `-ExtensionId`, `-Browser`. Install dir: `%LOCALAPPDATA%\Hoverboard`. Copies `native_host.exe` and helper scripts. Writes manifest to install dir; creates registry key `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.hoverboard.native_host` (or Chromium) with default value = full path to manifest file.

## Traceability

- **Architecture**: [ARCH-NATIVE_HOST](../architecture-decisions/ARCH-NATIVE_HOST.md)
- **Requirements**: [REQ-NATIVE_HOST_WRAPPER](../requirements/REQ-NATIVE_HOST_WRAPPER.md)
- **Code**: `native_host/install.sh`, `native_host/install.ps1`, `native_host/com.hoverboard.native_host.json.template`
