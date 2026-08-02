/**
 * [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT] [IMPL-MOVE_BOOKMARK_UI] [IMPL-COMPOSITION_TEST_PATTERNS]
 * [ARCH-SIDE_PANEL_TABS] [ARCH-MOVE_BOOKMARK_UI] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-READ_LATER_BROWSER_FALLBACK] [REQ-COMPOSITION_TEST_RECOGNITION]
 * Pattern: SCOPED_DOM_BINDING
 *
 * Composition: UISystem.createPopup({ container }) → UIManager resolves data-popup-ref under container
 * and PopupController receives that UIManager. Unit: ui-manager-scoped-root.test.js (unit-first).
 * No Playwright / no side-panel.html click.
 */

import { UISystem } from '../../src/ui/index.js'
import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'

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

describe('[IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT] createPopup scoped composition', () => {
  /** @type {HTMLDivElement} */
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'bookmarkPanel'
    const mainEl = document.createElement('div')
    mainEl.setAttribute('data-popup-ref', 'mainInterface')
    const loadingEl = document.createElement('div')
    loadingEl.setAttribute('data-popup-ref', 'loadingState')
    container.appendChild(mainEl)
    container.appendChild(loadingEl)
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

  afterEach(() => {
    container?.remove()
  })

  test('createPopup({ container }) wires UIManager scoped root into PopupController', () => {
    const uiSystem = new UISystem()
    uiSystem.isInitialized = true

    const components = uiSystem.createPopup({
      container,
      errorHandler: { handleError: jest.fn() },
      config: {},
      enableKeyboard: false
    })

    expect(components.uiManager).toBeInstanceOf(UIManager)
    expect(components.controller).toBeInstanceOf(PopupController)
    expect(components.uiManager.container).toBe(container)
    expect(components.uiManager.elements.mainInterface).toBe(
      container.querySelector('[data-popup-ref="mainInterface"]')
    )
    expect(components.uiManager.elements.loadingState).toBe(
      container.querySelector('[data-popup-ref="loadingState"]')
    )
    expect(components.controller.uiManager).toBe(components.uiManager)
  })

  test('[IMPL-MOVE_BOOKMARK_UI] [REQ-READ_LATER_BROWSER_FALLBACK] shared readLater event reaches PopupController.handleReadLater', () => {
    const handleReadLater = jest.spyOn(PopupController.prototype, 'handleReadLater')
      .mockImplementation(() => {})
    const uiSystem = new UISystem()
    uiSystem.isInitialized = true

    const components = uiSystem.createPopup({
      container,
      errorHandler: { handleError: jest.fn() },
      config: {},
      enableKeyboard: false
    })

    // [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Route the shared UIManager readLater event through PopupController.handleReadLater for both popup and scoped This Page surfaces.
    components.uiManager.emit('readLater')

    expect(handleReadLater).toHaveBeenCalledTimes(1)
    handleReadLater.mockRestore()
  })

  test('createPopup without panel container does not scope UIManager to document.body', () => {
    const uiSystem = new UISystem()
    uiSystem.isInitialized = true
    const components = uiSystem.createPopup({
      errorHandler: { handleError: jest.fn() },
      config: {},
      enableKeyboard: false
    })
    expect(components.uiManager.container).toBeNull()
  })
})
