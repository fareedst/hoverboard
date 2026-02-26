/**
 * [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS]
 * Unit tests: KeyboardManager shortcuts for quick access (openTagsTree, openOptions, openBookmarksIndex, openBrowserBookmarkImport).
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
