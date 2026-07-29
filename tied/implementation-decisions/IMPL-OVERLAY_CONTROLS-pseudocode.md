# [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_CONTROL_LAYOUT]
# Close and refresh buttons with fixed position, 24px min touch target, ARIA, theme vars.
# Contract: parent and theme and callback; control elements and styles.
INPUT: parent element; theme CSS variables; callback (close/refresh)
OUTPUT: control elements with fixed position, min 24px touch target, ARIA, keyboard handlers
DATA: inline styles (position absolute); theme vars for colors; ARIA labels/roles

# Create close button with position, size, ARIA, theme, click and Escape handler.
createCloseButton():
  CREATE button; SET position, size (min 24px); SET aria-label
  APPLY theme vars; ATTACH click -> callback; ATTACH key (Escape)
  RETURN element

# Create refresh button with position, size, ARIA, theme, click handler.
createRefreshButton():
  CREATE button; SET position, size; SET aria-label
  APPLY theme vars; ATTACH click -> callback
  RETURN element
