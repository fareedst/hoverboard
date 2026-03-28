/**
 * [REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT]
 * Phase G composition: bindings between PopupController ↔ UIManager and UIManager DOM ↔ sort mode
 * (no Playwright / no real extension UI).
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'

jest.mock('../../src/shared/utils.js', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
  browser: { runtime: { lastError: null } }
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getStorageMode: jest.fn().mockResolvedValue('local'),
    getAuthToken: jest.fn().mockResolvedValue(''),
    getConfig: jest.fn().mockResolvedValue({ aiApiKey: '' })
  }))
}))

global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
    getManifest: jest.fn(() => ({ version: '1.0.0' }))
  },
  tabs: { query: jest.fn(), sendMessage: jest.fn() },
  scripting: { executeScript: jest.fn(), insertCSS: jest.fn() },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        if (typeof callback === 'function') callback({})
      })
    }
  }
}

/** Minimal side-panel shim: sort toggle + tag containers (matches uIManager-tag-case-folding layout). */
function appendSortCompositionShim (container) {
  const html = `
    <div class="tag-sort-toggle" data-popup-ref="tagSortToggle" role="toolbar" aria-label="Tag list sort">
      <div class="tag-sort-toggle-buttons">
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="alphabetical" aria-pressed="true">A–Z</button>
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="frequency" aria-pressed="false">Frequency</button>
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="relevance" aria-pressed="false">Relevance</button>
      </div>
    </div>
    <div data-popup-ref="currentTagsContainer"></div>
    <div data-popup-ref="recentTagsContainer"></div>
    <section data-popup-ref="suggestedTags" style="display:block">
      <div data-popup-ref="suggestedTagsContainer"></div>
    </section>
  `
  container.insertAdjacentHTML('beforeend', html)
}

describe('[REQ-THIS_PAGE_TAG_SORT] This Page tag sort composition', () => {
  describe('loadInitialData: PopupController → refreshTagFrequencyMapForSort then updateCurrentTags', () => {
    /**
     * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
     * Binding: after tags normalized, controller awaits storage frequency refresh before painting current tags.
     */
    test('[REQ-THIS_PAGE_TAG_SORT] invokes refreshTagFrequencyMapForSort before updateCurrentTags', async () => {
      jest.clearAllMocks()
      const errorHandler = new ErrorHandler()
      const stateManager = new StateManager()
      const uiManager = new UIManager({
        errorHandler,
        stateManager,
        config: {}
      })
      const popupController = new PopupController({
        errorHandler,
        stateManager,
        uiManager
      })

      popupController.getCurrentTab = jest.fn().mockResolvedValue({
        id: 1,
        url: 'https://example.com',
        title: 'Example'
      })
      popupController.getBookmarkData = jest.fn().mockResolvedValue({
        url: 'https://example.com',
        description: 'Example',
        tags: ['z', 'a'],
        shared: 'yes',
        toread: 'no',
        time: '1',
        updated_at: '',
        extended: '',
        hash: ''
      })
      popupController.loadShowHoverOnPageLoadSetting = jest.fn().mockResolvedValue()
      popupController.loadRecentTags = jest.fn().mockResolvedValue()
      popupController.loadSuggestedTags = jest.fn().mockResolvedValue()
      popupController.getStorageBackendForUrl = jest.fn().mockResolvedValue('local')
      popupController.refreshUsageSection = jest.fn().mockResolvedValue()
      popupController.sendToTab = jest.fn().mockResolvedValue({})

      const seq = []
      jest.spyOn(popupController, 'refreshTagFrequencyMapForSort').mockImplementation(async () => {
        seq.push('refresh')
      })
      jest.spyOn(uiManager, 'updateCurrentTags').mockImplementation(() => {
        seq.push('updateCurrentTags')
      })

      await popupController.loadInitialData()

      expect(seq).toContain('refresh')
      expect(seq).toContain('updateCurrentTags')
      expect(seq.indexOf('refresh')).toBeLessThan(seq.indexOf('updateCurrentTags'))
    })
  })

  describe('UIManager setupEventListeners: [data-sort-mode] click → setTagSortMode', () => {
    /**
     * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
     * Binding: toolbar segment click delegates to setTagSortMode (which redraws cached chips).
     */
    test('[REQ-THIS_PAGE_TAG_SORT] click frequency segment calls setTagSortMode and redrawTagChipsFromCache', () => {
      const container = document.createElement('div')
      appendSortCompositionShim(container)
      document.body.appendChild(container)

      const ui = new UIManager({
        errorHandler: { handleError: () => {} },
        stateManager: null,
        config: {},
        container
      })
      const setSpy = jest.spyOn(ui, 'setTagSortMode')
      const redrawSpy = jest.spyOn(ui, 'redrawTagChipsFromCache')

      ui.setupEventListeners()
      ui.updateCurrentTags(['z', 'a'])

      container.querySelector('[data-sort-mode="frequency"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )

      expect(setSpy).toHaveBeenCalledWith('frequency')
      expect(redrawSpy).toHaveBeenCalled()

      container.remove()
    })
  })
})
