/**
 * PopupController - Main business logic controller for the popup
 */

import { UIManager } from './UIManager.js'
import { StateManager } from './StateManager.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { debugLog, debugError } from '../../shared/utils.js'

export class PopupController {
  constructor (dependencies = {}) {
    this.uiManager = dependencies.uiManager || new UIManager()
    this.stateManager = dependencies.stateManager || new StateManager()
    this.errorHandler = dependencies.errorHandler || new ErrorHandler()

    this.currentTab = null
    this.currentPin = null
    this.isInitialized = false
    this.isLoading = false

    // Bind methods
    this.loadInitialData = this.loadInitialData.bind(this)
    this.handleShowHoverboard = this.handleShowHoverboard.bind(this)
    this.handleTogglePrivate = this.handleTogglePrivate.bind(this)
    this.handleReadLater = this.handleReadLater.bind(this)
    this.handleAddTag = this.handleAddTag.bind(this)
    this.handleRemoveTag = this.handleRemoveTag.bind(this)
    this.handleSearch = this.handleSearch.bind(this)
    this.handleDeletePin = this.handleDeletePin.bind(this)
    this.handleReloadExtension = this.handleReloadExtension.bind(this)
    this.handleOpenOptions = this.handleOpenOptions.bind(this)
    this.normalizeTags = this.normalizeTags.bind(this)

    this.setupEventListeners()

    // [TOGGLE_SYNC_POPUP] Listen for BOOKMARK_UPDATED to sync popup UI with shared state
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === 'BOOKMARK_UPDATED') {
          try {
            // [TOGGLE_SYNC_POPUP] Fetch latest bookmark data for current tab
            if (this.currentTab && this.currentTab.url) {
              const updatedPin = await this.getBookmarkData(this.currentTab.url)
              this.currentPin = updatedPin
              this.stateManager.setState({ currentPin: this.currentPin })
              // [TOGGLE_SYNC_POPUP] Update UI to reflect new state
              this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')
              this.uiManager.updateReadLaterStatus(this.currentPin?.toread === 'yes')
              const normalizedTags = this.normalizeTags(this.currentPin?.tags)
              this.uiManager.updateCurrentTags(normalizedTags)
              // Optionally, show a message to the user
              this.uiManager.showSuccess('Bookmark updated from another window')
            }
          } catch (error) {
            debugError('[TOGGLE_SYNC_POPUP] Failed to update popup on BOOKMARK_UPDATED:', error)
          }
        }
      })
    }
  }

  /**
   * Normalize tags to array format regardless of input type
   */
  normalizeTags (tags) {
    if (!tags) return []

    if (typeof tags === 'string') {
      // If tags is a string, split by spaces and filter out empty strings
      return tags.split(' ').filter(tag => tag.trim())
    } else if (Array.isArray(tags)) {
      // If tags is already an array, filter out empty or non-string values
      return tags.filter(tag => tag && typeof tag === 'string' && tag.trim())
    }

    // For any other type, return empty array
    return []
  }

  /**
   * Setup event listeners for popup actions
   */
  setupEventListeners () {
    // Action buttons
    this.uiManager.on('showHoverboard', this.handleShowHoverboard)
    this.uiManager.on('togglePrivate', this.handleTogglePrivate)
    this.uiManager.on('readLater', this.handleReadLater)
    this.uiManager.on('addTag', this.handleAddTag)
    this.uiManager.on('removeTag', this.handleRemoveTag)
    this.uiManager.on('search', this.handleSearch)

    this.uiManager.on('deletePin', this.handleDeletePin)
    this.uiManager.on('reloadExtension', this.handleReloadExtension)
    this.uiManager.on('openOptions', this.handleOpenOptions)
  }

  /**
   * Load initial data when popup opens
   */
  async loadInitialData () {
    try {
      this.setLoading(true)

      // Get current tab information
      this.currentTab = await this.getCurrentTab()
      if (!this.currentTab) {
        throw new Error('Unable to get current tab information')
      }

      // Update state with tab info
      this.stateManager.setState({
        currentTab: this.currentTab,
        url: this.currentTab.url,
        title: this.currentTab.title
      })

      // Get bookmark data for current URL
      this.currentPin = await this.getBookmarkData(this.currentTab.url)
      this.stateManager.setState({ currentPin: this.currentPin })

      // Debug: Log the bookmark data structure
      debugLog('Bookmark data received:', this.currentPin)
      if (this.currentPin?.tags) {
        debugLog('Tags data type:', typeof this.currentPin.tags)
        debugLog('Tags data:', this.currentPin.tags)
      }

      // Process and normalize tags
      const normalizedTags = this.normalizeTags(this.currentPin?.tags)

      // Update UI with loaded data
      this.uiManager.updateCurrentTags(normalizedTags)
      this.uiManager.updateConnectionStatus(true)
      this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')

      // Check if current bookmark has read later status
      const hasReadLaterStatus = this.currentPin?.toread === 'yes'
      this.uiManager.updateReadLaterStatus(hasReadLaterStatus)

      // Load recent tags
      await this.loadRecentTags()

      // Set version info
      const manifest = chrome.runtime.getManifest()
      this.uiManager.updateVersionInfo(manifest.version)

      // Mark as initialized
      this.isInitialized = true
      debugLog('[POPUP-CONTROLLER] Popup initialization completed')
    } catch (error) {
      debugError('Failed to load initial data:', error)
      if (this.errorHandler) {
        this.errorHandler.handleError('Failed to load initial data', error)
      }
      this.uiManager.updateConnectionStatus(false)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Load user-driven recent tags from shared memory
   * Excludes tags already assigned to the current site
   */
  async loadRecentTags () {
    try {
      debugLog('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Loading user-driven recent tags')

      // [IMMUTABLE-REQ-TAG-003] - Get current tags to exclude from recent tags
      const currentTags = this.normalizeTags(this.currentPin?.tags || [])
      debugLog('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Current tags to exclude:', currentTags)

      // [IMMUTABLE-REQ-TAG-003] - Get user recent tags excluding current site
      const response = await this.sendMessage({
        type: 'getRecentBookmarks',
        data: {
          currentTags: currentTags, // Pass current tags for exclusion
          senderUrl: this.currentTab?.url
        }
      })

      debugLog('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Recent bookmarks response received:', response)

      if (response && response.recentTags) {
        debugLog('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Recent tags from response:', response.recentTags)

        // [IMMUTABLE-REQ-TAG-003] - Extract tag names from recent tags data
        // Handle both string arrays and object arrays
        const recentTagNames = response.recentTags.map(tag => {
          if (typeof tag === 'string') {
            return tag
          } else if (tag && typeof tag === 'object' && tag.name) {
            return tag.name
          } else {
            return String(tag)
          }
        })

        debugLog('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Extracted recent tag names:', recentTagNames)

        // [IMMUTABLE-REQ-TAG-003] - Tags are already filtered by the service, but double-check
        const filteredRecentTags = recentTagNames.filter(tag =>
          !currentTags.includes(tag)
        )

        debugLog('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Final filtered recent tags:', filteredRecentTags)

        this.uiManager.updateRecentTags(filteredRecentTags)
      } else {
        debugLog('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] No recent tags in response, updating with empty array')
        this.uiManager.updateRecentTags([])
      }
    } catch (error) {
      debugError('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Failed to load recent tags:', error)
      this.uiManager.updateRecentTags([])
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Validate tag input
   * @param {string} tag - Tag to validate
   * @returns {boolean} Whether tag is valid
   */
  isValidTag (tag) {
    if (!tag || typeof tag !== 'string') {
      return false
    }

    const trimmedTag = tag.trim()
    if (trimmedTag.length === 0 || trimmedTag.length > 50) {
      return false
    }

    // [IMMUTABLE-REQ-TAG-001] - Check for invalid characters
    const invalidChars = /[<>]/g
    if (invalidChars.test(trimmedTag)) {
      return false
    }

    // [IMMUTABLE-REQ-TAG-001] - Check for only safe characters
    const safeChars = /^[\w\s-]+$/
    if (!safeChars.test(trimmedTag)) {
      return false
    }

    return true
  }

  /**
   * Get current active tab
   */
  async getCurrentTab () {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (tabs && tabs.length > 0) {
          resolve(tabs[0])
        } else {
          reject(new Error('No active tab found'))
        }
      })
    })
  }

  /**
   * Get bookmark data for a URL
   */
  async getBookmarkData (url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'getCurrentBookmark',
          data: { url }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }

          if (response && response.success) {
            resolve(response.data)
          } else {
            reject(new Error(response?.error || 'Failed to get bookmark data'))
          }
        }
      )
    })
  }

  /**
   * Send message to background script
   */
  async sendMessage (message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (response && response.success) {
          resolve(response.data)
        } else {
          reject(new Error(response?.error || 'Request failed'))
        }
      })
    })
  }

  /**
   * Send message to content script in current tab
   */
  async sendToTab (message) {
    if (!this.currentTab) {
      throw new Error('No current tab available')
    }

    // Check if we can inject into this tab
    if (!this.canInjectIntoTab(this.currentTab)) {
      throw new Error('Cannot inject into this tab')
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          // If content script isn't loaded, try to inject it
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            debugLog('Content script not found, attempting injection...')
            this.injectContentScript(this.currentTab.id)
              .then(() => {
                debugLog('Content script injected, waiting for initialization...')
                // Wait a bit for the content script to initialize before retrying
                setTimeout(() => {
                  chrome.tabs.sendMessage(this.currentTab.id, message, (retryResponse) => {
                    if (chrome.runtime.lastError) {
                      debugError('Retry failed, trying fallback injection:', chrome.runtime.lastError.message)
                      // ES6 module injection failed, try fallback approach
                      this.injectFallbackContentScript(this.currentTab.id)
                        .then(() => {
                          // Try sending message again after fallback injection
                          setTimeout(() => {
                            chrome.tabs.sendMessage(this.currentTab.id, message, (fallbackResponse) => {
                              if (chrome.runtime.lastError) {
                                debugError('Fallback also failed:', chrome.runtime.lastError.message)
                                reject(new Error(chrome.runtime.lastError.message))
                                return
                              }
                              debugLog('Message sent successfully after fallback injection')
                              resolve(fallbackResponse)
                            })
                          }, 500)
                        })
                        .catch(fallbackError => {
                          debugError('Fallback injection failed:', fallbackError)
                          reject(new Error(`Both injection methods failed: ${fallbackError.message}`))
                        })
                      return
                    }
                    debugLog('Message sent successfully after injection')
                    resolve(retryResponse)
                  })
                }, 1000) // Wait 1 second for content script to initialize
              })
              .catch(error => {
                debugError('Content script injection failed:', error)
                reject(new Error(`Failed to inject content script: ${error.message}`))
              })
            return
          }
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        resolve(response)
      })
    })
  }

  /**
   * Check if we can inject into a tab
   */
  canInjectIntoTab (tab) {
    // Don't inject into chrome:// pages or extension pages
    return tab.url &&
           !tab.url.startsWith('chrome://') &&
           !tab.url.startsWith('chrome-extension://') &&
           !tab.url.startsWith('edge://') &&
           !tab.url.startsWith('about:')
  }

  /**
   * Inject content script into tab
   */
  async injectContentScript (tabId) {
    try {
      debugLog('Injecting content script into tab:', tabId)

      // First inject the CSS
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['src/features/content/overlay-styles.css']
      })

      // Try to inject the bundled content script (without ES6 export issues)
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        files: ['dist/src/features/content/content-main.js']
      })

      debugLog('Content script injection completed:', results)
      return results
    } catch (error) {
      debugError('Content script injection error:', error)
      throw error
    }
  }

  /**
   * Inject fallback content script that doesn't use ES6 modules
   */
  async injectFallbackContentScript (tabId) {
    try {
      debugLog('Injecting fallback content script into tab:', tabId)

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Create a comprehensive message listener for enhanced overlay injection
          if (!window.hoverboardInjected) {
            window.hoverboardInjected = true

            // Define refresh overlay function for use within content script
            async function refreshOverlay () {
              try {
                // Get updated bookmark data
                const response = await new Promise((resolve) => {
                  chrome.runtime.sendMessage({
                    type: 'getBookmark',
                    data: { url: window.location.href }
                  }, resolve)
                })

                if (response && response.success && response.bookmark) {
                  // Remove existing overlay
                  const existingOverlay = document.getElementById('hoverboard-overlay')
                  if (existingOverlay) {
                    existingOverlay.remove()
                  }

                  // Show updated overlay
                  chrome.runtime.sendMessage({
                    type: 'showHoverboard',
                    data: { url: window.location.href }
                  })
                }
              } catch (error) {
                debugError('Failed to refresh overlay:', error)
              }
            }

            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
              debugLog('Hoverboard content script received message:', message)

              if (message.type === 'TOGGLE_HOVER') {
                let overlay = document.getElementById('hoverboard-overlay')

                if (overlay) {
                  // Hide existing overlay
                  overlay.remove()
                  sendResponse({ success: true, action: 'hidden' })
                } else {
                  // Create enhanced overlay with full functionality matching test interface
                  const { bookmark, tab } = message.data || {}

                  overlay = document.createElement('div')
                  overlay.id = 'hoverboard-overlay'
                  overlay.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    max-height: 80vh;
                    background: rgba(255,255,255,0.95);
                    border: 2px solid #90ee90;
                    border-radius: 8px;
                    padding: 0;
                    z-index: 2147483647;
                    font-family: 'Futura PT', system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    color: black;
                    font-weight: 600;
                    overflow-y: auto;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                  `

                  // Create main container div
                  const mainContainer = document.createElement('div')
                  mainContainer.style.cssText = 'padding: 8px;'

                  // Create site tags row element (matching test overlay structure)
                  const siteTagsContainer = document.createElement('div')
                  siteTagsContainer.className = 'scrollmenu'
                  siteTagsContainer.style.cssText = `
                    margin-bottom: 8px;
                    padding: 4px;
                    background: white;
                    border-radius: 4px;
                  `

                  // Close button (matching extension style)
                  const closeBtn = document.createElement('span')
                  closeBtn.className = 'tiny'
                  closeBtn.innerHTML = '✕'
                  closeBtn.style.cssText = `
                    float: right;
                    cursor: pointer;
                    padding: 0.2em 0.5em;
                    color: red;
                    font-weight: 900;
                    background: rgba(255,255,255,0.8);
                    border-radius: 3px;
                    margin: 2px;
                  `
                  closeBtn.onclick = () => overlay.remove()
                  siteTagsContainer.appendChild(closeBtn)

                  // Current tags section (matching extension logic)
                  const currentLabel = document.createElement('span')
                  currentLabel.className = 'tiny'
                  currentLabel.textContent = 'Current:'
                  currentLabel.style.cssText = 'padding: 0.2em 0.5em; margin-right: 4px;'
                  siteTagsContainer.appendChild(currentLabel)

                  // Add current tags with full functionality
                  const currentTags = bookmark?.tags ? (Array.isArray(bookmark.tags) ? bookmark.tags : bookmark.tags.split(' ').filter(t => t)) : []
                  currentTags.forEach(tag => {
                    const tagElement = document.createElement('span')
                    tagElement.className = 'tiny iconTagDeleteInactive'
                    tagElement.textContent = tag
                    tagElement.style.cssText = `
                      padding: 0.2em 0.5em;
                      margin: 2px;
                      background: #f0f8f0;
                      border-radius: 3px;
                      cursor: pointer;
                      color: #90ee90;
                    `
                    tagElement.title = 'Double-click to remove'
                    tagElement.ondblclick = async () => {
                      // Remove tag and refresh overlay
                      if (confirm(`Delete tag "${tag}"?`)) {
                        chrome.runtime.sendMessage({
                          type: 'deleteTag',
                          data: {
                            url: window.location.href,
                            value: tag,
                            ...bookmark
                          }
                        })

                        // Update local bookmark data and refresh overlay
                        setTimeout(() => {
                          refreshOverlay()
                        }, 500)
                      }
                    }
                    siteTagsContainer.appendChild(tagElement)
                  })

                  // Add tag input (matching extension style)
                  const tagInput = document.createElement('input')
                  tagInput.className = 'tag-input'
                  tagInput.placeholder = 'New Tag'
                  tagInput.style.cssText = `
                    margin: 2px;
                    padding: 2px !important;
                    font-size: 12px;
                    width: 80px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                  `
                  tagInput.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter') {
                      const tagText = tagInput.value.trim()
                      if (tagText && !currentTags.includes(tagText)) {
                        chrome.runtime.sendMessage({
                          type: 'saveTag',
                          data: {
                            url: window.location.href,
                            value: tagText,
                            ...bookmark
                          }
                        })
                        tagInput.value = ''

                        // Update local bookmark data and refresh overlay
                        setTimeout(() => {
                          refreshOverlay()
                        }, 500)
                      }
                    }
                  })
                  siteTagsContainer.appendChild(tagInput)

                  // Recent tags section (matching test interface)
                  const recentContainer = document.createElement('div')
                  recentContainer.className = 'scrollmenu'
                  recentContainer.style.cssText = `
                    margin-bottom: 8px;
                    padding: 4px;
                    background: #f9f9f9;
                    border-radius: 4px;
                    font-size: smaller;
                    font-weight: 900;
                    color: green;
                  `

                  const recentLabel = document.createElement('span')
                  recentLabel.className = 'tiny'
                  recentLabel.textContent = 'Recent:'
                  recentLabel.style.cssText = 'padding: 0.2em 0.5em; margin-right: 4px;'
                  recentContainer.appendChild(recentLabel)

                  // Add sample recent tags for demonstration (same as test interface)
                  const sampleRecentTags = ['javascript', 'development', 'web', 'tutorial', 'reference', 'programming', 'tools', 'documentation']
                  sampleRecentTags.slice(0, 5).forEach(tag => {
                    if (!currentTags.includes(tag)) {
                      const tagElement = document.createElement('span')
                      tagElement.className = 'tiny'
                      tagElement.textContent = tag
                      tagElement.style.cssText = `
                        padding: 0.2em 0.5em;
                        margin: 2px;
                        background: #f0f8f0;
                        border-radius: 3px;
                        cursor: pointer;
                        color: green;
                      `
                      tagElement.onclick = async () => {
                        if (!currentTags.includes(tag)) {
                          chrome.runtime.sendMessage({
                            type: 'saveTag',
                            data: {
                              url: window.location.href,
                              value: tag,
                              ...bookmark
                            }
                          })

                          // Update local bookmark data and refresh overlay
                          setTimeout(() => {
                            refreshOverlay()
                          }, 500)
                        }
                      }
                      recentContainer.appendChild(tagElement)
                    }
                  })

                  // Action buttons section (matching extension functionality)
                  const actionsContainer = document.createElement('div')
                  actionsContainer.style.cssText = `
                    padding: 4px;
                    background: white;
                    border-radius: 4px;
                    text-align: center;
                  `

                  // Privacy toggle
                  const isPrivate = bookmark?.shared === 'no'
                  const privateBtn = document.createElement('button')
                  privateBtn.style.cssText = `
                    margin: 2px;
                    padding: 4px 8px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    background: ${isPrivate ? '#ffeeee' : '#eeffee'};
                    cursor: pointer;
                    font-weight: 600;
                  `
                  privateBtn.textContent = isPrivate ? '🔒 Private' : '🌐 Public'
                  privateBtn.onclick = async () => {
                    chrome.runtime.sendMessage({
                      type: 'saveBookmark',
                      data: {
                        ...bookmark,
                        url: window.location.href,
                        shared: isPrivate ? 'yes' : 'no'
                      }
                    })

                    // Update local bookmark data and refresh overlay
                    setTimeout(() => {
                      refreshOverlay()
                    }, 500)
                  }

                  // Read status toggle
                  const isToRead = bookmark?.toread === 'yes'
                  const readBtn = document.createElement('button')
                  readBtn.style.cssText = `
                    margin: 2px;
                    padding: 4px 8px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    background: ${isToRead ? '#ffffee' : '#eeeeff'};
                    cursor: pointer;
                    font-weight: 600;
                  `
                  readBtn.textContent = isToRead ? '📖 Read Later' : '📋 Not marked'
                  readBtn.onclick = async () => {
                    chrome.runtime.sendMessage({
                      type: 'saveBookmark',
                      data: {
                        ...bookmark,
                        url: window.location.href,
                        toread: isToRead ? 'no' : 'yes'
                      }
                    })

                    // Update local bookmark data and refresh overlay
                    setTimeout(() => {
                      refreshOverlay()
                    }, 500)
                  }

                  actionsContainer.appendChild(privateBtn)
                  actionsContainer.appendChild(readBtn)

                  // Page info at bottom (URL display - matching test interface)
                  const pageInfo = document.createElement('div')
                  pageInfo.style.cssText = `
                    padding: 4px;
                    font-size: 11px;
                    color: #666;
                    background: #f9f9f9;
                    border-radius: 4px;
                    margin-top: 4px;
                    word-break: break-all;
                  `
                  pageInfo.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 2px;">
                      ${bookmark?.description || document.title}
                    </div>
                    <div>${window.location.href}</div>
                  `

                  // Assemble the overlay (matching extension structure)
                  mainContainer.appendChild(siteTagsContainer)
                  mainContainer.appendChild(recentContainer)
                  mainContainer.appendChild(actionsContainer)
                  mainContainer.appendChild(pageInfo)
                  overlay.appendChild(mainContainer)

                  document.body.appendChild(overlay)

                  sendResponse({ success: true, action: 'shown' })
                }
              }

              return true // Keep message channel open
            })
          }
        }
      })

      debugLog('Fallback content script injection completed:', results)
      return results
    } catch (error) {
      debugError('Fallback content script injection error:', error)
      throw error
    }
  }

  /**
   * Set loading state
   */
  setLoading (isLoading) {
    this.isLoading = isLoading
    this.uiManager.setLoading(isLoading)
  }

  /**
   * Handle show/hide hoverboard action
   */
  async handleShowHoverboard () {
    try {
      debugLog('Attempting to show hoverboard on tab:', this.currentTab)

      // Check if we can inject into this tab
      if (!this.canInjectIntoTab(this.currentTab)) {
        throw new Error(`Cannot show hoverboard on this type of page: ${this.currentTab.url}`)
      }

      await this.sendToTab({
        type: 'TOGGLE_HOVER',
        data: {
          bookmark: this.currentPin,
          tab: this.currentTab
        }
      })
      this.closePopup()
    } catch (error) {
      debugError('Show hoverboard error:', error)
      this.errorHandler.handleError('Failed to toggle hoverboard', error)
    }
  }

  /**
   * Handle toggle private status
   */
  async handleTogglePrivate () {
    try {
      this.setLoading(true)

      if (this.currentPin) {
        // Toggle private status on existing bookmark
        const isPrivate = this.currentPin.shared === 'no'
        const newSharedStatus = isPrivate ? 'yes' : 'no'

        const updatedPin = {
          ...this.currentPin,
          shared: newSharedStatus
        }

        const response = await this.sendMessage({
          type: 'saveBookmark',
          data: updatedPin
        })

        this.currentPin.shared = newSharedStatus
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updatePrivateStatus(newSharedStatus === 'no')
        this.uiManager.showSuccess(`Bookmark is now ${isPrivate ? 'public' : 'private'}`)

        // [TOGGLE-SYNC-POPUP-001] - Notify overlay of changes (if visible)
        try {
          await this.sendToTab({
            type: 'BOOKMARK_UPDATED',
            data: updatedPin
          })
        } catch (error) {
          debugError('[TOGGLE-SYNC-POPUP-001] Failed to notify overlay:', error)
          // Don't fail the entire operation if overlay notification fails
        }
      } else {
        // Create new bookmark with private status set to 'yes' (private by default when toggling)
        await this.createBookmark([], 'yes')
        this.uiManager.updatePrivateStatus(true)
        this.uiManager.showSuccess('Bookmark created as private')
      }
    } catch (error) {
      this.errorHandler.handleError('Failed to toggle private status', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle read later action - toggles the toread attribute
   */
  async handleReadLater () {
    try {
      this.setLoading(true)

      if (this.currentPin) {
        // Toggle toread attribute on existing bookmark
        const isCurrentlyToRead = this.currentPin.toread === 'yes'
        const newToReadStatus = isCurrentlyToRead ? 'no' : 'yes'

        const updatedPin = {
          ...this.currentPin,
          toread: newToReadStatus,
          description: this.getBetterDescription(this.currentPin?.description, this.currentTab?.title)
        }

        const response = await this.sendMessage({
          type: 'saveBookmark',
          data: updatedPin
        })

        this.currentPin.toread = newToReadStatus
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateReadLaterStatus(newToReadStatus === 'yes')

        const statusMessage = newToReadStatus === 'yes' ? 'Added to read later' : 'Removed from read later'
        this.uiManager.showSuccess(statusMessage)

        // [TOGGLE-SYNC-POPUP-001] - Notify overlay of changes (if visible)
        try {
          await this.sendToTab({
            type: 'BOOKMARK_UPDATED',
            data: updatedPin
          })
        } catch (error) {
          debugError('[TOGGLE-SYNC-POPUP-001] Failed to notify overlay:', error)
          // Don't fail the entire operation if overlay notification fails
        }
      } else {
        // Create new bookmark with toread status
        await this.createBookmark([], 'yes', 'yes')
        this.uiManager.updateReadLaterStatus(true)
        this.uiManager.showSuccess('Bookmark created and added to read later')
      }
    } catch (error) {
      this.errorHandler.handleError('Failed to toggle read later status', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle add tag action
   * [IMMUTABLE-REQ-TAG-003] - Enhanced with user-driven recent tags tracking
   */
  async handleAddTag (tagText) {
    if (!tagText || !tagText.trim()) {
      this.errorHandler.handleError('Please enter a tag')
      return
    }

    try {
      this.setLoading(true)

      // [IMMUTABLE-REQ-TAG-001] - Sanitize and validate tags
      const newTags = tagText.trim().split(/\s+/).filter(tag => tag.length > 0)

      // [IMMUTABLE-REQ-TAG-001] - Validate each tag
      for (const tag of newTags) {
        if (!this.isValidTag(tag)) {
          this.errorHandler.handleError(`Invalid tag: ${tag}`)
          return
        }
      }

      if (this.currentPin) {
        // [IMMUTABLE-REQ-TAG-001] - Add tags to existing bookmark
        const currentTagsArray = this.normalizeTags(this.currentPin.tags)
        const allTags = [...new Set([...currentTagsArray, ...newTags])]

        await this.addTagsToBookmark(allTags)
      } else {
        // [IMMUTABLE-REQ-TAG-001] - Create new bookmark with tags
        await this.createBookmark(newTags)
      }

      // [IMMUTABLE-REQ-TAG-003] - Track newly added tags for current site only
      for (const tag of newTags) {
        try {
          await this.sendMessage({
            type: 'addTagToRecent',
            data: {
              tagName: tag,
              currentSiteUrl: this.currentTab?.url
            }
          })
        } catch (error) {
          debugError('[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Failed to track tag addition:', error)
          // Don't fail the entire operation if tag tracking fails
        }
      }

      // [IMMUTABLE-REQ-TAG-001] - Clear the input
      this.uiManager.clearTagInput()

      // [IMMUTABLE-REQ-TAG-003] - Refresh recent tags after adding a tag
      await this.loadRecentTags()
    } catch (error) {
      this.errorHandler.handleError('Failed to add tags', error)

      // [IMMUTABLE-REQ-TAG-001] - Even on failure, update UI with current tags and recent tags
      if (this.currentPin) {
        const currentTagsArray = this.normalizeTags(this.currentPin.tags)
        this.uiManager.updateCurrentTags(currentTagsArray)
      }
      await this.loadRecentTags()
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle remove tag action
   */
  async handleRemoveTag (tagToRemove) {
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found')
      return
    }

    try {
      this.setLoading(true)

      const tagsArray = this.normalizeTags(this.currentPin.tags).filter(tag => tag !== tagToRemove)

      await this.addTagsToBookmark(tagsArray)

      // Recent tags are refreshed in addTagsToBookmark
    } catch (error) {
      this.errorHandler.handleError('Failed to remove tag', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Add tags to bookmark
   * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking and validation
   */
  async addTagsToBookmark (tags) {
    // [IMMUTABLE-REQ-TAG-001] - Validate all tags before saving
    for (const tag of tags) {
      if (!this.isValidTag(tag)) {
        this.errorHandler.handleError(`Invalid tag: ${tag}`)
        return
      }
    }

    const tagsString = tags.join(' ')

    const pinData = {
      ...this.currentPin,
      tags: tagsString,
      description: this.getBetterDescription(this.currentPin?.description, this.currentTab?.title)
    }

    const response = await this.sendMessage({
      type: 'saveBookmark',
      data: pinData
    })

    // [IMMUTABLE-REQ-TAG-001] - Update current pin with new tags
    this.currentPin.tags = tagsString
    this.stateManager.setState({ currentPin: this.currentPin })
    this.uiManager.updateCurrentTags(tags)
    this.uiManager.showSuccess('Tags updated successfully')

    // [IMMUTABLE-REQ-TAG-001] - Refresh recent tags after updating bookmark
    await this.loadRecentTags()

    // [TAG-SYNC-POPUP-001] - Notify overlay of tag changes
    await this.notifyOverlayOfTagChanges(tags)

    // [TAG-SYNC-POPUP-001] - Also send BOOKMARK_UPDATED to ensure overlay updates tags
    try {
      await this.sendToTab({
        type: 'BOOKMARK_UPDATED',
        data: pinData
      })
    } catch (error) {
      debugError('[TAG-SYNC-POPUP-001] Failed to notify overlay of BOOKMARK_UPDATED after tag change:', error)
    }
  }

  /**
   * [TAG-SYNC-POPUP-001] - Notify overlay of tag changes
   * @param {string[]} tags - Array of updated tags
   */
  async notifyOverlayOfTagChanges(tags) {
    try {
      // [TAG-SYNC-POPUP-001] Send TAG_UPDATED message to overlay/content script
      const updatedBookmark = {
        url: this.currentTab?.url,
        description: this.currentTab?.title,
        tags: tags
      }
      await this.sendToTab({
        type: 'TAG_UPDATED',
        data: updatedBookmark
      })
    } catch (error) {
      debugError('[TAG-SYNC-POPUP-001] Failed to notify overlay of TAG_UPDATED:', error)
      // Don't fail the entire operation if overlay notification fails
    }
  }

  /**
   * Create new bookmark
   * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking and validation
   */
  async createBookmark (tags, sharedStatus = 'yes', toreadStatus = 'no') {
    // [IMMUTABLE-REQ-TAG-001] - Validate all tags before creating bookmark
    for (const tag of tags) {
      if (!this.isValidTag(tag)) {
        this.errorHandler.handleError(`Invalid tag: ${tag}`)
        return
      }
    }

    const tagsString = tags.join(' ')

    const pinData = {
      url: this.currentTab.url,
      description: this.currentTab.title,
      tags: tagsString,
      shared: sharedStatus,
      toread: toreadStatus
    }

    const response = await this.sendMessage({
      type: 'saveBookmark',
      data: pinData
    })

    // [IMMUTABLE-REQ-TAG-001] - Update current pin with new bookmark data
    this.currentPin = pinData
    this.stateManager.setState({ currentPin: this.currentPin })
    this.uiManager.updateCurrentTags(tags)
    this.uiManager.showSuccess('Bookmark created successfully')

    // [IMMUTABLE-REQ-TAG-001] - Refresh recent tags after creating bookmark
    await this.loadRecentTags()
  }

  /**
   * Handle search action - now uses tab search functionality
   */
  async handleSearch (searchText) {
    debugLog('[SEARCH-UI] Starting search:', { searchText, currentTab: this.currentTab })

    if (!searchText || !searchText.trim()) {
      this.errorHandler.handleError('Please enter search terms')
      return
    }

    // Check if popup is still initializing
    if (!this.isInitialized) {
      debugLog('[SEARCH-UI] Popup not yet initialized, waiting...')
      this.errorHandler.handleError('Please wait for popup to finish loading')
      return
    }

    // If currentTab is not available, try to get it
    if (!this.currentTab || !this.currentTab.id) {
      debugLog('[SEARCH-UI] No current tab available, attempting to get current tab')
      try {
        this.currentTab = await this.getCurrentTab()
        debugLog('[SEARCH-UI] Retrieved current tab:', this.currentTab)
      } catch (error) {
        debugError('[SEARCH-UI] Failed to get current tab:', error)
        this.errorHandler.handleError('Unable to get current tab information')
        return
      }
    }

    if (!this.currentTab || !this.currentTab.id) {
      this.errorHandler.handleError('No current tab available')
      return
    }

    try {
      this.setLoading(true)

      debugLog('[SEARCH-UI] Sending search message with tab ID:', this.currentTab.id)
      const response = await this.sendMessage({
        type: 'searchTabs',
        data: { searchText: searchText.trim() }
      })

      debugLog('[SEARCH-UI] Received response:', response)

      if (response.success) {
        this.uiManager.showSuccess(`Found ${response.matchCount} matching tabs - navigating to "${response.tabTitle}"`)
      } else {
        this.uiManager.showError(response.message || 'No matching tabs found')
      }
    } catch (error) {
      debugError('[SEARCH-UI] Search error:', error)
      this.errorHandler.handleError('Failed to search tabs', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle delete bookmark action
   */
  async handleDeletePin () {
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found to delete')
      return
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return
    }

    try {
      this.setLoading(true)

      const response = await this.sendMessage({
        type: 'deleteBookmark',
        data: { url: this.currentPin.url }
      })

      this.currentPin = null
      this.stateManager.setState({ currentPin: null })
      this.uiManager.updateCurrentTags([])
      this.uiManager.updatePrivateStatus(false)
      this.uiManager.showSuccess('Bookmark deleted')

      // Refresh hover data
      await this.sendToTab({ message: 'refreshData' })

      this.closePopup()
    } catch (error) {
      this.errorHandler.handleError('Failed to delete bookmark', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle reload extension action
   */
  async handleReloadExtension () {
    try {
      // Extension reload doesn't need a message - just reload the tab
      if (this.currentTab) {
        await chrome.tabs.reload(this.currentTab.id)
      }
      this.closePopup()
    } catch (error) {
      this.errorHandler.handleError('Failed to reload extension', error)
    }
  }

  /**
   * Handle open options action
   */
  async handleOpenOptions () {
    try {
      chrome.runtime.openOptionsPage()
      this.closePopup()
    } catch (error) {
      this.errorHandler.handleError('Failed to open options', error)
    }
  }

  /**
   * Get better description for bookmark
   */
  getBetterDescription (currentDescription, pageTitle) {
    if (currentDescription && currentDescription.trim()) {
      return currentDescription
    }
    return pageTitle || 'Untitled'
  }

  /**
   * Close the popup
   */
  closePopup () {
    setTimeout(() => window.close(), 100)
  }

  /**
   * Cleanup resources
   */
  cleanup () {
    // Remove event listeners if needed
    this.uiManager?.off('showHoverboard', this.handleShowHoverboard)
    this.uiManager?.off('togglePrivate', this.handleTogglePrivate)
    this.uiManager?.off('readLater', this.handleReadLater)
    this.uiManager?.off('addTag', this.handleAddTag)
    this.uiManager?.off('removeTag', this.handleRemoveTag)
    this.uiManager?.off('search', this.handleSearch)
    this.uiManager?.off('deletePin', this.handleDeletePin)
    this.uiManager?.off('reloadExtension', this.handleReloadExtension)
    this.uiManager?.off('openOptions', this.handleOpenOptions)
  }
}
