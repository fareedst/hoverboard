# [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_CONTROL_LAYOUT] — Close and refresh buttons with fixed position, 24px min touch target, ARIA, theme vars. Contract: parent and theme and callback; control elements and styles.

## CREATE_CLOSE_BUTTON

- Layout contract [ARCH-OVERLAY]/[ARCH-OVERLAY_CONTROLS]: Close at top/right 8/8 (px from edges). How: Implements createCloseButton() behavior for IMPL-OVERLAY_CONTROLS.
- Contract:
  - INPUT: parent element; theme CSS variables; callback (close/refresh)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: control elements with fixed position, min 24px touch target, ARIA, keyboard handlers
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: inline styles (position absolute); theme vars for colors; ARIA labels/roles
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: CREATE_CLOSE_BUTTON
  - CREATE button; SET position top 8px right 8px, size (min 24px); SET aria-label
  - APPLY theme vars; ATTACH click -> callback; ATTACH key (Escape)
  - RETURN element
  - How (sub-block): Create refresh button with position, size, ARIA, theme, click handler.

## CREATE_REFRESH_BUTTON

- Layout contract [ARCH-OVERLAY]/[ARCH-OVERLAY_CONTROLS]: Refresh at top/right 8/40 (px from edges). How: Implements createRefreshButton() behavior for IMPL-OVERLAY_CONTROLS.
- Contract:
  - INPUT: parent element; theme CSS variables; callback (close/refresh)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: control elements with fixed position, min 24px touch target, ARIA, keyboard handlers
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: inline styles (position absolute); theme vars for colors; ARIA labels/roles
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: CREATE_REFRESH_BUTTON
  - CREATE button; SET position top 8px right 40px, size; SET aria-label
  - APPLY theme vars; ATTACH click -> callback
  - RETURN element
