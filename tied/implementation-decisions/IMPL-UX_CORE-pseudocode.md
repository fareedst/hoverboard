# [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-CORE_UX_PRESERVATION] [REQ-POPUP_PERSISTENT_SESSION]
# How: preserve multi-action popup/overlay workflows; popup session stays open across successive actions.
INPUT: popup/overlay user actions (save, tag, toggle, refresh); session lifecycle events
OUTPUT: UI remains usable for chained actions; no forced auto-close after success; core overlay/popup behaviors retained
DATA: PopupController; UIManager; overlay-manager; ARCH-POPUP_SESSION / IMPL-POPUP_SESSION composition

# [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-POPUP_PERSISTENT_SESSION]
# How: after action success, refresh live data in place instead of closing the popup.
HANDLE_POPUP_ACTION(action):
  result = AWAIT dispatch(action)
  IF result.ok: REFRESH_POPUP_STATE(); KEEP popup open
  ELSE: SHOW error; KEEP popup open
  RETURN result

# How: overlay continues to support close/refresh/tag without regressing core show/hide UX.
PRESERVE_OVERLAY_CORE:
  SHOW/HIDE overlay per config and site policy
  RETAIN close and refresh controls (IMPL-OVERLAY_CONTROLS)
  RETURN
