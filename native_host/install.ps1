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
