/**
 * [REQ-TAB_SEARCH_NO_MATCH_UX] [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK]
 * Tab search no-match: visual feedback only (search button border), no error message.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'

describe('[REQ-TAB_SEARCH_NO_MATCH_UX] [IMPL-TAB_SEARCH_NO_MATCH_UI] handleSearch no-match', () => {
  let popupController
  let mockUIManager
  let mockStateManager
  let mockErrorHandler

  beforeEach(() => {
    mockUIManager = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showSearchNoMatchFeedback: jest.fn(),
      setLoading: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    }
    mockStateManager = { setState: jest.fn() }
    mockErrorHandler = { handleError: jest.fn() }

    global.chrome = {
      runtime: { sendMessage: jest.fn() },
      tabs: { query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]) }
    }

    popupController = new PopupController({
      uiManager: mockUIManager,
      stateManager: mockStateManager,
      errorHandler: mockErrorHandler
    })
    popupController.uiManager = mockUIManager
    popupController.currentTab = { id: 1, url: 'https://example.com' }
    popupController.isInitialized = true
  })

  test('[REQ-TAB_SEARCH_NO_MATCH_UX] no-match does not call showError, calls showSearchNoMatchFeedback', async () => {
    popupController.sendMessage = jest.fn().mockResolvedValue({
      success: false,
      matchCount: 0,
      message: 'No matching tabs found'
    })

    await popupController.handleSearch('nonexistent')

    expect(mockUIManager.showError).not.toHaveBeenCalled()
    expect(mockUIManager.showSearchNoMatchFeedback).toHaveBeenCalled()
  })

  test('[REQ-TAB_SEARCH_NO_MATCH_UX] no-match by matchCount 0 does not call showError', async () => {
    popupController.sendMessage = jest.fn().mockResolvedValue({
      success: false,
      matchCount: 0,
      message: 'No matching tabs found'
    })

    await popupController.handleSearch('xyz')

    expect(mockUIManager.showError).not.toHaveBeenCalled()
    expect(mockUIManager.showSearchNoMatchFeedback).toHaveBeenCalled()
  })

  test('[IMPL-TAB_SEARCH_NO_MATCH_UI] other failure (e.g. Already on last match) still calls showError', async () => {
    popupController.sendMessage = jest.fn().mockResolvedValue({
      success: false,
      matchCount: 2,
      message: 'Already on last match'
    })

    await popupController.handleSearch('test')

    expect(mockUIManager.showError).toHaveBeenCalledWith('Already on last match')
    expect(mockUIManager.showSearchNoMatchFeedback).not.toHaveBeenCalled()
  })

  test('[REQ-TAB_SEARCH_NO_MATCH_UX] success response shows success and does not call showSearchNoMatchFeedback', async () => {
    popupController.sendMessage = jest.fn().mockResolvedValue({
      success: true,
      matchCount: 1,
      tabTitle: 'Foo',
      tabId: 2
    })

    await popupController.handleSearch('foo')

    expect(mockUIManager.showSuccess).toHaveBeenCalled()
    expect(mockUIManager.showSearchNoMatchFeedback).not.toHaveBeenCalled()
    expect(mockUIManager.showError).not.toHaveBeenCalled()
  })
})

describe('[IMPL-TAB_SEARCH_NO_MATCH_UI] handleSearch scroll restore', () => {
  let popupController
  let mockUIManager
  let mockContainer

  beforeEach(() => {
    mockContainer = { scrollTop: 150, scrollHeight: 800 }
    mockUIManager = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showSearchNoMatchFeedback: jest.fn(),
      setLoading: jest.fn((isLoading) => {
        if (isLoading) mockContainer.scrollTop = 0
      }),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      container: null
    }

    global.chrome = {
      runtime: { sendMessage: jest.fn() },
      tabs: { query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]) }
    }

    popupController = new PopupController({
      uiManager: mockUIManager,
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
    popupController.uiManager = mockUIManager
    popupController.currentTab = { id: 1, url: 'https://example.com' }
    popupController.isInitialized = true
  })

  test('[IMPL-TAB_SEARCH_NO_MATCH_UI] restores scroll position when container present after no-match', async () => {
    popupController.sendMessage = jest.fn().mockResolvedValue({
      success: false,
      matchCount: 0,
      message: 'No matching tabs found'
    })
    mockUIManager.container = mockContainer

    await popupController.handleSearch('x')

    expect(mockContainer.scrollTop).toBe(150)
  })
})

describe('[REQ-TAB_SEARCH_NO_MATCH_UX] [IMPL-TAB_SEARCH_NO_MATCH_UI] UIManager.showSearchNoMatchFeedback', () => {
  let uiManager
  let mockSearchBtn

  beforeEach(() => {
    jest.useFakeTimers()
    mockSearchBtn = {
      classList: { add: jest.fn(), remove: jest.fn() }
    }
    const get = (id) => (id === 'searchBtn' ? mockSearchBtn : null)
    uiManager = new UIManager({
      errorHandler: { handleError: jest.fn() },
      stateManager: { setState: jest.fn() },
      config: {}
    })
    uiManager.elements = { searchBtn: mockSearchBtn }
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('[IMPL-TAB_SEARCH_NO_MATCH_UI] adds search-no-match class to searchBtn', () => {
    uiManager.showSearchNoMatchFeedback()
    expect(mockSearchBtn.classList.add).toHaveBeenCalledWith('search-no-match')
  })

  test('[IMPL-TAB_SEARCH_NO_MATCH_UI] removes search-no-match class after 2s', () => {
    uiManager.showSearchNoMatchFeedback()
    expect(mockSearchBtn.classList.remove).not.toHaveBeenCalled()
    jest.advanceTimersByTime(2000)
    expect(mockSearchBtn.classList.remove).toHaveBeenCalledWith('search-no-match')
  })

  test('[IMPL-TAB_SEARCH_NO_MATCH_UI] does nothing when searchBtn is null', () => {
    uiManager.elements.searchBtn = null
    expect(() => uiManager.showSearchNoMatchFeedback()).not.toThrow()
  })
})
