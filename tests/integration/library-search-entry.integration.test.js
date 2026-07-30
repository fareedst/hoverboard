/**
 * [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY]
 * Composition: UIManager librarySearch emit → PopupController handleLibrarySearch →
 * OPEN_BOOKMARKS_INDEX { q }. No Playwright / no popup.html UI invocation.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

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
    updateCurrentTags: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    syncBookmarkNotesFields: jest.fn(),
    redrawTagChipsFromCache: jest.fn(),
    _handlers: handlers
  }
}

describe('[REQ-LIBRARY_SEARCH_ENTRY] [IMPL-LIBRARY_SEARCH_ENTRY] UIManager → OPEN_BOOKMARKS_INDEX', () => {
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

  test('uiManager librarySearch emit sends OPEN_BOOKMARKS_INDEX with trimmed q', async () => {
    const uiManager = makeEmitterUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    controller.sendMessage = sendMessage

    expect(uiManager.on).toHaveBeenCalledWith('librarySearch', controller.handleLibrarySearch)

    uiManager.emit('librarySearch', '  tag:work  ')
    await Promise.resolve()

    expect(sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX,
      data: { q: 'tag:work' }
    })
  })

  test('handleLibrarySearch with empty query still opens Index with empty q', async () => {
    const uiManager = makeEmitterUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    controller.sendMessage = sendMessage

    await controller.handleLibrarySearch('   ')

    expect(sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX,
      data: { q: '' }
    })
  })

  test('handleLibrarySearch failure surfaces UI error [REQ-LIBRARY_SEARCH_ENTRY]', async () => {
    const uiManager = makeEmitterUiManager()
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    controller.sendMessage = jest.fn().mockRejectedValue(new Error('sw down'))

    await controller.handleLibrarySearch('x')

    expect(uiManager.showError).toHaveBeenCalledWith('Failed to open bookmarks search')
  })
})
