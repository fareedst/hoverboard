/**
 * [IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-SELECTION_TO_TAG_INPUT] [IMPL-MESSAGE_HANDLING]
 * [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION]
 * Pattern: MESSAGE_DISPATCH (timeout binding on tab send)
 *
 * Composition: sendToTab(GET_PAGE_SELECTION) times out → selection consumer leaves tag input unchanged.
 * Unit coverage: tests/unit/popup-message-timeout.test.js (unit-first RED).
 * No Playwright / no popup.html UI invocation.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { normalizeSelectionForTagInput } from '../../src/shared/utils.js'

jest.mock('../../src/shared/ui-inspector.js', () => ({
  recordAction: jest.fn(),
  POPUP_ACTION_IDS: { addTag: 'addTag' }
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({}),
    getStorageMode: jest.fn().mockResolvedValue('local'),
    getAuthToken: jest.fn().mockResolvedValue(''),
    getAiTaggingApiKey: jest.fn().mockResolvedValue('')
  }))
}))

/**
 * Mirrors loadInitialData selection try/catch ([IMPL-SELECTION_TO_TAG_INPUT]) without the full init chain.
 * @param {PopupController} controller
 * @param {{ setTagInputValue: Function }} uiManager
 */
async function consumePageSelectionForTagInput (controller, uiManager) {
  try {
    const selectionResponse = await controller.sendToTab({ type: 'GET_PAGE_SELECTION' })
    const data = selectionResponse?.data ?? selectionResponse
    const raw = data?.selection
    if (raw && typeof raw === 'string') {
      const normalized = normalizeSelectionForTagInput(raw, 8)
      if (normalized) uiManager.setTagInputValue(normalized)
    }
  } catch (_) {
    // timeout / missing content script: leave tag input unchanged
  }
}

describe('[IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-SELECTION_TO_TAG_INPUT] sendToTab timeout composition', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.chrome = {
      tabs: {
        sendMessage: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() },
        getManifest: jest.fn().mockReturnValue({ version: '0.0.0' }),
        lastError: null
      }
    }
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('GET_PAGE_SELECTION timeout leaves tag input unchanged (trigger → sendToTab → effect)', async () => {
    global.chrome.tabs.sendMessage.mockImplementation(() => {
      // never responds — timeout path
    })

    const setTagInputValue = jest.fn()
    const uiManager = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      setTagInputValue,
      showError: jest.fn(),
      showSuccess: jest.fn(),
      setLoading: jest.fn()
    }

    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() },
      tabMessageTimeoutMs: 40
    })
    controller.currentTab = { id: 7, url: 'https://example.com' }
    controller.canInjectIntoTab = jest.fn().mockReturnValue(true)

    const pending = consumePageSelectionForTagInput(controller, uiManager)
    await jest.advanceTimersByTimeAsync(80)
    await pending

    expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ type: 'GET_PAGE_SELECTION' }),
      expect.any(Function)
    )
    expect(setTagInputValue).not.toHaveBeenCalled()
  })

  test('successful GET_PAGE_SELECTION reaches setTagInputValue via same binding', async () => {
    global.chrome.tabs.sendMessage.mockImplementation((_tabId, _msg, cb) => {
      if (typeof cb === 'function') cb({ data: { selection: 'alpha beta gamma' } })
      return Promise.resolve({ data: { selection: 'alpha beta gamma' } })
    })

    const setTagInputValue = jest.fn()
    const uiManager = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      setTagInputValue,
      showError: jest.fn(),
      showSuccess: jest.fn(),
      setLoading: jest.fn()
    }

    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() },
      tabMessageTimeoutMs: 200
    })
    controller.currentTab = { id: 7, url: 'https://example.com' }
    controller.canInjectIntoTab = jest.fn().mockReturnValue(true)

    const pending = consumePageSelectionForTagInput(controller, uiManager)
    await jest.advanceTimersByTimeAsync(10)
    await pending

    expect(setTagInputValue).toHaveBeenCalledWith('alpha beta gamma')
  })
})
