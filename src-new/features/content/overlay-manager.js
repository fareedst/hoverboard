/**
 * Overlay Manager Module
 * Handles DOM overlay creation, positioning, and interaction management
 */

import { Logger } from '../../shared/logger.js'

// Debug logging utility
const debugLog = (message, data = null) => {
  if (window.HOVERBOARD_DEBUG) {
    if (data) {
      console.log(`[Hoverboard Overlay Debug] ${message}`, data)
    } else {
      console.log(`[Hoverboard Overlay Debug] ${message}`)
    }
  }
}

class OverlayManager {
  constructor (document, config) {
    this.document = document
    this.config = config
    this.logger = new Logger('OverlayManager')

    this.overlayElement = null
    this.isVisible = false
    this.currentContent = null
    this.isInsideOverlay = false

    this.overlayId = 'hoverboard-overlay'
    this.overlayClass = 'hoverboard-overlay'

    debugLog('OverlayManager initialized', { config })
  }

  /**
   * Show overlay with content
   */
  show (content) {
    try {
      debugLog('Showing overlay', { content })

      // Create overlay if it doesn't exist
      if (!this.overlayElement) {
        debugLog('Creating new overlay element')
        this.createOverlay()
      }

      // Clear existing content
      this.clearContent()
      debugLog('Content cleared')

      // Create overlay structure
      const container = this.document.createElement('div')
      container.className = 'hoverboard-container'

      // Add header section
      const header = this.document.createElement('div')
      header.className = 'hoverboard-section'

      const title = this.document.createElement('div')
      title.className = 'section-header'
      title.textContent = content.bookmark?.description || content.pageTitle || 'Bookmark Info'
      header.appendChild(title)

      debugLog('Header created', { title: title.textContent })

      // Add tags section
      const tagsSection = this.document.createElement('div')
      tagsSection.className = 'hoverboard-section'

      const tagsHeader = this.document.createElement('div')
      tagsHeader.className = 'section-header'
      tagsHeader.textContent = 'Tags'
      tagsSection.appendChild(tagsHeader)

      const tagsContainer = this.document.createElement('div')
      tagsContainer.className = 'tags-container'

      if (content.bookmark?.tags) {
        debugLog('Adding tags', { tags: content.bookmark.tags })
        content.bookmark.tags.forEach(tag => {
          const tagEl = this.document.createElement('span')
          tagEl.className = 'action-button'
          tagEl.textContent = tag
          tagsContainer.appendChild(tagEl)
        })
      } else {
        debugLog('No tags found in bookmark data')
      }

      // Add new tag input
      const addTagContainer = this.document.createElement('div')
      addTagContainer.className = 'add-tag-container'

      const tagInput = this.document.createElement('input')
      tagInput.className = 'add-tag-input'
      tagInput.placeholder = 'Add tag...'
      tagInput.id = 'newTag'

      const addButton = this.document.createElement('button')
      addButton.className = 'add-tag-button'
      addButton.textContent = 'Add'

      addTagContainer.appendChild(tagInput)
      addTagContainer.appendChild(addButton)

      tagsSection.appendChild(tagsContainer)
      tagsSection.appendChild(addTagContainer)

      debugLog('Tags section created')

      // Add actions section
      const actions = this.document.createElement('div')
      actions.className = 'actions'

      const closeButton = this.document.createElement('button')
      closeButton.className = 'action-button close-button'
      closeButton.textContent = 'Close'
      closeButton.onclick = () => this.hide()

      actions.appendChild(closeButton)

      debugLog('Actions section created')

      // Assemble overlay
      container.appendChild(header)
      container.appendChild(tagsSection)
      container.appendChild(actions)

      this.overlayElement.appendChild(container)
      this.currentContent = content

      debugLog('Overlay structure assembled')

      // Position and show overlay
      this.positionOverlay()
      this.overlayElement.style.display = 'block'
      this.isVisible = true

      debugLog('Overlay positioned and displayed')

      // Set up event handlers
      this.setupOverlayInteractions()

      // Add CSS animations
      this.addShowAnimation()

      debugLog('Overlay shown successfully')
    } catch (error) {
      this.logger.error('Error showing overlay:', error)
      debugLog('Error showing overlay', { error })
    }
  }

  /**
   * Hide overlay
   */
  hide () {
    if (!this.isVisible || !this.overlayElement) {
      debugLog('Hide called but overlay not visible')
      return
    }

    try {
      debugLog('Hiding overlay')

      // Add hide animation
      this.addHideAnimation(() => {
        if (this.overlayElement) {
          this.overlayElement.style.display = 'none'
          this.clearContent()
        }
        this.isVisible = false
        this.currentContent = null
        debugLog('Overlay hidden successfully')
      })
    } catch (error) {
      this.logger.error('Error hiding overlay:', error)
      debugLog('Error hiding overlay', { error })
    }
  }

