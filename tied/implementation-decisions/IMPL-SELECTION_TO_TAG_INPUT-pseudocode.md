# [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT]
# Prefill tag input from page selection on popup open; GET_PAGE_SELECTION and normalizeSelectionForTagInput.
# Contract: selection via message; tag input prefilled.
INPUT: none at popup open (selection read from page via message); raw selection string (normalizeSelectionForTagInput)
OUTPUT: tag input field prefilled with normalized words (side effect)
DATA: current tab; newTagInput element; maxWords = 8

# Return current selection from page.
content script on GET_PAGE_SELECTION:
  selection = window.getSelection().toString()
  RETURN { success: true, data: { selection } }

# Strip punctuation, collapse spaces, first maxWords words.
normalizeSelectionForTagInput(selection, maxWords):
  text = replace non-word non-space chars with space in selection
  text = collapse spaces, trim
  words = split text on whitespace
  RETURN first maxWords words joined by space

# Request selection; if present set tag input to normalized value.
popup loadInitialData (after loadSuggestedTags or loadRecentTags):
  TRY response = sendToTab(GET_PAGE_SELECTION)
  ON timeout or failure LEAVE tag input unchanged, RETURN
  raw = response.data.selection
  IF raw non-empty:
    normalized = normalizeSelectionForTagInput(raw, 8)
    setTagInputValue(normalized)
