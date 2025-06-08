/**
 * UIManager - Handles all UI interactions and DOM manipulation
 */

export class UIManager {
  constructor({ errorHandler, stateManager }) {
    this.errorHandler = errorHandler;
    this.stateManager = stateManager;
    this.eventHandlers = new Map();
    
    // Cache DOM elements
    this.elements = {};
    this.cacheElements();
    
    // Bind methods
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      // Container elements
      popupContainer: document.getElementById('mainPopup'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      errorToast: document.getElementById('errorToast'),
      errorContent: document.getElementById('errorContent'),
      errorClose: document.getElementById('errorClose'),
      
      // Status elements
      connectionStatus: document.getElementById('connectionStatus'),
      statusIndicator: document.getElementById('statusIndicator'),
      versionInfo: document.getElementById('versionInfo'),
      
      // Action buttons
      showHoverboard: document.getElementById('showHoverboard'),
      togglePrivate: document.getElementById('togglePrivate'),
      readLater: document.getElementById('readLater'),
      deletePin: document.getElementById('deletePin'),
      reloadExtension: document.getElementById('reloadExtension'),
      openOptions: document.getElementById('openOptions'),
      
      // Input elements
      addTagInput: document.getElementById('addTagInput'),
      addTagButton: document.getElementById('addTagButton'),
      searchInput: document.getElementById('searchInput'),
      searchButton: document.getElementById('searchButton'),
      
      // Tag display
      tagsContainer: document.getElementById('tagsContainer'),
      currentTags: document.getElementById('currentTags'),
      
      // Shortcuts help
      shortcutsHelp: document.getElementById('shortcutsHelp')
    };
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Action buttons
    this.elements.showHoverboard?.addEventListener('click', () => {
      this.emit('showHoverboard');
    });

    this.elements.togglePrivate?.addEventListener('click', () => {
      this.emit('togglePrivate');
    });

    this.elements.readLater?.addEventListener('click', () => {
      this.emit('readLater');
    });

    this.elements.deletePin?.addEventListener('click', () => {
      this.emit('deletePin');
    });

    this.elements.reloadExtension?.addEventListener('click', () => {
      this.emit('reloadExtension');
    });

    this.elements.openOptions?.addEventListener('click', () => {
      this.emit('openOptions');
    });

    // Input handling
    this.elements.addTagButton?.addEventListener('click', () => {
      const tagText = this.elements.addTagInput?.value;
      if (tagText) {
        this.emit('addTag', tagText);
      }
    });

    this.elements.addTagInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const tagText = this.elements.addTagInput?.value;
        if (tagText) {
          this.emit('addTag', tagText);
        }
      }
    });

    this.elements.searchButton?.addEventListener('click', () => {
      const searchText = this.elements.searchInput?.value;
      if (searchText) {
        this.emit('search', searchText);
      }
    });

    this.elements.searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchText = this.elements.searchInput?.value;
        if (searchText) {
          this.emit('search', searchText);
        }
      }
    });

    // Error toast close
    this.elements.errorClose?.addEventListener('click', () => {
      this.hideError();
    });

    // Auto-hide error toast
    this.elements.errorToast?.addEventListener('click', (e) => {
      if (e.target === this.elements.errorToast) {
        this.hideError();
      }
    });
  }

  /**
   * Event emitter - emit custom events
   */
  emit(eventName, ...args) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          this.errorHandler.handleError(`Error in event handler for ${eventName}`, error);
        }
      });
    }
  }

  /**
   * Event emitter - add event listener
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }

  /**
   * Event emitter - remove event listener
   */
  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Set loading state
   */
  setLoading(isLoading) {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.hidden = !isLoading;
    }
    
    if (this.elements.popupContainer) {
      this.elements.popupContainer.classList.toggle('loading', isLoading);
    }
    
    // Disable/enable interactive elements
    const interactiveElements = [
      this.elements.showHoverboard,
      this.elements.togglePrivate,
      this.elements.readLater,
      this.elements.deletePin,
      this.elements.addTagButton,
      this.elements.addTagInput,
      this.elements.searchButton,
      this.elements.searchInput
    ];
    
    interactiveElements.forEach(element => {
      if (element) {
        element.disabled = isLoading;
      }
    });
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus(isConnected) {
    if (this.elements.statusIndicator) {
      this.elements.statusIndicator.className = `status-indicator ${isConnected ? 'online' : 'offline'}`;
      this.elements.statusIndicator.title = isConnected ? 'Connected to Pinboard' : 'Disconnected from Pinboard';
    }
  }

  /**
   * Update private status button
   */
  updatePrivateStatus(isPrivate) {
    if (this.elements.togglePrivate) {
      const buttonText = this.elements.togglePrivate.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = isPrivate ? 'Make Public' : 'Make Private';
      }
      
      this.elements.togglePrivate.classList.toggle('active', isPrivate);
      this.elements.togglePrivate.title = isPrivate ? 'Make bookmark public' : 'Make bookmark private';
    }
  }

  /**
   * Update version info
   */
  updateVersionInfo(version) {
    if (this.elements.versionInfo) {
      this.elements.versionInfo.textContent = `v${version}`;
    }
  }

  /**
   * Update current tags display
   */
  updateCurrentTags(tags) {
    if (!this.elements.tagsContainer) return;
    
    // Clear existing tags
    this.elements.tagsContainer.innerHTML = '';
    
    // If no tags, show empty state
    if (!tags || tags.length === 0) {
      this.elements.currentTags?.classList.add('empty');
      return;
    }
    
    this.elements.currentTags?.classList.remove('empty');
    
    // Create tag elements
    const tagsArray = Array.isArray(tags) ? tags : tags.split(' ').filter(tag => tag.length > 0);
    
    tagsArray.forEach(tag => {
      const tagElement = this.createTagElement(tag);
      this.elements.tagsContainer.appendChild(tagElement);
    });
  }

  /**
   * Create a tag element
   */
  createTagElement(tag) {
    const tagElement = document.createElement('div');
    tagElement.className = 'tag';
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(tag)}</span>
      <button class="tag-remove" type="button" aria-label="Remove tag ${this.escapeHtml(tag)}" title="Remove tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `;
    
    // Add remove handler
    const removeButton = tagElement.querySelector('.tag-remove');
    removeButton?.addEventListener('click', () => {
      this.emit('removeTag', tag);
    });
    
    return tagElement;
  }

  /**
   * Clear tag input
   */
  clearTagInput() {
    if (this.elements.addTagInput) {
      this.elements.addTagInput.value = '';
      this.elements.addTagInput.focus();
    }
  }

  /**
   * Clear search input
   */
  clearSearchInput() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
  }

  /**
   * Focus tag input
   */
  focusTagInput() {
    if (this.elements.addTagInput) {
      this.elements.addTagInput.focus();
    }
  }

  /**
   * Focus search input
   */
  focusSearchInput() {
    if (this.elements.searchInput) {
      this.elements.searchInput.focus();
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.errorToast && this.elements.errorContent) {
      this.elements.errorContent.textContent = message;
      this.elements.errorToast.hidden = false;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideError();
      }, 5000);
    }
  }

  /**
   * Hide error message
   */
  hideError() {
    if (this.elements.errorToast) {
      this.elements.errorToast.hidden = true;
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // For now, we'll just log success messages
    // In a full implementation, you might want a success toast
    console.log('Success:', message);
    
    // Could implement success toast similar to error toast
    // or use a notification system
  }

  /**
   * Show info message
   */
  showInfo(message) {
    // For now, we'll just log info messages
    console.log('Info:', message);
  }

  /**
   * Show/hide shortcuts help
   */
  toggleShortcutsHelp() {
    if (this.elements.shortcutsHelp) {
      const isHidden = this.elements.shortcutsHelp.hidden;
      this.elements.shortcutsHelp.hidden = !isHidden;
    }
  }

  /**
   * Hide shortcuts help
   */
  hideShortcutsHelp() {
    if (this.elements.shortcutsHelp) {
      this.elements.shortcutsHelp.hidden = true;
    }
  }

  /**
   * Update button states based on current data
   */
  updateButtonStates(hasBookmark) {
    // Enable/disable buttons based on whether there's a bookmark
    const bookmarkRequiredButtons = [
      this.elements.togglePrivate,
      this.elements.deletePin
    ];
    
    bookmarkRequiredButtons.forEach(button => {
      if (button) {
        button.disabled = !hasBookmark;
        button.classList.toggle('disabled', !hasBookmark);
      }
    });
    
    // Update button text/appearance
    if (this.elements.showHoverboard) {
      const buttonText = this.elements.showHoverboard.querySelector('.button-text');
      if (buttonText) {
        buttonText.textContent = 'Show Hoverboard';
      }
    }
  }

  /**
   * Set popup theme (light/dark)
   */
  setTheme(theme) {
    if (this.elements.popupContainer) {
      this.elements.popupContainer.classList.remove('light-mode', 'dark-mode');
      this.elements.popupContainer.classList.add(`${theme}-mode`);
    }
  }

  /**
   * Add CSS animation class
   */
  addAnimation(element, animationClass) {
    if (element) {
      element.classList.add(animationClass);
      
      // Remove animation class after animation completes
      element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
      }, { once: true });
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle window resize (if needed for responsive design)
   */
  handleResize() {
    // Could implement responsive adjustments here
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adjust layout if needed
    if (width < 350) {
      this.elements.popupContainer?.classList.add('compact');
    } else {
      this.elements.popupContainer?.classList.remove('compact');
    }
  }

  /**
   * Cleanup event listeners and resources
   */
  cleanup() {
    // Clear event handlers
    this.eventHandlers.clear();
    
    // Remove window event listeners if any
    window.removeEventListener('resize', this.handleResize);
    
    // Clear timeouts if any
    // (In a full implementation, you'd track and clear timeouts)
  }
} 