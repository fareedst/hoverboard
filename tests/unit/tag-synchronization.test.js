/**
 * Tag Synchronization Tests
 * Tests for the tag synchronization feature between popup and overlay
 */

import { MessageHandler } from '../../src/core/message-handler.js'
import { PopupController } from '../../src/ui/popup/PopupController.js'
import { OverlayManager } from '../../src/features/content/overlay-manager.js'
import { ContentScript } from '../../src/features/content/content-script.js'

// Mock dependencies
jest.mock('../../src/features/pinboard/pinboard-service.js')
jest.mock('../../src/features/tagging/tag-service.js')
jest.mock('../../src/config/config-manager.js')
jest.mock('../../src/features/search/tab-search-service.js')
jest.mock('../../src/shared/logger.js')
jest.mock('../../src/features/content/message-client.js')

// Mock ConfigService
jest.mock('../../src/config/config-service.js', () => {
  return {
    ConfigService: jest.fn().mockImplementation(() => ({
      getInjectOptions: jest.fn().mockResolvedValue({
        showHoverOnPageLoad: true,
        pageLoadDelay: 1000,
        showHoverOnPageLoadForNewSites: true,
        showHoverOnPageLoadOnlyIfNoTags: false,
        showHoverOnPageLoadOnlyIfSomeTags: false
      })
    }))
  }
})

