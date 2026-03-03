/**
 * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
 * Unit tests for popup suggested-tags: restricted-URL skip and injectable-URL extraction.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'
import { debugLog, debugError } from '../../src/shared/utils.js'

jest.mock('../../src/shared/utils.js', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
  browser: { runtime: { lastError: null } }
}))

global.chrome = {
  runtime: { sendMessage: jest.fn(), onMessage: { addListener: jest.fn() }, getManifest: jest.fn(() => ({ version: '1.0.0' })) },
  tabs: { query: jest.fn(), sendMessage: jest.fn() },
  scripting: { executeScript: jest.fn(), insertCSS: jest.fn() },
  storage: { local: { get: jest.fn() } }
}

jest.mock('../../src/features/tagging/tag-service.js', () => ({
  TagService: jest.fn().mockImplementation(() => ({}))
}))

describe('[REQ-SUGGESTED_TAGS_FROM_CONTENT] Popup suggested tags', () => {
  let popupController
  let uiManager
  let errorHandler
  let stateManager

  beforeEach(() => {
    jest.clearAllMocks()
    errorHandler = new ErrorHandler()
    stateManager = new StateManager()
    uiManager = new UIManager({ errorHandler, stateManager, config: {} })
    uiManager.updateSuggestedTags = jest.fn()
    uiManager.updateRecentTags = jest.fn()
    popupController = new PopupController({
      errorHandler,
      stateManager,
      uiManager
    })
  })

  describe('loadSuggestedTags restricted-URL skip [REQ-SUGGESTED_TAGS_FROM_CONTENT]', () => {
    test('skips injection and shows empty suggestions when currentTab is null', async () => {
      popupController.currentTab = null
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection and shows empty suggestions when currentTab has no id', async () => {
      popupController.currentTab = { url: 'https://example.com' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is chrome-extension://', async () => {
      popupController.currentTab = {
        id: 1,
        url: 'chrome-extension://pmghkjjcieaijgcnediaphahnhifgkme/src/ui/bookmarks-table/bookmarks-table.html'
      }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is chrome://', async () => {
      popupController.currentTab = { id: 2, url: 'chrome://extensions/' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is file://', async () => {
      popupController.currentTab = { id: 3, url: 'file:///tmp/page.html' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    test('skips injection when currentTab.url is empty', async () => {
      popupController.currentTab = { id: 4, url: '' }
      await popupController.loadSuggestedTags()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith([])
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled()
    })
  })

  describe('loadSuggestedTags injectable URL [REQ-SUGGESTED_TAGS_FROM_CONTENT]', () => {
    test('calls executeScript and updates UI when currentTab.url is https://', async () => {
      popupController.currentTab = { id: 10, url: 'https://example.com/page' }
      popupController.currentPin = { tags: [] }
      popupController.normalizeTags = jest.fn((tags) => tags || [])
      chrome.scripting.executeScript.mockResolvedValueOnce([{ result: ['suggested1', 'suggested2'] }])

      await popupController.loadSuggestedTags()

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({ target: { tabId: 10 } })
      )
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith(['suggested1', 'suggested2'])
    })

    test('calls executeScript when currentTab.url is http://', async () => {
      popupController.currentTab = { id: 11, url: 'http://example.org' }
      popupController.currentPin = { tags: [] }
      popupController.normalizeTags = jest.fn((tags) => tags || [])
      chrome.scripting.executeScript.mockResolvedValueOnce([{ result: ['httpTag'] }])

      await popupController.loadSuggestedTags()

      expect(chrome.scripting.executeScript).toHaveBeenCalled()
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith(['httpTag'])
    })

    test('deduplicates suggested tags against current bookmark tags (case-insensitive)', async () => {
      popupController.currentTab = { id: 12, url: 'https://example.com' }
      popupController.currentPin = { tags: ['existing', 'Suggested1'] }
      popupController.normalizeTags = jest.fn((tags) => tags || [])
      chrome.scripting.executeScript.mockResolvedValueOnce([{ result: ['suggested1', 'suggested2', 'existing'] }])

      await popupController.loadSuggestedTags()

      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith(['suggested2'])
    })
  })

  describe('loadDemoSuggestedTagsIfScreenshotMode [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT]', () => {
    test('calls updateSuggestedTags with stored hoverboard_demo_suggested_tags when non-empty array', async () => {
      const demoTags = ['bookmarks', 'reading', 'reference']
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_suggested_tags: demoTags })
      })

      await popupController.loadDemoSuggestedTagsIfScreenshotMode()

      expect(chrome.storage.local.get).toHaveBeenCalledWith('hoverboard_demo_suggested_tags', expect.any(Function))
      expect(uiManager.updateSuggestedTags).toHaveBeenCalledWith(demoTags)
    })

    test('does not call updateSuggestedTags when storage returns empty array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_suggested_tags: [] })
      })

      await popupController.loadDemoSuggestedTagsIfScreenshotMode()

      expect(uiManager.updateSuggestedTags).not.toHaveBeenCalled()
    })

    test('does not call updateSuggestedTags when storage returns missing or non-array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({})
      })

      await popupController.loadDemoSuggestedTagsIfScreenshotMode()

      expect(uiManager.updateSuggestedTags).not.toHaveBeenCalled()
    })
  })

  describe('loadDemoRecentTagsIfScreenshotMode [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM]', () => {
    test('calls updateRecentTags with stored tags excluding current bookmark tags', async () => {
      popupController.currentPin = { tags: ['bookmarks', 'reading'] }
      popupController.normalizeTags = jest.fn((tags) => (Array.isArray(tags) ? tags : []).map(t => String(t).trim()).filter(Boolean))
      const demoTags = ['demo', 'reading', 'tools', 'reference', 'bookmarks']
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_recent_tags: demoTags })
      })

      const applied = await popupController.loadDemoRecentTagsIfScreenshotMode()

      expect(applied).toBe(true)
      expect(chrome.storage.local.get).toHaveBeenCalledWith('hoverboard_demo_recent_tags', expect.any(Function))
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith(['demo', 'tools', 'reference'])
    })

    test('does not call updateRecentTags when storage returns empty array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({ hoverboard_demo_recent_tags: [] })
      })

      const applied = await popupController.loadDemoRecentTagsIfScreenshotMode()

      expect(applied).toBe(false)
      expect(uiManager.updateRecentTags).not.toHaveBeenCalled()
    })

    test('does not call updateRecentTags when storage returns missing or non-array', async () => {
      chrome.storage.local.get.mockImplementation((key, callback) => {
        if (typeof callback === 'function') callback({})
      })

      const applied = await popupController.loadDemoRecentTagsIfScreenshotMode()

      expect(applied).toBe(false)
      expect(uiManager.updateRecentTags).not.toHaveBeenCalled()
    })
  })
})
