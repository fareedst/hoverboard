# [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] — How: default dark theme with user toggle; persist preference and apply to popup/overlay CSS.

## APPLY_THEME

- [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] How: on UI bootstrap load preference (default dark); apply; on toggle persist and re-apply.
- Contract:
  - INPUT: theme preference from ConfigManager; UI theme toggle events
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: data-theme / CSS class applied on popup and overlay; persisted preference
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ConfigManager theme keys; popup.css; overlay-styles.css; dark-theme-default tests
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: APPLY_THEME
  - pref = AWAIT configManager.getTheme() OR "dark"
  - SET root dataset/class to pref
  - RETURN pref

## TOGGLE_THEME

- [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] How: Implements TOGGLE_THEME(root) behavior for IMPL-THEME.
- Contract:
  - INPUT: theme preference from ConfigManager; UI theme toggle events
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: data-theme / CSS class applied on popup and overlay; persisted preference
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ConfigManager theme keys; popup.css; overlay-styles.css; dark-theme-default tests
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: TOGGLE_THEME
  - next = opposite of APPLY_THEME(root)
  - AWAIT configManager.setTheme(next)
  - APPLY_THEME(root)
  - RETURN next
