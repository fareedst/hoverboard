/**
 * KeyboardManager - Handles keyboard navigation and shortcuts
 */

export class KeyboardManager {
  constructor ({ uiManager }) {
    this.uiManager = uiManager
    this.isEnabled = true

    // Keyboard shortcuts mapping
    this.shortcuts = {
      Space: () => this.uiManager.emit('showHoverboard'),
      KeyT: () => this.uiManager.focusTagInput(),
      KeyS: () => this.uiManager.focusSearchInput(),
      Escape: () => this.handleEscape(),
      KeyH: () => this.uiManager.toggleShortcutsHelp(),
      F1: () => this.uiManager.toggleShortcutsHelp()
    }

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleEscape = this.handleEscape.bind(this)
  }

  /**
   * Setup keyboard navigation and shortcuts
   */
  setupKeyboardNavigation () {
    // Add global keydown listener
    document.addEventListener('keydown', this.handleKeyDown)

    // Setup focus management
    this.setupFocusManagement()

    // Setup tab navigation
    this.setupTabNavigation()
  }

  /**
   * Handle keydown events
   */
  handleKeyDown (event) {
    if (!this.isEnabled) return

    // Don't handle shortcuts when typing in inputs
    if (this.isTypingInInput(event.target)) {
      this.handleInputKeydown(event)
      return
    }

    // Handle global shortcuts
    const shortcutKey = this.getShortcutKey(event)
    const handler = this.shortcuts[shortcutKey]

    if (handler) {
      event.preventDefault()
      event.stopPropagation()
      handler()
    }

    // Handle navigation keys
    this.handleNavigationKeys(event)
  }

  /**
   * Handle input-specific keydown events
   */
  handleInputKeydown (event) {
    const target = event.target

    switch (event.key) {
      case 'Escape':
        target.blur()
        event.preventDefault()
        break

      case 'ArrowDown':
      case 'ArrowUp':
        // Could implement autocomplete navigation here
        break

      case 'Tab':
        // Allow natural tab navigation
        break
    }
  }

  /**
   * Handle navigation keys (arrows, tab, etc.)
   */
  handleNavigationKeys (event) {
    switch (event.key) {
      case 'ArrowDown':
        this.focusNext()
        event.preventDefault()
        break

      case 'ArrowUp':
        this.focusPrevious()
        event.preventDefault()
        break

      case 'Home':
        this.focusFirst()
        event.preventDefault()
        break

      case 'End':
        this.focusLast()
        event.preventDefault()
        break

      case 'Enter':
        this.activateFocused(event)
        break
    }
  }

  /**
   * Setup focus management for better accessibility
   */
  setupFocusManagement () {
    // Get all focusable elements
    this.updateFocusableElements()

    // Set initial focus
    this.setInitialFocus()

    // Add focus indicators
    this.addFocusIndicators()
  }

  /**
   * Setup tab navigation order
   */
  setupTabNavigation () {
    const focusableElements = this.getFocusableElements()

    // Ensure proper tab order
    focusableElements.forEach((element, index) => {
      if (!element.tabIndex || element.tabIndex === -1) {
        element.tabIndex = index + 1
      }
    })
  }

  /**
   * Update the list of focusable elements
   */
  updateFocusableElements () {
    this.focusableElements = this.getFocusableElements()
    this.currentFocusIndex = -1
  }

  /**
   * Get all focusable elements in tab order
   */
  getFocusableElements () {
    const selector = `
      button:not([disabled]):not([hidden]),
      input:not([disabled]):not([hidden]),
      textarea:not([disabled]):not([hidden]),
      select:not([disabled]):not([hidden]),
      a[href]:not([hidden]),
      [tabindex]:not([tabindex="-1"]):not([hidden])
    `

    const elements = Array.from(document.querySelectorAll(selector))

    // Filter out elements that are not visible
    return elements.filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
  }

