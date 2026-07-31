/**
 * [IMPL-SIDE_PANEL_TAGS_TREE] [IMPL-MESSAGE_HANDLING] [IMPL-COMPOSITION_TEST_PATTERNS]
 * [ARCH-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-COMPOSITION_TEST_RECOGNITION]
 * Pattern: UI_EMIT_COMMAND → MESSAGE_DISPATCH
 *
 * Composition: UIManager.emit('openTagsTree') → PopupController.handleOpenTagsTree →
 * sendMessage({ type: OPEN_SIDE_PANEL }). Unit: side-panel-open.test.js / popup-message-contract.
 * No Playwright.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

jest.mock('../../src/shared/ui-inspector.js', () => ({
  recordAction: jest.fn(),
  POPUP_ACTION_IDS: { openTagsTree: 'openTagsTree' }
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({}),
    getStorageMode: jest.fn().mockResolvedValue('local'),
    getAuthToken: jest.fn().mockResolvedValue(''),
    getAiTaggingApiKey: jest.fn().mockResolvedValue('')
  }))
}))

function makeEmitterUiManager () {
  const handlers = new Map()
  return {
    elements: {},
    on: jest.fn((event, fn) => {
      if (!handlers.has(event)) handlers.set(event, [])
      handlers.get(event).push(fn)
    }),
    off: jest.fn(),
    emit: jest.fn((event, ...args) => {
      for (const fn of handlers.get(event) || []) fn(...args)
    }),
    setLoading: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    _handlers: handlers
  }
}

describe('[IMPL-SIDE_PANEL_TAGS_TREE] openTagsTree emit → OPEN_SIDE_PANEL composition', () => {
  beforeEach(() => {
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

  test('uiManager openTagsTree emit sends OPEN_SIDE_PANEL via controller', async () => {
    const uiManager = makeEmitterUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    controller.sendMessage = sendMessage

    expect(uiManager.on).toHaveBeenCalledWith('openTagsTree', controller.handleOpenTagsTree)

    uiManager.emit('openTagsTree')
    await Promise.resolve()

    expect(sendMessage).toHaveBeenCalledWith({ type: MESSAGE_TYPES.OPEN_SIDE_PANEL })
    expect(uiManager.showSuccess).toHaveBeenCalled()
  })

  test('in-panel openTagsTree callback skips OPEN_SIDE_PANEL message', async () => {
    const uiManager = makeEmitterUiManager()
    const onOpenTagsTreeInPanel = jest.fn()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    controller.onOpenTagsTreeInPanel = onOpenTagsTreeInPanel
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    controller.sendMessage = sendMessage

    uiManager.emit('openTagsTree')
    await Promise.resolve()

    expect(onOpenTagsTreeInPanel).toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
