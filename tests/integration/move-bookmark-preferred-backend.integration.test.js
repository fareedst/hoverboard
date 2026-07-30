/**
 * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI]
 * Phase G composition: Save-to highlight (aria-pressed) → getSelectedStorageBackend
 * → createBookmark saveBookmark payload preferredBackend (incl. browser).
 * No Playwright / no popup.html UI invocation.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'

jest.mock('../../src/shared/ui-inspector.js', () => ({
  recordAction: jest.fn(),
  POPUP_ACTION_IDS: {}
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({}),
    getStorageMode: jest.fn().mockResolvedValue('local'),
    getAuthToken: jest.fn().mockResolvedValue(''),
    getAiTaggingApiKey: jest.fn().mockResolvedValue('')
  }))
}))

function makeStorageButtons (pressedBackend) {
  const container = document.createElement('div')
  container.id = 'storageBackendButtons'
  for (const backend of ['pinboard', 'local', 'file', 'sync', 'browser']) {
    const btn = document.createElement('button')
    btn.className = 'storage-backend-btn'
    btn.setAttribute('data-backend', backend)
    btn.setAttribute('aria-pressed', backend === pressedBackend ? 'true' : 'false')
    container.appendChild(btn)
  }
  return container
}

describe('[IMPL-MOVE_BOOKMARK_UI] Save-to → preferredBackend composition', () => {
  let container

  beforeEach(() => {
    document.body.innerHTML = ''
    container = makeStorageButtons('browser')
    document.body.appendChild(container)
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

  test('createBookmark sends preferredBackend browser from Save-to highlight [IMPL-MOVE_BOOKMARK_UI]', async () => {
    const uiManager = {
      elements: { storageBackendButtons: container },
      on: jest.fn(),
      off: jest.fn(),
      setLoading: jest.fn(),
      updateCurrentTags: jest.fn(),
      showSuccess: jest.fn(),
      showError: jest.fn(),
      redrawTagChipsFromCache: jest.fn()
    }
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    controller.uiManager.elements.storageBackendButtons = container
    controller.sendMessage = sendMessage
    controller.currentTab = { url: 'https://example.com/page', title: 'Example' }
    controller.isValidTag = () => true
    controller.loadRecentTags = jest.fn().mockResolvedValue(undefined)
    controller.refreshTagFrequencyMapForSort = jest.fn().mockResolvedValue(undefined)

    await controller.createBookmark(['tag-a'], 'yes', 'no')

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'saveBookmark',
      data: expect.objectContaining({
        url: 'https://example.com/page',
        preferredBackend: 'browser',
        tags: 'tag-a'
      })
    })
  })
})
