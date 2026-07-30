# [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] — PopupController handlers await messages; StateManager and UIManager updates; no window.close. Contract: user actions and GET_OVERLAY_STATE; popup open and state/UI in sync.

## MAIN

- [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] How: Logical block for IMPL-POPUP_SESSION.
- Contract:
  - INPUT: user actions (show overlay, toggle private, save, etc.); GET_OVERLAY_STATE fallback
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: popup stays open; state and UI updated; no window.close
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: StateManager (overlay visible, bookmark, etc.); UIManager (button states, labels)
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Await message; update state and UI; inline notification; do not close.
  - 1. PopupController handler (e.g. handleShowHoverboard):
  - 2.   AWAIT send message (e.g. TOGGLE_OVERLAY)
  - 3.   StateManager.update(...); UIManager.updateShowHoverButtonState(...)
  - 4.   INLINE notification if needed; DO NOT call window.close
  - How (sub-block): On open sync overlay state to StateManager and UIManager.
  - 5. ON popup open: SEND GET_OVERLAY_STATE; SYNC state to StateManager and UIManager
