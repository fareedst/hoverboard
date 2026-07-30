/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_MESSAGE_TIMEOUT ===
 * [IMPL-POPUP_MESSAGE_TIMEOUT] — Promise-based send with timeout; reject on timeout or error.
 *
 * ## SEND_WITH_TIMEOUT
 *
 * - [IMPL-POPUP_MESSAGE_TIMEOUT] How: Implements sendWithTimeout(message, timeoutMs) via PopupController.sendToTab.
 * - PROCEDURE: SEND_WITH_TIMEOUT race with timeout → reject "Timed out waiting for tab response"
 *
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_MESSAGE_TIMEOUT ===
 */
import { PopupController } from '../../src/ui/popup/PopupController.js'

describe('[IMPL-POPUP_MESSAGE_TIMEOUT] sendToTab timeout race', () => {
  let popupController

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
    popupController = new PopupController({
      uiManager: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        showError: jest.fn(),
        showSuccess: jest.fn(),
        setLoading: jest.fn(),
        updateShowHoverButtonState: jest.fn(),
        updateCurrentTags: jest.fn(),
        updatePrivateStatus: jest.fn(),
        updateReadLaterStatus: jest.fn(),
        updateConnectionStatus: jest.fn(),
        updateVersionInfo: jest.fn(),
        updateStorageBackendValue: jest.fn(),
        updateStorageLocalToggle: jest.fn()
      },
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() },
      tabMessageTimeoutMs: 50
    })
    popupController.currentTab = { id: 7, url: 'https://example.com' }
    popupController.canInjectIntoTab = jest.fn().mockReturnValue(true)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('rejects when tab sendMessage never responds [IMPL-POPUP_MESSAGE_TIMEOUT]', async () => {
    global.chrome.tabs.sendMessage.mockImplementation(() => {
      // never calls callback / never resolves
    })
    const pending = popupController.sendToTab({ type: 'PING' })
    const expectation = expect(pending).rejects.toThrow('Timed out waiting for tab response')
    await jest.advanceTimersByTimeAsync(60)
    await expectation
  })

  test('resolves and clears timeout when tab responds [IMPL-POPUP_MESSAGE_TIMEOUT]', async () => {
    global.chrome.tabs.sendMessage.mockImplementation((_tabId, _msg, cb) => {
      if (typeof cb === 'function') cb({ ok: true })
      return Promise.resolve({ ok: true })
    })
    const pending = popupController.sendToTab({ type: 'PING' })
    await jest.advanceTimersByTimeAsync(10)
    const result = await pending
    expect(result).toEqual({ ok: true })
  })
})
