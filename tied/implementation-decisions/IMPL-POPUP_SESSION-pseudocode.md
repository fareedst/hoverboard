# [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION]
# PopupController handlers await messages; StateManager and UIManager updates; no window.close.
# Contract: user actions and GET_OVERLAY_STATE; popup open and state/UI in sync.
INPUT: user actions (show overlay, toggle private, save, etc.); GET_OVERLAY_STATE fallback
OUTPUT: popup stays open; state and UI updated; no window.close
DATA: StateManager (overlay visible, bookmark, etc.); UIManager (button states, labels)

# Await message; update state and UI; inline notification; do not close.
PopupController handler (e.g. handleShowHoverboard):
  AWAIT send message (e.g. TOGGLE_OVERLAY)
  StateManager.update(...); UIManager.updateShowHoverButtonState(...)
  INLINE notification if needed; DO NOT call window.close

# On open sync overlay state to StateManager and UIManager.
ON popup open: SEND GET_OVERLAY_STATE; SYNC state to StateManager and UIManager
