# [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — truncate, normalizeText, escapeHtml for UI and user input. Contract: string and optional maxLen; truncated/normalized/escaped string.

## TRUNCATE

- [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements truncate(str, maxLen) behavior for IMPL-TEXT_UTILITIES.
- Contract:
  - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: string (truncated, normalized, or HTML-escaped)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ellipsis string (e.g. "…")
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: TRUNCATE
  - IF str.length <= maxLen RETURN str
  - RETURN str.slice(0, maxLen) + ellipsis
  - How (sub-block): Trim and collapse whitespace; normalize Unicode.

## NORMALIZE_TEXT

- [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements normalizeText(str) behavior for IMPL-TEXT_UTILITIES.
- Contract:
  - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: string (truncated, normalized, or HTML-escaped)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ellipsis string (e.g. "…")
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: NORMALIZE_TEXT
  - NORMALIZE whitespace and Unicode (e.g. trim, collapse spaces) for display or comparison
  - RETURN normalized string
  - How (sub-block): Encode <, >, &, " for safe textContent/attribute use.

## ESCAPE_HTML

- [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements escapeHtml(str) behavior for IMPL-TEXT_UTILITIES.
- Contract:
  - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: string (truncated, normalized, or HTML-escaped)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ellipsis string (e.g. "…")
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: ESCAPE_HTML
  - ENCODE characters that are significant in HTML (e.g. <, >, &, ") so string is safe for textContent or attribute use
  - RETURN encoded string

## SHARED_UTILITIES_COMPOSITION

- [IMPL-TEXT_UTILITIES] [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Keeps text normalization available to the shared URL and array/object utility composition without mutating caller data.
- Contract:
  - INPUT: text or URL value and shared helper module
  - PRE: text helper functions are available
  - OUTPUT: normalized text value consumed by a shared utility
  - POST:
    - success => normalized output is deterministic and source input is unchanged
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: SHARED_UTILITIES_COMPOSITION
  - Receive text value
  - NORMALIZE text
  - RETURN normalized value to the composing utility