  /**
   * Show a simple message in overlay
   */
  showMessage (message, type = 'info') {
    const messageElement = this.document.createElement('div')
    messageElement.className = `hoverboard-message ${type}`
    messageElement.textContent = message

    this.show(messageElement)

    // Auto-hide message after timeout
    if (this.config.messageTimeout > 0) {
      setTimeout(() => {
        this.hide()
      }, this.config.messageTimeout || 3000)
    }
  }

  /**
   * Check if click was inside overlay
   */
  isClickInsideOverlay (event) {
    if (!this.overlayElement || !this.isVisible) {
      return false
    }

    return this.overlayElement.contains(event.target)
  }

  /**
   * Create overlay DOM element
   */
  createOverlay () {
    this.logger.debug('Creating overlay element')

    // Remove existing overlay if any
    this.removeOverlay()

    // Create overlay container
    this.overlayElement = this.document.createElement('div')
    this.overlayElement.id = this.overlayId
    this.overlayElement.className = this.overlayClass

    // Set initial styles
    this.applyOverlayStyles()

    // Add overlay to document
    this.document.body.appendChild(this.overlayElement)

    // Inject CSS styles if not already present
    this.injectCSS()
  }

  /**
   * Remove overlay from DOM
   */
  removeOverlay () {
    const existing = this.document.getElementById(this.overlayId)
    if (existing) {
      existing.remove()
    }
    this.overlayElement = null
    this.isVisible = false
  }

  /**
   * Clear overlay content
   */
  clearContent () {
    if (this.overlayElement) {
      this.overlayElement.innerHTML = ''
    }
  }

  /**
   * Position overlay on screen
   */
  positionOverlay () {
    if (!this.overlayElement) {
      return
    }

    const position = this.calculateOptimalPosition()

    this.overlayElement.style.position = 'fixed'
    this.overlayElement.style.left = `${position.x}px`
    this.overlayElement.style.top = `${position.y}px`
    this.overlayElement.style.zIndex = '2147483647' // Maximum z-index

    // Ensure overlay stays within viewport
    this.constrainToViewport()
  }

  /**
   * Calculate optimal position for overlay
   */
  calculateOptimalPosition () {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.pageXOffset,
      scrollY: window.pageYOffset
    }

    // Default position (top-right corner with margin)
    let x = viewport.width - 320 - 20 // 320px width + 20px margin
    let y = 20 // 20px from top

    // Adjust for different positioning strategies
    switch (this.config.overlayPosition) {
      case 'top-left':
        x = 20
        y = 20
        break
      case 'top-right':
        x = viewport.width - 320 - 20
        y = 20
        break
      case 'bottom-left':
        x = 20
        y = viewport.height - 200 - 20 // Estimated height
        break
      case 'bottom-right':
        x = viewport.width - 320 - 20
        y = viewport.height - 200 - 20
        break
      case 'center':
        x = (viewport.width - 320) / 2
        y = (viewport.height - 200) / 2
        break
      case 'mouse':
        // Position near mouse if available
        if (this.lastMousePosition) {
          x = this.lastMousePosition.x + 10
          y = this.lastMousePosition.y + 10
        }
        break
      default:
        // Use top-right as default
        break
    }

