# [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] [IMPL-FILE_STORAGE_TYPED_PATH]
# Read JSON from stdin; handle bookmark and page-archive files with path; else echo back.
# Path: directory (we use sibling Hoverboard JSON files) or full path if ends with .json.
# Expands ~ to $env:USERPROFILE.

$json = [Console]::In.ReadToEnd()
try {
  $obj = $json | ConvertFrom-Json
  $type = if ($obj.PSObject.Properties['type']) { $obj.type } else { $null }
  $path = if ($obj.PSObject.Properties['path']) { $obj.path } else { $null }

  function Expand-TildePath($p) {
    if (-not $p) { return $null }
    $p = $p.Trim()
    if ($p -eq '~') { return $env:USERPROFILE }
    if ($p.StartsWith('~/') -or $p.StartsWith('~\')) {
      return Join-Path $env:USERPROFILE ($p.Substring(2) -replace '/', [IO.Path]::DirectorySeparatorChar)
    }
    return $p
  }

  function Resolve-FilePath($p) {
    $expanded = Expand-TildePath $p
    if (-not $expanded) { return $null }
    if ($expanded.EndsWith('.json')) { return $expanded }
    $dir = $expanded.TrimEnd([IO.Path]::DirectorySeparatorChar, '/')
    return Join-Path $dir 'hoverboard-bookmarks.json'
  }

  function Resolve-ArchiveFilePath($p) {
    $expanded = Expand-TildePath $p
    if (-not $expanded) { return $null }
    if ($expanded.EndsWith('.json')) { return $expanded }
    $dir = $expanded.TrimEnd([IO.Path]::DirectorySeparatorChar, '/')
    return Join-Path $dir 'hoverboard-page-archives.json'
  }

  if ($type -eq 'readBookmarksFile') {
    if (-not $path) {
      @{ type = 'error'; message = 'readBookmarksFile: path required' } | ConvertTo-Json -Compress
      exit 0
    }
    $file = Resolve-FilePath $path
    $defaultData = @{ version = 1; bookmarks = @{} }
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
      @{ type = 'readBookmarksFile'; data = $defaultData } | ConvertTo-Json -Compress -Depth 10
      exit 0
    }
    try {
      $raw = Get-Content -LiteralPath $file -Raw
      $dataObj = $raw | ConvertFrom-Json
      @{ type = 'readBookmarksFile'; data = $dataObj } | ConvertTo-Json -Compress -Depth 10
    } catch {
      @{ type = 'readBookmarksFile'; data = $defaultData } | ConvertTo-Json -Compress -Depth 10
    }
    exit 0
  }

  if ($type -eq 'writeBookmarksFile') {
    if (-not $path) {
      @{ type = 'error'; message = 'writeBookmarksFile: path required' } | ConvertTo-Json -Compress
      exit 0
    }
    $file = Resolve-FilePath $path
    $dir = [IO.Path]::GetDirectoryName($file)
    if (-not [string]::IsNullOrEmpty($dir) -and -not (Test-Path -LiteralPath $dir)) {
      New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $data = if ($obj.PSObject.Properties['data']) { $obj.data } else { @{ version = 1; bookmarks = @{} } }
    $data | ConvertTo-Json -Compress -Depth 10 | Set-Content -LiteralPath $file -Encoding UTF8
    @{ type = 'writeBookmarksFile'; success = $true } | ConvertTo-Json -Compress
    exit 0
  }

  if ($type -eq 'readArchiveFile') {
    if (-not $path) {
      @{ type = 'error'; message = 'readArchiveFile: path required' } | ConvertTo-Json -Compress
      exit 0
    }
    $file = Resolve-ArchiveFilePath $path
    $defaultData = @{ version = 1; archives = @{}; screenshots = @{} }
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
      @{ type = 'readArchiveFile'; data = $defaultData } | ConvertTo-Json -Compress -Depth 10
      exit 0
    }
    try {
      $raw = Get-Content -LiteralPath $file -Raw
      $dataObj = $raw | ConvertFrom-Json
      @{ type = 'readArchiveFile'; data = $dataObj } | ConvertTo-Json -Compress -Depth 10
    } catch {
      @{ type = 'readArchiveFile'; data = $defaultData } | ConvertTo-Json -Compress -Depth 10
    }
    exit 0
  }

  if ($type -eq 'writeArchiveFile') {
    if (-not $path) {
      @{ type = 'error'; message = 'writeArchiveFile: path required' } | ConvertTo-Json -Compress
      exit 0
    }
    $file = Resolve-ArchiveFilePath $path
    $dir = [IO.Path]::GetDirectoryName($file)
    if (-not [string]::IsNullOrEmpty($dir) -and -not (Test-Path -LiteralPath $dir)) {
      New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $data = if ($obj.PSObject.Properties['data']) { $obj.data } else { @{ version = 1; archives = @{}; screenshots = @{} } }
    $data | ConvertTo-Json -Compress -Depth 10 | Set-Content -LiteralPath $file -Encoding UTF8
    @{ type = 'writeArchiveFile'; success = $true } | ConvertTo-Json -Compress
    exit 0
  }

  if (-not $obj.PSObject.Properties['type']) { $obj | Add-Member -NotePropertyName type -NotePropertyValue 'echo' -Force }
  $obj | ConvertTo-Json -Compress -Depth 10
} catch {
  @{ type = 'echo'; payload = $json } | ConvertTo-Json -Compress
}
