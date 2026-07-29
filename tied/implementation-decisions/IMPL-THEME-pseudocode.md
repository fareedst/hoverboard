# [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME]
# How: default dark theme with user toggle; persist preference and apply to popup/overlay CSS.
INPUT: theme preference from ConfigManager; UI theme toggle events
OUTPUT: data-theme / CSS class applied on popup and overlay; persisted preference
DATA: ConfigManager theme keys; popup.css; overlay-styles.css; dark-theme-default tests

# [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME]
# How: on UI bootstrap load preference (default dark); apply; on toggle persist and re-apply.
APPLY_THEME(root):
  pref = AWAIT configManager.getTheme() OR "dark"
  SET root dataset/class to pref
  RETURN pref

TOGGLE_THEME(root):
  next = opposite of APPLY_THEME(root)
  AWAIT configManager.setTheme(next)
  APPLY_THEME(root)
  RETURN next
