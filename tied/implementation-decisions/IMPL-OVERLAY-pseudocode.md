# [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [REQ-OVERLAY_REFRESH_ACTION] — Overlay show/hide, DOM injection, close/refresh controls, auto-show. Contract: show/hide and auto-show and theme; overlay state and controls.

## SHOW

- [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [REQ-OVERLAY_REFRESH_ACTION] How: Implements show() behavior for IMPL-OVERLAY.
- Contract:
  - INPUT: show/hide command; optional auto-show condition; theme vars
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: overlay visible/hidden; DOM injected; controls (close, refresh) created
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: overlay root element; content container; control elements; visibility state
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: SHOW
  - CREATE overlay root (or reuse); INJECT into document body
  - APPLY theme CSS variables; RENDER content (bookmark form, etc.)
  - createCloseButton(); createRefreshButton(); ATTACH handlers
  - SET visibility = true
  - How (sub-block): Remove overlay or hide; set visibility false.

## HIDE

- [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [REQ-OVERLAY_REFRESH_ACTION] How: Implements hide() behavior for IMPL-OVERLAY.
- Contract:
  - INPUT: show/hide command; optional auto-show condition; theme vars
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: overlay visible/hidden; DOM injected; controls (close, refresh) created
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: overlay root element; content container; control elements; visibility state
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: HIDE
  - REMOVE overlay from DOM (or set display none); SET visibility = false
  - How (sub-block): Show when message or storage condition met.
  - 1. Auto-show: IF condition (e.g. message or storage): show()

## OVERLAY_REFRESH_COMPOSITION

- [IMPL-OVERLAY] [IMPL-OVERLAY_CONTROLS] [IMPL-OVERLAY_TEST_HARNESS] [ARCH-OVERLAY] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_CONTROL_LAYOUT] How: Connects OverlayManager.show to refresh-control creation, message retrieval, and a second overlay render in the deterministic DOM harness.
- Contract:
  - INPUT: overlay content, refresh control, message service, DOM harness
  - PRE: overlay manager and message service are initialized
  - OUTPUT: refreshed overlay content and visible control state
  - POST:
    - success => refresh sends getCurrentBookmark and renders the returned bookmark
  - FAILURE_MODES: BookmarkRefreshFailed
  - DATA: overlay DOM and current bookmark snapshot
  - DATA_TRANSITION: refreshed bookmark replaces the displayed content while visibility remains true
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: OVERLAY_REFRESH_COMPOSITION
  - SHOW overlay with initial bookmark
  - CREATE refresh control
  - ON refresh click: SEND getCurrentBookmark through message service
  - AWAIT response
  - SHOW overlay with refreshed bookmark
