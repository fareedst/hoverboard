/**
 * [IMPL-SUGGESTED_TAGS] [IMPL-TAG_SYSTEM] [IMPL-COMPOSITION_TEST_PATTERNS]
 * [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-COMPOSITION_TEST_RECOGNITION]
 * Pattern: UI_EMIT_COMMAND
 *
 * Composition: suggested chip click → UIManager.emit('addTag') → PopupController.handleAddTag
 * → sendMessage addTagToRecent (and bookmark update path). No Playwright.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'

jest.mock('../../src/shared/ui-inspector.js', () => ({
  recordAction: jest.fn(),
  POPUP_ACTION_IDS: { addTag: 'addTag' }
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({}),
    getStorageMode: jest.fn().mockResolvedValue('local'),
    getAuthToken: jest.fn().mockResolvedValue(''),
    getAiTaggingApiKey: jest.fn().mockResolvedValue('')
  }))
}))

describe('[IMPL-SUGGESTED_TAGS] [IMPL-TAG_SYSTEM] suggested chip → addTag composition', () => {
  /** @type {HTMLDivElement} */
  let root

  beforeEach(() => {
    root = document.createElement('div')
    const suggestedSection = document.createElement('div')
    suggestedSection.setAttribute('data-popup-ref', 'suggestedTags')
    const suggestedContainer = document.createElement('div')
    suggestedContainer.setAttribute('data-popup-ref', 'suggestedTagsContainer')
    suggestedSection.appendChild(suggestedContainer)
    root.appendChild(suggestedSection)
    document.body.appendChild(root)

    global.chrome = {
      runtime: {
        sendMessage: jest.fn((_msg, cb) => {
          if (typeof cb === 'function') cb({ success: true, data: { ok: true } })
        }),
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

  test('suggested chip click emits addTag and controller sends addTagToRecent', async () => {
    const uiManager = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: null,
      config: {},
      container: root
    })

    const controller = new PopupController({
      uiManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    controller.currentTab = { id: 1, url: 'https://example.com/page', title: 'Page' }
    controller.currentPin = null
    controller.createBookmark = jest.fn().mockResolvedValue(undefined)
    controller.setLoading = jest.fn()
    const sendMessage = jest.fn().mockResolvedValue({ ok: true })
    controller.sendMessage = sendMessage

    uiManager.updateSuggestedTags([{ tag: 'WorkNotes', relevance: 1, inPageFrequency: 2 }])
    const chip = uiManager.elements.suggestedTagsContainer?.querySelector('.tag.recent.clickable')
    expect(chip).toBeTruthy()

    chip.click()
    await Promise.resolve()
    await Promise.resolve()

    expect(controller.createBookmark).toHaveBeenCalledWith(expect.arrayContaining(['WorkNotes']))
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'addTagToRecent',
      data: {
        tagName: 'WorkNotes',
        currentSiteUrl: 'https://example.com/page'
      }
    })
  })
})
