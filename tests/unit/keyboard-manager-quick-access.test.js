/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS ===
 * [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — This block defines in-popup and in-panel keyboard shortcuts. Implements REQ "keyboard shortcuts when popup or side panel has focus"; implements ARCH by reusing UI event flow (emit → PopupController handlers).
 * 
 * ## MAIN
 * 
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS] How: KeyboardManager shortcuts: add four entries so handleKeyDown finds handler and calls emit; PopupController already listens for openTagsTree, openOptions, openBookmarksIndex, openBrowserBookmarkImport. Implements REQ "in-popup/panel shortcuts". Side panel Bookmark tab: enable keyboard and setup so panel has same shortcuts. Implements REQ "when popup or side panel has focus".
 * - Contract:
 *   - INPUT: user focuses popup or side panel Bookmark tab; user presses Ctrl+Shift+B/O/M/I
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: same as footer button click (side panel opens, options opens, bookmarks index tab, or import tab)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. KeyboardManager constructor shortcuts:
 *   - 2.   "Ctrl+Shift+KeyB": () => this.uiManager.emit('openTagsTree')
 *   - 3.   "Ctrl+Shift+KeyO": () => this.uiManager.emit('openOptions')
 *   - 4.   "Ctrl+Shift+KeyM": () => this.uiManager.emit('openBookmarksIndex')
 *   - 5.   "Ctrl+Shift+KeyI": () => this.uiManager.emit('openBrowserBookmarkImport')
 *   - 6. initBookmarkTab() (side-panel.js):
 *   - 7.   popupComponents = popup({ ..., enableKeyboard: true, ... })
 *   - 8.   ...
 *   - 9.   popupComponents.uiManager.setupEventListeners()
 *   - 10.   IF popupComponents.keyboardManager THEN popupComponents.keyboardManager.setupKeyboardNavigation()
 * 
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS ===
 */
import { KeyboardManager } from '../../src/ui/popup/KeyboardManager.js'

describe('[REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS] KeyboardManager quick access shortcuts', () => {
  let uiManager
  let keyboardManager

  beforeEach(() => {
    uiManager = {
      emit: jest.fn(),
      toggleShortcutsHelp: jest.fn(),
      focusTagInput: jest.fn(),
      focusSearchInput: jest.fn()
    }
    keyboardManager = new KeyboardManager({ uiManager })
    keyboardManager.setupKeyboardNavigation()
  })

  afterEach(() => {
    document.removeEventListener('keydown', keyboardManager.handleKeyDown)
  })

  function dispatchKey (key, code, modifiers = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      code: code || key,
      ctrlKey: modifiers.ctrlKey ?? true,
      shiftKey: modifiers.shiftKey ?? true,
      metaKey: modifiers.metaKey ?? false,
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  test('Ctrl+Shift+KeyB emits openTagsTree', () => {
    dispatchKey('b', 'KeyB')
    expect(uiManager.emit).toHaveBeenCalledWith('openTagsTree')
  })

  test('Ctrl+Shift+KeyO emits openOptions', () => {
    dispatchKey('o', 'KeyO')
    expect(uiManager.emit).toHaveBeenCalledWith('openOptions')
  })

  test('Ctrl+Shift+KeyM emits openBookmarksIndex', () => {
    dispatchKey('m', 'KeyM')
    expect(uiManager.emit).toHaveBeenCalledWith('openBookmarksIndex')
  })

  test('Ctrl+Shift+KeyI emits openBrowserBookmarkImport', () => {
    dispatchKey('i', 'KeyI')
    expect(uiManager.emit).toHaveBeenCalledWith('openBrowserBookmarkImport')
  })
})