  /**
   * Set initial focus when popup opens
   */
  setInitialFocus () {
    // Focus the first action button by default
    const showHoverboardButton = document.getElementById('showHoverboard')
    if (showHoverboardButton && !showHoverboardButton.disabled) {
      showHoverboardButton.focus()
    } else {
      // Fall back to first focusable element
      this.focusFirst()
    }
  }

  /**
   * Focus the next focusable element
   */
  focusNext () {
    const elements = this.getFocusableElements()
    const currentIndex = elements.indexOf(document.activeElement)
    const nextIndex = (currentIndex + 1) % elements.length

    if (elements[nextIndex]) {
      elements[nextIndex].focus()
    }
  }

  /**
   * Focus the previous focusable element
   */
  focusPrevious () {
    const elements = this.getFocusableElements()
    const currentIndex = elements.indexOf(document.activeElement)
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1

    if (elements[prevIndex]) {
      elements[prevIndex].focus()
    }
  }

  /**
   * Focus the first focusable element
   */
  focusFirst () {
    const elements = this.getFocusableElements()
    if (elements.length > 0) {
      elements[0].focus()
    }
  }

  /**
   * Focus the last focusable element
   */
  focusLast () {
    const elements = this.getFocusableElements()
    if (elements.length > 0) {
      elements[elements.length - 1].focus()
    }
  }

  /**
   * Activate the currently focused element
   */
  activateFocused (event) {
    const focused = document.activeElement

    if (focused && focused.tagName === 'BUTTON') {
      focused.click()
      event.preventDefault()
    }
  }

  /**
   * Handle escape key
   */
  handleEscape () {
    // Hide shortcuts help if open
    if (!this.uiManager.elements.shortcutsHelp?.hidden) {
      this.uiManager.hideShortcutsHelp()
      return
    }

    // Hide error toast if open
    if (!this.uiManager.elements.errorToast?.hidden) {
      this.uiManager.hideError()
      return
    }

    // Blur current element if it's an input
    if (this.isTypingInInput(document.activeElement)) {
      document.activeElement.blur()
      return
    }

    // Close popup
    window.close()
  }

  /**
   * Add visual focus indicators
   */
  addFocusIndicators () {
    const style = document.createElement('style')
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 2px solid var(--color-primary-500) !important;
        outline-offset: 2px !important;
      }
      
      .keyboard-navigation button:focus,
      .keyboard-navigation input:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
      }
    `
    document.head.appendChild(style)

    // Add keyboard navigation class to body
    document.body.classList.add('keyboard-navigation')
  }

  /**
   * Check if user is typing in an input element
   */
  isTypingInInput (element) {
    if (!element) return false

    const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT']
    return inputTypes.includes(element.tagName)
  }

  /**
   * Get shortcut key from event
   */
  getShortcutKey (event) {
    const modifiers = []

    if (event.ctrlKey) modifiers.push('Ctrl')
    if (event.altKey) modifiers.push('Alt')
    if (event.shiftKey) modifiers.push('Shift')
    if (event.metaKey) modifiers.push('Meta')

    const key = event.code || event.key

    return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key
  }

  /**
   * Enable keyboard management
   */
  enable () {
    this.isEnabled = true
  }

  /**
   * Disable keyboard management
   */
  disable () {
    this.isEnabled = false
  }

  /**
   * Add a custom keyboard shortcut
   */
  addShortcut (key, handler) {
    this.shortcuts[key] = handler
  }

  /**
   * Remove a keyboard shortcut
   */
  removeShortcut (key) {
    delete this.shortcuts[key]
  }

  /**
   * Handle focus trap for modal elements
   */
  trapFocus (container) {
    const focusableElements = container.querySelectorAll(`
      button:not([disabled]),
      input:not([disabled]),
      textarea:not([disabled]),
      select:not([disabled]),
      a[href],
      [tabindex]:not([tabindex="-1"])
    `)

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    })

    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }
  }

  /**
   * Announce to screen readers
   */
  announce (message, priority = 'polite') {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Cleanup keyboard management
   */
  cleanup () {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.body.classList.remove('keyboard-navigation')

    this.isEnabled = false
    this.focusableElements = []
    this.currentFocusIndex = -1
  }
}
