/**
 * [REQ-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [IMPL-SELECTION_TO_TAG_INPUT]
 * Unit tests for selection-to-tag-input: normalizeSelectionForTagInput and popup prefill.
 */

import { normalizeSelectionForTagInput } from '../../src/shared/utils.js'
import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'

jest.mock('../../src/shared/utils.js', () => {
  const actual = jest.requireActual('../../src/shared/utils.js')
  return {
    ...actual,
    debugLog: jest.fn(),
    debugError: jest.fn()
  }
})

global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
    getManifest: jest.fn(() => ({ version: '1.0.0' }))
  },
  tabs: { query: jest.fn(), sendMessage: jest.fn() },
  scripting: { executeScript: jest.fn(), insertCSS: jest.fn() }
}

describe('[REQ-SELECTION_TO_TAG_INPUT] [IMPL-SELECTION_TO_TAG_INPUT] normalizeSelectionForTagInput', () => {
  describe('empty and invalid input', () => {
    test('returns empty string for null', () => {
      expect(normalizeSelectionForTagInput(null)).toBe('')
    })

    test('returns empty string for undefined', () => {
      expect(normalizeSelectionForTagInput(undefined)).toBe('')
    })

    test('returns empty string for empty string', () => {
      expect(normalizeSelectionForTagInput('')).toBe('')
    })

    test('returns empty string for non-string (number)', () => {
      expect(normalizeSelectionForTagInput(123)).toBe('')
    })

    test('returns empty string for whitespace-only', () => {
      expect(normalizeSelectionForTagInput('   \n\t  ')).toBe('')
    })

    test('returns empty string when only punctuation', () => {
      expect(normalizeSelectionForTagInput('...!!!???')).toBe('')
    })
  })

  describe('punctuation elimination [REQ-SELECTION_TO_TAG_INPUT]', () => {
    test('strips punctuation and collapses spaces', () => {
      expect(normalizeSelectionForTagInput('hello, world!')).toBe('hello world')
    })

    test('removes punctuation between words', () => {
      expect(normalizeSelectionForTagInput('one—two...three')).toBe('one two three')
    })

    test('handles multiple spaces and punctuation', () => {
      expect(normalizeSelectionForTagInput('  a , b . c  ')).toBe('a b c')
    })
  })

  describe('word limit (first 8 words) [REQ-SELECTION_TO_TAG_INPUT]', () => {
    test('returns all words when 8 or fewer', () => {
      expect(normalizeSelectionForTagInput('one two three four')).toBe('one two three four')
    })

    test('returns exactly 8 words when given 8', () => {
      const eight = 'a b c d e f g h'
      expect(normalizeSelectionForTagInput(eight)).toBe(eight)
    })

    test('limits to first 8 words when more than 8', () => {
      expect(normalizeSelectionForTagInput('one two three four five six seven eight nine ten')).toBe(
        'one two three four five six seven eight'
      )
    })

    test('respects custom maxWords', () => {
      expect(normalizeSelectionForTagInput('a b c d e', 3)).toBe('a b c')
    })

    test('maxWords 0 returns empty', () => {
      expect(normalizeSelectionForTagInput('hello world', 0)).toBe('')
    })
  })

  describe('combined behavior', () => {
    test('strips punctuation then limits to 8 words', () => {
      const input = 'First, second—third. Fourth! Fifth? Sixth; seventh: eighth... ninth.'
      expect(normalizeSelectionForTagInput(input)).toBe(
        'First second third Fourth Fifth Sixth seventh eighth'
      )
    })

    test('normalizes then takes first 8', () => {
      const input = '  word1,  word2.  word3  word4  word5  word6  word7  word8  word9  '
      expect(normalizeSelectionForTagInput(input)).toBe(
        'word1 word2 word3 word4 word5 word6 word7 word8'
      )
    })
  })
})

describe('[REQ-SELECTION_TO_TAG_INPUT] [IMPL-SELECTION_TO_TAG_INPUT] Popup selection prefill', () => {
  let popupController
  let uiManager
  let errorHandler
  let stateManager
  let configManager

  beforeEach(() => {
    jest.clearAllMocks()
    errorHandler = new ErrorHandler()
    stateManager = new StateManager()
    uiManager = new UIManager({ errorHandler, stateManager, config: {} })
    uiManager.setTagInputValue = jest.fn()
    configManager = {
      getConfig: jest.fn().mockResolvedValue({ showHoverOnPageLoad: false }),
      getStorageMode: jest.fn().mockResolvedValue('local'),
      getAuthToken: jest.fn().mockResolvedValue('')
    }
    popupController = new PopupController({
      errorHandler,
      stateManager,
      uiManager,
      configManager
    })
    popupController.setLoading = jest.fn()
    popupController.getCurrentTab = jest.fn().mockResolvedValue({
      id: 1,
      url: 'https://example.com',
      title: 'Example'
    })
    popupController.getBookmarkData = jest.fn().mockResolvedValue({
      url: 'https://example.com',
      description: 'Example',
      tags: [],
      shared: 'yes',
      toread: 'no'
    })
    popupController.loadRecentTags = jest.fn().mockResolvedValue()
    popupController.loadSuggestedTags = jest.fn().mockResolvedValue()
    popupController.loadShowHoverOnPageLoadSetting = jest.fn().mockResolvedValue()
    popupController.getStorageBackendForUrl = jest.fn().mockResolvedValue('local')
  })

  test('calls setTagInputValue with normalized selection when sendToTab returns selection', async () => {
    popupController.sendToTab = jest.fn().mockResolvedValue({
      success: true,
      data: { selection: 'hello, world! here are four words' }
    })
    await popupController.loadInitialData()
    expect(popupController.sendToTab).toHaveBeenCalledWith({ type: 'GET_PAGE_SELECTION' })
    expect(uiManager.setTagInputValue).toHaveBeenCalledWith('hello world here are four words')
  })

  test('limits to first 8 words when selection has more than 8', async () => {
    popupController.sendToTab = jest.fn().mockResolvedValue({
      data: {
        selection: 'one two three four five six seven eight nine ten'
      }
    })
    await popupController.loadInitialData()
    expect(uiManager.setTagInputValue).toHaveBeenCalledWith(
      'one two three four five six seven eight'
    )
  })

  test('does not call setTagInputValue when selection is empty', async () => {
    popupController.sendToTab = jest.fn().mockResolvedValue({ data: { selection: '' } })
    await popupController.loadInitialData()
    expect(popupController.sendToTab).toHaveBeenCalledWith({ type: 'GET_PAGE_SELECTION' })
    expect(uiManager.setTagInputValue).not.toHaveBeenCalled()
  })

  test('does not call setTagInputValue when sendToTab rejects (e.g. content script missing)', async () => {
    popupController.sendToTab = jest.fn().mockRejectedValue(new Error('Receiving end does not exist'))
    await popupController.loadInitialData()
    expect(uiManager.setTagInputValue).not.toHaveBeenCalled()
  })

  test('does not call setTagInputValue when selection normalizes to empty (only punctuation)', async () => {
    popupController.sendToTab = jest.fn().mockResolvedValue({
      data: { selection: '...!!!' }
    })
    await popupController.loadInitialData()
    expect(uiManager.setTagInputValue).not.toHaveBeenCalled()
  })
})
