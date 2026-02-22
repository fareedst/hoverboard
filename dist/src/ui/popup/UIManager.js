/**
 * UIManager - Handles all UI interactions and DOM manipulation
 */

export class UIManager {
  constructor ({ errorHandler, stateManager, config = {} }) {
    this.errorHandler = errorHandler
    this.stateManager = stateManager
    this.config = config
    this.eventHandlers = new Map()

    // Cache DOM elements
    this.elements = {}
    this.cacheElements()

    // Apply configuration-based UI settings
    this.applyConfiguration()

    // Bind methods
    this.emit = this.emit.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
  }

  /**
   * Apply configuration-based UI settings
   */
  applyConfiguration () {
    // Apply section labels visibility setting
    if (this.config.uxShowSectionLabels !== undefined) {
      this.updateSectionLabelsVisibility(this.config.uxShowSectionLabels)
    }

    // Apply font size configuration
    this.applyFontSizeConfig()
  }

  /**
   * Apply font size configuration using CSS variables
   */
  applyFontSizeConfig () {
    const root = document.documentElement

    // Apply font sizes from config or use defaults
    const fontSizes = {
      suggestedTags: this.config.fontSizeSuggestedTags || 10,
      labels: this.config.fontSizeLabels || 12,
      tags: this.config.fontSizeTags || 12,
      base: this.config.fontSizeBase || 14,
      inputs: this.config.fontSizeInputs || 14
    }

    // Set CSS custom properties
    root.style.setProperty('--font-size-suggested-tags', `${fontSizes.suggestedTags}px`)
    root.style.setProperty('--font-size-labels', `${fontSizes.labels}px`)
    root.style.setProperty('--font-size-tags', `${fontSizes.tags}px`)
    root.style.setProperty('--font-size-base-custom', `${fontSizes.base}px`)
    root.style.setProperty('--font-size-inputs-custom', `${fontSizes.inputs}px`)
  }

