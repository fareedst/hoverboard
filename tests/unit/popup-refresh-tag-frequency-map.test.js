/**
 * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
 * Procedure: refreshTagFrequencyMapForSort (PopupController).
 * Validates pseudo-code OUTPUT: after AWAIT get hoverboard_tag_frequency, uiManager.setTagFrequencyMapForSort
 * receives a plain object map suitable for bookmark-frequency sort; malformed stored values coerce to {}.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'

jest.mock('../../src/shared/utils.js', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
  browser: { runtime: { lastError: null } }
}))

global.chrome = {
  runtime: { sendMessage: jest.fn(), onMessage: { addListener: jest.fn() }, getManifest: jest.fn(() => ({ version: '1.0.0' })) },
  tabs: { query: jest.fn(), sendMessage: jest.fn() },
  scripting: { executeScript: jest.fn(), insertCSS: jest.fn() },
  storage: { local: { get: jest.fn() } }
}

jest.mock('../../src/features/tagging/tag-service.js', () => ({
  TagService: jest.fn().mockImplementation(() => ({}))
}))

describe('refreshTagFrequencyMapForSort [REQ-THIS_PAGE_TAG_SORT]', () => {
  let popupController
  let uiManager

  beforeEach(() => {
    jest.clearAllMocks()
    const errorHandler = new ErrorHandler()
    const stateManager = new StateManager()
    uiManager = new UIManager({ errorHandler, stateManager, config: {} })
    popupController = new PopupController({
      errorHandler,
      stateManager,
      uiManager
    })
  })

  /**
   * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
   * Pseudo-code: TRY AWAIT get hoverboard_tag_frequency; uiManager.setTagFrequencyMapForSort(result or {}).
   * Contract: merged map must be a plain object for frequency lookup; array / primitive stored values are invalid and must normalize to {}.
   */
  test('[REQ-THIS_PAGE_TAG_SORT] when hoverboard_tag_frequency in storage is a non-plain-object (array), setTagFrequencyMapForSort receives {}', async () => {
    chrome.storage.local.get.mockImplementation((key, callback) => {
      queueMicrotask(() => callback({ hoverboard_tag_frequency: [] }))
    })
    const spy = jest.spyOn(uiManager, 'setTagFrequencyMapForSort').mockImplementation(() => {})

    await popupController.refreshTagFrequencyMapForSort()

    expect(spy).toHaveBeenCalledWith({})
  })
})
