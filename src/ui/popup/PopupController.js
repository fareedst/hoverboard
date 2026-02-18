/**
 * PopupController - Main business logic controller for the popup
 */

import { UIManager } from './UIManager.js'
import { StateManager } from './StateManager.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { debugLog, debugError } from '../../shared/utils.js'
import { ConfigManager } from '../../config/config-manager.js'
// [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
import { recordAction } from '../../shared/ui-inspector.js'
import { POPUP_ACTION_IDS } from '../../shared/ui-action-contract.js'
import { debugLogger, LOG_CATEGORIES } from '../../shared/debug-logger.js'

debugLog('[SAFARI-EXT-SHIM-001] PopupController.js: module loaded');

export class PopupController {
  constructor (dependencies = {}) {
    // [DEP-INJ-001] Proper dependency injection with fallback creation
    this.errorHandler = dependencies.errorHandler || new ErrorHandler()
    this.stateManager = dependencies.stateManager || new StateManager()
    this.configManager = dependencies.configManager || new ConfigManager()

    // [DEP-INJ-001] UIManager with proper dependency injection
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
    this.handleStorageBackendChange = this.handleStorageBackendChange.bind(this)
    this.normalizeTags = this.normalizeTags.bind(this)

    this.setupEventListeners()

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
    debugLog('[CHROME-DEBUG-001] PopupController constructor called', { platform: navigator.userAgent });
    // Platform detection
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      debugLog('[CHROME-DEBUG-001] Detected Chrome runtime in PopupController');
    } else if (typeof browser !== 'undefined' && browser.runtime) {
      debugLog('[CHROME-DEBUG-001] Detected browser polyfill runtime in PopupController');
    } else {
      debugError('[CHROME-DEBUG-001] No recognized extension runtime detected in PopupController');
    }
    // Check utils.js access
    if (!debugLog || !debugError) {
      console.error('[CHROME-DEBUG-001] utils.js functions missing in PopupController');
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
    this.uiManager.on('openBookmarksIndex', this.handleOpenBookmarksIndex)

    // [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Storage backend change (move bookmark)
    this.uiManager.on('storageBackendChange', this.handleStorageBackendChange)
    // [REQ-MOVE_BOOKMARK_STORAGE_UI] File ↔ browser one-click toggle reuses same move handler
    this.uiManager.on('storageLocalToggle', (targetBackend) => this.handleStorageBackendChange(targetBackend))

    // [POPUP-REFRESH-001] Add refresh event handler
    this.uiManager.on('refreshData', this.refreshPopupData.bind(this))

    // [SHOW-HOVER-CHECKBOX-CONTROLLER-001] - Add checkbox event handler binding
    this.uiManager.on('showHoverOnPageLoadChange', this.handleShowHoverOnPageLoadChange.bind(this))
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
   * Set optional callback for UI actions (for tests). Signature: ({ actionId, payload }) => void
   */
  setOnAction (fn) {
    this._onAction = typeof fn === 'function' ? fn : null
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
   * Set optional callback for state/screen changes (for tests). Signature: ({ screen, state }) => void
   */
  setOnStateChange (fn) {
    this._onStateChange = typeof fn === 'function' ? fn : null
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

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] - Load suggested tags from page content
      await this.loadSuggestedTags()

      // [SHOW-HOVER-CHECKBOX-CONTROLLER-002] - Load checkbox state
      await this.loadShowHoverOnPageLoadSetting()

      // Set version info
      const manifest = chrome.runtime.getManifest()
      this.uiManager.updateVersionInfo(manifest.version)

      // [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] [REQ-STORAGE_MODE_DEFAULT] When not bookmarked: show default storage (ARCH).
      const hasRealBookmark = !!(this.currentPin?.time)
      const validBackends = ['pinboard', 'local', 'file', 'sync']
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

      // Mark as initialized
      this.isInitialized = true
      debugLog('[POPUP-DATA-FLOW-001] Popup initialization completed successfully')
      if (this._onStateChange) {
        this._onStateChange({ screen: 'mainInterface', state: { bookmark: this.currentPin } })
      }
    } catch (error) {
      debugError('[POPUP-DATA-FLOW-001] Failed to load initial data:', error)
      if (this._onStateChange) this._onStateChange({ screen: 'error', state: {} })
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

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] - Extract suggested tags using content script injection
      // Import TagService dynamically to avoid circular dependencies
      const { TagService } = await import('../../features/tagging/tag-service.js')
      const tagService = new TagService()

      // Execute script in tab to extract suggested tags
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          func: () => {
            // Extract tags from multiple sources in the page context
            const allTexts = []

            // [REQ-SUGGESTED_TAGS_FROM_CONTENT] Helper function to extract text from element, preferring title attribute
            const extractElementText = (element) => {
              // Check for title attribute on the element itself
              if (element.title && element.title.trim().length > 0) {
                return element.title.trim()
              }
              // Check for title attribute on child elements (e.g., yt-formatted-string inside h1)
              const childWithTitle = element.querySelector('[title]')
              if (childWithTitle && childWithTitle.title && childWithTitle.title.trim().length > 0) {
                return childWithTitle.title.trim()
              }
              // Fall back to textContent
              return (element.textContent || '').trim()
            }

            // 1. Document title
            if (document.title) {
              allTexts.push(document.title)
            }

            // 2. URL path segments
            try {
              const urlObj = new URL(window.location.href)
              const pathSegments = urlObj.pathname.split('/').filter(seg => seg.length > 0)
              const meaningfulSegments = pathSegments.filter(seg => {
                const lower = seg.toLowerCase()
                return !['www', 'com', 'org', 'net', 'html', 'htm', 'php', 'asp', 'aspx', 'index', 'home', 'page'].includes(lower) &&
                       !/^\d+$/.test(seg) && seg.length >= 2
              })
              if (meaningfulSegments.length > 0) {
                allTexts.push(meaningfulSegments.join(' '))
              }
            } catch (e) {
              // Ignore URL parsing errors
            }

            // 2.5. Meta keywords and description
            const metaKeywords = document.querySelector('meta[name="keywords"]')
            if (metaKeywords && metaKeywords.content && metaKeywords.content.trim().length > 0) {
              allTexts.push(metaKeywords.content.trim())
            }
            const metaDescription = document.querySelector('meta[name="description"]')
            if (metaDescription && metaDescription.content && metaDescription.content.trim().length > 0) {
              allTexts.push(metaDescription.content.trim())
            }

            // 3. Headings
            const headings = document.querySelectorAll('h1, h2, h3')
            if (headings.length > 0) {
              const headingTexts = Array.from(headings).map(h => extractElementText(h)).filter(t => t.length > 0)
              if (headingTexts.length > 0) {
                allTexts.push(headingTexts.join(' '))
              }
            }

            // 3.5. Semantic emphasis elements within main content
            const emphasisElements = document.querySelectorAll('main strong, main b, main em, main i, main mark, main dfn, main cite, main kbd, main code, article strong, article b, article em, article i, article mark, article dfn, article cite, article kbd, article code, [role="main"] strong, [role="main"] b, [role="main"] em, [role="main"] i, [role="main"] mark, [role="main"] dfn, [role="main"] cite, [role="main"] kbd, [role="main"] code, .main strong, .main b, .main em, .main i, .main mark, .main dfn, .main cite, .main kbd, .main code, .content strong, .content b, .content em, .content i, .content mark, .content dfn, .content cite, .content kbd, .content code')
            if (emphasisElements.length > 0) {
              const emphasisTexts = Array.from(emphasisElements).slice(0, 60).map(el => extractElementText(el)).filter(t => t.length > 0)
              if (emphasisTexts.length > 0) {
                allTexts.push(emphasisTexts.join(' '))
              }
            }

            // 3.6. Definition lists and table headers
            const definitionTerms = document.querySelectorAll('main dl dt, article dl dt, [role="main"] dl dt, .main dl dt, .content dl dt')
            if (definitionTerms.length > 0) {
              const dtTexts = Array.from(definitionTerms).slice(0, 40).map(dt => extractElementText(dt)).filter(t => t.length > 0)
              if (dtTexts.length > 0) {
                allTexts.push(dtTexts.join(' '))
              }
            }
            const tableHeaders = document.querySelectorAll('main th, main caption, article th, article caption, [role="main"] th, [role="main"] caption, .main th, .main caption, .content th, .content caption')
            if (tableHeaders.length > 0) {
              const thTexts = Array.from(tableHeaders).slice(0, 40).map(th => extractElementText(th)).filter(t => t.length > 0)
              if (thTexts.length > 0) {
                allTexts.push(thTexts.join(' '))
              }
            }

            // 4. Top-level navigation
            const nav = document.querySelector('nav') || document.querySelector('header nav') || document.querySelector('[role="navigation"]')
            if (nav) {
              const navLinks = nav.querySelectorAll('a')
              const navTexts = Array.from(navLinks).slice(0, 40).map(link => extractElementText(link)).filter(t => t.length > 0)
              if (navTexts.length > 0) {
                allTexts.push(navTexts.join(' '))
              }
            }

            // 5. Breadcrumbs
            const breadcrumb = document.querySelector('[aria-label*="breadcrumb" i], .breadcrumb, nav[aria-label*="breadcrumb" i], [itemtype*="BreadcrumbList"]')
            if (breadcrumb) {
              const breadcrumbLinks = breadcrumb.querySelectorAll('a, [itemprop="name"]')
              const breadcrumbTexts = Array.from(breadcrumbLinks).map(link => extractElementText(link)).filter(t => t.length > 0)
              if (breadcrumbTexts.length > 0) {
                allTexts.push(breadcrumbTexts.join(' '))
              }
            }

            // 6. First 10 images' alt text
            const mainImages = document.querySelectorAll('main img, article img, [role="main"] img, .main img, .content img')
            if (mainImages.length > 0) {
              const imageAlts = Array.from(mainImages).slice(0, 10).map(img => img.alt || '').filter(alt => alt.length > 0)
              if (imageAlts.length > 0) {
                allTexts.push(imageAlts.join(' '))
              }
            }

            // 7. First 20 anchor links within main content
            const mainLinks = document.querySelectorAll('main a, article a, [role="main"] a, .main a, .content a')
            if (mainLinks.length > 0) {
              const linkTexts = Array.from(mainLinks).slice(0, 20).map(link => extractElementText(link)).filter(t => t.length > 0)
              if (linkTexts.length > 0) {
                allTexts.push(linkTexts.join(' '))
              }
            }

            if (allTexts.length === 0) return []

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Preserve original case from content
            const allText = allTexts.join(' ')

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Tokenize preserving original case
            const words = allText
              .split(/[\s\.,;:!?\-_\(\)\[\]{}"']+/)
              .filter(word => word.length > 0)

            // Noise word list (common English stop words) - lowercase for case-insensitive matching
            const noiseWords = new Set([
              'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
              'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
              'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have',
              'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if', 'up',
              'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would',
              'make', 'like', 'into', 'him', 'two', 'more', 'very', 'after',
              'words', 'long', 'than', 'first', 'been', 'call', 'who', 'oil', 'sit',
              'now', 'find', 'down', 'day', 'did', 'get', 'come', 'made', 'may',
              'part', 'over', 'new', 'sound', 'take', 'only', 'little', 'work', 'know',
              'place', 'year', 'live', 'me', 'back', 'give', 'most', 'thing', 'our',
              'just', 'name', 'good', 'sentence', 'man', 'think', 'say', 'great',
              'where', 'help', 'through', 'much', 'before', 'line', 'right', 'too',
              'mean', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want',
              'show', 'also', 'around', 'form', 'three', 'small', 'set', 'put', 'end',
              'does', 'another', 'well', 'large', 'must', 'big', 'even', 'such',
              'because', 'turn', 'here', 'why', 'ask', 'went', 'men', 'read', 'need',
              'land', 'different', 'home', 'us', 'move', 'try', 'kind', 'hand', 'picture',
              'again', 'change', 'off', 'play', 'spell', 'air', 'away', 'animal', 'house',
              'point', 'page', 'letter', 'mother', 'answer', 'found', 'study', 'still',
              'learn', 'should', 'america', 'world', 'high', 'every', 'near', 'add',
              'food', 'between', 'own', 'below', 'country', 'plant', 'last', 'school',
              'father', 'keep', 'tree', 'never', 'start', 'city', 'earth', 'eye', 'light',
              'thought', 'head', 'under', 'story', 'saw', 'left', 'don\'t', 'few', 'while',
              'along', 'might', 'close', 'something', 'seem', 'next', 'hard', 'open',
              'example', 'begin', 'life', 'always', 'those', 'both', 'paper', 'together',
              'got', 'group', 'often', 'run', 'important', 'until', 'children', 'side',
              'feet', 'car', 'mile', 'night', 'walk', 'white', 'sea', 'began', 'grow',
              'took', 'river', 'four', 'carry', 'state', 'once', 'book', 'hear', 'stop',
              'without', 'second', 'later', 'miss', 'idea', 'enough', 'eat', 'face',
              'watch', 'far', 'indian', 'really', 'almost', 'let', 'above', 'girl',
              'sometimes', 'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song',
              'leave', 'family', 'it\'s'
            ])

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Track original case variants and frequency using lowercase keys
            const wordFrequency = new Map()
            const originalCaseMap = new Map() // lowercase -> most common original case variant

            words.forEach(word => {
              const trimmed = word.trim()
              if (trimmed.length === 0) return

              // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Generate lowercase version for case-insensitive operations
              const lowerWord = trimmed.toLowerCase()

              // Filter: not a noise word, length >= 2, not a number
              if (
                trimmed.length >= 2 &&
                !noiseWords.has(lowerWord) &&
                !/^\d+$/.test(trimmed)
              ) {
                // Track frequency using lowercase key (groups case variants together)
                const count = wordFrequency.get(lowerWord) || 0
                wordFrequency.set(lowerWord, count + 1)

                // Track original case variants - keep the first occurrence of each original case
                if (!originalCaseMap.has(lowerWord)) {
                  originalCaseMap.set(lowerWord, trimmed)
                }
              }
            })

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Build list of tags with both original case and lowercase versions
            // For words with uppercase letters, include both versions as separate tags
            // For words already lowercase, include only once
            const tagsWithVersions = []
            const seenLowercase = new Set() // Track lowercase versions we've already added

            // Sort by frequency (descending), then alphabetically for ties
            const sortedEntries = Array.from(wordFrequency.entries())
              .sort((a, b) => {
                // Primary sort: frequency (descending)
                if (b[1] !== a[1]) {
                  return b[1] - a[1]
                }
                // Secondary sort: alphabetically (ascending) using lowercase
                return a[0].localeCompare(b[0])
              })

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] For each word, add original case version and lowercase version (if different)
            for (const [lowerWord, frequency] of sortedEntries) {
              const originalCase = originalCaseMap.get(lowerWord) || lowerWord

              // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Add original case version
              tagsWithVersions.push({ tag: originalCase, lowerTag: lowerWord, frequency })

              // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] If word contains uppercase letters, also add lowercase version
              // Only add lowercase version if it's different from original and we haven't seen it yet
              if (originalCase !== lowerWord && !seenLowercase.has(lowerWord)) {
                tagsWithVersions.push({ tag: lowerWord, lowerTag: lowerWord, frequency })
                seenLowercase.add(lowerWord)
              } else if (originalCase === lowerWord) {
                // Word is already lowercase, mark it as seen
                seenLowercase.add(lowerWord)
              }
            }

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Sort all tags (both versions) by frequency, then alphabetically
            tagsWithVersions.sort((a, b) => {
              // Primary sort: frequency (descending)
              if (b.frequency !== a.frequency) {
                return b.frequency - a.frequency
              }
              // Secondary sort: alphabetically (ascending) using lowercase
              return a.lowerTag.localeCompare(b.lowerTag)
            })

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Extract tags and apply limit
            const sortedWords = tagsWithVersions
              .slice(0, 60) // Allow more entries since we're adding lowercase versions
              .map(item => item.tag)

            // Simple sanitization (remove special chars, limit length)
            const sanitizedTags = sortedWords
              .map(word => word.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50))
              .filter(tag => tag !== null && tag.length > 0)

            // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Remove exact duplicates (same string) while preserving both "Git" and "git"
            const uniqueTags = []
            const seenExact = new Set() // Track exact strings to avoid true duplicates

            for (const tag of sanitizedTags) {
              // Only skip if we've seen this exact string before
              if (!seenExact.has(tag)) {
                uniqueTags.push(tag)
                seenExact.add(tag)
              }
            }

            return uniqueTags.slice(0, 60) // Final limit
          }
        })

        if (results && results[0] && results[0].result) {
          const suggestedTags = results[0].result
          const currentTags = this.normalizeTags(this.currentPin?.tags || [])

          // [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] - Filter using case-insensitive comparison
          const currentTagsLower = new Set(currentTags.map(t => t.toLowerCase()))
          const filteredSuggestedTags = suggestedTags.filter(tag =>
            tag && !currentTagsLower.has(tag.toLowerCase())
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

    // [IMMUTABLE-REQ-TAG-001] - Check for only safe characters (allow #, +, . for e.g. C#, node.js; API encodes via buildSaveParams)
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

            // [POPUP-DATA-FLOW-001] Only treat as no bookmark when URL is blocked; needsAuth still has bookmark from local/file/sync
            if (bookmarkData?.blocked) {
              debugLog('[POPUP-DATA-FLOW-001] getBookmarkData: URL blocked', bookmarkData);
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
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Get storage backend for URL (pinboard | local | file | sync).
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
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move current bookmark to target storage backend.
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

    if (!data || typeof data !== 'object' || !data.url) {
      debugLog('[POPUP-DEBUG-001] Bookmark data validation: missing url or invalid object');
      return false;
    }

    // [IMPL-URL_TAGS_DISPLAY] Normalize tags to array instead of rejecting (defensive; backend now returns normalized)
    if (!Array.isArray(data.tags)) {
      data.tags = data.tags == null
        ? []
        : (typeof data.tags === 'string' ? data.tags.split(/\s+/).filter(t => t.trim()) : []);
    }

    const isValid = true;
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
   * Handle show/hide hoverboard action
   */
  /**
   * [POPUP-CLOSE-BEHAVIOR-004] Handle show/hide hoverboard action
   * Modified to NOT close popup after toggling overlay visibility
   */
  async handleShowHoverboard () {
    recordAction(POPUP_ACTION_IDS.showHoverboard, { tabId: this.currentTab?.id }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.showHoverboard, payload: { tabId: this.currentTab?.id } })
    debugLogger.trace('PopupController', 'handleShowHoverboard', { tabId: this.currentTab?.id }, LOG_CATEGORIES.UI)
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
    recordAction(POPUP_ACTION_IDS.addTag, { tag: tagText }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.addTag, payload: { tag: tagText } })
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
    recordAction(POPUP_ACTION_IDS.reloadExtension, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.reloadExtension, payload: undefined })
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
    recordAction(POPUP_ACTION_IDS.openOptions, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openOptions, payload: undefined })
    try {
      chrome.runtime.openOptionsPage()
      this.uiManager.showSuccess('Options page opened in new tab')
      // [POPUP-CLOSE-BEHAVIOR-FIX-001] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to open options', error)
    }
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Open the local bookmarks index page in a new tab.
   */
  handleOpenBookmarksIndex () {
    recordAction(POPUP_ACTION_IDS.openBookmarksIndex, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openBookmarksIndex, payload: undefined })
    try {
      const url = chrome.runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html')
      chrome.tabs.create({ url })
      this.uiManager.showSuccess('Bookmarks index opened in new tab')
    } catch (error) {
      this.errorHandler.handleError('Failed to open bookmarks index', error)
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
  }

  /**
   * [POPUP-REFRESH-001] Manual refresh capability
   */
  async refreshPopupData() {
    recordAction(POPUP_ACTION_IDS.refreshData, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.refreshData, payload: undefined })
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
   * [IMMUTABLE-REQ-TAG-003] [IMPL-RECENT_TAGS_POPUP_REFRESH] Refresh Recent Tags when popup becomes visible
   */
  setupAutoRefresh() {
    window.addEventListener('focus', () => {
      if (this.isInitialized && !this.isLoading) {
        debugLog('[POPUP-REFRESH-001] Auto-refresh on focus triggered')
        this.refreshPopupData()
      }
    })

    // [IMMUTABLE-REQ-TAG-003] [IMPL-RECENT_TAGS_POPUP_REFRESH] Refresh Recent Tags every time popup is displayed
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isInitialized && !this.isLoading) {
        debugLog('[IMPL-RECENT_TAGS_POPUP_REFRESH] Popup visible, refreshing recent tags')
        this.loadRecentTags()
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
