/**
 * PopupController - Main business logic controller for the popup
 */

import { UIManager } from './UIManager.js'
import { StateManager } from './StateManager.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { debugLog, debugError } from '../../shared/utils.js'
import { ConfigManager } from '../../config/config-manager.js'
import { platformUtils } from '../../shared/safari-shim.js'

debugLog('[SAFARI-EXT-POPUP-001] PopupController.js: module loaded with Safari optimizations');

export class PopupController {
  constructor (dependencies = {}) {
    // [DEP-INJ-001] Proper dependency injection with fallback creation
    this.errorHandler = dependencies.errorHandler || new ErrorHandler()
    this.stateManager = dependencies.stateManager || new StateManager()
    this.configManager = dependencies.configManager || new ConfigManager()

    // [SAFARI-EXT-POPUP-001] Safari-specific initialization
    this.isSafari = platformUtils.isSafari()
    this.safariConfig = this.getSafariPopupConfig()
    this.performanceMonitor = null
    this.errorRecoveryAttempts = 0
    this.maxErrorRecoveryAttempts = 3

    // [DEP-INJ-001] UIManager with proper dependency injection and Safari optimizations
    this.uiManager = dependencies.uiManager || new UIManager({
      errorHandler: this.errorHandler,
      stateManager: this.stateManager,
      config: {},
      // Safari-specific UI optimizations
      enableSafariOptimizations: this.isSafari,
      safariConfig: this.safariConfig
    })

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

    // [SAFARI-EXT-POPUP-001] Safari-specific setup
    this.setupSafariOptimizations()

    // [POPUP-REFRESH-001] Setup refresh mechanisms
    this.setupAutoRefresh()
    this.setupRealTimeUpdates()

    // [TOGGLE_SYNC_POPUP] Listen for BOOKMARK_UPDATED to sync popup UI with shared state
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === 'BOOKMARK_UPDATED') {
          try {
            debugLog('[POPUP-REFRESH-001] Received BOOKMARK_UPDATED, refreshing data')
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
    debugLog('[SAFARI-EXT-POPUP-001] PopupController constructor called', { platform: navigator.userAgent, isSafari: this.isSafari });
    // Platform detection
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      debugLog('[SAFARI-EXT-POPUP-001] Detected Chrome runtime in PopupController');
    } else if (typeof browser !== 'undefined' && browser.runtime) {
      debugLog('[SAFARI-EXT-POPUP-001] Detected browser polyfill runtime in PopupController');
    } else {
      debugError('[SAFARI-EXT-POPUP-001] No recognized extension runtime detected in PopupController');
    }
    // Check utils.js access
    if (!debugLog || !debugError) {
      console.error('[SAFARI-EXT-POPUP-001] utils.js functions missing in PopupController');
    }
  }

  /**
   * [SAFARI-EXT-POPUP-001] Get Safari-specific popup configuration
   */
  getSafariPopupConfig() {
    return {
      // Safari-specific performance settings
      enablePerformanceMonitoring: true,
      performanceMonitoringInterval: 30000, // 30 seconds
      enableMemoryOptimization: true,
      enableAnimationOptimization: true,
      
      // Safari-specific error handling
      enableErrorRecovery: true,
      enableGracefulDegradation: true,
      maxErrorRecoveryAttempts: 3,
      errorRecoveryDelay: 1000,
      
      // Safari-specific UI optimizations
      enableSafariUIOptimizations: true,
      enableSafariAccessibility: true,
      enableSafariAnimationOptimizations: true,
      
      // Safari-specific message handling
      messageTimeout: 15000, // 15 seconds for Safari
      messageRetries: 5, // More retries for Safari
      messageRetryDelay: 2000, // Longer delay between retries
      
      // Safari-specific overlay settings
      overlayAnimationDuration: 300, // Faster animations for Safari
      overlayBlurAmount: 3, // Enhanced blur for Safari
      overlayOpacityNormal: 0.03, // Lower opacity for Safari
      overlayOpacityHover: 0.12, // Lower hover opacity for Safari
      overlayOpacityFocus: 0.20, // Lower focus opacity for Safari
      
      // Safari-specific platform detection
      enablePlatformDetection: true,
      enableFeatureDetection: true,
      enablePerformanceDetection: true
    }
  }

