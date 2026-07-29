# [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER]
# Copy wrapper and helper to install dir; write manifest; register with Chrome/Chromium.
# Contract: source dir and extension ID and browser; install dir and registration.
INPUT: source dir, extension ID, browser (e.g. chrome vs chromium)
OUTPUT: install dir with binary and manifest; browser registration so extension can connect
DATA: install dir (e.g. ~/.hoverboard or %LOCALAPPDATA%\Hoverboard); manifest path; allowed_origins = [chrome-extension://<EXTENSION_ID>/]

# Parse args; copy binary and helper; fill manifest; write to NativeMessagingHosts dir.
install_sh (macOS/Linux):
  PARSE args [SOURCE_DIR] [EXTENSION_ID] [BROWSER]
  DETERMINE install_dir (e.g. ~/.hoverboard)
  COPY native_host binary (or platform-named) and helper.sh to install_dir
  FILL manifest template: path = absolute path to wrapper, allowed_origins = [chrome-extension://<EXTENSION_ID>/]
  WRITE manifest to browser NativeMessagingHosts dir (Chrome: ~/Library/Application Support/... or ~/.config/google-chrome/...; Chromium: ~/.config/chromium/...)

# Parse params; copy exe and helper; write manifest; create registry key for host path.
install_ps1 (Windows):
  PARSE params -SourceDir, -ExtensionId, -Browser
  DETERMINE install_dir (%LOCALAPPDATA%\Hoverboard)
  COPY native_host.exe and helper.ps1 (or helper.exe) to install_dir
  WRITE manifest to install_dir
  CREATE registry key HKCU\Software\Google\Chrome\NativeMessagingHosts\com.hoverboard.native_host (or Chromium) with default value = full path to manifest
