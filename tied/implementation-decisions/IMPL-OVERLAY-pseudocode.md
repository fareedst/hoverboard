# [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [REQ-OVERLAY_REFRESH_ACTION]
# Overlay show/hide, DOM injection, close/refresh controls, auto-show.
# Contract: show/hide and auto-show and theme; overlay state and controls.
INPUT: show/hide command; optional auto-show condition; theme vars
OUTPUT: overlay visible/hidden; DOM injected; controls (close, refresh) created
DATA: overlay root element; content container; control elements; visibility state

# Create/inject root; apply theme and content; attach close/refresh; set visible.
show():
  CREATE overlay root (or reuse); INJECT into document body
  APPLY theme CSS variables; RENDER content (bookmark form, etc.)
  createCloseButton(); createRefreshButton(); ATTACH handlers
  SET visibility = true

# Remove overlay or hide; set visibility false.
hide():
  REMOVE overlay from DOM (or set display none); SET visibility = false

# Show when message or storage condition met.
Auto-show: IF condition (e.g. message or storage): show()
