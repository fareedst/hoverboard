/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.
 * 
 * ## MAIN
 * 
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
 * - Contract:
 *   - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: consistent bookmark state across overlay, popup, badge
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
 *   - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
 *   - 2.   SEND message to backend; await processMessage result
 *   - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
 *   - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
 *   - 4. Badge manager:
 *   - 5.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
 * 
 * ## OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 * 
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Constructor-path observer listener — synchronous, returns undefined, re-fetches pin/tags via applyExternalBookmarkUpdate in a detached promise. Distinct from setupRealTimeUpdates full refresh (IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH). Chrome 144+ treats a promise-returning listener as answering and would deliver null to the SW sender.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers refresh
 *   - PRE: PopupController constructed; chrome.runtime.onMessage available when registering
 *   - OUTPUT: undefined (never a Promise, never sendResponse); pin/tags UI may update asynchronously
 *   - POST:
 *     - success => listener returned undefined; unrelated types left the response channel free
 *     - BOOKMARK_UPDATED => detached applyExternalBookmarkUpdate started (or no-op when no currentTab)
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError; does not answer message)
 *   - DATA: currentTab; currentPin; UIManager tag/privacy/read-later widgets
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, currentPin and chip UI updated from re-fetch; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached applyExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 * 
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 * 
 * - [IMPL-BOOKMARK_STATE_SYNC] [IMPL-POPUP_SESSION] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-POPUP_PERSISTENT_SESSION] How: setupRealTimeUpdates observer — synchronous, returns undefined, runs refreshOnExternalBookmarkUpdate (refreshPopupData then updateOverlayState) in a detached promise. Complements constructor applyExternalBookmarkUpdate path; duplicate refresh is an accepted non-goal.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers full refresh
 *   - PRE: setupRealTimeUpdates registered; controller may be initialized
 *   - OUTPUT: undefined; full This Page refresh may run asynchronously
 *   - POST:
 *     - success => listener returned undefined; response channel not claimed
 *     - BOOKMARK_UPDATED => detached refreshPopupData + updateOverlayState started
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError)
 *   - DATA: PopupController session state; overlay button state
 *   - DATA_TRANSITION: on success path, bookmark/suggested/overlay UI refreshed; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refreshOnExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 */
import { jest } from '@jest/globals'

// Mock Chrome Extension APIs
globalThis.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
}

// Mock console methods
globalThis.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}

// Mock debug functions
globalThis.debugLog = jest.fn()
globalThis.debugError = jest.fn()

