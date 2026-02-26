/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [IMPL-PLAYWRIGHT_E2E_EXTENSION]
 * Popup action → message type contract: openTagsTree → OPEN_SIDE_PANEL, saveBookmark types, etc.
 */

import { POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, MESSAGE_TYPES } from '../../src/shared/ui-action-contract.js'

describe('[IMPL-MESSAGE_HANDLING] Popup action to message type contract', () => {
  test('openTagsTree maps to OPEN_SIDE_PANEL [REQ-SIDE_PANEL_TAGS_TREE]', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.openTagsTree]).toBe(MESSAGE_TYPES.OPEN_SIDE_PANEL)
  })

  test('showHoverboard maps to TOGGLE_HOVER (sendToTab)', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.showHoverboard]).toBe(MESSAGE_TYPES.TOGGLE_HOVER)
  })

  test('deletePin maps to DELETE_BOOKMARK', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.deletePin]).toBe(MESSAGE_TYPES.DELETE_BOOKMARK)
  })

  test('addTag maps to SAVE_TAG', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.addTag]).toBe(MESSAGE_TYPES.SAVE_TAG)
  })

  test('storageBackendChange maps to MOVE_BOOKMARK_TO_STORAGE', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.storageBackendChange]).toBe(MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE)
  })

  test('every non-null POPUP_ACTION_TO_MESSAGE value is a string message type', () => {
    const values = Object.values(POPUP_ACTION_TO_MESSAGE)
    for (const v of values) {
      if (v != null) expect(typeof v).toBe('string')
    }
  })
})
