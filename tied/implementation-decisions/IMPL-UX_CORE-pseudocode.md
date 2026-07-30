# [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-CORE_UX_PRESERVATION] [REQ-POPUP_PERSISTENT_SESSION] — How: preserve multi-action popup/overlay workflows; popup session stays open across successive actions.

## HANDLE_POPUP_ACTION

- [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-POPUP_PERSISTENT_SESSION] How: after action success, refresh live data in place instead of closing the popup.
- Contract:
  - INPUT: popup/overlay user actions (save, tag, toggle, refresh); session lifecycle events
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: UI remains usable for chained actions; no forced auto-close after success; core overlay/popup behaviors retained | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: PopupController; UIManager; overlay-manager; ARCH-POPUP_SESSION / IMPL-POPUP_SESSION composition
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: HANDLE_POPUP_ACTION
  - result = AWAIT dispatch(action)
  - IF result.ok: REFRESH_POPUP_STATE(); KEEP popup open
  - ELSE: SHOW error; KEEP popup open
  - RETURN result
  - How (sub-block): How: overlay continues to support close/refresh/tag without regressing core show/hide UX.

## PRESERVE_OVERLAY_CORE

- [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-CORE_UX_PRESERVATION] [REQ-POPUP_PERSISTENT_SESSION] How: Implements PRESERVE_OVERLAY_CORE behavior for IMPL-UX_CORE.
- Contract:
  - INPUT: popup/overlay user actions (save, tag, toggle, refresh); session lifecycle events
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: UI remains usable for chained actions; no forced auto-close after success; core overlay/popup behaviors retained
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: PopupController; UIManager; overlay-manager; ARCH-POPUP_SESSION / IMPL-POPUP_SESSION composition
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: PRESERVE_OVERLAY_CORE
  - SHOW/HIDE overlay per config and site policy
  - RETAIN close and refresh controls (IMPL-OVERLAY_CONTROLS)
  - RETURN