  /**
   * [SAFARI-EXT-POPUP-001] Setup Safari-specific optimizations
   */
  setupSafariOptimizations() {
    try {
      debugLog('[SAFARI-EXT-POPUP-001] Setting up Safari-specific optimizations...')

      // Add Safari-specific CSS classes to body
      if (this.isSafari) {
        document.body.classList.add('safari-platform-detected')
        document.body.classList.add('safari-performance-monitoring')
        document.body.classList.add('safari-error-handling')
        document.body.classList.add('safari-graceful-degradation')
        
        // Add Safari-specific feature detection classes
        if (CSS.supports('backdrop-filter', 'blur(10px)')) {
          document.body.classList.add('safari-feature-supported')
        } else {
          document.body.classList.add('safari-feature-unsupported')
        }
        
        debugLog('[SAFARI-EXT-POPUP-001] Safari-specific CSS classes added')
      }

      // Start Safari performance monitoring
      if (this.safariConfig.enablePerformanceMonitoring) {
        this.performanceMonitor = setInterval(this.monitorSafariPerformance.bind(this), this.safariConfig.performanceMonitoringInterval)
        debugLog('[SAFARI-EXT-POPUP-001] Safari performance monitoring started')
      }

      debugLog('[SAFARI-EXT-POPUP-001] Safari-specific optimizations setup completed')
    } catch (error) {
      debugError('[SAFARI-EXT-POPUP-001] Failed to setup Safari optimizations:', error)
    }
  }

  /**
   * [SAFARI-EXT-POPUP-001] Monitor Safari performance
   */
  monitorSafariPerformance() {
    try {
      if (window.performance && window.performance.memory) {
        const memoryInfo = window.performance.memory
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        
        if (memoryUsagePercent > 90) {
          console.warn('[SAFARI-EXT-POPUP-001] Critical Safari popup memory usage:', memoryUsagePercent.toFixed(1) + '%')
          this.handleSafariError('Safari Critical Memory Usage', `Memory usage: ${memoryUsagePercent.toFixed(1)}%`)
        } else if (memoryUsagePercent > 70) {
          debugLog('[SAFARI-EXT-POPUP-001] High Safari popup memory usage:', memoryUsagePercent.toFixed(1) + '%')
        }
      }
    } catch (error) {
      debugError('[SAFARI-EXT-POPUP-001] Safari performance monitoring failed:', error)
    }
  }

  /**
   * [SAFARI-EXT-POPUP-001] Handle Safari-specific errors
   */
  async handleSafariError(message, errorInfo = null) {
    try {
      debugError('[SAFARI-EXT-POPUP-001] Safari Popup Error:', message, errorInfo)

      // Safari-specific error categorization
      let errorType = 'general'
      if (message.includes('network') || message.includes('fetch')) {
        errorType = 'network'
      } else if (message.includes('permission') || message.includes('denied')) {
        errorType = 'permission'
      } else if (message.includes('auth') || message.includes('token')) {
        errorType = 'auth'
      } else if (message.includes('memory') || message.includes('performance')) {
        errorType = 'performance'
      }

      // Safari-specific error recovery
      if (this.safariConfig.enableErrorRecovery && errorType !== 'auth') {
        const recoverySuccessful = await this.attemptSafariErrorRecovery({ type: errorType, error: errorInfo })
        if (recoverySuccessful) {
          debugLog('[SAFARI-EXT-POPUP-001] Safari error recovery successful, continuing...')
          return
        }
      }

      // Safari-specific error messages
      let userMessage = 'An unexpected error occurred. Please try again.'
      
      if (errorType === 'auth') {
        userMessage = 'Please configure your Pinboard API token in the extension options.'
      } else if (errorType === 'network') {
        userMessage = 'Network error. Please check your connection and try again.'
      } else if (errorType === 'permission') {
        userMessage = 'Permission denied. Please check extension permissions.'
      } else if (errorType === 'performance') {
        userMessage = 'Performance issue detected. Please try refreshing the popup.'
      }

      // Show error in UI if possible
      if (this.uiManager) {
        this.uiManager.showError(userMessage)
      }
    } catch (error) {
      debugError('[SAFARI-EXT-POPUP-001] Failed to handle Safari error:', error)
    }
  }

