/**
 * PopupController - Main business logic controller for the popup
 */

import { UIManager } from './UIManager.js'
import { StateManager } from './StateManager.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { debugLog, debugError, normalizeSelectionForTagInput } from '../../shared/utils.js'
import { ConfigManager } from '../../config/config-manager.js'
// [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
import { recordAction } from '../../shared/ui-inspector.js'
import { POPUP_ACTION_IDS, MESSAGE_TYPES } from '../../shared/ui-action-contract.js'
import { splitAiTagsBySession } from '../../features/ai/ai-tagging-popup-utils.js'
import { testAiApiKey } from '../../features/ai/ai-api-test.js'
import { formatTimeAge } from '../bookmarks-table/bookmarks-table-time.js'

/** [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] Extension-root path for scripting.executeScript files */
const SUGGESTED_TAGS_MAIN_WORLD_FILE = 'src/features/tagging/suggested-tags-main-world-snippet.js'

export class PopupController {
  constructor (dependencies = {}) {
    // [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION] Proper dependency injection with fallback creation
    this.errorHandler = dependencies.errorHandler || new ErrorHandler()
    this.stateManager = dependencies.stateManager || new StateManager()
    this.configManager = dependencies.configManager || new ConfigManager()

    // [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION] UIManager with proper dependency injection
    this.uiManager = dependencies.uiManager || new UIManager({
      errorHandler: this.errorHandler,
      stateManager: this.stateManager,
      config: {}
    })

    this.currentTab = null
    this.currentPin = null
    this.isInitialized = false
    this.isLoading = false
    // [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] Optional test hooks
    this._onAction = null
    this._onStateChange = null

    // [IMPL-POPUP_MESSAGE_TIMEOUT] Preserve predictable refresh behavior in tests and runtime
    const isTestEnv = typeof process !== 'undefined' && process?.env?.JEST_WORKER_ID
    this.tabMessageTimeoutMs = dependencies.tabMessageTimeoutMs ?? (isTestEnv ? 100 : 2000)

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
    this.handleOpenBookmarksIndex = this.handleOpenBookmarksIndex.bind(this)
    this.handleOpenBrowserBookmarkImport = this.handleOpenBrowserBookmarkImport.bind(this)
    this.handleStorageBackendChange = this.handleStorageBackendChange.bind(this)
    this.handleTagWithAi = this.handleTagWithAi.bind(this)
    this.handleTestAiApiKey = this.handleTestAiApiKey.bind(this)
    this.handleOpenTagsTree = this.handleOpenTagsTree.bind(this)
    this.normalizeTags = this.normalizeTags.bind(this)

    this.setupEventListeners()

    // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Setup refresh mechanisms
    this.setupAutoRefresh()
    this.setupRealTimeUpdates()

    // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] Listen for BOOKMARK_UPDATED to refresh popup data.
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === 'BOOKMARK_UPDATED') {
          try {
            debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Received BOOKMARK_UPDATED, refreshing data')
            // [TOGGLE_SYNC_POPUP] Fetch latest bookmark data for current tab
            if (this.currentTab && this.currentTab.url) {
              const updatedPin = await this.getBookmarkData(this.currentTab.url)
              this.currentPin = updatedPin
              this.stateManager.setState({ currentPin: this.currentPin })
              // [TOGGLE_SYNC_POPUP] Update UI to reflect new state
              this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')
              this.uiManager.updateReadLaterStatus(this.currentPin?.toread === 'yes')
              const normalizedTags = this.normalizeTags(this.currentPin?.tags)
              await this.refreshTagFrequencyMapForSort()
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
    debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] PopupController constructor called', { platform: navigator.userAgent })
    // Platform detection
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] Detected Chrome runtime in PopupController')
    } else if (typeof browser !== 'undefined' && browser.runtime) {
      debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] Detected browser polyfill runtime in PopupController')
    } else {
      debugError('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] No recognized extension runtime detected in PopupController')
    }
    // Check utils.js access
    if (!debugLog || !debugError) {
      console.error('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] utils.js functions missing in PopupController')
    }
  }

  /**
   * Normalize tags to array format regardless of input type
   */
  normalizeTags (tags) {
    if (!tags) {
      return []
    }

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
    this.uiManager.on('openBookmarksIndex', this.handleOpenBookmarksIndex)
    this.uiManager.on('openBrowserBookmarkImport', this.handleOpenBrowserBookmarkImport)
    this.uiManager.on('openTagsTree', this.handleOpenTagsTree)
    this.uiManager.on('tagWithAi', this.handleTagWithAi)
    this.uiManager.on('testAiApiKey', this.handleTestAiApiKey)

    // [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Storage backend change (move bookmark)
    this.uiManager.on('storageBackendChange', this.handleStorageBackendChange)
    // [REQ-MOVE_BOOKMARK_STORAGE_UI] File ↔ browser one-click toggle reuses same move handler
    this.uiManager.on('storageLocalToggle', (targetBackend) => this.handleStorageBackendChange(targetBackend))

    // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Add refresh event handler
    this.uiManager.on('refreshData', this.refreshPopupData.bind(this))

    // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Add checkbox event handler binding
    this.uiManager.on('showHoverOnPageLoadChange', this.handleShowHoverOnPageLoadChange.bind(this))
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] Set optional callback for UI actions (for tests).
   */
  setOnAction (fn) {
    this._onAction = typeof fn === 'function' ? fn : null
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] Set optional callback for state/screen changes (for tests).
   */
  setOnStateChange (fn) {
    this._onStateChange = typeof fn === 'function' ? fn : null
  }

  /**
   * Load initial data when popup opens
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced data flow validation
   */
  async loadInitialData () {
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: start')
    try {
      this.setLoading(true)

      // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Screenshot/demo mode: use fake current tab from URL params so
      // screenshot scripts can open popup as tab and show bookmark data for a specific URL.
      const params = typeof window !== 'undefined' && window.location && window.location.search
        ? new URLSearchParams(window.location.search)
        : null
      const screenshotMode = params && params.get('screenshot') === '1'
      this._screenshotMode = !!screenshotMode
      const screenshotUrl = params && params.get('url')
      const screenshotTitle = params && params.get('title')
      if (screenshotMode && screenshotUrl) {
        const decodedUrl = decodeURIComponent(screenshotUrl)
        const decodedTitle = screenshotTitle ? decodeURIComponent(screenshotTitle) : ''
        this.currentTab = { url: decodedUrl, title: decodedTitle }
        debugLog('[IMPL-SCREENSHOT_MODE] loadInitialData: using fake tab from params', this.currentTab)
      } else {
        // Get current tab information
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: calling getCurrentTab')
        this.currentTab = await this.getCurrentTab()
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: got currentTab', this.currentTab)
      }
      if (!this.currentTab) {
        throw new Error('Unable to get current tab information')
      }

      // Update state with tab info
      this.stateManager.setState({
        currentTab: this.currentTab,
        url: this.currentTab.url,
        title: this.currentTab.title
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Get and validate bookmark data
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: calling getBookmarkData', this.currentTab.url)
      this.currentPin = await this.getBookmarkData(this.currentTab.url)
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: got currentPin', this.currentPin)

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Handle both bookmarked and non-bookmarked sites
      if (!this.currentPin) {
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: No bookmark data, creating empty bookmark for current site')
        this.currentPin = {
          url: this.currentTab.url,
          description: this.currentTab.title || '',
          tags: [],
          shared: 'yes',
          toread: 'no',
          time: '',
          updated_at: '',
          extended: '',
          hash: ''
        }
        // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Log the created empty bookmark for test compatibility
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: created empty bookmark', this.currentPin)
      }

      this.stateManager.setState({ currentPin: this.currentPin })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced debug logging for bookmark data
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: bookmark data validation:', {
        hasBookmark: !!this.currentPin,
        url: this.currentPin?.url,
        description: this.currentPin?.description,
        tagCount: this.currentPin?.tags?.length || 0,
        isPrivate: this.currentPin?.shared === 'no',
        isReadLater: this.currentPin?.toread === 'yes'
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Process and validate tags
      const normalizedTags = this.normalizeTags(this.currentPin?.tags)
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: tags processing:', {
        originalTags: this.currentPin?.tags,
        originalTagsType: typeof this.currentPin?.tags,
        normalizedTags,
        normalizedTagsLength: normalizedTags.length,
        normalizedTagsIsArray: Array.isArray(normalizedTags)
      })
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Update UI with validated data
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: calling updateCurrentTags with:', normalizedTags)
      // [REQ-THIS_PAGE_TAG_SORT] Bookmark tag counts for This Page frequency sort (side panel)
      await this.refreshTagFrequencyMapForSort()
      this.uiManager.updateCurrentTags(normalizedTags)
      this.uiManager.updateConnectionStatus(true)
      this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')

      // Check if current bookmark has read later status
      const hasReadLaterStatus = this.currentPin?.toread === 'yes'
      this.uiManager.updateReadLaterStatus(hasReadLaterStatus)

      // Load recent tags
      await this.loadRecentTags()

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] - Load suggested tags from page content
      await this.loadSuggestedTags()

      // [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT] In screenshot/demo mode, overlay demo suggested tags from storage so Suggested Tags section is visible.
      if (this._screenshotMode) {
        await this.loadDemoSuggestedTagsIfScreenshotMode()
      }

      // [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] Prefill tag input from page selection (≤8 words)
      try {
        const selectionResponse = await this.sendToTab({ type: 'GET_PAGE_SELECTION' })
        const data = selectionResponse?.data ?? selectionResponse
        const raw = data?.selection
        if (raw && typeof raw === 'string') {
          const normalized = normalizeSelectionForTagInput(raw, 8)
          if (normalized) this.uiManager.setTagInputValue(normalized)
        }
      } catch (_) {
        // Content script not injected or no selection: leave tag input unchanged
      }

      // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Load checkbox state
      await this.loadShowHoverOnPageLoadSetting()

      // Set version info
      const manifest = chrome.runtime.getManifest()
      this.uiManager.updateVersionInfo(manifest.version)

      // [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] [REQ-STORAGE_MODE_DEFAULT] When not bookmarked: show default storage (ARCH).
      const hasRealBookmark = !!(this.currentPin?.time)
      const validBackends = ['pinboard', 'local', 'file', 'sync', 'browser']
      let storageBackend
      if (!hasRealBookmark) {
        storageBackend = await this.configManager.getStorageMode()
      } else {
        storageBackend = await this.getStorageBackendForUrl(this.currentTab?.url)
      }
      const backend = validBackends.includes(storageBackend) ? storageBackend : (await this.configManager.getStorageMode()) || 'local'
      this.uiManager.updateStorageBackendValue(backend)
      this.uiManager.updateStorageLocalToggle(backend, hasRealBookmark)
      // [REQ-MOVE_BOOKMARK_STORAGE_UI] Disable Pinboard storage option when no API token configured
      const token = await this.configManager.getAuthToken()
      this.uiManager.updateStoragePinboardEnabled(!!(token && token.trim()))

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Enable Tag with AI only when API key set and tab is http(s).
      const config = await this.configManager.getConfig()
      const aiApiKey = (config?.aiApiKey || '').trim()
      const tabUrl = (this.currentTab?.url || '').trim()
      const urlOk = tabUrl.startsWith('http://') || tabUrl.startsWith('https://')
      const tagWithAiBtn = this.uiManager.elements.tagWithAiBtn
      if (tagWithAiBtn) tagWithAiBtn.disabled = !aiApiKey || !urlOk

      // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI] This Page inline usage section
      await this.refreshUsageSection()

      // Mark as initialized
      this.isInitialized = true
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Popup initialization completed successfully')
      if (this._onStateChange) {
        this._onStateChange({ screen: 'mainInterface', state: { bookmark: this.currentPin } })
      }
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Failed to load initial data:', error)
      if (this._onStateChange) this._onStateChange({ screen: 'error', state: {} })
      if (this.errorHandler) {
        this.errorHandler.handleError('Failed to load initial data', error)
      }
      this.uiManager.updateConnectionStatus(false)
      // Re-throw the error so it can be caught by the calling method
      throw error
    } finally {
      this.setLoading(false)
      // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Signal to screenshot script that content is ready (enables wait-for-content).
      if (this._screenshotMode && this.uiManager?.elements?.mainInterface) {
        this.uiManager.elements.mainInterface.setAttribute('data-screenshot-ready', 'true')
      }
    }
  }

  /**
   * [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] In screenshot/demo mode, read hoverboard_demo_recent_tags from storage and call updateRecentTags (excluding current bookmark tags). Returns true if demo tags were applied, false otherwise.
   */
  async loadDemoRecentTagsIfScreenshotMode () {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== 'function') {
        resolve(false)
        return
      }
      chrome.storage.local.get('hoverboard_demo_recent_tags', (result) => {
        const tags = result && result.hoverboard_demo_recent_tags
        if (!Array.isArray(tags) || tags.length === 0) {
          resolve(false)
          return
        }
        const currentTags = this.normalizeTags(this.currentPin?.tags || [])
        const filtered = tags.filter(tag => !currentTags.includes(tag))
        this.uiManager.updateRecentTags(filtered)
        resolve(true)
      })
    })
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Load user-driven recent tags from shared memory
   * Excludes tags already assigned to the current site
   */
  async loadRecentTags () {
    try {
      debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Loading user-driven recent tags')

      // [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] In screenshot/demo mode use seeded demo recent tags so Recent Tags section is visible.
      if (this._screenshotMode) {
        const applied = await this.loadDemoRecentTagsIfScreenshotMode()
        if (applied) return
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get current tags to exclude from recent tags
      const currentTags = this.normalizeTags(this.currentPin?.tags || [])
      debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Current tags to exclude:', currentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get user recent tags excluding current site
      const response = await this.sendMessage({
        type: 'getRecentBookmarks',
        data: {
          currentTags, // Pass current tags for exclusion
          senderUrl: this.currentTab?.url
        }
      })

      debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Recent bookmarks response received:', response)

      if (response && response.recentTags) {
        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Recent tags from response:', response.recentTags)

        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Extract tag names from recent tags data
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

        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Extracted recent tag names:', recentTagNames)

        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Tags are already filtered by the service, but double-check
        const filteredRecentTags = recentTagNames.filter(tag =>
          !currentTags.includes(tag)
        )

        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Final filtered recent tags:', filteredRecentTags)

        this.uiManager.updateRecentTags(filteredRecentTags)
      } else {
        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] No recent tags in response, updating with empty array')
        this.uiManager.updateRecentTags([])
      }
    } catch (error) {
      debugError('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to load recent tags:', error)
      this.uiManager.updateRecentTags([])
    }
  }

  /**
   * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
   * Coerce chrome.storage hoverboard_tag_frequency payload to a plain object map (tag → count); arrays / primitives / null → {}.
   */
  _normalizeHoverboardTagFrequencyMap (raw) {
    return raw != null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  }

  /**
   * [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT]
   * NORMALIZE_SUGGESTED_ROWS + FILTER_INVALID_ROWS: map MAIN-world extract array to row objects; trim `tag`; omit empty-after-trim (matches IMPL-THIS_PAGE_TAG_SORT essence_pseudocode + unit test token set).
   */
  _normalizeSuggestedRowsFromMainWorld (raw) {
    if (!Array.isArray(raw)) return []
    return raw
      .map((entry) => {
        if (typeof entry === 'string') {
          const tag = entry.trim()
          if (!tag) return null
          return { tag, relevance: 0, inPageFrequency: 0 }
        }
        if (entry && typeof entry === 'object' && typeof entry.tag === 'string') {
          const tag = entry.tag.trim()
          if (!tag) return null
          return {
            tag,
            relevance: typeof entry.relevance === 'number' ? entry.relevance : 0,
            inPageFrequency: typeof entry.inPageFrequency === 'number' ? entry.inPageFrequency : 0
          }
        }
        return null
      })
      .filter(Boolean)
  }

  /**
   * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
   * Load hoverboard_tag_frequency from storage, normalize via _normalizeHoverboardTagFrequencyMap, push into UIManager for chip ordering (side panel).
   */
  async refreshTagFrequencyMapForSort () {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.local?.get) return
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('hoverboard_tag_frequency', resolve)
      })
      const map = this._normalizeHoverboardTagFrequencyMap(result?.hoverboard_tag_frequency)
      this.uiManager.setTagFrequencyMapForSort(map)
    } catch (e) {
      debugError('[POPUP-CONTROLLER] [REQ-THIS_PAGE_TAG_SORT] refreshTagFrequencyMapForSort failed:', e)
    }
  }

  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
   * Load suggested tags from page headings
   */
  async loadSuggestedTags () {
    try {
      debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Loading suggested tags from page content')

      if (!this.currentTab || !this.currentTab.id) {
        debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] No current tab, skipping suggested tags')
        this.uiManager.updateSuggestedTags([])
        return
      }

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] - Skip script injection on restricted URLs (extension pages, chrome://, etc.)
      const url = (this.currentTab.url || '').trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Tab URL not injectable (chrome-extension://, chrome://, etc.), skipping suggested tags')
        this.uiManager.updateSuggestedTags([])
        return
      }

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] MAIN world: snippet file then extractor (relevance + in-page frequency).
      try {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: this.currentTab.id },
            world: 'MAIN',
            files: [SUGGESTED_TAGS_MAIN_WORLD_FILE]
          })
        } catch (fileErr) {
          debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Main-world snippet file inject failed (non-fatal):', fileErr)
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          world: 'MAIN',
          func: () => {
            const fn = globalThis.__hoverboardExtractSuggestedTagsWithRelevance
            return typeof fn === 'function' ? fn() : []
          }
        })

        if (results && results[0] && results[0].result) {
          const raw = results[0].result
          const suggestedList = this._normalizeSuggestedRowsFromMainWorld(raw)

          const currentTags = this.normalizeTags(this.currentPin?.tags || [])
          const currentTagsLower = new Set(currentTags.map((t) => t.toLowerCase()))
          const filteredSuggestedTags = suggestedList.filter(
            (item) => !currentTagsLower.has(item.tag.toLowerCase())
          )

          debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted suggested tags:', filteredSuggestedTags)
          this.uiManager.updateSuggestedTags(filteredSuggestedTags)
        } else {
          debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] No suggested tags extracted')
          this.uiManager.updateSuggestedTags([])
        }
      } catch (scriptError) {
        // Script injection might fail on certain pages (chrome://, extension pages, etc.)
        debugError('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to extract suggested tags:', scriptError)
        this.uiManager.updateSuggestedTags([])
      }
    } catch (error) {
      debugError('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to load suggested tags:', error)
      this.uiManager.updateSuggestedTags([])
    }
  }

  /**
   * [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT] In screenshot/demo mode, read hoverboard_demo_suggested_tags from storage and call updateSuggestedTags so the Suggested Tags section is visible in screenshots and demo GIF.
   */
  async loadDemoSuggestedTagsIfScreenshotMode () {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== 'function') {
        resolve()
        return
      }
      chrome.storage.local.get('hoverboard_demo_suggested_tags', (result) => {
        const tags = result && result.hoverboard_demo_suggested_tags
        if (Array.isArray(tags) && tags.length > 0) {
          this.uiManager.updateSuggestedTags(tags)
        }
        resolve()
      })
    })
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate tag input
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

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Check for invalid characters
    const invalidChars = /[<>]/g
    if (invalidChars.test(trimmedTag)) {
      return false
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Check for only safe characters (allow #, +, . for e.g. C#, node.js; API encodes via buildSaveParams)
    const safeChars = /^[\w\s.#+-]+$/
    if (!safeChars.test(trimmedTag)) {
      return false
    }

    return true
  }

  /**
   * Get current active tab
   */
  async getCurrentTab () {
    debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: calling chrome.tabs.query')
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: chrome.tabs.query callback', tabs, chrome.runtime.lastError)
        if (chrome.runtime.lastError) {
          debugError('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: chrome.runtime.lastError', chrome.runtime.lastError)
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (tabs && tabs.length > 0) {
          resolve(tabs[0])
        } else {
          debugError('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: No active tab found')
          reject(new Error('No active tab found'))
        }
      })
    })
  }

  /**
   * Get bookmark data for a URL
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced data extraction with validation
   */
  async getBookmarkData (url) {
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: calling chrome.runtime.sendMessage', url)
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'getCurrentBookmark',
          data: { url }
        },
        (response) => {
          debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: chrome.runtime.sendMessage callback', response, chrome.runtime.lastError)
          if (chrome.runtime.lastError) {
            debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: chrome.runtime.lastError', chrome.runtime.lastError)
            reject(new Error(chrome.runtime.lastError.message))
            return
          }

          if (response && response.success) {
            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced response structure validation
            debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: response structure:', {
              response,
              responseSuccess: response.success,
              responseData: response.data,
              responseDataType: typeof response.data,
              responseDataKeys: response.data ? Object.keys(response.data) : null,
              hasUrl: !!response.data?.url,
              hasTags: !!response.data?.tags,
              tagCount: response.data?.tags ? (Array.isArray(response.data.tags) ? response.data.tags.length : 'not-array') : 0
            })

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Extract and validate bookmark data
            const bookmarkData = response.data

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Only treat as no bookmark when URL is blocked; needsAuth still has bookmark from local/file/sync
            if (bookmarkData?.blocked) {
              debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: URL blocked', bookmarkData)
              resolve(null)
              return
            }

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Validate extracted data
            const isValid = this.validateBookmarkData(bookmarkData)
            if (!isValid) {
              debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: Invalid bookmark data structure, treating as no bookmark', bookmarkData)
              resolve(null)
              return
            }

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Extract the actual bookmark data (handle both direct and nested structures)
            const extractedData = bookmarkData?.data || bookmarkData
            debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: extracted and validated bookmark data:', extractedData)
            resolve(extractedData)
          } else {
            debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: Failed to get bookmark data', response)
            reject(new Error(response?.error || 'Failed to get bookmark data'))
          }
        }
      )
    })
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Get the storage backend currently selected in the popup UI (highlighted button).
   * Used so save follows the highlight when creating or updating a bookmark.
   * @returns {string|null} 'pinboard'|'local'|'file'|'sync' or null if not determinable
   */
  getSelectedStorageBackend () {
    const btn = this.uiManager.elements.storageBackendButtons?.querySelector('.storage-backend-btn[aria-pressed="true"]')
    const backend = btn?.getAttribute('data-backend') || null
    return (backend && ['pinboard', 'local', 'file', 'sync'].includes(backend)) ? backend : null
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] Get storage backend for URL (pinboard | local | file | sync).
   */
  async getStorageBackendForUrl (url) {
    if (!url || typeof chrome?.runtime?.sendMessage !== 'function') return 'local'
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'getStorageBackendForUrl', data: { url } },
        (response) => {
          if (chrome.runtime.lastError || response === undefined) {
            resolve('local')
            return
          }
          const backend = response?.data ?? response
          resolve(typeof backend === 'string' ? backend : 'local')
        }
      )
    })
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move current bookmark to target storage backend.
   */
  async handleStorageBackendChange (targetBackend) {
    recordAction(POPUP_ACTION_IDS.storageBackendChange, { targetBackend }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.storageBackendChange, payload: { targetBackend } })
    // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Use bookmark URL when available so move uses same key as storage.
    const url = this.currentPin?.url || this.currentTab?.url
    if (!url) return
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'moveBookmarkToStorage', data: { url, targetBackend } },
          (r) => (chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(r))
        )
      })
      // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Use inner result: service worker wraps as { success: true, data: routerResult }.
      const result = response?.data ?? response
      if (result?.success) {
        this.uiManager.showSuccess('Bookmark moved to ' + targetBackend)
        const updated = await this.getBookmarkData(this.currentTab?.url || url)
        this.currentPin = updated
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateStorageBackendValue(targetBackend)
        this.uiManager.updateStorageLocalToggle(targetBackend, true)
        this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')
        this.uiManager.updateReadLaterStatus(this.currentPin?.toread === 'yes')
        this.uiManager.updateCurrentTags(this.normalizeTags(this.currentPin?.tags))
      } else {
        this.uiManager.showError(result?.message || 'Move failed')
      }
    } catch (e) {
      debugError('[IMPL-MOVE_BOOKMARK_UI] handleStorageBackendChange failed:', e)
      this.uiManager.showError(e.message || 'Move failed')
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Validate bookmark data structure
   * @param {Object} bookmarkData - Bookmark data to validate
   * @returns {boolean} Whether the data is valid
   */
  validateBookmarkData (bookmarkData) {
    // Handle null and undefined inputs
    if (bookmarkData === null || bookmarkData === undefined) {
      return false
    }

    // Handle both direct bookmark data and response structure
    const data = bookmarkData?.data || bookmarkData

    if (!data || typeof data !== 'object' || !data.url) {
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Bookmark data validation: missing url or invalid object')
      return false
    }

    // [IMPL-URL_TAGS_DISPLAY] Normalize tags to array instead of rejecting (defensive; backend now returns normalized)
    if (!Array.isArray(data.tags)) {
      data.tags = data.tags == null
        ? []
        : (typeof data.tags === 'string' ? data.tags.split(/\s+/).filter(t => t.trim()) : [])
    }

    const isValid = true
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Bookmark data validation:', {
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
   * Send message to background script.
   * @param {{ type: string, data?: Record<string, unknown> }} message - Message envelope (type + optional data)
   * @returns {Promise<unknown>} Response from service worker
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
        } else if (response && typeof response.error === 'string') {
          reject(new Error(response.error))
        } else if (response && ('textContent' in response || 'title' in response)) {
          resolve(response)
        } else {
          reject(new Error(response?.error || 'Request failed'))
        }
      })
    })
  }

  /**
   * [IMPL-POPUP_MESSAGE_TIMEOUT] Send message to content script with timeout; reject on timeout or error.
   */
  async sendToTab (message) {
    if (!this.currentTab) {
      throw new Error('No current tab available')
    }

    // Check if we can inject into this tab
    if (!this.canInjectIntoTab(this.currentTab)) {
      throw new Error('Cannot inject into this tab')
    }

    const timeoutMs = this.tabMessageTimeoutMs ?? 2000

    return new Promise((resolve, reject) => {
      let settled = false

      const startTimer = () => setTimeout(() => {
        if (settled) {
          return
        }
        settled = true
        debugError('[IMPL-POPUP_MESSAGE_TIMEOUT] sendToTab timed out', {
          timeoutMs,
          messageType: message?.type
        })
        reject(new Error('Timed out waiting for tab response'))
      }, timeoutMs)

      let timerId = startTimer()

      const refreshTimer = () => {
        if (settled) {
          return
        }
        clearTimeout(timerId)
        timerId = startTimer()
      }

      const resolveOnce = (value) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timerId)
        resolve(value)
      }

      const rejectOnce = (error) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timerId)
        reject(error)
      }

      const handleResponse = (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            debugLog('Content script not found, attempting injection...')
            refreshTimer()
            this.injectContentScript(this.currentTab.id)
              .then(() => {
                debugLog('Content script injected, waiting for initialization...')
                refreshTimer()
                setTimeout(() => {
                  if (settled) {
                    return
                  }
                  refreshTimer()
                  chrome.tabs.sendMessage(this.currentTab.id, message, (retryResponse) => {
                    if (chrome.runtime.lastError) {
                      debugError('Retry failed, trying fallback injection:', chrome.runtime.lastError.message)
                      refreshTimer()
                      this.injectFallbackContentScript(this.currentTab.id)
                        .then(() => {
                          setTimeout(() => {
                            if (settled) {
                              return
                            }
                            refreshTimer()
                            chrome.tabs.sendMessage(this.currentTab.id, message, (fallbackResponse) => {
                              if (chrome.runtime.lastError) {
                                debugError('Fallback also failed:', chrome.runtime.lastError.message)
                                rejectOnce(new Error(chrome.runtime.lastError.message))
                                return
                              }
                              debugLog('Message sent successfully after fallback injection')
                              resolveOnce(fallbackResponse)
                            })
                          }, 500)
                        })
                        .catch(fallbackError => {
                          debugError('Fallback injection failed:', fallbackError)
                          rejectOnce(new Error(`Both injection methods failed: ${fallbackError.message}`))
                        })
                      return
                    }
                    debugLog('Message sent successfully after injection')
                    resolveOnce(retryResponse)
                  })
                }, 1000)
              })
              .catch(error => {
                debugError('Content script injection failed:', error)
                rejectOnce(new Error(`Failed to inject content script: ${error.message}`))
              })
            return
          }
          rejectOnce(new Error(chrome.runtime.lastError.message))
          return
        }
        resolveOnce(response)
      }

      const sendMessageWithTimeout = () => {
        refreshTimer()
        let maybePromise
        try {
          maybePromise = chrome.tabs.sendMessage(this.currentTab.id, message, handleResponse)
        } catch (error) {
          rejectOnce(error instanceof Error ? error : new Error(String(error)))
          return
        }

        // [IMPL-POPUP_MESSAGE_TIMEOUT] Support Promise-based mocks that skip callbacks in Jest
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise
            .then((response) => {
              handleResponse(response)
            })
            .catch((error) => {
              debugError('[IMPL-POPUP_MESSAGE_TIMEOUT] Promise-based sendMessage failed', error)
              rejectOnce(error instanceof Error ? error : new Error(String(error)))
            })
        }
      }

      sendMessageWithTimeout()
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
        files: ['src/features/content/content-main.js']
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
    if (this._onStateChange) {
      this._onStateChange({ screen: isLoading ? 'loading' : 'mainInterface', state: { bookmark: this.currentPin } })
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Handle show/hide hoverboard; no window.close.
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Modified to NOT close popup after toggling overlay visibility
   */
  async handleShowHoverboard () {
    recordAction(POPUP_ACTION_IDS.showHoverboard, { tabId: this.currentTab?.id }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.showHoverboard, payload: { tabId: this.currentTab?.id } })
    try {
      // Check if we can inject into this tab
      if (!this.canInjectIntoTab(this.currentTab)) {
        this.uiManager.showError('Hoverboard is not available on this page (e.g., Chrome Web Store, New Tab, or Settings).')
        return
      }

      const toggleResponse = await this.sendToTab({
        type: 'TOGGLE_HOVER',
        data: {
          bookmark: this.currentPin,
          tab: this.currentTab
        }
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Remove closePopup() call and add overlay state tracking
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Use response data for immediate UI update
      if (toggleResponse && toggleResponse.data) {
        this.uiManager.updateShowHoverButtonState(toggleResponse.data.isVisible)
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Updated UI with toggle response:', toggleResponse.data)
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
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Handle toggle private status (popup stays open).
   */
  async handleTogglePrivate () {
    recordAction(POPUP_ACTION_IDS.togglePrivate, { hasBookmark: !!this.currentPin }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.togglePrivate, payload: { hasBookmark: !!this.currentPin } })
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
        const preferredBackendToggle = this.getSelectedStorageBackend()
        if (preferredBackendToggle) updatedPin.preferredBackend = preferredBackendToggle

        const response = await this.sendMessage({
          type: 'saveBookmark',
          data: updatedPin
        })

        this.currentPin.shared = newSharedStatus
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updatePrivateStatus(newSharedStatus === 'no')
        this.uiManager.showSuccess(`Bookmark is now ${isPrivate ? 'public' : 'private'}`)

        // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Notify overlay of changes (if visible)
        try {
          await this.sendToTab({
            type: 'BOOKMARK_UPDATED',
            data: updatedPin
          })
        } catch (error) {
          debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to notify overlay:', error)
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
    recordAction(POPUP_ACTION_IDS.readLater, { hasBookmark: !!this.currentPin }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.readLater, payload: { hasBookmark: !!this.currentPin } })
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
        const preferredBackendRead = this.getSelectedStorageBackend()
        if (preferredBackendRead) updatedPin.preferredBackend = preferredBackendRead

        const response = await this.sendMessage({
          type: 'saveBookmark',
          data: updatedPin
        })

        this.currentPin.toread = newToReadStatus
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateReadLaterStatus(newToReadStatus === 'yes')

        const statusMessage = newToReadStatus === 'yes' ? 'Added to read later' : 'Removed from read later'
        this.uiManager.showSuccess(statusMessage)

        // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Notify overlay of changes (if visible)
        try {
          await this.sendToTab({
            type: 'BOOKMARK_UPDATED',
            data: updatedPin
          })
        } catch (error) {
          debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to notify overlay:', error)
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
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Enhanced with user-driven recent tags tracking
   */
  async handleAddTag (tagText) {
    recordAction(POPUP_ACTION_IDS.addTag, { tag: tagText }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.addTag, payload: { tag: tagText } })
    if (!tagText || !tagText.trim()) {
      this.errorHandler.handleError('Please enter a tag')
      return
    }

    try {
      this.setLoading(true)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Sanitize and validate tags
      const newTags = tagText.trim().split(/\s+/).filter(tag => tag.length > 0)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate each tag
      for (const tag of newTags) {
        if (!this.isValidTag(tag)) {
          this.errorHandler.handleError(`Invalid tag: ${tag}`)
          return
        }
      }

      if (this.currentPin) {
        // [IMPL-URL_TAGS_DISPLAY] Re-fetch current tags from backend and merge so prior tags are never lost
        const url = this.currentTab?.url || this.currentPin?.url
        let currentTagsArray = this.normalizeTags(this.currentPin.tags)
        if (url) {
          try {
            const fresh = await this.getBookmarkData(url)
            if (fresh && (fresh.tags?.length || this.currentPin?.tags?.length)) {
              currentTagsArray = this.normalizeTags(fresh.tags)
            }
          } catch (e) {
            debugError('[IMPL-URL_TAGS_DISPLAY] getBookmarkData before add tag failed, using currentPin', e)
          }
        }
        const allTags = [...new Set([...currentTagsArray, ...newTags])]
        await this.addTagsToBookmark(allTags)
      } else {
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Create new bookmark with tags
        await this.createBookmark(newTags)
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Track newly added tags for current site only
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
          debugError('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to track tag addition:', error)
          // Don't fail the entire operation if tag tracking fails
        }
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Clear the input
      this.uiManager.clearTagInput()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Refresh recent tags after adding a tag
      await this.loadRecentTags()
    } catch (error) {
      this.errorHandler.handleError('Failed to add tags', error)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Even on failure, update UI with current tags and recent tags
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
    recordAction(POPUP_ACTION_IDS.removeTag, { tag: tagToRemove }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.removeTag, payload: { tag: tagToRemove } })
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found')
      return
    }

    try {
      this.setLoading(true)

      // [IMPL-URL_TAGS_DISPLAY] Re-fetch current tags so we remove from authoritative list
      const url = this.currentTab?.url || this.currentPin?.url
      let currentTagsArray = this.normalizeTags(this.currentPin.tags)
      if (url) {
        try {
          const fresh = await this.getBookmarkData(url)
          if (fresh?.tags?.length) currentTagsArray = this.normalizeTags(fresh.tags)
        } catch (e) {
          debugError('[IMPL-URL_TAGS_DISPLAY] getBookmarkData before remove tag failed', e)
        }
      }
      const tagsArray = currentTagsArray.filter(tag => tag !== tagToRemove)
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
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced with tag tracking and validation
   */
  async addTagsToBookmark (tags) {
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate all tags before saving
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
    const preferredBackendTag = this.getSelectedStorageBackend()
    if (preferredBackendTag) pinData.preferredBackend = preferredBackendTag

    const response = await this.sendMessage({
      type: 'saveBookmark',
      data: pinData
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Update current pin with new tags
    this.currentPin.tags = tagsString
    this.stateManager.setState({ currentPin: this.currentPin })
    this.uiManager.updateCurrentTags(tags)
    this.uiManager.showSuccess('Tags updated successfully')

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Refresh recent tags after updating bookmark
    await this.loadRecentTags()
    await this.refreshTagFrequencyMapForSort()
    this.uiManager.redrawTagChipsFromCache()

    // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Notify overlay of tag changes
    await this.notifyOverlayOfTagChanges(tags)

    // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Also send BOOKMARK_UPDATED to ensure overlay updates tags
    try {
      await this.sendToTab({
        type: 'BOOKMARK_UPDATED',
        data: pinData
      })
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Failed to notify overlay of BOOKMARK_UPDATED after tag change:', error)
    }
  }

  /**
   * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Notify overlay of tag changes
   * @param {string[]} tags - Array of updated tags
   */
  async notifyOverlayOfTagChanges (tags) {
    try {
      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Send TAG_UPDATED message to overlay/content script
      const updatedBookmark = {
        url: this.currentTab?.url,
        description: this.currentTab?.title,
        tags
      }
      await this.sendToTab({
        type: 'TAG_UPDATED',
        data: updatedBookmark
      })
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Failed to notify overlay of TAG_UPDATED:', error)
      // Don't fail the entire operation if overlay notification fails
    }
  }

  /**
   * Create new bookmark
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced with tag tracking and validation
   */
  async createBookmark (tags, sharedStatus = 'yes', toreadStatus = 'no') {
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate all tags before creating bookmark
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

    // [REQ-STORAGE_MODE_DEFAULT] Save follows highlight: pass UI-selected backend so router uses it for new bookmarks.
    const preferredBackend = this.getSelectedStorageBackend()
    if (preferredBackend) pinData.preferredBackend = preferredBackend

    const response = await this.sendMessage({
      type: 'saveBookmark',
      data: pinData
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Update current pin with new bookmark data
    this.currentPin = pinData
    this.stateManager.setState({ currentPin: this.currentPin })
    this.uiManager.updateCurrentTags(tags)
    this.uiManager.showSuccess('Bookmark created successfully')

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Refresh recent tags after creating bookmark
    await this.loadRecentTags()
    await this.refreshTagFrequencyMapForSort()
    this.uiManager.redrawTagChipsFromCache()
  }

  /**
   * Handle search action - now uses tab search functionality
   */
  async handleSearch (searchText) {
    recordAction(POPUP_ACTION_IDS.search, { searchText }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.search, payload: { searchText } })
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

    let scrollContainer = null
    let savedScrollTop
    try {
      scrollContainer = this.uiManager?.container
      savedScrollTop = scrollContainer ? scrollContainer.scrollTop : undefined
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
        // [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] No-match: visual feedback only, no error message.
        const isNoMatch = response.message === 'No matching tabs found' || response.matchCount === 0
        if (isNoMatch) {
          this.uiManager.showSearchNoMatchFeedback()
        } else {
          this.uiManager.showError(response.message || 'No matching tabs found')
        }
      }
    } catch (error) {
      debugError('[SEARCH-UI] Search error:', error)
      this.errorHandler.handleError('Failed to search tabs', error)
    } finally {
      this.setLoading(false)
      if (scrollContainer != null && savedScrollTop !== undefined) {
        scrollContainer.scrollTop = savedScrollTop
      }
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle delete bookmark action
   * Modified to NOT close popup after deletion - popup stays open for continued interaction
   */
  async handleDeletePin () {
    recordAction(POPUP_ACTION_IDS.deletePin, { url: this.currentPin?.url }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.deletePin, payload: { url: this.currentPin?.url } })
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found to delete')
      return
    }

    // Confirm deletion
    const globalConfirm = typeof globalThis !== 'undefined' && typeof globalThis.confirm === 'function'
      ? globalThis.confirm
      : (typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm : null)
    if (globalConfirm && !globalConfirm('Are you sure you want to delete this bookmark?')) {
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

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to delete bookmark', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle reload extension action
   * Modified to NOT close popup after reload - popup stays open for continued interaction
   */
  async handleReloadExtension () {
    recordAction(POPUP_ACTION_IDS.reloadExtension, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.reloadExtension, payload: undefined })
    try {
      // Extension reload doesn't need a message - just reload the tab
      if (this.currentTab) {
        await chrome.tabs.reload(this.currentTab.id)
      }
      this.uiManager.showSuccess('Extension reloaded successfully')
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to reload extension', error)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle open options action
   * Modified to NOT close popup after opening options - popup stays open for continued interaction
   */
  async handleOpenOptions () {
    recordAction(POPUP_ACTION_IDS.openOptions, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openOptions, payload: undefined })
    try {
      chrome.runtime.openOptionsPage()
      this.uiManager.showSuccess('Options page opened in new tab')
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to open options', error)
    }
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Open Local Bookmarks Index via SW OPEN_BOOKMARKS_INDEX_TAB (create tab + dismiss side panel).
   */
  async handleOpenBookmarksIndex () {
    recordAction(POPUP_ACTION_IDS.openBookmarksIndex, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openBookmarksIndex, payload: undefined })
    try {
      await this.sendMessage({ type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX })
      this.uiManager.showSuccess('Bookmarks index opened in new tab')
    } catch (error) {
      this.errorHandler.handleError('Failed to open bookmarks index', error)
    }
  }

  /**
   * [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
   * Open the browser bookmark import page in a new tab.
   */
  handleOpenBrowserBookmarkImport () {
    recordAction(POPUP_ACTION_IDS.openBrowserBookmarkImport, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openBrowserBookmarkImport, payload: undefined })
    try {
      const url = chrome.runtime.getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html')
      chrome.tabs.create({ url })
      this.uiManager.showSuccess('Browser bookmark import opened in new tab')
    } catch (error) {
      this.errorHandler.handleError('Failed to open browser bookmark import', error)
    }
  }

  /**
   * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
   * Open the tags and bookmarks tree in the side panel. Implements requirement "open tags tree from popup" by sending OPEN_SIDE_PANEL to the service worker (which opens the panel with cached windowId); records action, shows success or delegates error to ErrorHandler.
   */
  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] When onOpenTagsTreeInPanel is set (side panel Bookmark tab),
   * call it instead of sending OPEN_SIDE_PANEL so the panel switches to the Tags tree tab.
   */
  async handleOpenTagsTree () {
    recordAction(POPUP_ACTION_IDS.openTagsTree, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openTagsTree, payload: undefined })
    if (typeof this.onOpenTagsTreeInPanel === 'function') {
      this.onOpenTagsTreeInPanel()
      return
    }
    try {
      await this.sendMessage({ type: MESSAGE_TYPES.OPEN_SIDE_PANEL })
      this.uiManager.showSuccess('Tags tree opened in side panel')
    } catch (error) {
      this.errorHandler.handleError('Failed to open tags tree', error)
    }
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_POPUP_UI]
   * Submit current page to AI for tagging: Readability → AI tags → session split → save/suggested.
   */
  async handleTagWithAi () {
    const btn = this.uiManager.elements.tagWithAiBtn
    if (btn) btn.disabled = true
    try {
      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Guard: require tab, http(s) URL, and API key.
      if (!this.currentTab || !this.currentTab.id) {
        this.uiManager.showError('No tab available')
        return
      }
      const url = (this.currentTab.url || '').trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        this.uiManager.showError('AI tagging is not available on this page')
        return
      }
      const config = await this.configManager.getConfig()
      const apiKey = (config.aiApiKey || '').trim()
      if (!apiKey) {
        this.uiManager.showError('Set an AI API key in Options to use Tag with AI')
        return
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] GET_PAGE_CONTENT via SW; show content.error or generic message when no text.
      const content = await this.sendMessage({
        type: 'GET_PAGE_CONTENT',
        data: { tabId: this.currentTab.id }
      })
      const text = (content?.textContent ?? content?.data?.textContent ?? '').trim()
      if (!text) {
        const msg = (content?.success === false && content?.error) ? content.error : 'Could not extract page content for tagging'
        this.uiManager.showError(msg)
        return
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] GET_AI_TAGS from SW; require success and non-empty tags.
      const aiRes = await this.sendMessage({
        type: 'GET_AI_TAGS',
        data: { text }
      })
      const aiTags = Array.isArray(aiRes?.tags) ? aiRes.tags : []
      if (!aiRes?.success || aiTags.length === 0) {
        const msg = aiRes?.error || 'No tags returned from AI'
        this.uiManager.showError(msg)
        return
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] getSessionTags + splitAiTagsBySession → inSession vs suggested.
      const sessionRes = await this.sendMessage({ type: 'getSessionTags' })
      const sessionTags = Array.isArray(sessionRes?.tags) ? sessionRes.tags : []
      const { inSession, suggested } = splitAiTagsBySession(aiTags, sessionTags)

      const currentTags = this.normalizeTags(this.currentPin?.tags || [])
      const mergedTags = [...new Set([...currentTags, ...inSession])]

      if (!this.currentPin || !this.currentPin.url) {
        // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] Create new bookmark with preferredBackend from getStorageMode().
        const preferredBackend = await this.configManager.getStorageMode()
        const pinData = {
          url: this.currentTab.url,
          description: content?.title || this.currentTab?.title || 'Untitled',
          tags: mergedTags.join(' '),
          shared: 'yes',
          toread: 'no',
          preferredBackend: preferredBackend || undefined
        }
        await this.sendMessage({ type: 'saveBookmark', data: pinData })
        this.currentPin = pinData
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateCurrentTags(mergedTags)
        this.uiManager.showSuccess('Bookmark created with AI tags')
      } else {
        // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] Update existing bookmark: merged tags, preferredBackend from selection or default.
        const pinData = {
          ...this.currentPin,
          tags: mergedTags.join(' '),
          description: this.getBetterDescription(this.currentPin?.description, content?.title || this.currentTab?.title)
        }
        const preferredBackend = this.getSelectedStorageBackend()
        if (preferredBackend) pinData.preferredBackend = preferredBackend
        await this.sendMessage({ type: 'saveBookmark', data: pinData })
        this.currentPin.tags = pinData.tags
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateCurrentTags(mergedTags)
        this.uiManager.showSuccess('Tags updated with AI suggestions')
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] updateSuggestedTags, loadRecentTags, notify tab (BOOKMARK_UPDATED).
      this.uiManager.updateSuggestedTags(suggested)
      await this.loadRecentTags()
      try {
        await this.sendToTab({ type: 'BOOKMARK_UPDATED', data: this.currentPin })
      } catch (_) { /* ignore */ }
    } catch (error) {
      debugError('[REQ-AI_TAGGING_POPUP] handleTagWithAi failed:', error)
      this.uiManager.showError(error?.message || 'AI tagging failed')
    } finally {
      if (btn) btn.disabled = false
    }
  }

  /**
   * [REQ-AI_TAGGING_CONFIG] [IMPL-AI_TAG_TEST] Test AI API key from popup (same as options page).
   */
  async handleTestAiApiKey () {
    const statusEl = this.uiManager.elements.popupAiTestStatus
    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] No status element; skip.
    if (!statusEl) return
    try {
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Load config; require apiKey or show "Set API key in Options first".
      const config = await this.configManager.getConfig()
      const apiKey = (config.aiApiKey || '').trim()
      const provider = config.aiProvider || 'openai'
      if (!apiKey) {
        statusEl.textContent = 'Set API key in Options first'
        return
      }
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] "Testing…" then testAiApiKey; set status to "API key OK" or error.
      statusEl.textContent = 'Testing…'
      const result = await testAiApiKey(apiKey, provider)
      if (result.ok) {
        statusEl.textContent = 'API key OK'
      } else {
        statusEl.textContent = result.error || 'Failed'
      }
    } catch (e) {
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Catch: show error message in status.
      statusEl.textContent = `Error: ${e?.message || 'Unknown'}`
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
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Update popup UI to reflect overlay state
   */
  async updateOverlayState () {
    if (!this.currentTab || !this.canInjectIntoTab(this.currentTab)) {
      this.uiManager.updateShowHoverButtonState(false)
      return
    }
    try {
      // Query overlay state from content script
      const overlayState = await this.sendToTab({
        type: 'GET_OVERLAY_STATE'
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle response data structure
      const stateData = overlayState.data || overlayState

      // Update button appearance based on overlay visibility
      this.uiManager.updateShowHoverButtonState(stateData.isVisible)

      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Updated overlay state:', stateData)
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Failed to update overlay state:', error)
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Graceful degradation - fallback to default state
      this.uiManager.updateShowHoverButtonState(false)
    }
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
    this.uiManager?.off('openBookmarksIndex', this.handleOpenBookmarksIndex)
    this.uiManager?.off('openBrowserBookmarkImport', this.handleOpenBrowserBookmarkImport)
    this.uiManager?.off('openTagsTree', this.handleOpenTagsTree)
  }

  /**
   * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
   * Fetch usage and inbound links for current tab URL and update This Page usage section.
   */
  async refreshUsageSection () {
    const url = this.currentTab?.url
    if (!url || typeof this.sendMessage !== 'function') return
    try {
      const [usageRes, inboundRes] = await Promise.all([
        this.sendMessage({ type: MESSAGE_TYPES.GET_BOOKMARK_USAGE, data: { url } }),
        this.sendMessage({ type: MESSAGE_TYPES.GET_BOOKMARK_INBOUND_LINKS, data: { url } })
      ])
      const usage = usageRes && typeof usageRes === 'object' ? usageRes : null
      const inbound = (Array.isArray(inboundRes) ? inboundRes : [])
        .filter((e) => e?.sourceUrl)
        .sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0))
      const topReferrer = inbound[0]?.sourceUrl
      let topReferrerDisplay = ''
      if (topReferrer) {
        try {
          const u = new URL(topReferrer)
          topReferrerDisplay = u.hostname + (u.pathname && u.pathname !== '/' ? u.pathname.slice(0, 50) + (u.pathname.length > 50 ? '…' : '') : '')
        } catch (_) {
          topReferrerDisplay = topReferrer.slice(0, 50)
        }
      }
      const visitCount = usage?.visitCount ?? 0
      const lastVisitedAgoText = usage?.lastVisitedAt ? formatTimeAge(usage.lastVisitedAt) : ''
      this.uiManager.updateUsageSection(
        visitCount > 0 ? { visitCount, lastVisitedAgoText } : null,
        topReferrerDisplay
      )
    } catch (err) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING_UI] refreshUsageSection failed:', err)
      this.uiManager.updateUsageSection(null, '')
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Manual refresh capability
   */
  async refreshPopupData () {
    recordAction(POPUP_ACTION_IDS.refreshData, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.refreshData, payload: undefined })
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Starting manual refresh')
    try {
      this.setLoading(true)
      await this.loadInitialData()

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Update overlay state after refresh
      await this.updateOverlayState()

      this.uiManager.showSuccess('Data refreshed successfully')
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Manual refresh completed successfully')
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Refresh failed:', error)
      this.uiManager.showError('Failed to refresh data')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Setup auto-refresh on focus
   * [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [REQ-RECENT_TAGS_SYSTEM] Refresh Recent Tags when popup becomes visible (visibilitychange).
   */
  setupAutoRefresh () {
    window.addEventListener('focus', () => {
      if (this.isInitialized && !this.isLoading) {
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Auto-refresh on focus triggered')
        this.refreshPopupData()
      }
    })

    // [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [REQ-RECENT_TAGS_SYSTEM] Refresh Recent Tags every time popup is displayed
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isInitialized && !this.isLoading) {
        debugLog('[IMPL-RECENT_TAGS_POPUP_REFRESH] Popup visible, refreshing recent tags')
        this.loadRecentTags()
      }
    })
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced real-time update handling
   */
  setupRealTimeUpdates () {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === 'BOOKMARK_UPDATED') {
          debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Received BOOKMARK_UPDATED, refreshing data')
          try {
            await this.refreshPopupData()
            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Update overlay state after bookmark changes
            await this.updateOverlayState()
          } catch (error) {
            debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Failed to refresh on update:', error)
          }
        }
      })
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Ensure popup and badge show same data
   */
  async validateBadgeSynchronization () {
    try {
      const currentTab = await this.getCurrentTab()
      const popupData = this.currentPin
      const badgeData = await this.sendMessage({
        type: 'getCurrentBookmark',
        data: { url: currentTab.url }
      })

      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Badge synchronization check:', {
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
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Badge synchronization check failed:', error)
      return { synchronized: false, error: error.message }
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Ensure popup and overlay show same data
   */
  async validateOverlaySynchronization () {
    try {
      const overlayData = await this.sendToTab({
        type: 'getCurrentBookmark',
        data: { url: this.currentTab.url }
      })

      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Overlay synchronization check:', {
        popupData: this.currentPin,
        overlayData,
        popupTagCount: this.currentPin?.tags?.length || 0,
        overlayTagCount: overlayData?.tags?.length || 0,
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData)
      })

      return {
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData),
        popupData: this.currentPin,
        overlayData
      }
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Overlay synchronization check failed:', error)
      return { synchronized: false, error: error.message }
    }
  }

  /**
   * [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Handle checkbox state change
   */
  async handleShowHoverOnPageLoadChange () {
    recordAction(POPUP_ACTION_IDS.showHoverOnPageLoadChange, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.showHoverOnPageLoadChange, payload: undefined })
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
   * [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Load checkbox state from configuration
   */
  async loadShowHoverOnPageLoadSetting () {
    try {
      const config = await this.configManager.getConfig()
      this.uiManager.elements.showHoverOnPageLoad.checked = config.showHoverOnPageLoad
    } catch (error) {
      this.errorHandler.handleError('Failed to load page load setting', error)
    }
  }

  /**
   * [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Broadcast configuration updates to content scripts
   */
  async broadcastConfigUpdate () {
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
