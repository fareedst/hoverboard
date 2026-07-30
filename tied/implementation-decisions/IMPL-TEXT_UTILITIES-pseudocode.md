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