  /**
   * Update section labels visibility based on configuration
   */
  updateSectionLabelsVisibility (showLabels) {
    const sectionTitles = document.querySelectorAll('.section-title')
    sectionTitles.forEach(title => {
      if (showLabels) {
        title.style.display = ''
      } else {
        title.style.display = 'none'
      }
    })
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements () {
    this.elements = {
      // Container elements
      mainInterface: document.getElementById('mainInterface'),
      loadingState: document.getElementById('loadingState'),
      errorState: document.getElementById('errorState'),
      errorMessage: document.getElementById('errorMessage'),
      retryBtn: document.getElementById('retryBtn'),

      // Status elements
      bookmarkStatus: document.getElementById('bookmarkStatus'),
      versionInfo: document.getElementById('versionInfo'),

      // Action buttons
      showHoverBtn: document.getElementById('showHoverBtn'),
      togglePrivateBtn: document.getElementById('togglePrivateBtn'),
      toggleReadBtn: document.getElementById('toggleReadBtn'),
      deleteBtn: document.getElementById('deleteBtn'),
      reloadBtn: document.getElementById('reloadBtn'),
      optionsBtn: document.getElementById('optionsBtn'),
      bookmarksIndexBtn: document.getElementById('bookmarksIndexBtn'),
      browserBookmarkImportBtn: document.getElementById('browserBookmarkImportBtn'),
      settingsBtn: document.getElementById('settingsBtn'),

      // Input elements
      newTagInput: document.getElementById('newTagInput'),
      addTagBtn: document.getElementById('addTagBtn'),
      tagWithAiBtn: document.getElementById('tagWithAiBtn'),
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Popup Test API key button and status span.
      testAiApiBtn: document.getElementById('testAiApiBtn'),
      popupAiTestStatus: document.getElementById('popupAiTestStatus'),
      searchInput: document.getElementById('searchInput'),
      searchBtn: document.getElementById('searchBtn'),
      searchSuggestions: document.getElementById('searchSuggestions'),

      // Tag display
      currentTagsContainer: document.getElementById('currentTagsContainer'),
      recentTagsContainer: document.getElementById('recentTagsContainer'),
      suggestedTagsContainer: document.getElementById('suggestedTagsContainer'),

      // Status displays
      privateIcon: document.getElementById('privateIcon'),
      privateStatus: document.getElementById('privateStatus'),
      readIcon: document.getElementById('readIcon'),
      readStatus: document.getElementById('readStatus'),

      // [SHOW-HOVER-CHECKBOX-UIMANAGER-001] - Add checkbox element reference
      showHoverOnPageLoad: document.getElementById('showHoverOnPageLoad'),

      // [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Storage backend select-one buttons (pinboard | file | local | sync)
      storageBackendButtons: document.getElementById('storageBackendButtons')
    }
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners () {
    // Action buttons
    this.elements.showHoverBtn?.addEventListener('click', () => {
      this.emit('showHoverboard')
    })

    this.elements.togglePrivateBtn?.addEventListener('click', () => {
      this.emit('togglePrivate')
    })

    this.elements.toggleReadBtn?.addEventListener('click', () => {
      this.emit('readLater')
    })

    this.elements.deleteBtn?.addEventListener('click', () => {
      this.emit('deletePin')
    })

    this.elements.reloadBtn?.addEventListener('click', () => {
      // [POPUP-REFRESH-001] Emit refreshData event for manual refresh
      this.emit('refreshData')
      // Also emit reloadExtension for backward compatibility
      this.emit('reloadExtension')
    })

    this.elements.optionsBtn?.addEventListener('click', () => {
      this.emit('openOptions')
    })

    this.elements.bookmarksIndexBtn?.addEventListener('click', () => {
      this.emit('openBookmarksIndex')
    })

    this.elements.browserBookmarkImportBtn?.addEventListener('click', () => {
      this.emit('openBrowserBookmarkImport')
    })

    // [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Storage backend buttons: click emits storageBackendChange (move when non-API to non-API)
    const storageBtns = this.elements.storageBackendButtons?.querySelectorAll('.storage-backend-btn')
    storageBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-backend')
        if (target) this.emit('storageBackendChange', target)
      })
    })

    this.elements.settingsBtn?.addEventListener('click', () => {
      this.emit('openOptions')
    })

    // [IMMUTABLE-REQ-TAG-001] - Enhanced input handling with validation
    this.elements.addTagBtn?.addEventListener('click', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && this.isValidTag(tagText)) {
        this.emit('addTag', tagText)
        // [IMMUTABLE-REQ-TAG-001] - Clear input after successful addition
        this.elements.newTagInput.value = ''
      } else if (tagText && !this.isValidTag(tagText)) {
        // [IMMUTABLE-REQ-TAG-001] - Show validation error
        this.showError('Invalid tag format')
      }
    })

    // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Tag with AI button click emits tagWithAi.
    this.elements.tagWithAiBtn?.addEventListener('click', () => {
      this.emit('tagWithAi')
    })

    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Test API key button click emits testAiApiKey.
    this.elements.testAiApiBtn?.addEventListener('click', () => {
      this.emit('testAiApiKey')
    })

    this.elements.newTagInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const tagText = this.elements.newTagInput?.value
        if (tagText && this.isValidTag(tagText)) {
          this.emit('addTag', tagText)
          // [IMMUTABLE-REQ-TAG-001] - Clear input after successful addition
          this.elements.newTagInput.value = ''
        } else if (tagText && !this.isValidTag(tagText)) {
          // [IMMUTABLE-REQ-TAG-001] - Show validation error
          this.showError('Invalid tag format')
        }
      }
    })

    // [IMMUTABLE-REQ-TAG-001] - Add input validation on blur
    this.elements.newTagInput?.addEventListener('blur', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && !this.isValidTag(tagText)) {
        this.showError('Invalid tag format')
      }
    })

    // [IMMUTABLE-REQ-TAG-001] - Add input validation on input change
    this.elements.newTagInput?.addEventListener('input', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && !this.isValidTag(tagText)) {
        this.elements.newTagInput.classList.add('invalid')
      } else {
        this.elements.newTagInput.classList.remove('invalid')
      }
    })

    this.elements.searchBtn?.addEventListener('click', () => {
      const searchText = this.elements.searchInput?.value
      if (searchText) {
        this.emit('search', searchText)
      }
    })

    this.elements.searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchText = this.elements.searchInput?.value
        if (searchText) {
          this.emit('search', searchText)
        }
      }
    })

    // Error handling
    this.elements.retryBtn?.addEventListener('click', () => {
      this.emit('retry')
    })

    // [SHOW-HOVER-CHECKBOX-UIMANAGER-002] - Add checkbox event listener
    this.elements.showHoverOnPageLoad?.addEventListener('change', () => {
      this.emit('showHoverOnPageLoadChange')
    })
  }

  /**
   * Event emitter - emit custom events
   */
  emit (eventName, ...args) {
    const handlers = this.eventHandlers.get(eventName)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          this.errorHandler.handleError(`Error in event handler for ${eventName}`, error)
        }
      })
    }
  }

  /**
   * Event emitter - add event listener
   */
  on (eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, [])
    }
    this.eventHandlers.get(eventName).push(handler)
  }

  /**
   * Event emitter - remove event listener
   */
  off (eventName, handler) {
    const handlers = this.eventHandlers.get(eventName)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Set loading state
   */
  setLoading (isLoading) {
    if (this.elements.loadingState) {
      this.elements.loadingState.classList.toggle('hidden', !isLoading)
    }

    if (this.elements.mainInterface) {
      this.elements.mainInterface.classList.toggle('hidden', isLoading)
    }

    // Disable/enable interactive elements ([REQ-AI_TAGGING_POPUP] tagWithAiBtn state set in loadInitialData + handleTagWithAi)
    const interactiveElements = [
      this.elements.showHoverBtn,
      this.elements.togglePrivateBtn,
      this.elements.toggleReadBtn,
      this.elements.deleteBtn,
      this.elements.addTagBtn,
      this.elements.newTagInput,
      this.elements.searchBtn,
      this.elements.searchInput
    ]

    interactiveElements.forEach(element => {
      if (element) {
        element.disabled = isLoading
      }
    })
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus (isConnected) {
    if (this.elements.statusIndicator) {
      this.elements.statusIndicator.className = `status-indicator ${isConnected ? 'online' : 'offline'}`
      this.elements.statusIndicator.title = isConnected ? 'Connected to Pinboard' : 'Disconnected from Pinboard'
    }
  }

  /**
   * Update private status button
   */
  updatePrivateStatus (isPrivate) {
    if (this.elements.togglePrivateBtn) {
      this.elements.togglePrivateBtn.classList.toggle('active', isPrivate)

      // Update status display
      if (this.elements.privateIcon && this.elements.privateStatus) {
        if (isPrivate) {
          this.elements.privateIcon.textContent = '🔒'
          this.elements.privateStatus.textContent = 'Private'
        } else {
          this.elements.privateIcon.textContent = '🔓'
          this.elements.privateStatus.textContent = 'Public'
        }
      }
    }
  }

  /**
   * Update read later status display
   */
  updateReadLaterStatus (isReadLater) {
    if (this.elements.toggleReadBtn) {
      this.elements.toggleReadBtn.classList.toggle('active', isReadLater)

      // Update status display
      if (this.elements.readIcon && this.elements.readStatus) {
        if (isReadLater) {
          this.elements.readIcon.textContent = '📖'
          this.elements.readStatus.textContent = 'Read Later'
        } else {
          this.elements.readIcon.textContent = '📋'
          this.elements.readStatus.textContent = 'Not marked'
        }
      }
    }
  }

  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Update storage backend buttons: set aria-pressed on the selected backend (pinboard | local | file | sync).
   * [REQ-STORAGE_MODE_DEFAULT] If backend is falsy, use 'local' so one option is always selected.
   */
  updateStorageBackendValue (backend) {
    if (!backend) backend = 'local'
    const container = this.elements.storageBackendButtons
    if (!container) return
    const buttons = container.querySelectorAll('.storage-backend-btn')
    buttons.forEach(btn => {
      const isSelected = btn.getAttribute('data-backend') === backend
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
    })
  }

  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] No-op: move is done via storage backend buttons. Kept for API compatibility.
   * @param {string} _backend - 'pinboard'|'local'|'file'|'sync'
   * @param {boolean} _hasBookmark - whether current URL has a saved bookmark
   */
  updateStorageLocalToggle (_backend, _hasBookmark) {
    // Toggle removed; all moves via select-one buttons
  }

  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] Enable or disable Pinboard storage button based on API key configuration.
   * When disabled, button cannot be selected; title hints user to configure token in Options.
   * @param {boolean} hasApiKey - whether a Pinboard API token is configured
   */
  updateStoragePinboardEnabled (hasApiKey) {
    const container = this.elements.storageBackendButtons
    if (!container) return
    const btn = container.querySelector('.storage-backend-btn[data-backend="pinboard"]')
    if (!btn) return
    btn.disabled = !hasApiKey
    btn.title = hasApiKey ? 'Pinboard (cloud)' : 'Configure API token in Options to use Pinboard'
    btn.setAttribute('aria-label', hasApiKey ? 'Pinboard (cloud)' : 'Pinboard (cloud). Configure API token in Options to use.')
  }

  /**
   * Update version info
   */
  updateVersionInfo (version) {
    if (this.elements.versionInfo) {
      this.elements.versionInfo.textContent = `v${version}`
    }
  }

  /**
   * Update current tags display
   */
  updateCurrentTags (tags) {
    if (!this.elements.currentTagsContainer) return

    // Clear existing tags
    this.elements.currentTagsContainer.innerHTML = ''

    // If no tags, show empty state
    if (!tags || tags.length === 0) {
      this.elements.currentTagsContainer.innerHTML = '<div class="no-tags">No tags</div>'
      return
    }

    // Create tag elements
    const tagsArray = Array.isArray(tags) ? tags : tags.split(' ').filter(tag => tag.length > 0)

    tagsArray.forEach(tag => {
      const tagElement = this.createTagElement(tag)
      this.elements.currentTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Update recent tags display with user-driven behavior
   * @param {string[]} recentTags - Array of recent tag names
   */
  updateRecentTags (recentTags) {
    if (!this.elements.recentTagsContainer) return

    // Clear existing recent tags
    this.elements.recentTagsContainer.innerHTML = ''

    // [IMMUTABLE-REQ-TAG-003] - Show empty state for user-driven recent tags
    if (!recentTags || recentTags.length === 0) {
      this.elements.recentTagsContainer.innerHTML = '<div class="no-tags">No recent tags</div>'
      return
    }

    // [IMMUTABLE-REQ-TAG-003] - Create recent tag elements (clickable to add to current site only)
    recentTags.forEach(tag => {
      const tagElement = this.createRecentTagElement(tag)
      this.elements.recentTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Create a recent tag element (clickable to add to current site only)
   * @param {string} tag - Tag name
   * @returns {HTMLElement} Tag element
   */
  createRecentTagElement (tag) {
    const tagElement = document.createElement('div')
    tagElement.className = 'tag recent clickable'
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(tag)}</span>
    `

    // [IMMUTABLE-REQ-TAG-003] - Add click handler to add this tag to current site only
    tagElement.addEventListener('click', () => {
      this.emit('addTag', tag)
    })

    return tagElement
  }

  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
   * Update suggested tags display
   * @param {string[]} suggestedTags - Array of suggested tag names
   */
  updateSuggestedTags (suggestedTags) {
    if (!this.elements.suggestedTagsContainer) return

    // Clear existing suggested tags
    this.elements.suggestedTagsContainer.innerHTML = ''

    // [REQ-SUGGESTED_TAGS_FROM_CONTENT] - Show empty state or hide when no suggestions
    if (!suggestedTags || suggestedTags.length === 0) {
      const suggestedTagsSection = document.getElementById('suggestedTags')
      if (suggestedTagsSection) {
        suggestedTagsSection.style.display = 'none'
      }
      return
    }

    // Show the section
    const suggestedTagsSection = document.getElementById('suggestedTags')
    if (suggestedTagsSection) {
      suggestedTagsSection.style.display = 'block'
    }

    // [REQ-SUGGESTED_TAGS_FROM_CONTENT] - Create suggested tag elements (clickable to add to current site)
    suggestedTags.forEach(tag => {
      const tagElement = this.createRecentTagElement(tag) // Reuse same styling/behavior as recent tags
      this.elements.suggestedTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * Create a tag element
   */
  createTagElement (tag) {
    const tagElement = document.createElement('div')
    tagElement.className = 'tag'
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(tag)}</span>
      <button class="tag-remove" type="button" aria-label="Remove tag ${this.escapeHtml(tag)}" title="Remove tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `

    // Add remove handler
    const removeButton = tagElement.querySelector('.tag-remove')
    removeButton?.addEventListener('click', () => {
      this.emit('removeTag', tag)
    })

    return tagElement
  }

  /**
   * Clear tag input
   */
  clearTagInput () {
    if (this.elements.newTagInput) {
      this.elements.newTagInput.value = ''
      this.elements.newTagInput.focus()
    }
  }

  /**
   * [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] Set tag input value (e.g. from page selection).
   * @param {string} value - Text to set in the new-tag input
   */
  setTagInputValue (value) {
    if (!this.elements.newTagInput) return
    this.elements.newTagInput.value = value ?? ''
    this.elements.newTagInput.classList.remove('invalid')
  }

  /**
   * Clear search input
   */
  clearSearchInput () {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = ''
    }
  }

  /**
   * Focus tag input
   */
  focusTagInput () {
    if (this.elements.newTagInput) {
      this.elements.newTagInput.focus()
    }
  }

  /**
   * Focus search input
   */
  focusSearchInput () {
    if (this.elements.searchInput) {
      this.elements.searchInput.focus()
    }
  }

  /**
   * Show error message
   */
  showError (message) {
    if (this.elements.errorState && this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message
      this.elements.errorState.classList.remove('hidden')
      this.elements.loadingState?.classList.add('hidden')
      this.elements.mainInterface?.classList.add('hidden')
    }
  }

  /**
   * Hide error message
   */
  hideError () {
    if (this.elements.errorState) {
      this.elements.errorState.classList.add('hidden')
    }
  }

  /**
   * Show success message
   */
  showSuccess (message) {
    // For now, we'll just log success messages
    // In a full implementation, you might want a success toast
    console.log('Success:', message)

    // Could implement success toast similar to error toast
    // or use a notification system
  }

  /**
   * Show info message
   */
  showInfo (message) {
    // For now, we'll just log info messages
    console.log('Info:', message)
  }

  /**
   * Show/hide shortcuts help
   */
  toggleShortcutsHelp () {
    if (this.elements.shortcutsHelp) {
      const isHidden = this.elements.shortcutsHelp.hidden
      this.elements.shortcutsHelp.hidden = !isHidden
    }
  }

  /**
   * Hide shortcuts help
   */
  hideShortcutsHelp () {
    if (this.elements.shortcutsHelp) {
      this.elements.shortcutsHelp.hidden = true
    }
  }

  /**
   * Update button states based on current data
   */
  updateButtonStates (hasBookmark) {
    // Enable/disable buttons based on whether there's a bookmark
    const bookmarkRequiredButtons = [
      this.elements.togglePrivate,
      this.elements.deletePin
    ]

    bookmarkRequiredButtons.forEach(button => {
      if (button) {
        button.disabled = !hasBookmark
        button.classList.toggle('disabled', !hasBookmark)
      }
    })

    // Update button text/appearance
    if (this.elements.showHoverboard) {
      const buttonText = this.elements.showHoverboard.querySelector('.button-text')
      if (buttonText) {
        buttonText.textContent = 'Show Hoverboard'
      }
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Update Show Hover button state from overlay visibility.
   * @param {boolean} isOverlayVisible - Whether the overlay is currently visible
   */
  updateShowHoverButtonState (isOverlayVisible) {
    const showHoverBtn = this.elements.showHoverBtn
    if (showHoverBtn) {
      const actionIcon = showHoverBtn.querySelector('.action-icon')

      if (isOverlayVisible) {
        actionIcon.textContent = '🙈'
        showHoverBtn.title = 'Hide hoverboard overlay'
        showHoverBtn.setAttribute('aria-label', 'Hide hoverboard overlay')
      } else {
        actionIcon.textContent = '👁️'
        showHoverBtn.title = 'Show hoverboard overlay'
        showHoverBtn.setAttribute('aria-label', 'Show hoverboard overlay')
      }
    }
  }

  /**
   * Set popup theme (light/dark)
   */
  setTheme (theme) {
    if (this.elements.popupContainer) {
      this.elements.popupContainer.classList.remove('light-mode', 'dark-mode')
      this.elements.popupContainer.classList.add(`${theme}-mode`)
    }
  }

  /**
   * Add CSS animation class
   */
  addAnimation (element, animationClass) {
    if (element) {
      element.classList.add(animationClass)

      // Remove animation class after animation completes
      element.addEventListener('animationend', () => {
        element.classList.remove(animationClass)
      }, { once: true })
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml (text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Handle window resize (if needed for responsive design)
   */
  handleResize () {
    // Could implement responsive adjustments here
    const width = window.innerWidth
    const height = window.innerHeight

    // Adjust layout if needed
    if (width < 350) {
      this.elements.popupContainer?.classList.add('compact')
    } else {
      this.elements.popupContainer?.classList.remove('compact')
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
   * Cleanup event listeners and resources
   */
  cleanup () {
    // Clear event handlers
    this.eventHandlers.clear()

    // Remove window event listeners if any
    window.removeEventListener('resize', this.handleResize)

    // Clear timeouts if any
    // (In a full implementation, you'd track and clear timeouts)
  }

  /**
   * [TAB-SEARCH-UI] Show tab search results
   */
  showTabSearchResults (results) {
    const resultsContainer = this.elements.tabSearchResults
    if (!resultsContainer) return

    if (results.success) {
      resultsContainer.innerHTML = `
        <div class="search-result">
          <span class="result-count">${results.currentMatch} of ${results.matchCount}</span>
          <span class="result-title">${results.tabTitle}</span>
        </div>
      `
      resultsContainer.classList.remove('hidden')
    } else {
      resultsContainer.innerHTML = `
        <div class="search-result no-matches">
          <span class="result-message">${results.message}</span>
        </div>
      `
      resultsContainer.classList.remove('hidden')
    }
  }

  /**
   * [TAB-SEARCH-UI] Update search history display
   */
  updateSearchHistory (history) {
    const historyContainer = this.elements.tabSearchHistory
    if (!historyContainer || !history.length) return

    const historyHTML = history.map(term => `
      <button class="history-item" data-term="${term}">
        ${term}
      </button>
    `).join('')

    historyContainer.innerHTML = historyHTML
    historyContainer.classList.remove('hidden')
  }

  /**
   * [TAB-SEARCH-UI] Focus tab search input
   */
  focusTabSearchInput () {
    this.elements.tabSearchInput?.focus()
  }
}
