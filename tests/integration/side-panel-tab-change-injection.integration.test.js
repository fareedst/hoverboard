/**
 * [IMPL-SIDE_PANEL_TABS] [IMPL-POPUP_SESSION] [IMPL-UI_INSPECTOR] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Phase G composition: chrome.tabs.onActivated → bindTabChangeRefresh → real PopupController.refreshPopupData
 * ({ trigger: tabChange }) on Web Store URL must not call chrome.scripting.executeScript / insertCSS.
 * No Playwright / no side-panel.html UI invocation. No Web Store E2E (platform forbids scripting that target).
 */

import {
  bindTabChangeRefresh,
  setPopupComponentsForTest
} from '../../src/ui/side-panel/side-panel.js'
import { PopupController } from '../../src/ui/popup/PopupController.js'
import { setEnabled, clear, getLastActions } from '../../src/shared/ui-inspector.js'

const mockInitTagsTreeTab = jest.fn()
jest.mock('../../src/ui/side-panel/tags-tree.js', () => ({
  initTagsTreeTab: (...args) => mockInitTagsTreeTab(...args),
  setSelectedTagsFromCurrentBookmark: jest.fn()
}))
jest.mock('../../src/ui/index.js', () => ({
  init: jest.fn().mockResolvedValue(),
  popup: jest.fn()
}))
jest.mock('../../src/shared/ErrorHandler.js', () => ({
  ErrorHandler: jest.fn()
}))
jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({}),
    getStorageMode: jest.fn().mockResolvedValue('local'),
    getAuthToken: jest.fn().mockResolvedValue(''),
    getAiTaggingApiKey: jest.fn().mockResolvedValue('')
  }))
}))

const GALLERY_URL = 'https://chrome.google.com/webstore/detail/foo/abcdef'

function makeRealController () {
  const uiManager = {
    updateShowHoverButtonState: jest.fn(),
    updateSuggestedTags: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    setLoading: jest.fn(),
    updateCurrentTags: jest.fn(),
    updatePrivateStatus: jest.fn(),
    updateReadLaterStatus: jest.fn(),
    updateConnectionStatus: jest.fn(),
    updateVersionInfo: jest.fn(),
    updateStorageBackendValue: jest.fn(),
    updateStorageLocalToggle: jest.fn(),
    updateStoragePinboardEnabled: jest.fn(),
    setTagInputValue: jest.fn(),
    updateAiTagButtonEnabled: jest.fn(),
    setTagFrequencyMapForSort: jest.fn()
  }
  const controller = new PopupController({
    errorHandler: { handle: jest.fn() },
    stateManager: { setState: jest.fn() },
    uiManager
  })
  controller.configManager = {
    getConfig: jest.fn().mockResolvedValue({}),
    getStorageMode: jest.fn().mockResolvedValue('local'),
    getAuthToken: jest.fn().mockResolvedValue(''),
    getAiTaggingApiKey: jest.fn().mockResolvedValue('')
  }
  controller.getCurrentTab = jest.fn().mockResolvedValue({ id: 99, url: GALLERY_URL, title: 'Web Store' })
  controller.getBookmarkData = jest.fn().mockResolvedValue({ tags: [], shared: 'yes', toread: 'no' })
  controller.refreshTagFrequencyMapForSort = jest.fn().mockResolvedValue(undefined)
  controller.loadRecentTags = jest.fn().mockResolvedValue(undefined)
  controller.loadShowHoverOnPageLoadSetting = jest.fn().mockResolvedValue(undefined)
  controller.getStorageBackendForUrl = jest.fn().mockResolvedValue('local')
  controller.sendToTab = jest.fn().mockResolvedValue({ isVisible: false })
  controller.isInitialized = true
  controller.isLoading = false
  return { controller, uiManager }
}

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] bindTabChangeRefresh non-scriptable inject', () => {
  /** @type {(() => void) | null} */
  let onActivatedHandler = null
  /** @type {((tabId: number, changeInfo: object, tab: object) => void) | null} */
  let onUpdatedHandler = null

  beforeEach(() => {
    onActivatedHandler = null
    onUpdatedHandler = null
    setEnabled(true)
    clear()
    global.chrome = {
      runtime: {
        lastError: undefined,
        getManifest: jest.fn(() => ({ version: '0.0.0-test' })),
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn()
      },
      tabs: {
        onActivated: {
          addListener: jest.fn((fn) => {
            onActivatedHandler = fn
          })
        },
        onUpdated: {
          addListener: jest.fn((fn) => {
            onUpdatedHandler = fn
          })
        },
        query: jest.fn((query, cb) => {
          cb([{ id: 99, url: GALLERY_URL, active: true }])
        }),
        sendMessage: jest.fn()
      },
      scripting: {
        executeScript: jest.fn().mockResolvedValue([]),
        insertCSS: jest.fn().mockResolvedValue(undefined)
      },
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb({})),
          set: jest.fn((vals, cb) => cb && cb())
        }
      }
    }
    setPopupComponentsForTest(null)
  })

  afterEach(() => {
    setPopupComponentsForTest(null)
    clear()
    setEnabled(false)
  })

  test('onActivated with Web Store tab reaches real inject prechecks and does not script', async () => {
    const { controller, uiManager } = makeRealController()
    const refreshSpy = jest.spyOn(controller, 'refreshPopupData')
    setPopupComponentsForTest({ controller })

    bindTabChangeRefresh()
    expect(typeof onActivatedHandler).toBe('function')

    await onActivatedHandler()
    // refreshPopupData is async; wait for microtasks + loadSuggestedTags path
    await new Promise((resolve) => setTimeout(resolve, 0))
    await Promise.resolve()

    expect(refreshSpy).toHaveBeenCalledWith({ trigger: 'tabChange', surface: 'side-panel' })
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    expect(chrome.scripting.insertCSS).not.toHaveBeenCalled()
    expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])

    const tabActions = getLastActions().filter((a) => a.actionId === 'tabChangeRefresh')
    expect(tabActions.length).toBeGreaterThanOrEqual(1)
    expect(tabActions[tabActions.length - 1].payload).toMatchObject({ source: 'onActivated' })
    expect(tabActions[tabActions.length - 1].surface).toBe('side-panel')

    const outcomes = getLastActions().filter((a) => a.actionId === 'injectionOutcome')
    expect(outcomes.some((a) => a.payload?.reason === 'extensions_gallery')).toBe(true)
  })

  test('onUpdated complete for active Web Store tab triggers refresh with tabChange', async () => {
    const { controller } = makeRealController()
    controller.currentTab = { id: 99, url: 'https://chromewebstore.google.com/detail/x/y' }
    const refreshSpy = jest.spyOn(controller, 'refreshPopupData')
    setPopupComponentsForTest({ controller })

    bindTabChangeRefresh()
    expect(typeof onUpdatedHandler).toBe('function')

    onUpdatedHandler(99, { status: 'complete' }, {
      id: 99,
      url: 'https://chromewebstore.google.com/detail/x/y'
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    await Promise.resolve()

    expect(refreshSpy).toHaveBeenCalledWith({ trigger: 'tabChange', surface: 'side-panel' })
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
  })

  test('when tabs API incomplete bindTabChangeRefresh does not register', () => {
    global.chrome = { tabs: {} }
    bindTabChangeRefresh()
    expect(onActivatedHandler).toBeNull()
  })
})
