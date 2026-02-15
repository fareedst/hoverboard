# [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] Minimal helper: read JSON from stdin, echo as JSON to stdout.
$json = [Console]::In.ReadToEnd()
try {
  $obj = $json | ConvertFrom-Json
  if (-not $obj.PSObject.Properties['type']) { $obj | Add-Member -NotePropertyName type -NotePropertyValue 'echo' -Force }
  $obj | ConvertTo-Json -Compress
} catch {
  @{ type = 'echo'; payload = $json } | ConvertTo-Json -Compress
}
