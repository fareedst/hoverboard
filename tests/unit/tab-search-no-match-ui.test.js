/**
 * === IMPL-FULL-BLOCK: IMPL-TAB_SEARCH_NO_MATCH_UI ===
 * [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] — Block 1: When handleSearch receives response.success === false and response indicates no matches, do not call showError; call showSearchNoMatchFeedback(). Other failures (e.g. "Already on last match") still call showError.
 * 
 * ## HANDLE_SEARCH
 * 
 * - [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Implements handleSearch(response) behavior for IMPL-TAB_SEARCH_NO_MATCH_UI.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_SEARCH
 *   - IF response.success:
 *   - showSuccess(...); RETURN
 *   - isNoMatch = (response.message === "No matching tabs found" OR response.matchCount === 0)
 *   - IF isNoMatch:
 *   - showSearchNoMatchFeedback()
 *   - ELSE:
 *   - showError(response.message OR "No matching tabs found")
 * 
 * ## SHOW_SEARCH_NO_MATCH_FEEDBACK
 * 
 * - [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Block 2: showSearchNoMatchFeedback adds class to elements.searchBtn; after 2s remove class. Ensures bright red border then fade to default.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHOW_SEARCH_NO_MATCH_FEEDBACK
 *   - IF NOT elements.searchBtn: RETURN
 *   - elements.searchBtn.classList.add("search-no-match")
 *   - setTimeout(2000, () => elements.searchBtn.classList.remove("search-no-match"))
 * 
 * ## HANDLE_SEARCH_TRY_FINALLY_SCROLL
 * 
 * - [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Block 3: CSS class on search button sets border to bright red and transition (2s) to default; when class removed, border fades back. .button.secondary.search-no-match { border-color: #e00 or similar; transition: border-color 2s ease; }
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_SEARCH_TRY_FINALLY_SCROLL
 *   - scrollContainer = uiManager?.container
 *   - savedScrollTop = scrollContainer ? scrollContainer.scrollTop : undefined
 *   - TRY:
 *   - setLoading(true)   # may reset scroll in UI
 *   - How (sub-block): # ... search logic ...
 *   - FINALLY:
 *   - setLoading(false)
 *   - IF scrollContainer != null AND savedScrollTop !== undefined:
 *   - scrollContainer.scrollTop = savedScrollTop
 * 
 * === END IMPL-FULL-BLOCK: IMPL-TAB_SEARCH_NO_MATCH_UI ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SEARCH ===
 * [IMPL-SEARCH] [ARCH-SEARCH] [REQ-SEARCH_FUNCTIONALITY] — How: search bookmarks/tabs by query across popup and side-panel surfaces with consistent no-match feedback.
 * 
 * ## RUN_SEARCH
 * 
 * - [IMPL-SEARCH] [ARCH-SEARCH] [REQ-SEARCH_FUNCTIONALITY] How: normalize query, filter candidates, return matches or empty-state signal.
 * - Contract:
 *   - INPUT: user query string; search scope (bookmarks, tabs, tags); TabSearchService / bookmark index readers
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: ordered match list or empty-state UI per REQ-TAB_SEARCH_NO_MATCH_UX
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: TabSearchService; side-panel bookmark search; popup search entry points
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_SEARCH
 *   - q = TRIM(query)
 *   - IF q empty: RETURN empty-state OR all-in-scope per surface policy
 *   - matches = FILTER candidates IN scope BY q
 *   - IF matches empty: RETURN NO_MATCH_UI
 *   - RETURN matches
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SEARCH ===
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
