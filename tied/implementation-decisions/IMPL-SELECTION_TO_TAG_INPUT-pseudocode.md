# [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] — Prefill tag input from page selection on popup open; GET_PAGE_SELECTION and normalizeSelectionForTagInput. Contract: selection via message; tag input prefilled.

## NORMALIZE_SELECTION_FOR_TAG_INPUT

- [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] How: Implements normalizeSelectionForTagInput(selection, maxWords) behavior for IMPL-SELECTION_TO_TAG_INPUT.
- Contract:
  - INPUT: none at popup open (selection read from page via message); raw selection string (normalizeSelectionForTagInput)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: tag input field prefilled with normalized words (side effect) | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: current tab; newTagInput element; maxWords = 8
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: NORMALIZE_SELECTION_FOR_TAG_INPUT
  - text = replace non-word non-space chars with space in selection
  - text = collapse spaces, trim
  - words = split text on whitespace
  - RETURN first maxWords words joined by space
  - How (sub-block): Request selection; if present set tag input to normalized value.
  - 1. popup loadInitialData (after loadSuggestedTags or loadRecentTags):
  - TRY response = sendToTab(GET_PAGE_SELECTION)
  - ON timeout or failure LEAVE tag input unchanged, RETURN
  - raw = response.data.selection
  - IF raw non-empty:
  - normalized = normalizeSelectionForTagInput(raw, 8)
  - setTagInputValue(normalized)
