/**
 * === IMPL-FULL-BLOCK: IMPL-UI_ACTION_CONTRACT ===
 * Static exports for message types and popup/overlay action IDs.
 * === END IMPL-FULL-BLOCK: IMPL-UI_ACTION_CONTRACT ===
 */
import {
  MESSAGE_TYPES,
  POPUP_ACTION_IDS,
  POPUP_ACTION_TO_MESSAGE,
  OVERLAY_ACTION_IDS,
  CONTENT_MESSAGE_TYPES
} from '../../src/shared/ui-action-contract.js'

describe('[IMPL-UI_ACTION_CONTRACT] static contract exports', () => {
  test('exports MESSAGE_TYPES and popup/overlay action IDs [IMPL-UI_ACTION_CONTRACT]', () => {
    expect(MESSAGE_TYPES).toBeDefined()
    expect(POPUP_ACTION_IDS.storageBackendChange).toBe('storageBackendChange')
    expect(OVERLAY_ACTION_IDS).toBeDefined()
    expect(Array.isArray(CONTENT_MESSAGE_TYPES)).toBe(true)
  })

  test('POPUP_ACTION_TO_MESSAGE maps storageBackendChange to move message [IMPL-UI_ACTION_CONTRACT]', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.storageBackendChange]).toBe(
      MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE
    )
  })

  test('maps archive popup actions to dedicated messages [REQ-PAGE_ARCHIVE_STORAGE]', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.capturePageArchive]).toBe(MESSAGE_TYPES.CAPTURE_PAGE_ARCHIVE)
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.capturePageScreenshot]).toBe(MESSAGE_TYPES.CAPTURE_PAGE_SCREENSHOT)
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.openOfflineReader]).toBeNull()
  })
})
