/**
 * UIManager - Handles all UI interactions and DOM manipulation
 */

export class UIManager {
  constructor ({ errorHandler, stateManager }) {
    this.errorHandler = errorHandler
    this.stateManager = stateManager
    this.eventHandlers = new Map()

    // Cache DOM elements
    this.elements = {}
    this.cacheElements()

    // Bind methods
    this.emit = this.emit.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
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
      settingsBtn: document.getElementById('settingsBtn'),

      // Input elements
      newTagInput: document.getElementById('newTagInput'),
      addTagBtn: document.getElementById('addTagBtn'),
      searchInput: document.getElementById('searchInput'),
      searchBtn: document.getElementById('searchBtn'),

      // Tag display
      currentTagsContainer: document.getElementById('currentTagsContainer'),
      recentTagsContainer: document.getElementById('recentTagsContainer'),

      // Status displays
      privateIcon: document.getElementById('privateIcon'),
      privateStatus: document.getElementById('privateStatus'),
      readIcon: document.getElementById('readIcon'),
      readStatus: document.getElementById('readStatus')
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
      this.emit('reloadExtension')
    })

    this.elements.optionsBtn?.addEventListener('click', () => {
      this.emit('openOptions')
    })

    this.elements.settingsBtn?.addEventListener('click', () => {
      this.emit('openOptions')
    })

    // Input handling
    this.elements.addTagBtn?.addEventListener('click', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText) {
        this.emit('addTag', tagText)
      }
    })

    this.elements.newTagInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const tagText = this.elements.newTagInput?.value
        if (tagText) {
          this.emit('addTag', tagText)
        }
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

    // Disable/enable interactive elements
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
}
