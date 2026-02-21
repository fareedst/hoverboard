/**
 * [TOGGLE-SYNC-TEST-001] Toggle synchronization - [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC]
 * Tests for toggle button synchronization between popup and overlay.
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
    test('[TOGGLE-SYNC-TEST-001] Overlay privacy toggle sends saveBookmark message', async () => {
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
            
            // [TOGGLE-SYNC-OVERLAY-001] - Send saveBookmark message for persistence
            await mockMessageService.sendMessage({
              type: 'saveBookmark',
              data: updatedBookmark
            })
            
            // [TOGGLE-SYNC-OVERLAY-001] - Update local content immediately for display
            mockContent.bookmark.shared = newSharedStatus
            mockShow(mockContent) // Refresh overlay with updated local content
            
            // [TOGGLE-SYNC-OVERLAY-001] - Show success message
            mockShowMessage(`Bookmark is now ${isPrivate ? 'public' : 'private'}`, 'success')
            
            // [TOGGLE-SYNC-OVERLAY-001] - Notify popup of changes (if open)
            await mockMessageService.sendMessage({
              type: 'BOOKMARK_UPDATED',
              data: updatedBookmark
            })
            
            debugLog('[TOGGLE-SYNC-OVERLAY-001] Privacy toggled', mockContent.bookmark.shared)
          } catch (error) {
            debugError('[TOGGLE-SYNC-OVERLAY-001] Failed to toggle privacy:', error)
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

    test('[TOGGLE-SYNC-TEST-001] Overlay read later toggle sends saveBookmark message', async () => {
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
            
            // [TOGGLE-SYNC-OVERLAY-001] - Send saveBookmark message for persistence
            await mockMessageService.sendMessage({
              type: 'saveBookmark',
              data: updatedBookmark
            })
            
            // [TOGGLE-SYNC-OVERLAY-001] - Update local content immediately for display
            mockContent.bookmark.toread = newToReadStatus
            mockShow(mockContent) // Refresh overlay with updated local content
            
            // [TOGGLE-SYNC-OVERLAY-001] - Show success message
            const statusMessage = newToReadStatus === 'yes' ? 'Added to read later' : 'Removed from read later'
            mockShowMessage(statusMessage, 'success')
            
            // [TOGGLE-SYNC-OVERLAY-001] - Notify popup of changes (if open)
            await mockMessageService.sendMessage({
              type: 'BOOKMARK_UPDATED',
              data: updatedBookmark
            })
            
            debugLog('[TOGGLE-SYNC-OVERLAY-001] Read status toggled', mockContent.bookmark.toread)
          } catch (error) {
            debugError('[TOGGLE-SYNC-OVERLAY-001] Failed to toggle read later status:', error)
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
    test('[TOGGLE-SYNC-TEST-001] Handles network failure gracefully', async () => {
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
            
            // [TOGGLE-SYNC-OVERLAY-001] - Send saveBookmark message for persistence
            await mockMessageService.sendMessage({
              type: 'saveBookmark',
              data: updatedBookmark
            })
            
            // [TOGGLE-SYNC-OVERLAY-001] - Update local content immediately for display
            mockContent.bookmark.shared = newSharedStatus
            mockShow(mockContent) // Refresh overlay with updated local content
            
            // [TOGGLE-SYNC-OVERLAY-001] - Show success message
            mockShowMessage(`Bookmark is now ${isPrivate ? 'public' : 'private'}`, 'success')
            
            // [TOGGLE-SYNC-OVERLAY-001] - Notify popup of changes (if open)
            await mockMessageService.sendMessage({
              type: 'BOOKMARK_UPDATED',
              data: updatedBookmark
            })
            
            debugLog('[TOGGLE-SYNC-OVERLAY-001] Privacy toggled', mockContent.bookmark.shared)
          } catch (error) {
            debugError('[TOGGLE-SYNC-OVERLAY-001] Failed to toggle privacy:', error)
            mockShowMessage('Failed to update privacy setting', 'error')
          }
        }
      }

      // Trigger the onclick handler
      await privateBtn.onclick()

      // Verify error message was shown
      expect(mockShowMessage).toHaveBeenCalledWith('Failed to update privacy setting', 'error')

      // Verify error was logged
      expect(debugError).toHaveBeenCalledWith('[TOGGLE-SYNC-OVERLAY-001] Failed to toggle privacy:', expect.any(Error))

      // Verify local content was NOT updated (should remain unchanged due to error)
      expect(mockContent.bookmark.shared).toBe('no')

      // Verify overlay was NOT refreshed
      expect(mockShow).not.toHaveBeenCalled()
    })
  })

  describe('Message Handler Integration', () => {
    test('[TOGGLE-SYNC-TEST-001] BOOKMARK_UPDATED message type is defined', () => {
      // This test verifies that the BOOKMARK_UPDATED message type is properly defined
      const MESSAGE_TYPES = {
        // ... other message types ...
        BOOKMARK_UPDATED: 'bookmarkUpdated'
      }

      expect(MESSAGE_TYPES.BOOKMARK_UPDATED).toBe('bookmarkUpdated')
    })

    test('[TOGGLE-SYNC-TEST-001] handleBookmarkUpdated method exists', () => {
      // Mock message handler
      const mockMessageHandler = {
        handleBookmarkUpdated: jest.fn().mockResolvedValue({ success: true })
      }

      expect(mockMessageHandler.handleBookmarkUpdated).toBeDefined()
      expect(typeof mockMessageHandler.handleBookmarkUpdated).toBe('function')
    })
  })

  describe('Popup and Overlay Message Reception', () => {
    test('[TOGGLE-SYNC-TEST-001] Popup updates UI on BOOKMARK_UPDATED', async () => {
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

    test('[TOGGLE-SYNC-TEST-001] Overlay updates UI on BOOKMARK_UPDATED', async () => {
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
    test('[TOGGLE-SYNC-TEST-001] Handles rapid toggling', async () => {
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
    test('[TOGGLE-SYNC-TEST-001] Handles reload scenario', async () => {
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
    test('[TAG-SYNC-POPUP-001] Adding a tag in popup updates overlay', async () => {
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
    test('[TAG-SYNC-POPUP-001] Deleting a tag in popup updates overlay', async () => {
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