  /**
   * [SAFARI-EXT-POPUP-001] Attempt Safari error recovery
   */
  async attemptSafariErrorRecovery(errorInfo) {
    try {
      if (this.errorRecoveryAttempts >= this.safariConfig.maxErrorRecoveryAttempts) {
        debugLog('[SAFARI-EXT-POPUP-001] Max Safari popup error recovery attempts reached')
        return false
      }
      
      this.errorRecoveryAttempts++
      debugLog(`[SAFARI-EXT-POPUP-001] Attempting Safari popup error recovery (${this.errorRecoveryAttempts}/${this.safariConfig.maxErrorRecoveryAttempts})`)
      
      // Wait before attempting recovery
      await new Promise(resolve => setTimeout(resolve, this.safariConfig.errorRecoveryDelay))
      
      // Attempt recovery based on error type
      if (errorInfo.type === 'initialization') {
        // Reinitialize popup components
        await this.loadInitialData()
      } else if (errorInfo.type === 'ui') {
        // Reinitialize UI system
        this.uiManager.setupEventListeners()
      } else if (errorInfo.type === 'message') {
        // Reinitialize message handling
        await this.loadInitialData()
      }
      
      debugLog('[SAFARI-EXT-POPUP-001] Safari popup error recovery successful')
      this.errorRecoveryAttempts = 0
      return true
      
    } catch (error) {
      debugError('[SAFARI-EXT-POPUP-001] Safari popup error recovery failed:', error)
      return false
    }
  }

  /**
   * Normalize tags to array format regardless of input type
   */
  normalizeTags (tags) {
    // [DEBUG-FIX-001] Add debug logs for normalizeTags
    console.log('🔍 [DEBUG-FIX-001] normalizeTags called with:', tags);
    debugLog('[DEBUG-FIX-001] normalizeTags: input:', {
      tags: tags,
      tagsType: typeof tags,
      tagsIsArray: Array.isArray(tags),
      tagsLength: tags ? (Array.isArray(tags) ? tags.length : tags.toString().length) : 0
    });

    if (!tags) {
      console.log('🔍 [DEBUG-FIX-001] normalizeTags: no tags provided, returning empty array');
      debugLog('[DEBUG-FIX-001] normalizeTags: no tags provided, returning empty array');
      return []
    }

    if (typeof tags === 'string') {
      // If tags is a string, split by spaces and filter out empty strings
      const result = tags.split(' ').filter(tag => tag.trim())
      console.log('🔍 [DEBUG-FIX-001] normalizeTags: string input processed:', {
        originalString: tags,
        splitResult: result,
        resultLength: result.length
      });
      debugLog('[DEBUG-FIX-001] normalizeTags: string input processed:', {
        originalString: tags,
        splitResult: result,
        resultLength: result.length
      });
      return result
    } else if (Array.isArray(tags)) {
      // If tags is already an array, filter out empty or non-string values
      const result = tags.filter(tag => tag && typeof tag === 'string' && tag.trim())
      console.log('🔍 [DEBUG-FIX-001] normalizeTags: array input processed:', {
        originalArray: tags,
        filteredResult: result,
        resultLength: result.length
      });
      debugLog('[DEBUG-FIX-001] normalizeTags: array input processed:', {
        originalArray: tags,
        filteredResult: result,
        resultLength: result.length
      });
      return result
    }

    // For any other type, return empty array
    console.log('🔍 [DEBUG-FIX-001] normalizeTags: unknown input type, returning empty array');
    debugLog('[DEBUG-FIX-001] normalizeTags: unknown input type, returning empty array');
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

    // [POPUP-REFRESH-001] Add refresh event handler
    this.uiManager.on('refreshData', this.refreshPopupData.bind(this))

    // [SHOW-HOVER-CHECKBOX-CONTROLLER-001] - Add checkbox event handler binding
    this.uiManager.on('showHoverOnPageLoadChange', this.handleShowHoverOnPageLoadChange.bind(this))
  }