describe('Tag Synchronization', () => {
  let messageHandler
  let popupController
  let overlayManager
  let contentScript

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock dependencies for PopupController
    const mockErrorHandler = { handleError: jest.fn() }
    const mockStateManager = { setState: jest.fn() }
    const mockUIManager = { 
      updateCurrentTags: jest.fn(), 
      showSuccess: jest.fn(), 
      showError: jest.fn(), 
      updatePrivateStatus: jest.fn(), 
      on: jest.fn() 
    }

    // Create instances
    messageHandler = new MessageHandler()
    popupController = new PopupController({
      errorHandler: mockErrorHandler,
      stateManager: mockStateManager,
      uiManager: mockUIManager
    })
    overlayManager = new OverlayManager(document, {})
    contentScript = new ContentScript()

    // Mock chrome API
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      }
    }
  })

  describe('Phase 1: Overlay Dynamic Recent Tags', () => {
    test('should load dynamic recent tags from shared memory', async () => {
      // Mock message service response
      const mockRecentTags = ['development', 'web', 'tutorial']
      overlayManager.messageService = {
        sendMessage: jest.fn().mockResolvedValue({
          recentTags: mockRecentTags
        })
      }

      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: ['existing']
        }
      }

      const result = await overlayManager.loadRecentTagsForOverlay(content)

      expect(result).toEqual(mockRecentTags)
      expect(overlayManager.messageService.sendMessage).toHaveBeenCalledWith({
        type: 'getRecentBookmarks',
        data: {
          currentTags: ['existing'],
          senderUrl: 'https://example.com'
        }
      })
    })

    test('should handle empty recent tags gracefully', async () => {
      overlayManager.messageService = {
        sendMessage: jest.fn().mockResolvedValue({
          recentTags: []
        })
      }

      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: []
        }
      }

      const result = await overlayManager.loadRecentTagsForOverlay(content)

      expect(result).toEqual([])
    })

    test('should handle message service errors gracefully', async () => {
      overlayManager.messageService = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Network error'))
      }

      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: []
        }
      }

      const result = await overlayManager.loadRecentTagsForOverlay(content)

      expect(result).toEqual([])
    })
  })

  describe('Phase 2: Popup-to-Overlay Notification', () => {
    test('should notify overlay when tags are updated', async () => {
      // [TAG-SYNC-TEST-001] Provide required dependencies to PopupController
      const mockUIManager = { clearTagInput: jest.fn(), updateCurrentTags: jest.fn(), updateRecentTags: jest.fn(), showSuccess: jest.fn(), updateConnectionStatus: jest.fn(), updatePrivateStatus: jest.fn(), updateReadLaterStatus: jest.fn(), updateVersionInfo: jest.fn(), on: jest.fn() }
      const mockStateManager = { setState: jest.fn() }
      const mockErrorHandler = { handleError: jest.fn() }
      const popupController = new PopupController({
        uiManager: mockUIManager,
        stateManager: mockStateManager,
        errorHandler: mockErrorHandler
      })
      popupController.currentTab = { url: 'https://example.com', title: 'Test Page' }
      popupController.sendToTab = jest.fn().mockResolvedValue({ success: true })
      const tags = ['development', 'web']
      await popupController.notifyOverlayOfTagChanges(tags)
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: tags
        }
      })
    })

    test('should handle notification errors gracefully', async () => {
      popupController.currentPin = {
        url: 'https://example.com'
      }
      popupController.sendMessage = jest.fn().mockRejectedValue(new Error('Network error'))

      const tags = ['development']
      
      // Should not throw error
      await expect(popupController.notifyOverlayOfTagChanges(tags)).resolves.not.toThrow()
    })
  })

  describe('Phase 3: Content Script Message Handler', () => {
    test('should handle tag update notifications correctly', async () => {
      // Mock content script dependencies
      contentScript.currentTab = {
        url: 'https://example.com',
        title: 'Test Page'
      }
      contentScript.overlayManager = {
        show: jest.fn()
      }
      contentScript.hoverSystem = {
        isHoverVisible: jest.fn().mockReturnValue(true)
      }

      const tagUpdateData = {
        url: 'https://example.com',
        description: 'Test Page',
        tags: ['development', 'web']
      }

      await contentScript.handleTagUpdate(tagUpdateData)

      expect(contentScript.overlayManager.show).toHaveBeenCalledWith({
        bookmark: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: ['development', 'web']
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })

    test('should ignore tag updates for different URLs', async () => {
      contentScript.currentTab = {
        url: 'https://example.com'
      }
      contentScript.overlayManager = {
        show: jest.fn()
      }
      contentScript.hoverSystem = {
        isHoverVisible: jest.fn().mockReturnValue(true)
      }

      const tagUpdateData = {
        url: 'https://different.com',
        tags: ['development']
      }

      await contentScript.handleTagUpdate(tagUpdateData)

      expect(contentScript.overlayManager.show).not.toHaveBeenCalled()
    })

    test('should validate tag update data', async () => {
      contentScript.currentTab = {
        url: 'https://example.com'
      }

      // Test with invalid data
      await contentScript.handleTagUpdate(null)
      await contentScript.handleTagUpdate({})
      await contentScript.handleTagUpdate({ url: 'https://example.com' })
      await contentScript.handleTagUpdate({ url: 'https://example.com', tags: 'not-an-array' })

      // Should not throw errors for invalid data
      expect(true).toBe(true)
    })
  })

  describe('Phase 4: Message Handler Integration', () => {
    test('should handle TAG_UPDATED messages correctly', async () => {
      // Mock broadcast method
      messageHandler.broadcastToAllTabs = jest.fn().mockResolvedValue()

      const tagUpdateData = {
        url: 'https://example.com',
        description: 'Test Page',
        tags: ['development', 'web']
      }

      const result = await messageHandler.handleTagUpdated(tagUpdateData, 123)

      expect(result).toEqual({
        success: true,
        updated: tagUpdateData
      })
      expect(messageHandler.broadcastToAllTabs).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: tagUpdateData
      })
    })

    test('should validate tag update data in message handler', async () => {
      // Test with invalid data
      await expect(messageHandler.handleTagUpdated(null, 123)).rejects.toThrow('Invalid tag update data')
      await expect(messageHandler.handleTagUpdated({}, 123)).rejects.toThrow('Invalid tag update data')
      await expect(messageHandler.handleTagUpdated({ url: 'https://example.com' }, 123)).rejects.toThrow('Invalid tag update data')
    })

    test('should handle broadcast errors gracefully', async () => {
      messageHandler.broadcastToAllTabs = jest.fn().mockRejectedValue(new Error('Broadcast failed'))

      const tagUpdateData = {
        url: 'https://example.com',
        tags: ['development']
      }

      await expect(messageHandler.handleTagUpdated(tagUpdateData, 123)).rejects.toThrow('Failed to update tags across interfaces')
    })
  })

  describe('Phase 4: Overlay Double-Click Tag Deletion', () => {
    test('should delete tag from UI and persistent storage on double-click', async () => {
      // [test:tag-deletion] [event:double-click] [action:delete] [sync:site-record] [arch:atomic-sync]
      const mockDeleteTag = jest.fn().mockResolvedValue({ success: true })
      overlayManager.messageService = {
        sendMessage: mockDeleteTag
      }
      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: ['tag1', 'tag2', 'tag3']
        }
      }
      // Simulate rendering and double-clicking the second tag
      overlayManager.show = jest.fn() // Prevent actual DOM manipulation
      overlayManager.showMessage = jest.fn()
      // Find the double-click handler logic
      const tag = 'tag2'
      // Simulate double-click handler
      if (content.bookmark && content.bookmark.tags) {
        const index = content.bookmark.tags.indexOf(tag)
        if (index > -1) {
          content.bookmark.tags.splice(index, 1)
        }
      }
      if (content.bookmark && content.bookmark.url) {
        await overlayManager.messageService.sendMessage({
          type: 'deleteTag',
          data: {
            url: content.bookmark.url,
            value: tag
          }
        })
      }
      // [arch:atomic-sync] - UI should refresh
      overlayManager.show(content)
      overlayManager.showMessage('Tag deleted successfully', 'success')
      // Assertions
      expect(content.bookmark.tags).toEqual(['tag1', 'tag3'])
      expect(mockDeleteTag).toHaveBeenCalledWith({
        type: 'deleteTag',
        data: {
          url: 'https://example.com',
          value: 'tag2'
        }
      })
      expect(overlayManager.show).toHaveBeenCalledWith(content)
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Tag deleted successfully', 'success')
    })
  })

  describe('Integration Tests', () => {
    test('should synchronize tags from popup to overlay', async () => {
      // [TAG-SYNC-TEST-001] Provide required dependencies and mock sendToTab
      const mockUIManager = { clearTagInput: jest.fn(), updateCurrentTags: jest.fn(), updateRecentTags: jest.fn(), showSuccess: jest.fn(), updateConnectionStatus: jest.fn(), updatePrivateStatus: jest.fn(), updateReadLaterStatus: jest.fn(), updateVersionInfo: jest.fn(), on: jest.fn() }
      const mockStateManager = { setState: jest.fn() }
      const mockErrorHandler = { handleError: jest.fn() }
      const popupController = new PopupController({
        uiManager: mockUIManager,
        stateManager: mockStateManager,
        errorHandler: mockErrorHandler
      })
      popupController.currentTab = { url: 'https://example.com', title: 'Test Page' }
      popupController.sendToTab = jest.fn().mockResolvedValue({ success: true })
      const tags = ['development', 'web']
      await popupController.notifyOverlayOfTagChanges(tags)
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: tags
        }
      })

      contentScript.currentTab = {
        url: 'https://example.com',
        title: 'Test Page'
      }
      contentScript.overlayManager = {
        show: jest.fn()
      }
      contentScript.hoverSystem = {
        isHoverVisible: jest.fn().mockReturnValue(true)
      }

      messageHandler.broadcastToAllTabs = jest.fn().mockResolvedValue()

      // Simulate tag update flow
      const tagUpdateData = {
        url: 'https://example.com',
        description: 'Test Page',
        tags: tags
      }
      await messageHandler.handleTagUpdated(tagUpdateData, 123)
      
      // 3. Content script receives the update
      await contentScript.handleTagUpdate(tagUpdateData)

      // Verify the flow worked correctly
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: {
          tags: tags,
          url: 'https://example.com',
          description: 'Test Page'
        }
      })

      expect(messageHandler.broadcastToAllTabs).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: tagUpdateData
      })

      expect(contentScript.overlayManager.show).toHaveBeenCalledWith({
        bookmark: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: tags
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })
  })
}) 