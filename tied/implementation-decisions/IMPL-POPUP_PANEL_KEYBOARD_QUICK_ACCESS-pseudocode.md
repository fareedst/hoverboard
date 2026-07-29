# [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY]
# This block defines in-popup and in-panel keyboard shortcuts. Implements REQ "keyboard shortcuts when popup or side panel has focus"; implements ARCH by reusing UI event flow (emit → PopupController handlers).
INPUT: user focuses popup or side panel Bookmark tab; user presses Ctrl+Shift+B/O/M/I
OUTPUT: same as footer button click (side panel opens, options opens, bookmarks index tab, or import tab)

# [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS]
# KeyboardManager shortcuts: add four entries so handleKeyDown finds handler and calls emit; PopupController already listens for openTagsTree, openOptions, openBookmarksIndex, openBrowserBookmarkImport. Implements REQ "in-popup/panel shortcuts".
KeyboardManager constructor shortcuts:
  "Ctrl+Shift+KeyB": () => this.uiManager.emit('openTagsTree')
  "Ctrl+Shift+KeyO": () => this.uiManager.emit('openOptions')
  "Ctrl+Shift+KeyM": () => this.uiManager.emit('openBookmarksIndex')
  "Ctrl+Shift+KeyI": () => this.uiManager.emit('openBrowserBookmarkImport')

# [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS]
# Side panel Bookmark tab: enable keyboard and setup so panel has same shortcuts. Implements REQ "when popup or side panel has focus".
initBookmarkTab() (side-panel.js):
  popupComponents = popup({ ..., enableKeyboard: true, ... })
  ...
  popupComponents.uiManager.setupEventListeners()
  IF popupComponents.keyboardManager THEN popupComponents.keyboardManager.setupKeyboardNavigation()
