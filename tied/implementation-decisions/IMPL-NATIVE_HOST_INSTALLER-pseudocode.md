# [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] — Copy wrapper and helper to install dir; write manifest; register with Chrome/Chromium. Contract: source dir and extension ID and browser; install dir and registration.

## MAIN

- [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] How: Logical block for IMPL-NATIVE_HOST_INSTALLER.
- Contract:
  - INPUT: source dir, extension ID, browser (e.g. chrome vs chromium)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: install dir with binary and manifest; browser registration so extension can connect
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: install dir (e.g. ~/.hoverboard or %LOCALAPPDATA%\Hoverboard); manifest path; allowed_origins = [chrome-extension://<EXTENSION_ID>/]
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Parse args; copy binary and helper; fill manifest; write to NativeMessagingHosts dir.
  - 1. install_sh (macOS/Linux):
  - 2.   PARSE args [SOURCE_DIR] [EXTENSION_ID] [BROWSER]
  - 3.   DETERMINE install_dir (e.g. ~/.hoverboard)
  - 4.   COPY native_host binary (or platform-named) and helper.sh to install_dir
  - 5.   FILL manifest template: path = absolute path to wrapper, allowed_origins = [chrome-extension://<EXTENSION_ID>/]
  - 6.   WRITE manifest to browser NativeMessagingHosts dir (Chrome: ~/Library/Application Support/... or ~/.config/google-chrome/...; Chromium: ~/.config/chromium/...)
  - How (sub-block): Parse params; copy exe and helper; write manifest; create registry key for host path.
  - 7. install_ps1 (Windows):
  - 8.   PARSE params -SourceDir, -ExtensionId, -Browser
  - 9.   DETERMINE install_dir (%LOCALAPPDATA%\Hoverboard)
  - 10.   COPY native_host.exe and helper.ps1 (or helper.exe) to install_dir
  - 11.   WRITE manifest to install_dir
  - 12.   CREATE registry key HKCU\Software\Google\Chrome\NativeMessagingHosts\com.hoverboard.native_host (or Chromium) with default value = full path to manifest
