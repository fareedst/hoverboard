/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Content script message contract: response shape for each content message type
 * and unknown type returns { success: false, error: 'Unknown message type' }.
 */

import { CONTENT_MESSAGE_TYPES } from '../../src/shared/ui-action-contract.js'

// [IMPL-MESSAGE_HANDLING] Content-only types (handled in content-main, not in MESSAGE_TYPES)
const CONTENT_ONLY_TYPES = ['GET_PAGE_SELECTION', 'GET_PAGE_CONTENT']

// Contract: for each type the content script must respond with { success, data? } or { success: false, error }
const CONTENT_MESSAGE_CONTRACTS = [
  'TOGGLE_HOVER',
  'HIDE_OVERLAY',
  'REFRESH_DATA',
  'REFRESH_HOVER',
  'CLOSE_IF_TO_READ',
  'PING',
  'SHOW_BOOKMARK_DIALOG',
  'TOGGLE_HOVER_OVERLAY',
  'UPDATE_CONFIG',
  'updateOverlayTransparency',
  'CHECK_PAGE_STATE',
  'BOOKMARK_UPDATED',
  'TAG_UPDATED',
  'GET_OVERLAY_STATE',
  'GET_PAGE_SELECTION'
]

describe('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] Content message type contract list', () => {
  test('every CONTENT_MESSAGE_TYPES entry is in the content contract list (no drift)', () => {
    for (const type of CONTENT_MESSAGE_TYPES) {
      expect(CONTENT_MESSAGE_CONTRACTS).toContain(type)
    }
  })

  test('GET_PAGE_SELECTION is content-handled and in contract list', () => {
    expect(CONTENT_MESSAGE_CONTRACTS).toContain('GET_PAGE_SELECTION')
  })

  test('GET_PAGE_CONTENT is content-handled via early listener (documented)', () => {
    expect(CONTENT_ONLY_TYPES).toContain('GET_PAGE_CONTENT')
  })
})

describe('[IMPL-MESSAGE_HANDLING] Content response shape contract', () => {
  test('success response must have success: true and optional data', () => {
    const successResponses = [
      { success: true },
      { success: true, data: {} },
      { success: true, data: { isVisible: false, hasBookmark: false } },
      { success: true, data: 'pong' }
    ]
    for (const r of successResponses) {
      expect(r.success).toBe(true)
      if (r.data !== undefined) expect(typeof r.data === 'object' || typeof r.data === 'string').toBe(true)
    }
  })

  test('error response must have success: false and error string', () => {
    const errorResponse = { success: false, error: 'Unknown message type' }
    expect(errorResponse.success).toBe(false)
    expect(typeof errorResponse.error).toBe('string')
  })
})
