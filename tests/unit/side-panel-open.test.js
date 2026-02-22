/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Tests verify: (1) popup handleOpenTagsTree sends OPEN_SIDE_PANEL so SW can open panel (implements popup-entry requirement); (2) openUrlInNewTab calls chrome.tabs.create (implements click-URL-opens-in-new-tab).
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { openUrlInNewTab } from '../../src/ui/side-panel/tags-tree-data.js'

describe('Side panel open [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  let popupController
  let mockUIManager
  let mockStateManager
  let mockErrorHandler
  let sendMessageSpy

  beforeEach(() => {
    mockUIManager = {
      updateShowHoverButtonState: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      setLoading: jest.fn(),
      updateCurrentTags: jest.fn(),
      updatePrivateStatus: jest.fn(),
      updateReadLaterStatus: jest.fn(),
      updateConnectionStatus: jest.fn(),
      elements: {}
    }
    mockStateManager = { setState: jest.fn() }
    mockErrorHandler = { handleError: jest.fn() }
    sendMessageSpy = jest.fn().mockImplementation((msg, cb) => {
      if (typeof cb === 'function') cb({ success: true })
    })
    global.chrome = {
      tabs: { query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]), create: jest.fn() },
      runtime: { sendMessage: sendMessageSpy, getURL: jest.fn((p) => `chrome-extension://id/${p}`) }
    }
    popupController = new PopupController({
      uiManager: mockUIManager,
      stateManager: mockStateManager,
      errorHandler: mockErrorHandler
    })
  })

  test('handleOpenTagsTree sends OPEN_SIDE_PANEL message (implements popup → SW open flow)', async () => {
    expect(typeof popupController.handleOpenTagsTree).toBe('function')
    await popupController.handleOpenTagsTree()
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OPEN_SIDE_PANEL' }),
      expect.any(Function)
    )
  })
})

describe('Open URL in new tab [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('openUrlInNewTab calls chrome.tabs.create with url (implements click-URL-opens-in-new-tab)', () => {
    const createSpy = jest.fn()
    global.chrome = { tabs: { create: createSpy } }
    openUrlInNewTab('https://example.com')
    expect(createSpy).toHaveBeenCalledWith({ url: 'https://example.com' })
  })
})
