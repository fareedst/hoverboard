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
# [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] Install native host and manifest for Windows.
# Usage: .\install.ps1 [-SourceDir <path>] [-ExtensionId <id>] [-Browser chrome|chromium]
param(
  [string]$SourceDir = $PSScriptRoot,
  [string]$ExtensionId = "",
  [ValidateSet("chrome", "chromium")]
  [string]$Browser = "chrome"
)

if (-not $ExtensionId) {
  $ExtensionId = Read-Host "Enter the extension ID (from chrome://extensions)"
}
if (-not $ExtensionId) {
  Write-Error "Extension ID is required."
  exit 1
}

$InstallDir = Join-Path $env:LOCALAPPDATA "Hoverboard"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$WrapperName = "native_host.exe"
$WrapperPath = Join-Path $SourceDir $WrapperName
if (-not (Test-Path $WrapperPath)) {
  $WrapperPath = Join-Path $SourceDir "native_host_windows_amd64.exe"
  if (-not (Test-Path $WrapperPath)) {
    Write-Error "Wrapper binary not found in $SourceDir. Build with: go build -o native_host.exe ."
    exit 1
  }
}

Copy-Item -Path $WrapperPath -Destination (Join-Path $InstallDir "native_host.exe") -Force
$DestWrapper = (Resolve-Path (Join-Path $InstallDir "native_host.exe")).Path

if (Test-Path (Join-Path $SourceDir "helper.sh")) {
  Copy-Item (Join-Path $SourceDir "helper.sh") (Join-Path $InstallDir "helper.sh") -Force
}
if (Test-Path (Join-Path $SourceDir "helper.ps1")) {
  Copy-Item (Join-Path $SourceDir "helper.ps1") (Join-Path $InstallDir "helper.ps1") -Force
}

$AllowedOrigins = "[\"chrome-extension://$ExtensionId/\"]"

switch ($Browser) {
  "chrome"   { $ManifestDir = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data\NativeMessagingHosts" }
  "chromium" { $ManifestDir = Join-Path $env:LOCALAPPDATA "Chromium\User Data\NativeMessagingHosts" }
}
New-Item -ItemType Directory -Force -Path $ManifestDir | Out-Null
$ManifestFile = Join-Path $ManifestDir "com.hoverboard.native_host.json"

# Chrome on Windows looks up manifest path via registry; manifest can live next to binary.
# Per Chrome docs: registry key default value = full path to manifest file.
# So we write manifest to InstallDir and point registry to it.
$ManifestPath = Join-Path $InstallDir "com.hoverboard.native_host.json"

$manifest = @"
{
  "name": "com.hoverboard.native_host",
  "description": "Hoverboard native messaging host (wrapper)",
  "path": "$(($DestWrapper -replace '\\', '\\\\'))",
  "type": "stdio",
  "allowed_origins": $AllowedOrigins
}
"@
$manifest | Set-Content -Path $ManifestPath -Encoding UTF8

# Registry: HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.hoverboard.native_host
$regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts"
if ($Browser -eq "chromium") {
  $regPath = "HKCU:\Software\Chromium\NativeMessagingHosts"
}
New-Item -Path $regPath -Force | Out-Null
New-ItemProperty -Path "$regPath\com.hoverboard.native_host" -Name "(Default)" -Value $ManifestPath -PropertyType String -Force | Out-Null

Write-Host "Installed native host to $InstallDir"
Write-Host "Manifest: $ManifestPath"
Write-Host "Registry: $regPath\com.hoverboard.native_host"
Write-Host "Restart Chrome if it was running."