  /**
   * Load initial data when popup opens
   * [POPUP-DATA-FLOW-001] Enhanced data flow validation
   */
  async loadInitialData () {
    debugLog('[POPUP-DATA-FLOW-001] loadInitialData: start');
    try {
      this.setLoading(true)

      // Get current tab information
      debugLog('[POPUP-DATA-FLOW-001] loadInitialData: calling getCurrentTab');
      this.currentTab = await this.getCurrentTab()
      debugLog('[POPUP-DATA-FLOW-001] loadInitialData: got currentTab', this.currentTab);
      if (!this.currentTab) {
        throw new Error('Unable to get current tab information')
      }

      // Update state with tab info
      this.stateManager.setState({
        currentTab: this.currentTab,
        url: this.currentTab.url,
        title: this.currentTab.title
      })

      // [POPUP-DATA-FLOW-001] Get and validate bookmark data
      debugLog('[POPUP-DATA-FLOW-001] loadInitialData: calling getBookmarkData', this.currentTab.url);
      this.currentPin = await this.getBookmarkData(this.currentTab.url)
      debugLog('[POPUP-DATA-FLOW-001] loadInitialData: got currentPin', this.currentPin);

      // [POPUP-DATA-FLOW-001] Handle both bookmarked and non-bookmarked sites
      if (!this.currentPin) {
        debugLog('[POPUP-DATA-FLOW-001] loadInitialData: No bookmark data, creating empty bookmark for current site');
        this.currentPin = {
          url: this.currentTab.url,
          description: this.currentTab.title || '',
          tags: [],
          shared: 'yes',
          toread: 'no',
          time: '',
          extended: '',
          hash: ''
        }
        // [POPUP-DATA-FLOW-001] Log the created empty bookmark for test compatibility
        debugLog('[POPUP-DATA-FLOW-001] loadInitialData: created empty bookmark', this.currentPin);
      }

      this.stateManager.setState({ currentPin: this.currentPin })

      // [POPUP-DATA-FLOW-001] Enhanced debug logging for bookmark data
      debugLog('[POPUP-DATA-FLOW-001] loadInitialData: bookmark data validation:', {
        hasBookmark: !!this.currentPin,
        url: this.currentPin?.url,
        description: this.currentPin?.description,
        tagCount: this.currentPin?.tags?.length || 0,
        isPrivate: this.currentPin?.shared === 'no',
        isReadLater: this.currentPin?.toread === 'yes'
      });

      // [POPUP-DATA-FLOW-001] Process and validate tags
      const normalizedTags = this.normalizeTags(this.currentPin?.tags)
      debugLog('[POPUP-DATA-FLOW-001] loadInitialData: tags processing:', {
        originalTags: this.currentPin?.tags,
        originalTagsType: typeof this.currentPin?.tags,
        normalizedTags: normalizedTags,
        normalizedTagsLength: normalizedTags.length,
        normalizedTagsIsArray: Array.isArray(normalizedTags)
      });

      // [POPUP-DATA-FLOW-001] Update UI with validated data
      debugLog('[POPUP-DATA-FLOW-001] loadInitialData: calling updateCurrentTags with:', normalizedTags);
      this.uiManager.updateCurrentTags(normalizedTags)
      this.uiManager.updateConnectionStatus(true)
      this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')

      // Check if current bookmark has read later status
      const hasReadLaterStatus = this.currentPin?.toread === 'yes'
      this.uiManager.updateReadLaterStatus(hasReadLaterStatus)

      // Load recent tags
      await this.loadRecentTags()

      // [SHOW-HOVER-CHECKBOX-CONTROLLER-002] - Load checkbox state
      await this.loadShowHoverOnPageLoadSetting()

      // Set version info
      const manifest = chrome.runtime.getManifest()
      this.uiManager.updateVersionInfo(manifest.version)

      // Mark as initialized
      this.isInitialized = true
      debugLog('[POPUP-DATA-FLOW-001] Popup initialization completed successfully')
    } catch (error) {
      debugError('[POPUP-DATA-FLOW-001] Failed to load initial data:', error)
      if (this.errorHandler) {
        this.errorHandler.handleError('Failed to load initial data', error)
      }
      this.uiManager.updateConnectionStatus(false)
      // Re-throw the error so it can be caught by the calling method
      throw error
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
    debugLog('[CHROME-DEBUG-001] getCurrentTab: calling chrome.tabs.query');
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        debugLog('[CHROME-DEBUG-001] getCurrentTab: chrome.tabs.query callback', tabs, chrome.runtime.lastError);
        if (chrome.runtime.lastError) {
          debugError('[CHROME-DEBUG-001] getCurrentTab: chrome.runtime.lastError', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (tabs && tabs.length > 0) {
          resolve(tabs[0])
        } else {
          debugError('[CHROME-DEBUG-001] getCurrentTab: No active tab found');
          reject(new Error('No active tab found'))
        }
      })
    })
  }

  /**
   * Get bookmark data for a URL
   * [POPUP-DATA-FLOW-001] Enhanced data extraction with validation
   */
  async getBookmarkData (url) {
    debugLog('[POPUP-DATA-FLOW-001] getBookmarkData: calling chrome.runtime.sendMessage', url);
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'getCurrentBookmark',
          data: { url }
        },
        (response) => {
          debugLog('[POPUP-DATA-FLOW-001] getBookmarkData: chrome.runtime.sendMessage callback', response, chrome.runtime.lastError);
          if (chrome.runtime.lastError) {
            debugError('[POPUP-DATA-FLOW-001] getBookmarkData: chrome.runtime.lastError', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message))
            return
          }

          if (response && response.success) {
            // [POPUP-DATA-FLOW-001] Enhanced response structure validation
            debugLog('[POPUP-DATA-FLOW-001] getBookmarkData: response structure:', {
              response: response,
              responseSuccess: response.success,
              responseData: response.data,
              responseDataType: typeof response.data,
              responseDataKeys: response.data ? Object.keys(response.data) : null,
              hasUrl: response.data?.url ? true : false,
              hasTags: response.data?.tags ? true : false,
              tagCount: response.data?.tags ? (Array.isArray(response.data.tags) ? response.data.tags.length : 'not-array') : 0
            });

            // [POPUP-DATA-FLOW-001] Extract and validate bookmark data
            const bookmarkData = response.data;

            // [POPUP-DATA-FLOW-001] Handle blocked URLs or no auth
            if (bookmarkData?.blocked || bookmarkData?.needsAuth) {
              debugLog('[POPUP-DATA-FLOW-001] getBookmarkData: URL blocked or needs auth', bookmarkData);
              resolve(null);
              return;
            }

            // [POPUP-DATA-FLOW-001] Validate extracted data
            const isValid = this.validateBookmarkData(bookmarkData);
            if (!isValid) {
              debugLog('[POPUP-DATA-FLOW-001] getBookmarkData: Invalid bookmark data structure, treating as no bookmark', bookmarkData);
              resolve(null);
              return;
            }

            // [POPUP-DATA-FLOW-001] Extract the actual bookmark data (handle both direct and nested structures)
            const extractedData = bookmarkData?.data || bookmarkData;
            debugLog('[POPUP-DATA-FLOW-001] getBookmarkData: extracted and validated bookmark data:', extractedData);
            resolve(extractedData)
          } else {
            debugError('[POPUP-DATA-FLOW-001] getBookmarkData: Failed to get bookmark data', response);
            reject(new Error(response?.error || 'Failed to get bookmark data'))
          }
        }
      )
    })
  }

  /**
   * [POPUP-DEBUG-001] Validate bookmark data structure
   * @param {Object} bookmarkData - Bookmark data to validate
   * @returns {boolean} Whether the data is valid
   */
  validateBookmarkData(bookmarkData) {
    // Handle null and undefined inputs
    if (bookmarkData === null || bookmarkData === undefined) {
      return false;
    }

    // Handle both direct bookmark data and response structure
    const data = bookmarkData?.data || bookmarkData;

    // [POPUP-DEBUG-001] Maintain backward compatibility with existing test requirements
    // Original requirement: tags must be an array and present
    const isValid = data &&
                    typeof data === 'object' &&
                    data.url &&
                    Array.isArray(data.tags) // Must be an array, not just truthy

    debugLog('[POPUP-DEBUG-001] Bookmark data validation:', {
      isValid,
      hasUrl: !!data?.url,
      hasTags: Array.isArray(data?.tags),
      tagCount: data?.tags?.length || 0,
      hasDescription: !!data?.description,
      hasShared: data?.shared !== undefined,
      hasToread: data?.toread !== undefined,
      dataStructure: {
        hasDataProperty: !!bookmarkData?.data,
        directData: !!bookmarkData?.url,
        dataKeys: data ? Object.keys(data) : null
      }
    })

    return isValid
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
  /**
   * [POPUP-CLOSE-BEHAVIOR-004] Handle show/hide hoverboard action
   * Modified to NOT close popup after toggling overlay visibility
   */
  async handleShowHoverboard () {
    try {
      debugLog('Attempting to show hoverboard on tab:', this.currentTab)

      // Check if we can inject into this tab
      if (!this.canInjectIntoTab(this.currentTab)) {
        this.uiManager.showError('Hoverboard is not available on this page (e.g., Chrome Web Store, New Tab, or Settings).');
        return;
      }

      const toggleResponse = await this.sendToTab({
        type: 'TOGGLE_HOVER',
        data: {
          bookmark: this.currentPin,
          tab: this.currentTab
        }
      })

      // [POPUP-CLOSE-BEHAVIOR-004] Remove closePopup() call and add overlay state tracking
      // [POPUP-CLOSE-BEHAVIOR-ARCH-004] Use response data for immediate UI update
      if (toggleResponse && toggleResponse.data) {
        this.uiManager.updateShowHoverButtonState(toggleResponse.data.isVisible)
        debugLog('[POPUP-CLOSE-BEHAVIOR-ARCH-004] Updated UI with toggle response:', toggleResponse.data)
      } else {
        // Fallback to querying overlay state
        await this.updateOverlayState()
      }
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
   * [POPUP-CLOSE-BEHAVIOR-FIX-001] Handle delete bookmark action
   * Modified to NOT close popup after deletion - popup stays open for continued interaction
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
      this.uiManager.showSuccess('Bookmark deleted successfully')

      // Refresh hover data
      await this.sendToTab({ message: 'refreshData' })

      // [POPUP-CLOSE-BEHAVIOR-FIX-001] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to delete bookmark', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [POPUP-CLOSE-BEHAVIOR-FIX-001] Handle reload extension action
   * Modified to NOT close popup after reload - popup stays open for continued interaction
   */
  async handleReloadExtension () {
    try {
      // Extension reload doesn't need a message - just reload the tab
      if (this.currentTab) {
        await chrome.tabs.reload(this.currentTab.id)
      }
      this.uiManager.showSuccess('Extension reloaded successfully')
      // [POPUP-CLOSE-BEHAVIOR-FIX-001] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to reload extension', error)
    }
  }

  /**
   * [POPUP-CLOSE-BEHAVIOR-FIX-001] Handle open options action
   * Modified to NOT close popup after opening options - popup stays open for continued interaction
   */
  async handleOpenOptions () {
    try {
      chrome.runtime.openOptionsPage()
      this.uiManager.showSuccess('Options page opened in new tab')
      // [POPUP-CLOSE-BEHAVIOR-FIX-001] Popup stays open - user can continue working
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
   * [POPUP-CLOSE-BEHAVIOR-005] Update popup UI to reflect overlay state
   */
  async updateOverlayState() {
    try {
      // Query overlay state from content script
      const overlayState = await this.sendToTab({
        type: 'GET_OVERLAY_STATE'
      })

      // [POPUP-CLOSE-BEHAVIOR-005] Handle response data structure
      const stateData = overlayState.data || overlayState

      // Update button appearance based on overlay visibility
      this.uiManager.updateShowHoverButtonState(stateData.isVisible)

      debugLog('[POPUP-CLOSE-BEHAVIOR-005] Updated overlay state:', stateData)
    } catch (error) {
      debugError('[POPUP-CLOSE-BEHAVIOR-005] Failed to update overlay state:', error)
      // [POPUP-CLOSE-BEHAVIOR-ARCH-005] Graceful degradation - fallback to default state
      this.uiManager.updateShowHoverButtonState(false)
    }
  }

  /**
   * Cleanup resources with Safari-specific cleanup
   */
  cleanup () {
    debugLog('[SAFARI-EXT-POPUP-001] PopupController cleanup called with Safari optimizations')
    
    // [SAFARI-EXT-POPUP-001] Stop Safari performance monitoring
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor)
      this.performanceMonitor = null
      debugLog('[SAFARI-EXT-POPUP-001] Safari performance monitoring stopped')
    }
    
    // [SAFARI-EXT-POPUP-001] Cleanup Safari-specific CSS classes
    if (this.isSafari) {
      document.body.classList.remove('safari-platform-detected')
      document.body.classList.remove('safari-performance-monitoring')
      document.body.classList.remove('safari-error-handling')
      document.body.classList.remove('safari-graceful-degradation')
      document.body.classList.remove('safari-feature-supported')
      document.body.classList.remove('safari-feature-unsupported')
      debugLog('[SAFARI-EXT-POPUP-001] Safari-specific CSS classes removed')
    }
    
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
    
    // [SAFARI-EXT-POPUP-001] Reset Safari-specific state
    this.errorRecoveryAttempts = 0
    
    debugLog('[SAFARI-EXT-POPUP-001] PopupController cleanup completed with Safari optimizations')
  }

  /**
   * [POPUP-REFRESH-001] Manual refresh capability
   */
  async refreshPopupData() {
    debugLog('[POPUP-REFRESH-001] Starting manual refresh')
    try {
      this.setLoading(true)
      await this.loadInitialData()

      // [POPUP-CLOSE-BEHAVIOR-ARCH-007] Update overlay state after refresh
      await this.updateOverlayState()

      this.uiManager.showSuccess('Data refreshed successfully')
      debugLog('[POPUP-REFRESH-001] Manual refresh completed successfully')
    } catch (error) {
      debugError('[POPUP-REFRESH-001] Refresh failed:', error)
      this.uiManager.showError('Failed to refresh data')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [POPUP-REFRESH-001] Setup auto-refresh on focus
   */
  setupAutoRefresh() {
    window.addEventListener('focus', () => {
      if (this.isInitialized && !this.isLoading) {
        debugLog('[POPUP-REFRESH-001] Auto-refresh on focus triggered')
        this.refreshPopupData()
      }
    })
  }

  /**
   * [POPUP-REFRESH-001] Enhanced real-time update handling
   */
  setupRealTimeUpdates() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === 'BOOKMARK_UPDATED') {
          debugLog('[POPUP-REFRESH-001] Received BOOKMARK_UPDATED, refreshing data')
          try {
            await this.refreshPopupData()
            // [POPUP-CLOSE-BEHAVIOR-ARCH-008] Update overlay state after bookmark changes
            await this.updateOverlayState()
          } catch (error) {
            debugError('[POPUP-REFRESH-001] Failed to refresh on update:', error)
          }
        }
      })
    }
  }

  /**
   * [POPUP-SYNC-001] Ensure popup and badge show same data
   */
  async validateBadgeSynchronization() {
    try {
      const currentTab = await this.getCurrentTab()
      const popupData = this.currentPin
      const badgeData = await this.sendMessage({
        type: 'getCurrentBookmark',
        data: { url: currentTab.url }
      })

      debugLog('[POPUP-SYNC-001] Badge synchronization check:', {
        popupTags: popupData?.tags,
        badgeTags: badgeData?.tags,
        popupTagCount: popupData?.tags?.length || 0,
        badgeTagCount: badgeData?.tags?.length || 0,
        synchronized: JSON.stringify(popupData) === JSON.stringify(badgeData)
      })

      return {
        synchronized: JSON.stringify(popupData) === JSON.stringify(badgeData),
        popupData,
        badgeData
      }
    } catch (error) {
      debugError('[POPUP-SYNC-001] Badge synchronization check failed:', error)
      return { synchronized: false, error: error.message }
    }
  }

  /**
   * [POPUP-SYNC-001] Ensure popup and overlay show same data
   */
  async validateOverlaySynchronization() {
    try {
      const overlayData = await this.sendToTab({
        type: 'getCurrentBookmark',
        data: { url: this.currentTab.url }
      })

      debugLog('[POPUP-SYNC-001] Overlay synchronization check:', {
        popupData: this.currentPin,
        overlayData: overlayData,
        popupTagCount: this.currentPin?.tags?.length || 0,
        overlayTagCount: overlayData?.tags?.length || 0,
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData)
      })

      return {
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData),
        popupData: this.currentPin,
        overlayData: overlayData
      }
    } catch (error) {
      debugError('[POPUP-SYNC-001] Overlay synchronization check failed:', error)
      return { synchronized: false, error: error.message }
    }
  }

  /**
   * [SHOW-HOVER-CHECKBOX-CONTROLLER-003] - Handle checkbox state change
   */
  async handleShowHoverOnPageLoadChange() {
    try {
      const isChecked = this.uiManager.elements.showHoverOnPageLoad.checked

      // Update configuration
      await this.configManager.updateConfig({
        showHoverOnPageLoad: isChecked
      })

      // Provide user feedback
      this.uiManager.showSuccess(
        isChecked ? 'Hover will show on page load' : 'Hover will not show on page load'
      )

      // Broadcast to content scripts
      await this.broadcastConfigUpdate()

    } catch (error) {
      this.errorHandler.handleError('Failed to update page load setting', error)
    }
  }

  /**
   * [SHOW-HOVER-CHECKBOX-CONTROLLER-004] - Load checkbox state from configuration
   */
  async loadShowHoverOnPageLoadSetting() {
    try {
      const config = await this.configManager.getConfig()
      this.uiManager.elements.showHoverOnPageLoad.checked = config.showHoverOnPageLoad
    } catch (error) {
      this.errorHandler.handleError('Failed to load page load setting', error)
    }
  }

    /**
   * [SHOW-HOVER-CHECKBOX-CONTROLLER-005] - Broadcast configuration updates to content scripts
   */
  async broadcastConfigUpdate() {
    try {
      const config = await this.configManager.getConfig()

      // Send to current tab if available
      if (this.currentTab) {
        await this.sendToTab({
          type: 'UPDATE_CONFIG',
          data: { showHoverOnPageLoad: config.showHoverOnPageLoad }
        })
      }

      // Broadcast to all tabs using the existing UPDATE_OVERLAY_CONFIG message type
      await this.sendMessage({
        type: 'updateOverlayConfig',
        data: { showHoverOnPageLoad: config.showHoverOnPageLoad }
      })

    } catch (error) {
      this.errorHandler.handleError('Failed to broadcast config update', error)
    }
  }
}
