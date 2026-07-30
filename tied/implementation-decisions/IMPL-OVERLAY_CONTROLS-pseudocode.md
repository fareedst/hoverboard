# [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_CONTROL_LAYOUT]
# Close and refresh buttons with fixed position, 24px min touch target, ARIA, theme vars.
# Contract: parent and theme and callback; control elements and styles.
INPUT: parent element; theme CSS variables; callback (close/refresh)
OUTPUT: control elements with fixed position, min 24px touch target, ARIA, keyboard handlers
DATA: inline styles (position absolute); theme vars for colors; ARIA labels/roles

# Create close button with position, size, ARIA, theme, click and Escape handler.
# Layout contract [ARCH-OVERLAY]/[ARCH-OVERLAY_CONTROLS]: Close at top/right 8/8 (px from edges).
createCloseButton():
  CREATE button; SET position top 8px right 8px, size (min 24px); SET aria-label
  APPLY theme vars; ATTACH click -> callback; ATTACH key (Escape)
  RETURN element

# Create refresh button with position, size, ARIA, theme, click handler.
# Layout contract [ARCH-OVERLAY]/[ARCH-OVERLAY_CONTROLS]: Refresh at top/right 8/40 (px from edges).
createRefreshButton():
  CREATE button; SET position top 8px right 40px, size; SET aria-label
  APPLY theme vars; ATTACH click -> callback
  RETURN element
