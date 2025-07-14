/**
 * Popup Tag Integration Tests
 * 
 * Integration tests to verify that tags added through the popup UI
 * are properly stored and available across different popup instances.
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    getManifest: jest.fn(() => ({ version: '1.0.0' }))
  }
}

// Mock fetch
global.fetch = jest.fn()

// Mock DOM elements
document.getElementById = jest.fn()
document.querySelector = jest.fn()
document.querySelectorAll = jest.fn()

describe('Popup Tag Integration Tests', () => {
  let popupController
  let uiManager
  let stateManager
  let errorHandler

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup DOM mocks
    const mockElements = {
      mainInterface: { classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() } },
      loadingState: { classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() } },
      errorState: { classList: { add: jest.fn(), remove: jest.fn() } },
      errorMessage: { textContent: '' },
      retryBtn: { addEventListener: jest.fn() },
      currentTagsContainer: { innerHTML: '', appendChild: jest.fn() },
      recentTagsContainer: { innerHTML: '', appendChild: jest.fn() },
      newTagInput: { value: '', focus: jest.fn(), addEventListener: jest.fn() },
      addTagBtn: { disabled: false, addEventListener: jest.fn() },
      searchInput: { value: '', addEventListener: jest.fn() },
      searchBtn: { addEventListener: jest.fn() },
      showHoverBtn: { addEventListener: jest.fn() },
      togglePrivateBtn: { addEventListener: jest.fn() },
      toggleReadBtn: { addEventListener: jest.fn() },
      deleteBtn: { addEventListener: jest.fn() },
      reloadBtn: { addEventListener: jest.fn() },
      optionsBtn: { addEventListener: jest.fn() },
      versionInfo: { textContent: '' },
      connectionStatus: { classList: { add: jest.fn(), remove: jest.fn() } },
      successMessage: { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } }
    }

    // Setup chrome API mocks
    chrome.tabs.query.mockResolvedValue([{
      id: 1,
      url: 'https://example.com',
      title: 'Test Page'
    }])

    // Realistic sendMessage mock
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.type === 'saveBookmark') {
        callback({ success: true, data: { result_code: 'done' } })
      } else if (message.type === 'getCurrentBookmark') {
        callback({
          success: true,
          data: {
            url: 'https://example.com',
            description: 'Test Bookmark',
            tags: 'existing-tag',
            shared: 'yes',
            toread: 'no'
          }
        })
      } else if (message.type === 'getRecentBookmarks') {
        callback({
          success: true,
          data: {
            recentTags: ['existing-tag', 'another-tag']
          }
        })
      } else {
        callback({ success: true })
      }
    })

    // Create mock instances
    uiManager = new UIManager(mockElements)
    stateManager = new StateManager()
    errorHandler = new ErrorHandler()

    // Mock UIManager methods that need to be spied on
    uiManager.clearTagInput = jest.fn()
    uiManager.updateCurrentTags = jest.fn()
    uiManager.updateRecentTags = jest.fn()
    uiManager.showSuccess = jest.fn()
    uiManager.updateConnectionStatus = jest.fn()
    uiManager.updatePrivateStatus = jest.fn()
    uiManager.updateReadLaterStatus = jest.fn()
    uiManager.updateVersionInfo = jest.fn()
    uiManager.on = jest.fn()

    // Mock ErrorHandler methods
    errorHandler.handleError = jest.fn()

    // Create popup controller
    popupController = new PopupController({
      uiManager,
      stateManager,
      errorHandler
    })

    // Initialize popup controller state
    popupController.currentTab = {
      id: 1,
      url: 'https://example.com',
      title: 'Test Page'
    }
    popupController.currentPin = {
      url: 'https://example.com',
      description: 'Test Bookmark',
      tags: 'existing-tag',
      shared: 'yes',
      toread: 'no'
    }
  })

  describe('Tag Management', () => {
    test('should add tag through popup and persist to storage', async () => {
      // Stateful mock that tracks current tags
      let currentTags = ['existing-tag']
      let recentTags = ['existing-tag', 'another-tag']
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          // Update current tags when saving
          currentTags = message.data.tags.split(' ').filter(tag => tag.trim())
          // Add new tags to recent tags
          const newTags = message.data.tags.split(' ').filter(tag => tag.trim())
          recentTags = [...new Set([...recentTags, ...newTags])]
          callback({ success: true, data: { result_code: 'done' } })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        }
      })

      // Add a new tag
      await popupController.handleAddTag('new-tag')

      // Verify the tag was saved
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'saveBookmark',
          data: expect.objectContaining({
            tags: expect.stringContaining('new-tag')
          })
        }),
        expect.any(Function)
      )

      // Verify recent tags were refreshed
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'getRecentBookmarks'
        }),
        expect.any(Function)
      )

      // Verify UI was updated
      expect(uiManager.updateCurrentTags).toHaveBeenCalled()
      expect(uiManager.updateRecentTags).toHaveBeenCalled()
    }, 10000)

    test('should remove tag and update recent tags', async () => {
      // Stateful mock for current and recent tags
      let currentTags = ['tag1', 'tag2', 'tag3']
      let recentTags = ['tag1', 'tag2', 'tag3', 'another-tag']
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          // Remove the tag from currentTags
          currentTags = message.data.tags.split(' ').filter(tag => tag.trim())
          callback({ success: true, data: { result_code: 'done' } })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        } else {
          callback({ success: true })
        }
      })
      // Set up popupController state for this test
      popupController.currentPin = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: currentTags.join(' '),
        shared: 'yes',
        toread: 'no'
      }
      // Remove a tag
      await popupController.handleRemoveTag('tag2')
      // Verify the tag was removed
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'saveBookmark',
          data: expect.objectContaining({
            tags: expect.stringContaining('tag1 tag3')
          })
        }),
        expect.any(Function)
      )
      // Verify recent tags were refreshed
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'getRecentBookmarks'
        }),
        expect.any(Function)
      )
      // Verify UI was updated
      expect(uiManager.updateCurrentTags).toHaveBeenCalled()
      expect(uiManager.updateRecentTags).toHaveBeenCalled()
    }, 10000)

    test('should load and display recent tags on popup open', async () => {
      // Stateful mock for recent tags
      let recentTags = ['tag1', 'tag2', 'tag3', 'frequently-used']
      
      // Ensure chrome.tabs.query mock is properly set up
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: 'existing-tag',
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      
      // Load initial data (simulates popup opening)
      await popupController.loadInitialData()
      
      // Verify recent tags were loaded
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'getRecentBookmarks'
        }),
        expect.any(Function)
      )
      
      // Verify UI was updated with recent tags
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith(recentTags)
    }, 10000)

    test('should refresh recent tags after adding multiple tags', async () => {
      // Stateful mock for current and recent tags
      let currentTags = ['existing-tag']
      let recentTags = ['existing-tag']
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          // Add new tags to currentTags and recentTags
          currentTags = message.data.tags.split(' ').filter(tag => tag.trim())
          recentTags = Array.from(new Set([...recentTags, ...currentTags]))
          callback({ success: true, data: { result_code: 'done' } })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          // Return recent tags excluding current tags (simulating real behavior)
          const recentTagsExcludingCurrent = recentTags.filter(tag => 
            !currentTags.includes(tag)
          )
          callback({
            success: true,
            data: {
              recentTags: recentTagsExcludingCurrent
            }
          })
        } else {
          callback({ success: true })
        }
      })
      // Set up popupController state for this test
      popupController.currentPin = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: currentTags.join(' '),
        shared: 'yes',
        toread: 'no'
      }
      popupController.currentTab = {
        id: 1,
        url: 'https://example.com',
        title: 'Test Page'
      }
      const tags = ['tag1', 'tag2', 'tag3']
      // Add tags one by one
      for (const tag of tags) {
        await popupController.handleAddTag(tag)
      }
      // There are multiple calls due to the way handleAddTag chains calls
      // We'll check that the final recentTags contains all added tags
      expect(recentTags).toEqual(expect.arrayContaining(['existing-tag', 'tag1', 'tag2', 'tag3']))
      // Verify UI was updated with recent tags (should be empty since all tags are current tags)
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith([])
    }, 10000)
  })

  describe('Cross-Popup Instance Tag Availability', () => {
    test('should retrieve tags added in previous popup instance', async () => {
      // Simulate tags added in a previous popup instance
      let currentTags = ['existing-tag']
      let recentTags = ['existing-tag']
      // Simulate adding a tag in a previous instance
      const previouslyAddedTag = 'previous-instance-tag'
      currentTags.push(previouslyAddedTag)
      recentTags.push(previouslyAddedTag)
      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      // Mock chrome.runtime.sendMessage
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          // Return recent tags excluding current tags (simulating real behavior)
          const recentTagsExcludingCurrent = recentTags.filter(tag => 
            !currentTags.includes(tag)
          )
          callback({
            success: true,
            data: {
              recentTags: recentTagsExcludingCurrent
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      // Simulate opening a new popup instance and loading data
      await popupController.loadInitialData()
      // Verify the previously added tag is present in current tags but not in recent tags
      expect(uiManager.updateCurrentTags).toHaveBeenCalledWith(
        expect.arrayContaining([previouslyAddedTag])
      )
      // Recent tags should be empty since all tags are current tags
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith([])
    }, 10000)

    test('should handle tag removal and update across instances', async () => {
      // Simulate tags in a previous popup instance
      let currentTags = ['keep-tag', 'tag-to-remove', 'another-tag']
      let recentTags = ['keep-tag', 'tag-to-remove', 'another-tag']
      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      // Mock chrome.runtime.sendMessage
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          // Remove the tag from currentTags and recentTags
          currentTags = message.data.tags.split(' ').filter(tag => tag.trim())
          recentTags = recentTags.filter(tag => tag !== 'tag-to-remove')
          callback({ success: true, data: { result_code: 'done' } })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      // Simulate removing a tag in the popup
      await popupController.handleRemoveTag('tag-to-remove')
      // Simulate opening a new popup instance and loading data
      await popupController.loadInitialData()
      // Verify the removed tag is not present in current or recent tags
      expect(uiManager.updateCurrentTags).toHaveBeenCalledWith(
        expect.not.arrayContaining(['tag-to-remove'])
      )
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith(
        expect.not.arrayContaining(['tag-to-remove'])
      )
    }, 10000)

    test('should maintain tag order consistency across instances', async () => {
      // Simulate ordered tags in a previous popup instance
      let orderedTags = ['tag1', 'tag2', 'tag3', 'tag4']
      let recentTags = [...orderedTags]
      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      // Mock chrome.runtime.sendMessage
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: orderedTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      // Simulate opening a new popup instance and loading data
      await popupController.loadInitialData()
      // Verify the order of tags is preserved in current and recent tags
      expect(uiManager.updateCurrentTags).toHaveBeenCalledWith(orderedTags)
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith([])
    }, 10000)
  })

  describe('Tag Input and UI Integration', () => {
    test('should handle empty tag input gracefully', async () => {
      // Try to add empty tag
      await popupController.handleAddTag('')

      // Verify no API call was made
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'saveBookmark'
        }),
        expect.any(Function)
      )
    })

    test('should handle whitespace-only tag input', async () => {
      // Try to add whitespace-only tag
      await popupController.handleAddTag('   ')

      // Verify no API call was made
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'saveBookmark'
        }),
        expect.any(Function)
      )
    })

    test('should normalize tag input (trim whitespace)', async () => {
      // Stateful mock for current and recent tags
      let currentTags = ['existing-tag']
      let recentTags = ['existing-tag']
      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      // Mock chrome.runtime.sendMessage
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          currentTags = message.data.tags.split(' ').filter(tag => tag.trim())
          recentTags = Array.from(new Set([...recentTags, ...currentTags]))
          callback({ success: true, data: { result_code: 'done' } })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          // Return recent tags excluding current tags (simulating real behavior)
          const recentTagsExcludingCurrent = recentTags.filter(tag => 
            !currentTags.includes(tag)
          )
          callback({
            success: true,
            data: {
              recentTags: recentTagsExcludingCurrent
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      // Set up popupController state for this test
      popupController.currentPin = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: currentTags.join(' '),
        shared: 'yes',
        toread: 'no'
      }
      popupController.currentTab = {
        id: 1,
        url: 'https://example.com',
        title: 'Test Page'
      }
      const rawTag = '  test-tag  '
      const normalizedTag = 'test-tag'
      await popupController.handleAddTag(rawTag)
      // Verify normalized tag was saved and displayed
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'saveBookmark',
          data: expect.objectContaining({
            tags: expect.stringContaining(normalizedTag)
          })
        }),
        expect.any(Function)
      )
      expect(uiManager.updateCurrentTags).toHaveBeenCalledWith(
        expect.arrayContaining([normalizedTag])
      )
      // Recent tags should be empty since the normalized tag is now a current tag
      expect(uiManager.updateRecentTags).toHaveBeenCalledWith([])
    }, 10000)
  })

  describe('Error Handling in Popup', () => {
    test('should handle API failures gracefully', async () => {
      // Mock API failure
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          callback({ success: false, error: 'API Error' });
        } else {
          callback({ success: true });
        }
      });

      // Try to add tag
      await popupController.handleAddTag('test-tag');

      // Verify error was handled
      expect(errorHandler.handleError).toHaveBeenCalledWith(
        'Failed to add tags',
        expect.any(Error)
      );
    });

    test('should handle network failures during tag addition', async () => {
      // Mock network failure
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          callback({ success: false, error: 'Network error' });
        } else {
          callback({ success: true });
        }
      });

      // Try to add tag
      await popupController.handleAddTag('test-tag');

      // Verify error was handled gracefully
      expect(errorHandler.handleError).toHaveBeenCalled();
    });

    test('should continue operation after tag addition failure', async () => {
      // Stateful mock for current and recent tags
      let currentTags = ['existing-tag']
      let recentTags = ['existing-tag']
      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      // Mock chrome.runtime.sendMessage
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          // Simulate failure on saveBookmark
          callback({ success: false, error: 'Simulated failure' })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      // Set up popupController state for this test
      popupController.currentPin = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: currentTags.join(' '),
        shared: 'yes',
        toread: 'no'
      }
      popupController.currentTab = {
        id: 1,
        url: 'https://example.com',
        title: 'Test Page'
      }
      // Try to add a tag, which will fail
      await popupController.handleAddTag('fail-tag')
      // Should call errorHandler.handleError
      expect(errorHandler.handleError).toHaveBeenCalledWith(
        'Failed to add tags', expect.any(Error)
      )
      // Should still update UI with current and recent tags (should not throw)
      expect(uiManager.updateCurrentTags).toHaveBeenCalled()
      expect(uiManager.updateRecentTags).toHaveBeenCalled()
    }, 10000)
  })

  describe('Tag State Management', () => {
    test('should update state manager when tags are added', async () => {
      // Stateful mock for current and recent tags
      let currentTags = ['existing-tag']
      let recentTags = ['existing-tag']
      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      // Mock chrome.runtime.sendMessage
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          currentTags = message.data.tags.split(' ').filter(tag => tag.trim())
          recentTags = Array.from(new Set([...recentTags, ...currentTags]))
          callback({ success: true, data: { result_code: 'done' } })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      // Set up popupController state for this test
      popupController.currentPin = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: currentTags.join(' '),
        shared: 'yes',
        toread: 'no'
      }
      popupController.currentTab = {
        id: 1,
        url: 'https://example.com',
        title: 'Test Page'
      }
      const newTag = 'state-test-tag'
      const expectedTags = ['existing-tag', newTag]
      await popupController.handleAddTag(newTag)
      // Verify state manager was updated with new tags
      const state = stateManager.getState()
      expect(state.currentPin.tags.split(' ')).toEqual(expect.arrayContaining(expectedTags))
    }, 10000)

    test('should update state manager when tags are removed', async () => {
      // Stateful mock for current and recent tags
      let currentTags = ['keep-tag', 'remove-test-tag']
      let recentTags = ['keep-tag', 'remove-test-tag']
      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{
          id: 1,
          url: 'https://example.com',
          title: 'Test Page'
        }])
      })
      // Mock chrome.runtime.sendMessage
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.type === 'saveBookmark') {
          currentTags = message.data.tags.split(' ').filter(tag => tag.trim())
          recentTags = recentTags.filter(tag => tag !== 'remove-test-tag')
          callback({ success: true, data: { result_code: 'done' } })
        } else if (message.type === 'getCurrentBookmark') {
          callback({
            success: true,
            data: {
              url: 'https://example.com',
              description: 'Test Bookmark',
              tags: currentTags.join(' '),
              shared: 'yes',
              toread: 'no'
            }
          })
        } else if (message.type === 'getRecentBookmarks') {
          callback({
            success: true,
            data: {
              recentTags: recentTags
            }
          })
        } else {
          callback({ success: true, data: {} })
        }
      })
      // Set up popupController state for this test
      popupController.currentPin = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: currentTags.join(' '),
        shared: 'yes',
        toread: 'no'
      }
      popupController.currentTab = {
        id: 1,
        url: 'https://example.com',
        title: 'Test Page'
      }
      const tagToRemove = 'remove-test-tag'
      const remainingTags = ['keep-tag']
      await popupController.handleRemoveTag(tagToRemove)
      // Verify state manager was updated with remaining tags
      const state = stateManager.getState()
      expect(state.currentPin.tags.split(' ')).toEqual(expect.arrayContaining(remainingTags))
      expect(state.currentPin.tags.split(' ')).not.toContain(tagToRemove)
    }, 10000)
  })
}) 