    return { x, y }
  }

  /**
   * Constrain overlay to viewport
   */
  constrainToViewport () {
    if (!this.overlayElement) {
      return
    }

    const rect = this.overlayElement.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    let x = parseInt(this.overlayElement.style.left)
    let y = parseInt(this.overlayElement.style.top)

    // Constrain horizontally
    if (rect.right > viewport.width) {
      x = viewport.width - rect.width - 10
    }
    if (x < 10) {
      x = 10
    }

    // Constrain vertically
    if (rect.bottom > viewport.height) {
      y = viewport.height - rect.height - 10
    }
    if (y < 10) {
      y = 10
    }

    this.overlayElement.style.left = `${x}px`
    this.overlayElement.style.top = `${y}px`
  }

  /**
   * Apply overlay styles
   */
  applyOverlayStyles () {
    if (!this.overlayElement) {
      return
    }

    const styles = {
      display: 'none',
      position: 'fixed',
      minWidth: '300px',
      maxWidth: '400px',
      minHeight: '100px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '12px',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: '2147483647',
      overflow: 'auto',
      cursor: 'default'
    }

    Object.assign(this.overlayElement.style, styles)
  }

  /**
   * Set up overlay interactions
   */
  setupOverlayInteractions () {
    if (!this.overlayElement) {
      return
    }

    // Track mouse enter/leave for overlay
    this.overlayElement.addEventListener('mouseenter', () => {
      this.isInsideOverlay = true
    })

    this.overlayElement.addEventListener('mouseleave', () => {
      this.isInsideOverlay = false
    })

    // Prevent overlay from capturing certain events
    this.overlayElement.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    // Make overlay draggable if enabled
    if (this.config.overlayDraggable) {
      this.makeDraggable()
    }
  }

  /**
   * Make overlay draggable
   */
  makeDraggable () {
    if (!this.overlayElement) {
      return
    }

    let isDragging = false
    const dragOffset = { x: 0, y: 0 }

    // Add drag handle
    const dragHandle = this.document.createElement('div')
    dragHandle.className = 'hoverboard-drag-handle'
    dragHandle.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 20px;
      cursor: move;
      background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
      border-bottom: 1px solid #ddd;
      border-radius: 6px 6px 0 0;
    `

    this.overlayElement.style.position = 'relative'
    this.overlayElement.style.paddingTop = '32px'
    this.overlayElement.insertBefore(dragHandle, this.overlayElement.firstChild)

    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true
      const overlayRect = this.overlayElement.getBoundingClientRect()
      dragOffset.x = e.clientX - overlayRect.left
      dragOffset.y = e.clientY - overlayRect.top

      e.preventDefault()
    })

    this.document.addEventListener('mousemove', (e) => {
      if (!isDragging) return

      const x = e.clientX - dragOffset.x
      const y = e.clientY - dragOffset.y

      this.overlayElement.style.left = `${x}px`
      this.overlayElement.style.top = `${y}px`

      this.constrainToViewport()
    })

    this.document.addEventListener('mouseup', () => {
      isDragging = false
    })
  }

  /**
   * Add show animation
   */
  addShowAnimation () {
    if (!this.overlayElement || !this.config.overlayAnimations) {
      return
    }

    this.overlayElement.style.opacity = '0'
    this.overlayElement.style.transform = 'scale(0.9) translateY(-10px)'
    this.overlayElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease'

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      this.overlayElement.style.opacity = '1'
      this.overlayElement.style.transform = 'scale(1) translateY(0)'
    })
  }

  /**
   * Add hide animation
   */
  addHideAnimation (callback) {
    if (!this.overlayElement || !this.config.overlayAnimations) {
      callback()
      return
    }

    this.overlayElement.style.transition = 'opacity 0.15s ease, transform 0.15s ease'
    this.overlayElement.style.opacity = '0'
    this.overlayElement.style.transform = 'scale(0.9) translateY(-10px)'

    setTimeout(callback, 150)
  }

  /**
   * Inject CSS styles
   */
  injectCSS () {
    const styleId = 'hoverboard-overlay-styles'

    if (this.document.getElementById(styleId)) {
      return // Already injected
    }

    const style = this.document.createElement('style')
    style.id = styleId
    style.textContent = this.getOverlayCSS()

    this.document.head.appendChild(style)
  }

  /**
   * Get overlay CSS styles
   */
  getOverlayCSS () {
    return `
      .hoverboard-overlay {
        position: fixed !important;
        z-index: 2147483647 !important;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        min-width: 280px;
        max-width: 400px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.4;
        color: #333;
        padding: 16px;
        margin: 0;
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
      }
      
      .hoverboard-overlay * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .hoverboard-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .hoverboard-section {
        border-bottom: 1px solid #eee;
        padding-bottom: 12px;
      }
      
      .hoverboard-section:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .section-header {
        font-weight: 600;
        font-size: 14px;
        color: #2c3e50;
        margin-bottom: 8px;
      }
      
      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }
      
      .action-button {
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
        color: #333;
      }
      
      .action-button:hover {
        background: #f5f5f5;
        border-color: #999;
      }
      
      .action-button.close-button {
        background: #f44336;
        color: white;
        border-color: #f44336;
      }
      
      .action-button.close-button:hover {
        background: #d32f2f;
      }
      
      .add-tag-container {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .add-tag-input {
        padding: 6px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 13px;
        width: 140px;
        outline: none;
      }
      
      .add-tag-input:focus {
        border-color: #2196f3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
      }
      
      .add-tag-button {
        padding: 6px 12px;
        border: 1px solid #4caf50;
        border-radius: 4px;
        background: #4caf50;
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .add-tag-button:hover {
        background: #45a049;
      }
      
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      
      @media (max-width: 480px) {
        .hoverboard-overlay {
          min-width: 280px;
          max-width: 90vw;
          font-size: 13px;
        }
        
        .tags-container {
          gap: 4px;
        }
        
        .actions {
          gap: 6px;
        }
      }
    `
  }

  /**
   * Update mouse position for positioning
   */
  updateMousePosition (x, y) {
    this.lastMousePosition = { x, y }
  }

  /**
   * Update configuration
   */
  updateConfig (newConfig) {
    this.config = newConfig
  }

  /**
   * Cleanup resources
   */
  destroy () {
    this.removeOverlay()

    // Remove injected styles
    const styleElement = this.document.getElementById('hoverboard-overlay-styles')
    if (styleElement) {
      styleElement.remove()
    }
  }
}

export { OverlayManager }
