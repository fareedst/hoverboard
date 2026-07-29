# [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
# truncate, normalizeText, escapeHtml for UI and user input.
# Contract: string and optional maxLen; truncated/normalized/escaped string.
INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
OUTPUT: string (truncated, normalized, or HTML-escaped)
DATA: ellipsis string (e.g. "…")

# Slice to maxLen and append ellipsis if longer.
truncate(str, maxLen):
  IF str.length <= maxLen RETURN str
  RETURN str.slice(0, maxLen) + ellipsis

# Trim and collapse whitespace; normalize Unicode.
normalizeText(str):
  NORMALIZE whitespace and Unicode (e.g. trim, collapse spaces) for display or comparison
  RETURN normalized string

# Encode <, >, &, " for safe textContent/attribute use.
escapeHtml(str):
  ENCODE characters that are significant in HTML (e.g. <, >, &, ") so string is safe for textContent or attribute use
  RETURN encoded string