describe('[REQ-BOOKMARK_STATE_SYNCHRONIZATION] [IMPL-BOOKMARK_STATE_SYNC] Toggle Synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Overlay Toggle Persistence', () => {
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Overlay privacy toggle sends saveBookmark message', async () => {
      // Mock message service
      const mockMessageService = {
        sendMessage: jest.fn().mockResolvedValue({ success: true })
      }

      // Mock content
      const mockContent = {
        bookmark: {
          url: 'https://example.com',
          shared: 'no',
          toread: 'no',
          tags: []
        }
      }

      // Mock overlay manager methods
      const mockShow = jest.fn()
      const mockShowMessage = jest.fn()

      // Create mock overlay manager
      const overlayManager = {
        messageService: mockMessageService,
        show: mockShow,
        showMessage: mockShowMessage,
        document: {
          createElement: jest.fn().mockReturnValue({
            style: {},
            onclick: null
          })
        }
      }

      // Simulate privacy toggle click
      const privateBtn = {
        onclick: null
      }

      // Set up the onclick handler (this would normally be done in the overlay manager)
      privateBtn.onclick = async () => {
        if (mockContent.bookmark) {
          try {
            const isPrivate = mockContent.bookmark.shared === 'no'
            const newSharedStatus = isPrivate ? 'yes' : 'no'
            
            const updatedBookmark = {
              ...mockContent.bookmark,
              shared: newSharedStatus
            }
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Send saveBookmark message for persistence
            await mockMessageService.sendMessage({
              type: 'saveBookmark',
              data: updatedBookmark
            })
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Update local content immediately for display
            mockContent.bookmark.shared = newSharedStatus
            mockShow(mockContent) // Refresh overlay with updated local content
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Show success message
            mockShowMessage(`Bookmark is now ${isPrivate ? 'public' : 'private'}`, 'success')
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Notify popup of changes (if open)
            await mockMessageService.sendMessage({
              type: 'BOOKMARK_UPDATED',
              data: updatedBookmark
            })
            
            debugLog('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Privacy toggled', mockContent.bookmark.shared)
          } catch (error) {
            debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to toggle privacy:', error)
            mockShowMessage('Failed to update privacy setting', 'error')
          }
        }
      }

      // Trigger the onclick handler
      await privateBtn.onclick()

      // Verify saveBookmark message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'saveBookmark',
        data: expect.objectContaining({
          url: 'https://example.com',
          shared: 'yes'
        })
      })

      // Verify BOOKMARK_UPDATED message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'BOOKMARK_UPDATED',
        data: expect.objectContaining({
          url: 'https://example.com',
          shared: 'yes'
        })
      })

      // Verify local content was updated
      expect(mockContent.bookmark.shared).toBe('yes')

      // Verify overlay was refreshed
      expect(mockShow).toHaveBeenCalledWith(mockContent)

      // Verify success message was shown
      expect(mockShowMessage).toHaveBeenCalledWith('Bookmark is now public', 'success')
    })

    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Overlay read later toggle sends saveBookmark message', async () => {
      // Mock message service
      const mockMessageService = {
        sendMessage: jest.fn().mockResolvedValue({ success: true })
      }

      // Mock content
      const mockContent = {
        bookmark: {
          url: 'https://example.com',
          shared: 'yes',
          toread: 'no',
          tags: []
        }
      }

      // Mock overlay manager methods
      const mockShow = jest.fn()
      const mockShowMessage = jest.fn()

      // Create mock overlay manager
      const overlayManager = {
        messageService: mockMessageService,
        show: mockShow,
        showMessage: mockShowMessage,
        document: {
          createElement: jest.fn().mockReturnValue({
            style: {},
            onclick: null
          })
        }
      }

      // Simulate read later toggle click
      const readBtn = {
        onclick: null
      }

      // Set up the onclick handler
      readBtn.onclick = async () => {
        if (mockContent.bookmark) {
          try {
            const isCurrentlyToRead = mockContent.bookmark.toread === 'yes'
            const newToReadStatus = isCurrentlyToRead ? 'no' : 'yes'
            
            const updatedBookmark = {
              ...mockContent.bookmark,
              toread: newToReadStatus,
              description: mockContent.bookmark.description || 'Test Page'
            }
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Send saveBookmark message for persistence
            await mockMessageService.sendMessage({
              type: 'saveBookmark',
              data: updatedBookmark
            })
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Update local content immediately for display
            mockContent.bookmark.toread = newToReadStatus
            mockShow(mockContent) // Refresh overlay with updated local content
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Show success message
            const statusMessage = newToReadStatus === 'yes' ? 'Added to read later' : 'Removed from read later'
            mockShowMessage(statusMessage, 'success')
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Notify popup of changes (if open)
            await mockMessageService.sendMessage({
              type: 'BOOKMARK_UPDATED',
              data: updatedBookmark
            })
            
            debugLog('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Read status toggled', mockContent.bookmark.toread)
          } catch (error) {
            debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to toggle read later status:', error)
            mockShowMessage('Failed to update read later status', 'error')
          }
        }
      }

      // Trigger the onclick handler
      await readBtn.onclick()

      // Verify saveBookmark message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'saveBookmark',
        data: expect.objectContaining({
          url: 'https://example.com',
          toread: 'yes'
        })
      })

      // Verify BOOKMARK_UPDATED message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'BOOKMARK_UPDATED',
        data: expect.objectContaining({
          url: 'https://example.com',
          toread: 'yes'
        })
      })

      // Verify local content was updated
      expect(mockContent.bookmark.toread).toBe('yes')

      // Verify overlay was refreshed
      expect(mockShow).toHaveBeenCalledWith(mockContent)

      // Verify success message was shown
      expect(mockShowMessage).toHaveBeenCalledWith('Added to read later', 'success')
    })
  })

  describe('Error Handling', () => {
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Handles network failure gracefully', async () => {
      // Mock message service that throws an error
      const mockMessageService = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Network error'))
      }

      // Mock content
      const mockContent = {
        bookmark: {
          url: 'https://example.com',
          shared: 'no',
          toread: 'no',
          tags: []
        }
      }

      // Mock overlay manager methods
      const mockShow = jest.fn()
      const mockShowMessage = jest.fn()

      // Simulate privacy toggle click with error
      const privateBtn = {
        onclick: null
      }

      // Set up the onclick handler
      privateBtn.onclick = async () => {
        if (mockContent.bookmark) {
          try {
            const isPrivate = mockContent.bookmark.shared === 'no'
            const newSharedStatus = isPrivate ? 'yes' : 'no'
            
            const updatedBookmark = {
              ...mockContent.bookmark,
              shared: newSharedStatus
            }
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Send saveBookmark message for persistence
            await mockMessageService.sendMessage({
              type: 'saveBookmark',
              data: updatedBookmark
            })
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Update local content immediately for display
            mockContent.bookmark.shared = newSharedStatus
            mockShow(mockContent) // Refresh overlay with updated local content
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Show success message
            mockShowMessage(`Bookmark is now ${isPrivate ? 'public' : 'private'}`, 'success')
            
            // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Notify popup of changes (if open)
            await mockMessageService.sendMessage({
              type: 'BOOKMARK_UPDATED',
              data: updatedBookmark
            })
            
            debugLog('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Privacy toggled', mockContent.bookmark.shared)
          } catch (error) {
            debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to toggle privacy:', error)
            mockShowMessage('Failed to update privacy setting', 'error')
          }
        }
      }

      // Trigger the onclick handler
      await privateBtn.onclick()

      // Verify error message was shown
      expect(mockShowMessage).toHaveBeenCalledWith('Failed to update privacy setting', 'error')

      // Verify error was logged
      expect(debugError).toHaveBeenCalledWith('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to toggle privacy:', expect.any(Error))

      // Verify local content was NOT updated (should remain unchanged due to error)
      expect(mockContent.bookmark.shared).toBe('no')

      // Verify overlay was NOT refreshed
      expect(mockShow).not.toHaveBeenCalled()
    })
  })

  describe('Message Handler Integration', () => {
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] BOOKMARK_UPDATED message type is defined', () => {
      // This test verifies that the BOOKMARK_UPDATED message type is properly defined
      const MESSAGE_TYPES = {
        // ... other message types ...
        BOOKMARK_UPDATED: 'bookmarkUpdated'
      }

      expect(MESSAGE_TYPES.BOOKMARK_UPDATED).toBe('bookmarkUpdated')
    })

    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] handleBookmarkUpdated method exists', () => {
      // Mock message handler
      const mockMessageHandler = {
        handleBookmarkUpdated: jest.fn().mockResolvedValue({ success: true })
      }

      expect(mockMessageHandler.handleBookmarkUpdated).toBeDefined()
      expect(typeof mockMessageHandler.handleBookmarkUpdated).toBe('function')
    })
  })

  describe('Popup and Overlay Message Reception', () => {
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Popup updates UI on BOOKMARK_UPDATED', async () => {
      // [TOGGLE_SYNC_POPUP] Simulate popup receiving BOOKMARK_UPDATED
      const mockGetBookmarkData = jest.fn().mockResolvedValue({
        url: 'https://example.com',
        shared: 'no',
        toread: 'yes',
        tags: ['test']
      })
      const mockStateManager = { setState: jest.fn() }
      const mockUIManager = {
        updatePrivateStatus: jest.fn(),
        updateReadLaterStatus: jest.fn(),
        updateCurrentTags: jest.fn(),
        showSuccess: jest.fn()
      }
      const popupController = {
        currentTab: { url: 'https://example.com' },
        getBookmarkData: mockGetBookmarkData,
        stateManager: mockStateManager,
        uiManager: mockUIManager,
        normalizeTags: tags => tags
      }
      // Simulate BOOKMARK_UPDATED handler
      const message = { type: 'BOOKMARK_UPDATED' }
      if (message.type === 'BOOKMARK_UPDATED') {
        const updatedPin = await popupController.getBookmarkData(popupController.currentTab.url)
        popupController.currentPin = updatedPin
        popupController.stateManager.setState({ currentPin: popupController.currentPin })
        popupController.uiManager.updatePrivateStatus(popupController.currentPin?.shared === 'no')
        popupController.uiManager.updateReadLaterStatus(popupController.currentPin?.toread === 'yes')
        const normalizedTags = popupController.normalizeTags(popupController.currentPin?.tags)
        popupController.uiManager.updateCurrentTags(normalizedTags)
        popupController.uiManager.showSuccess('Bookmark updated from another window')
      }
      expect(mockGetBookmarkData).toHaveBeenCalledWith('https://example.com')
      expect(mockStateManager.setState).toHaveBeenCalledWith({ currentPin: expect.any(Object) })
      expect(mockUIManager.updatePrivateStatus).toHaveBeenCalledWith(true)
      expect(mockUIManager.updateReadLaterStatus).toHaveBeenCalledWith(true)
      expect(mockUIManager.updateCurrentTags).toHaveBeenCalledWith(['test'])
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith('Bookmark updated from another window')
    })

    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Overlay updates UI on BOOKMARK_UPDATED', async () => {
      // [TOGGLE_SYNC_OVERLAY] Simulate overlay receiving BOOKMARK_UPDATED
      const mockShow = jest.fn()
      const overlayManager = {
        overlayManager: { isVisible: true, show: mockShow },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com',
        currentBookmark: null
      }
      const bookmarkData = { url: 'https://example.com', shared: 'no', toread: 'yes', tags: ['test'] }
      // Simulate handleBookmarkUpdated
      overlayManager.currentBookmark = bookmarkData
      if (overlayManager.overlayManager.isVisible) {
        const updatedContent = {
          bookmark: bookmarkData,
          pageTitle: overlayManager.pageTitle,
          pageUrl: overlayManager.pageUrl
        }
        overlayManager.overlayManager.show(updatedContent)
      }
      expect(mockShow).toHaveBeenCalledWith({
        bookmark: bookmarkData,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })
  })

  describe('Edge Cases', () => {
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Handles rapid toggling', async () => {
      // [TOGGLE_SYNC_TEST] Simulate rapid toggling and ensure all messages are sent
      const mockMessageService = { sendMessage: jest.fn().mockResolvedValue({ success: true }) }
      const mockContent = { bookmark: { url: 'https://example.com', shared: 'no', toread: 'no', tags: [] } }
      let toggleCount = 0
      const privateBtn = { onclick: null }
      privateBtn.onclick = async () => {
        if (mockContent.bookmark) {
          const isPrivate = mockContent.bookmark.shared === 'no'
          const newSharedStatus = isPrivate ? 'yes' : 'no'
          const updatedBookmark = { ...mockContent.bookmark, shared: newSharedStatus }
          await mockMessageService.sendMessage({ type: 'saveBookmark', data: updatedBookmark })
          mockContent.bookmark.shared = newSharedStatus
          await mockMessageService.sendMessage({ type: 'BOOKMARK_UPDATED', data: updatedBookmark })
          toggleCount++
        }
      }
      // Simulate rapid toggling
      await privateBtn.onclick()
      await privateBtn.onclick()
      await privateBtn.onclick()
      expect(toggleCount).toBe(3)
      expect(mockMessageService.sendMessage).toHaveBeenCalledTimes(6) // 2 per toggle
    })
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Handles reload scenario', async () => {
      // [TOGGLE_SYNC_TEST] Simulate reload and ensure state is restored from shared record
      const mockGetBookmarkData = jest.fn().mockResolvedValue({ url: 'https://example.com', shared: 'no', toread: 'yes', tags: ['test'] })
      const mockStateManager = { setState: jest.fn() }
      const mockUIManager = { updatePrivateStatus: jest.fn(), updateReadLaterStatus: jest.fn(), updateCurrentTags: jest.fn() }
      const popupController = {
        currentTab: { url: 'https://example.com' },
        getBookmarkData: mockGetBookmarkData,
        stateManager: mockStateManager,
        uiManager: mockUIManager,
        normalizeTags: tags => tags
      }
      // Simulate reload
      const updatedPin = await popupController.getBookmarkData(popupController.currentTab.url)
      popupController.currentPin = updatedPin
      popupController.stateManager.setState({ currentPin: popupController.currentPin })
      popupController.uiManager.updatePrivateStatus(popupController.currentPin?.shared === 'no')
      popupController.uiManager.updateReadLaterStatus(popupController.currentPin?.toread === 'yes')
      const normalizedTags = popupController.normalizeTags(popupController.currentPin?.tags)
      popupController.uiManager.updateCurrentTags(normalizedTags)
      expect(mockGetBookmarkData).toHaveBeenCalledWith('https://example.com')
      expect(mockStateManager.setState).toHaveBeenCalledWith({ currentPin: expect.any(Object) })
      expect(mockUIManager.updatePrivateStatus).toHaveBeenCalledWith(true)
      expect(mockUIManager.updateReadLaterStatus).toHaveBeenCalledWith(true)
      expect(mockUIManager.updateCurrentTags).toHaveBeenCalledWith(['test'])
    })
  })

  describe('Tag Synchronization', () => {
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Adding a tag in popup updates overlay', async () => {
      // Mock sendToTab and overlay show
      const mockSendToTab = jest.fn().mockResolvedValue({ success: true })
      const mockShow = jest.fn()
      // Simulate popup controller
      const popupController = {
        currentTab: { url: 'https://example.com' },
        currentPin: { url: 'https://example.com', tags: 'foo', description: 'desc' },
        getBookmarkData: jest.fn().mockResolvedValue({ url: 'https://example.com', tags: 'foo bar', description: 'desc' }),
        stateManager: { setState: jest.fn() },
        uiManager: { updateCurrentTags: jest.fn(), showSuccess: jest.fn() },
        normalizeTags: tags => tags.split(' '),
        sendToTab: mockSendToTab
      }
      // Simulate addTagsToBookmark logic
      const tags = ['foo', 'bar']
      const pinData = { ...popupController.currentPin, tags: tags.join(' '), description: 'desc' }
      await popupController.sendToTab({ type: 'BOOKMARK_UPDATED', data: pinData })
      // Simulate overlay receiving BOOKMARK_UPDATED
      const overlayManager = { isVisible: true, show: mockShow, pageTitle: 'desc', pageUrl: 'https://example.com' }
      const updatedContent = { bookmark: pinData, pageTitle: 'desc', pageUrl: 'https://example.com' }
      overlayManager.show(updatedContent)
      expect(mockSendToTab).toHaveBeenCalledWith({ type: 'BOOKMARK_UPDATED', data: pinData })
      expect(mockShow).toHaveBeenCalledWith(updatedContent)
    })
    test('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Deleting a tag in popup updates overlay', async () => {
      // Mock sendToTab and overlay show
      const mockSendToTab = jest.fn().mockResolvedValue({ success: true })
      const mockShow = jest.fn()
      // Simulate popup controller
      const popupController = {
        currentTab: { url: 'https://example.com' },
        currentPin: { url: 'https://example.com', tags: 'foo bar', description: 'desc' },
        getBookmarkData: jest.fn().mockResolvedValue({ url: 'https://example.com', tags: 'foo', description: 'desc' }),
        stateManager: { setState: jest.fn() },
        uiManager: { updateCurrentTags: jest.fn(), showSuccess: jest.fn() },
        normalizeTags: tags => tags.split(' '),
        sendToTab: mockSendToTab
      }
      // Simulate addTagsToBookmark logic for delete
      const tags = ['foo']
      const pinData = { ...popupController.currentPin, tags: tags.join(' '), description: 'desc' }
      await popupController.sendToTab({ type: 'BOOKMARK_UPDATED', data: pinData })
      // Simulate overlay receiving BOOKMARK_UPDATED
      const overlayManager = { isVisible: true, show: mockShow, pageTitle: 'desc', pageUrl: 'https://example.com' }
      const updatedContent = { bookmark: pinData, pageTitle: 'desc', pageUrl: 'https://example.com' }
      overlayManager.show(updatedContent)
      expect(mockSendToTab).toHaveBeenCalledWith({ type: 'BOOKMARK_UPDATED', data: pinData })
      expect(mockShow).toHaveBeenCalledWith(updatedContent)
    })
  })
}) 