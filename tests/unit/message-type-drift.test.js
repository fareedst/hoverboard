/**
 * [ARCH-MESSAGE_HANDLING] [IMPL-MESSAGE_HANDLING]
 * Drift test: CONTENT_MESSAGE_TYPES entries are either a key in MESSAGE_TYPES or are known content-only types.
 * Ensures the contract list does not drift from content-main.js handling.
 */

import { MESSAGE_TYPES } from '../../src/core/message-handler.js'
import { CONTENT_MESSAGE_TYPES } from '../../src/shared/ui-action-contract.js'

const MESSAGE_TYPE_KEYS = new Set(Object.keys(MESSAGE_TYPES))

// Content-only: handled only in content script (not a key in message-handler MESSAGE_TYPES)
const CONTENT_ONLY_TYPES = ['GET_PAGE_SELECTION', 'GET_PAGE_CONTENT', 'updateOverlayTransparency', 'UPDATE_CONFIG', 'PING', 'SHOW_BOOKMARK_DIALOG', 'TOGGLE_HOVER_OVERLAY', 'CHECK_PAGE_STATE', 'GET_OVERLAY_STATE', 'CLOSE_IF_TO_READ']

describe('[ARCH-MESSAGE_HANDLING] Message type drift', () => {
  test('every CONTENT_MESSAGE_TYPES entry is a MESSAGE_TYPES key or in CONTENT_ONLY_TYPES', () => {
    for (const type of CONTENT_MESSAGE_TYPES) {
      const inHandler = MESSAGE_TYPE_KEYS.has(type)
      const contentOnly = CONTENT_ONLY_TYPES.includes(type)
      expect(inHandler || contentOnly).toBe(true)
    }
  })

  test('MESSAGE_TYPES includes TOGGLE_HOVER (content contract overlap)', () => {
    expect(MESSAGE_TYPES.TOGGLE_HOVER).toBe('toggleHover')
    expect(CONTENT_MESSAGE_TYPES).toContain('TOGGLE_HOVER')
  })
})
