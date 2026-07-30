#!/usr/bin/env sh
# === IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_INSTALLER ===
# [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] — Copy wrapper and helper to install dir; write manifest; register with Chrome/Chromium. Contract: source dir and extension ID and browser; install dir and registration.
# 
# ## MAIN
# 
# - [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] How: Logical block for IMPL-NATIVE_HOST_INSTALLER.
# - Contract:
#   - INPUT: source dir, extension ID, browser (e.g. chrome vs chromium)
#   - PRE: caller supplies valid inputs for this block; dependencies wired
#   - OUTPUT: install dir with binary and manifest; browser registration so extension can connect
#   - POST:
#     - success => block outputs match OUTPUT shape
#   - DATA: install dir (e.g. ~/.hoverboard or %LOCALAPPDATA%\Hoverboard); manifest path; allowed_origins = [chrome-extension://<EXTENSION_ID>/]
#   - EFFECTS: IO
#   - TERMINATION: total
# - PROCEDURE: MAIN
#   - How (sub-block): Parse args; copy binary and helper; fill manifest; write to NativeMessagingHosts dir.
#   - 1. install_sh (macOS/Linux):
#   - 2.   PARSE args [SOURCE_DIR] [EXTENSION_ID] [BROWSER]
#   - 3.   DETERMINE install_dir (e.g. ~/.hoverboard)
#   - 4.   COPY native_host binary (or platform-named) and helper.sh to install_dir
#   - 5.   FILL manifest template: path = absolute path to wrapper, allowed_origins = [chrome-extension://<EXTENSION_ID>/]
#   - 6.   WRITE manifest to browser NativeMessagingHosts dir (Chrome: ~/Library/Application Support/... or ~/.config/google-chrome/...; Chromium: ~/.config/chromium/...)
#   - How (sub-block): Parse params; copy exe and helper; write manifest; create registry key for host path.
#   - 7. install_ps1 (Windows):
#   - 8.   PARSE params -SourceDir, -ExtensionId, -Browser
#   - 9.   DETERMINE install_dir (%LOCALAPPDATA%\Hoverboard)
#   - 10.   COPY native_host.exe and helper.ps1 (or helper.exe) to install_dir
#   - 11.   WRITE manifest to install_dir
#   - 12.   CREATE registry key HKCU\Software\Google\Chrome\NativeMessagingHosts\com.hoverboard.native_host (or Chromium) with default value = full path to manifest
# 
# === END IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_INSTALLER ===
# [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] Install native host and manifest for macOS/Linux.
# Usage: ./install.sh [SOURCE_DIR] [EXTENSION_ID] [BROWSER]
#   SOURCE_DIR: dir containing native_host binary and helper scripts (default: script dir)
#   EXTENSION_ID: e.g. from chrome://extensions (default: prompt)
#   BROWSER: chrome or chromium (default: chrome)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="${1:-$SCRIPT_DIR}"
EXTENSION_ID="${2}"
BROWSER="${3:-chrome}"

if [ -z "$EXTENSION_ID" ]; then
  echo "Enter the extension ID (from chrome://extensions, e.g. knldjmfmopnpolahpmmgbagdohdnhkik):"
  read -r EXTENSION_ID
fi

if [ -z "$EXTENSION_ID" ]; then
  echo "ERROR: Extension ID is required." >&2
  exit 1
fi

# Install directory: user-level so no sudo
INSTALL_DIR="${HOME}/.hoverboard"
mkdir -p "$INSTALL_DIR"

# Detect wrapper binary name (native_host or native_host.exe not used on Unix)
WRAPPER_NAME="native_host"
if [ ! -f "$SOURCE_DIR/$WRAPPER_NAME" ]; then
  # Try platform-specific name from build
  case "$(uname -s)" in
    Darwin)  WRAPPER_NAME="native_host_darwin_arm64" ;;
    Linux)   WRAPPER_NAME="native_host_linux_amd64" ;;
    *)       WRAPPER_NAME="native_host" ;;
  esac
  if [ "$(uname -m)" = "x86_64" ] && [ -f "$SOURCE_DIR/native_host_darwin_amd64" ]; then
    WRAPPER_NAME="native_host_darwin_amd64"
  fi
fi

if [ ! -f "$SOURCE_DIR/$WRAPPER_NAME" ]; then
  echo "ERROR: Wrapper binary not found in $SOURCE_DIR (looked for $WRAPPER_NAME). Build with: go build -o native_host ." >&2
  exit 1
fi

echo "DEBUG: Installing from $SOURCE_DIR to $INSTALL_DIR"
cp "$SOURCE_DIR/$WRAPPER_NAME" "$INSTALL_DIR/native_host"
chmod +x "$INSTALL_DIR/native_host"

[ -f "$SOURCE_DIR/helper.sh" ] && cp "$SOURCE_DIR/helper.sh" "$INSTALL_DIR/helper.sh" && chmod +x "$INSTALL_DIR/helper.sh"
[ -f "$SOURCE_DIR/helper.ps1" ] && cp "$SOURCE_DIR/helper.ps1" "$INSTALL_DIR/helper.ps1"

WRAPPER_PATH="$INSTALL_DIR/native_host"
# macOS paths must be absolute
WRAPPER_PATH="$(cd "$INSTALL_DIR" && pwd)/native_host"

ALLOWED_ORIGINS="[\"chrome-extension://${EXTENSION_ID}/\"]"

case "$(uname -s)" in
  Darwin)
    case "$BROWSER" in
      chrome)  MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts" ;;
      chromium) MANIFEST_DIR="$HOME/Library/Application Support/Chromium/NativeMessagingHosts" ;;
      *)       MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts" ;;
    esac
    ;;
  Linux)
    case "$BROWSER" in
      chrome)  MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts" ;;
      chromium) MANIFEST_DIR="$HOME/.config/chromium/NativeMessagingHosts" ;;
      *)       MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts" ;;
    esac
    ;;
  *)
    echo "ERROR: Unsupported OS" >&2
    exit 1
    ;;
esac

mkdir -p "$MANIFEST_DIR"
MANIFEST_FILE="$MANIFEST_DIR/com.hoverboard.native_host.json"

if [ -f "$SOURCE_DIR/com.hoverboard.native_host.json.template" ]; then
  sed -e "s|{{PATH}}|$WRAPPER_PATH|g" -e "s|{{ALLOWED_ORIGINS}}|$ALLOWED_ORIGINS|g" \
    "$SOURCE_DIR/com.hoverboard.native_host.json.template" > "$MANIFEST_FILE"
else
  cat > "$MANIFEST_FILE" << EOF
{
  "name": "com.hoverboard.native_host",
  "description": "Hoverboard native messaging host (wrapper)",
  "path": "$WRAPPER_PATH",
  "type": "stdio",
  "allowed_origins": $ALLOWED_ORIGINS
}
EOF
fi

echo "Installed native host to $INSTALL_DIR"
echo "Manifest written to $MANIFEST_FILE"
echo "Restart Chrome/Chromium if it was running."
