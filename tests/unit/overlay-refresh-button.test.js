// [OVERLAY-REFRESH-TEST-001] Unit tests for overlay refresh button
import { jest } from '@jest/globals'

// Mock the overlay manager for testing
class MockOverlayManager {
  constructor() {
    this.messageService = {
      sendMessage: jest.fn()
    }
    this.showMessage = jest.fn()
    this.show = jest.fn()
  }

  async refreshOverlayContent() {
    try {
      const refreshData = {
        url: 'https://example.com',
        title: 'Test Page',
        tabId: null
      }

      const response = await this.messageService.sendMessage({
        type: 'getCurrentBookmark',
        data: refreshData
      })

      if (response && response.success && response.data) {
        return {
          bookmark: response.data,
          pageTitle: 'Test Page',
          pageUrl: 'https://example.com'
        }
      }
    } catch (error) {
      console.error('Failed to refresh overlay content:', error)
    }
    return null
  }

  async handleRefreshButtonClick() {
    try {
      console.log('[OVERLAY-REFRESH-HANDLER-001] Refresh button clicked')
      
      this.showMessage('Refreshing data...', 'info')
      
      const updatedContent = await this.refreshOverlayContent()
      
      if (updatedContent) {
        this.show(updatedContent)
        this.showMessage('Data refreshed successfully', 'success')
        console.log('[OVERLAY-REFRESH-HANDLER-001] Overlay refreshed successfully')
      } else {
        throw new Error('Failed to get updated data')
      }
    } catch (error) {
      console.error('[OVERLAY-REFRESH-HANDLER-001] Refresh failed:', error)
      this.showMessage('Failed to refresh data', 'error')
    }
  }
}

describe('[OVERLAY-REFRESH-BUTTON-001] Overlay Refresh Button Unit Tests', () => {
  let overlayManager

  beforeEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Setup test environment
    overlayManager = new MockOverlayManager()
  })

  describe('[OVERLAY-REFRESH-HANDLER-001] Refresh Button Handler Tests', () => {
    test('should handle refresh button click successfully', async () => {
      // [OVERLAY-REFRESH-HANDLER-001] Test click handler
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com',
          description: 'Updated Bookmark',
          tags: ['updated', 'refresh'],
          shared: 'yes',
          toread: 'no'
        }
      }

      overlayManager.messageService.sendMessage.mockResolvedValue(mockResponse)

      await overlayManager.handleRefreshButtonClick()

      // Verify message was sent
      expect(overlayManager.messageService.sendMessage).toHaveBeenCalledWith({
        type: 'getCurrentBookmark',
        data: {
          url: 'https://example.com',
          title: 'Test Page',
          tabId: null
        }
      })

      // Verify overlay was updated
      expect(overlayManager.show).toHaveBeenCalled()
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })

    test('should handle refresh errors gracefully', async () => {
      // [OVERLAY-REFRESH-ERROR-001] Test error handling
      overlayManager.messageService.sendMessage.mockRejectedValue(new Error('API Error'))

      await overlayManager.handleRefreshButtonClick()

      // Verify error was handled
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })

    test('should handle empty response gracefully', async () => {
      // [OVERLAY-REFRESH-ERROR-001] Test empty response handling
      overlayManager.messageService.sendMessage.mockResolvedValue({ success: false })

      await overlayManager.handleRefreshButtonClick()

      // Verify error was handled
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })
  })

  describe('[OVERLAY-REFRESH-INTEGRATION-001] Data Integration Tests', () => {
    test('should refresh overlay content with updated data', async () => {
      // [OVERLAY-REFRESH-INTEGRATION-001] Test data refresh
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com',
          description: 'Updated Bookmark',
          tags: ['new', 'tags'],
          shared: 'no',
          toread: 'yes'
        }
      }

      overlayManager.messageService.sendMessage.mockResolvedValue(mockResponse)

      const result = await overlayManager.refreshOverlayContent()

      expect(result).toEqual({
        bookmark: mockResponse.data,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })

    test('should handle network errors during refresh', async () => {
      // [OVERLAY-REFRESH-ERROR-001] Test network error handling
      overlayManager.messageService.sendMessage.mockRejectedValue(new Error('Network Error'))

      const result = await overlayManager.refreshOverlayContent()

      expect(result).toBeNull()
    })
  })

  describe('[OVERLAY-REFRESH-UI-001] UI Integration Tests', () => {
    test('should show loading message when refresh starts', async () => {
      // [OVERLAY-REFRESH-UI-001] Test loading state
      const mockResponse = {
        success: true,
        data: { url: 'https://example.com' }
      }

      overlayManager.messageService.sendMessage.mockResolvedValue(mockResponse)

      await overlayManager.handleRefreshButtonClick()

      // Verify loading message was shown
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Refreshing data...', 'info')
    })

    test('should show success message when refresh completes', async () => {
      // [OVERLAY-REFRESH-UI-001] Test success state
      const mockResponse = {
        success: true,
        data: { url: 'https://example.com' }
      }

      overlayManager.messageService.sendMessage.mockResolvedValue(mockResponse)

      await overlayManager.handleRefreshButtonClick()

      // Verify success message was shown
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })
  })
}) 