/**
 * [REQ-LINK_HEALTH] [ARCH-LINK_HEALTH] [IMPL-LINK_HEALTH] [IMPL-COMPOSITION_TEST_PATTERNS]
 * Pattern: MESSAGE_DISPATCH / capture UI
 *
 * Composition: PopupController.refreshLinkHealthHint → GET_LINK_HEALTH →
 * UIManager.setLinkHealthHint / applyLinkHealthHint. No Playwright.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'

jest.mock('../../src/shared/ui-inspector.js', () => ({
  recordAction: jest.fn(),
  POPUP_ACTION_IDS: {}
}))

describe('[REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] CAPTURE_UI_LINK_HEALTH_HINT composition', () => {
  /** @type {HTMLDivElement} */
  let root
  /** @type {HTMLElement} */
  let hintEl

  beforeEach(() => {
    root = document.createElement('div')
    hintEl = document.createElement('p')
    hintEl.setAttribute('data-popup-ref', 'linkHealthHint')
    hintEl.hidden = true
    root.appendChild(hintEl)
    document.body.appendChild(root)

    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() },
        getManifest: jest.fn().mockReturnValue({ version: '0.0.0' }),
        lastError: null
      },
      tabs: { query: jest.fn().mockResolvedValue([]) }
    }
  })

  afterEach(() => {
    root?.remove()
  })

  function makeController (configManager, sendMessage) {
    const uiManager = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: null,
      config: {},
      container: root
    })
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() },
      configManager
    })
    controller.currentTab = { id: 1, url: 'https://example.com/page', title: 'Page' }
    controller.sendMessage = sendMessage
    return { controller, uiManager }
  }

  test('opt-in off clears hint and does not GET_LINK_HEALTH', async () => {
    const sendMessage = jest.fn()
    const { controller } = makeController(
      { getConfig: jest.fn().mockResolvedValue({ linkHealthChecksEnabled: false }) },
      sendMessage
    )
    hintEl.hidden = false
    hintEl.textContent = 'stale'

    await controller.refreshLinkHealthHint()

    expect(sendMessage).not.toHaveBeenCalled()
    expect(hintEl.hidden).toBe(true)
    expect(hintEl.textContent).toBe('')
  })

  test('opt-in on with stored record shows Health hint via GET_LINK_HEALTH', async () => {
    const url = 'https://example.com/page'
    const sendMessage = jest.fn().mockResolvedValue({
      success: true,
      data: {
        [url]: { status: 'ok', httpStatus: 200, checkedAt: 't' }
      }
    })
    const { controller } = makeController(
      { getConfig: jest.fn().mockResolvedValue({ linkHealthChecksEnabled: true }) },
      sendMessage
    )

    await controller.refreshLinkHealthHint()

    expect(sendMessage).toHaveBeenCalledWith({ type: 'GET_LINK_HEALTH' })
    expect(hintEl.hidden).toBe(false)
    expect(hintEl.textContent).toBe('Health: ok (200)')
  })

  test('opt-in on with missing record clears hint', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: true, data: {} })
    const { controller } = makeController(
      { getConfig: jest.fn().mockResolvedValue({ linkHealthChecksEnabled: true }) },
      sendMessage
    )
    hintEl.hidden = false
    hintEl.textContent = 'stale'

    await controller.refreshLinkHealthHint()

    expect(sendMessage).toHaveBeenCalledWith({ type: 'GET_LINK_HEALTH' })
    expect(hintEl.hidden).toBe(true)
    expect(hintEl.textContent).toBe('')
  })

  test('sendMessage failure clears hint', async () => {
    const sendMessage = jest.fn().mockRejectedValue(new Error('channel closed'))
    const { controller } = makeController(
      { getConfig: jest.fn().mockResolvedValue({ linkHealthChecksEnabled: true }) },
      sendMessage
    )
    hintEl.hidden = false
    hintEl.textContent = 'stale'

    await controller.refreshLinkHealthHint()

    expect(hintEl.hidden).toBe(true)
    expect(hintEl.textContent).toBe('')
  })
})
