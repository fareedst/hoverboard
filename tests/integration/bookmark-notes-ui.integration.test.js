/**
 * [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI]
 * Composition: handleSaveBookmarkDetails → saveBookmark with preferredBackend;
 * browser Notes path still sends save with extended preserved/empty via helper.
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

describe('[REQ-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] Save details composition', () => {
  let container

  beforeEach(() => {
    document.body.innerHTML = ''
    container = makeStorageButtons('local')
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

  function makeController (overrides = {}) {
    const titleInput = document.createElement('input')
    titleInput.id = 'bookmarkTitleInput'
    titleInput.value = overrides.titleText ?? 'Updated Title'
    const notesInput = document.createElement('textarea')
    notesInput.id = 'bookmarkNotesInput'
    notesInput.value = overrides.notesText ?? 'Updated notes'
    const uiManager = {
      elements: {
        storageBackendButtons: container,
        bookmarkTitleInput: titleInput,
        bookmarkNotesInput: notesInput
      },
      on: jest.fn(),
      off: jest.fn(),
      setLoading: jest.fn(),
      updateCurrentTags: jest.fn(),
      showSuccess: jest.fn(),
      showError: jest.fn(),
      syncBookmarkNotesFields: jest.fn(),
      redrawTagChipsFromCache: jest.fn()
    }
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    controller.uiManager.elements = uiManager.elements
    controller.sendMessage = sendMessage
    controller.currentTab = { url: 'https://example.com/page', title: 'Tab Title' }
    controller.currentPin = {
      url: 'https://example.com/page',
      description: 'Old',
      extended: 'Old notes',
      tags: 'a',
      shared: 'yes',
      toread: 'no'
    }
    controller._resolvedStorageBackend = overrides.resolvedBackend ?? 'local'
    return { controller, sendMessage, uiManager }
  }

  test('handleSaveBookmarkDetails sends saveBookmark with preferredBackend local [REQ-BOOKMARK_NOTES_UI]', async () => {
    const { controller, sendMessage, uiManager } = makeController()
    await controller.handleSaveBookmarkDetails()
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'saveBookmark',
      data: expect.objectContaining({
        url: 'https://example.com/page',
        description: 'Updated Title',
        extended: 'Updated notes',
        preferredBackend: 'local'
      })
    })
    expect(uiManager.showSuccess).toHaveBeenCalledWith('Details saved')
    expect(uiManager.syncBookmarkNotesFields).toHaveBeenCalled()
  })

  test('browser backend save keeps preferredBackend browser and does not send edited notes [REQ-BOOKMARK_NOTES_UI]', async () => {
    document.body.innerHTML = ''
    container = makeStorageButtons('browser')
    document.body.appendChild(container)
    const { controller, sendMessage } = makeController({
      resolvedBackend: 'browser',
      notesText: 'Should not persist for browser'
    })
    controller.uiManager.elements.storageBackendButtons = container
    await controller.handleSaveBookmarkDetails()
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'saveBookmark',
      data: expect.objectContaining({
        url: 'https://example.com/page',
        description: 'Updated Title',
        extended: 'Old notes',
        preferredBackend: 'browser'
      })
    })
  })

  test('unchanged details are a no-op [REQ-BOOKMARK_NOTES_UI]', async () => {
    const { controller, sendMessage } = makeController({
      titleText: 'Old',
      notesText: 'Old notes'
    })
    await controller.handleSaveBookmarkDetails()
    expect(sendMessage).not.toHaveBeenCalled()
  })

  test('UIManager saveBookmarkDetails emit invokes handleSaveBookmarkDetails [REQ-BOOKMARK_NOTES_UI]', async () => {
    const handlers = new Map()
    const titleInput = document.createElement('input')
    titleInput.id = 'bookmarkTitleInput'
    titleInput.value = 'From Emit'
    const notesInput = document.createElement('textarea')
    notesInput.id = 'bookmarkNotesInput'
    notesInput.value = 'Notes from emit'
    const uiManager = {
      elements: {
        storageBackendButtons: container,
        bookmarkTitleInput: titleInput,
        bookmarkNotesInput: notesInput
      },
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
      redrawTagChipsFromCache: jest.fn()
    }
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    controller.sendMessage = sendMessage
    controller.currentTab = { url: 'https://example.com/page', title: 'Tab Title' }
    controller.currentPin = {
      url: 'https://example.com/page',
      description: 'Old',
      extended: 'Old notes',
      tags: 'a',
      shared: 'yes',
      toread: 'no'
    }
    controller._resolvedStorageBackend = 'local'

    expect(uiManager.on).toHaveBeenCalledWith('saveBookmarkDetails', controller.handleSaveBookmarkDetails)
    uiManager.emit('saveBookmarkDetails')
    await Promise.resolve()
    await Promise.resolve()

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'saveBookmark',
      data: expect.objectContaining({
        description: 'From Emit',
        extended: 'Notes from emit',
        preferredBackend: 'local'
      })
    })
  })
})
