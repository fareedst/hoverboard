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

    // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
    this.transparencyMode = config?.overlayTransparencyMode || 'opaque'
    this.positionMode = config?.overlayPositionMode || 'default'
    this.adaptiveVisibility = config?.overlayAdaptiveVisibility || false
    this.proximityListener = null

    debugLog('OverlayManager initialized', { config, transparencyMode: this.transparencyMode })
  }

  /**
   * Show overlay with content
   */
  show (content) {
    try {
      debugLog('Showing overlay', { content })
      
      // Enhanced debugging for overlay content
      console.log('🎨 [Overlay Debug] Content received:')
      console.log('🎨 [Overlay Debug] - Full content:', content)
      console.log('🎨 [Overlay Debug] - Bookmark:', content.bookmark)
      console.log('🎨 [Overlay Debug] - Bookmark tags:', content.bookmark?.tags)
      console.log('🎨 [Overlay Debug] - Tags type:', typeof content.bookmark?.tags)
      console.log('🎨 [Overlay Debug] - Tags is array:', Array.isArray(content.bookmark?.tags))
      console.log('🎨 [Overlay Debug] - Page title:', content.pageTitle)
      console.log('🎨 [Overlay Debug] - Page URL:', content.pageUrl)

      // Create overlay if it doesn't exist
      if (!this.overlayElement) {
        debugLog('Creating new overlay element')
        this.createOverlay()
      }

      // Clear existing content
      this.clearContent()
      debugLog('Content cleared')

      // Create main container div
      const mainContainer = this.document.createElement('div')
      mainContainer.style.cssText = 'padding: 8px;'

      // Create current tags section (matching desired overlay)
      const currentTagsContainer = this.document.createElement('div')
      currentTagsContainer.className = 'scrollmenu'
      currentTagsContainer.style.cssText = `
        margin-bottom: 8px;
        padding: 4px;
        background: white;
        border-radius: 4px;
      `

      // Close button (matching desired overlay style)
      const closeBtn = this.document.createElement('span')
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
      closeBtn.onclick = () => this.hide()
      currentTagsContainer.appendChild(closeBtn)

      // Current tags label
      const currentLabel = this.document.createElement('span')
      currentLabel.className = 'tiny'
      currentLabel.textContent = 'Current:'
      currentLabel.style.cssText = 'padding: 0.2em 0.5em; margin-right: 4px;'
      currentTagsContainer.appendChild(currentLabel)

      // Add current tags
      if (content.bookmark?.tags) {
        debugLog('Adding tags', { tags: content.bookmark.tags })
        content.bookmark.tags.forEach(tag => {
          const tagElement = this.document.createElement('span')
          tagElement.className = 'tiny iconTagDeleteInactive'
          tagElement.textContent = tag
          tagElement.title = 'Double-click to remove'
          tagElement.style.cssText = `
            padding: 0.2em 0.5em;
            margin: 2px;
            background: #f0f8f0;
            border-radius: 3px;
            cursor: pointer;
            color: #90ee90;
          `
          // Add double-click to remove functionality
          tagElement.ondblclick = () => {
            // Remove tag from current content
            if (content.bookmark && content.bookmark.tags) {
              const index = content.bookmark.tags.indexOf(tag)
              if (index > -1) {
                content.bookmark.tags.splice(index, 1)
                // Refresh overlay
                this.show(content)
              }
            }
          }
          currentTagsContainer.appendChild(tagElement)
        })
      } else {
        debugLog('No tags found in bookmark data')
      }

      // Add tag input (matching desired overlay style)
      const tagInput = this.document.createElement('input')
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
      tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const tagText = tagInput.value.trim()
          if (tagText && content.bookmark) {
            if (!content.bookmark.tags) content.bookmark.tags = []
            if (!content.bookmark.tags.includes(tagText)) {
              content.bookmark.tags.push(tagText)
              tagInput.value = ''
              // Refresh overlay
              this.show(content)
              debugLog('Tag added', tagText)
            }
          }
        }
      })
      currentTagsContainer.appendChild(tagInput)

      // Recent tags section (matching desired overlay)
      const recentContainer = this.document.createElement('div')
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

      const recentLabel = this.document.createElement('span')
      recentLabel.className = 'tiny'
      recentLabel.textContent = 'Recent:'
      recentLabel.style.cssText = 'padding: 0.2em 0.5em; margin-right: 4px;'
      recentContainer.appendChild(recentLabel)

      // Add sample recent tags
      const sampleRecentTags = ['development', 'web', 'tutorial', 'javascript', 'reference']
      sampleRecentTags.slice(0, 3).forEach(tag => {
        if (!content.bookmark?.tags?.includes(tag)) {
          const tagElement = this.document.createElement('span')
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
          tagElement.onclick = () => {
            if (content.bookmark) {
              if (!content.bookmark.tags) content.bookmark.tags = []
              if (!content.bookmark.tags.includes(tag)) {
                content.bookmark.tags.push(tag)
                // Refresh overlay
                this.show(content)
                debugLog('Tag added from recent', tag)
              }
            }
          }
          recentContainer.appendChild(tagElement)
        }
      })

      // Transparency controls section
      const transparencyContainer = this.document.createElement('div')
      transparencyContainer.className = 'transparency-controls'
      transparencyContainer.style.cssText = `
        margin-bottom: 8px;
        padding: 4px 8px;
        background: #f0f0f0;
        border-radius: 4px;
        border: 1px solid #ddd;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      `

      // Transparency label
      const transparencyLabel = this.document.createElement('span')
      transparencyLabel.textContent = '👁️ Overlay:'
      transparencyLabel.style.cssText = `
        font-weight: 600;
        color: #555;
        font-size: 11px;
      `
      transparencyContainer.appendChild(transparencyLabel)

      // Transparency mode buttons
      const modes = [
        { mode: 'opaque', label: '●', title: 'Opaque' },
        { mode: 'nearly-transparent', label: '◐', title: 'Nearly Transparent' },
        { mode: 'fully-transparent', label: '○', title: 'Fully Transparent' }
      ]

      modes.forEach(({ mode, label, title }) => {
        const modeBtn = this.document.createElement('button')
        modeBtn.textContent = label
        modeBtn.title = title
        modeBtn.style.cssText = `
          padding: 2px 6px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 3px;
          background: ${this.transparencyMode === mode ? '#007acc' : '#fff'};
          color: ${this.transparencyMode === mode ? '#fff' : '#333'};
          cursor: pointer;
          font-weight: 600;
        `
        modeBtn.onclick = () => {
          this.transparencyMode = mode
          this.applyTransparencyMode()
          // Update button styles
          transparencyContainer.querySelectorAll('button').forEach(btn => {
            btn.style.background = '#fff'
            btn.style.color = '#333'
          })
          modeBtn.style.background = '#007acc'
          modeBtn.style.color = '#fff'
          debugLog('Transparency mode changed', mode)
        }
        transparencyContainer.appendChild(modeBtn)
      })

      // Opacity slider (only show for transparent modes)
      if (this.transparencyMode !== 'opaque') {
        const opacityLabel = this.document.createElement('span')
        opacityLabel.textContent = 'Opacity:'
        opacityLabel.style.cssText = `
          font-size: 11px;
          color: #555;
          margin-left: 8px;
        `
        transparencyContainer.appendChild(opacityLabel)

        const opacitySlider = this.document.createElement('input')
        opacitySlider.type = 'range'
        opacitySlider.min = '0.01'
        opacitySlider.max = '1'
        opacitySlider.step = '0.01'
        opacitySlider.value = this.config?.overlayOpacityNormal || 0.05
        opacitySlider.style.cssText = `
          width: 60px;
          height: 16px;
        `
        
        const opacityValue = this.document.createElement('span')
        opacityValue.textContent = Math.round((this.config?.overlayOpacityNormal || 0.05) * 100) + '%'
        opacityValue.style.cssText = `
          font-size: 10px;
          color: #555;
          min-width: 25px;
          text-align: right;
        `

        opacitySlider.oninput = () => {
          const opacity = parseFloat(opacitySlider.value)
          opacityValue.textContent = Math.round(opacity * 100) + '%'
          
          // Update configuration with new opacity
          this.config = { 
            ...this.config, 
            overlayOpacityNormal: opacity,
            overlayOpacityHover: Math.min(opacity + 0.1, 1),
            overlayOpacityFocus: Math.min(opacity + 0.2, 1)
          }
          
          // Apply transparency changes through the proper system
          this.applyTransparencyMode()
          
          debugLog('Opacity changed and applied', { 
            opacity, 
            mode: this.transparencyMode,
            config: this.config 
          })
        }

        transparencyContainer.appendChild(opacitySlider)
        transparencyContainer.appendChild(opacityValue)
      }

      // Action buttons section (matching desired overlay)
      const actionsContainer = this.document.createElement('div')
      actionsContainer.style.cssText = `
        padding: 4px;
        background: white;
        border-radius: 4px;
        text-align: center;
      `

      // Privacy toggle button
      const privateBtn = this.document.createElement('button')
      const isPrivate = content.bookmark?.shared === 'no'
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
      privateBtn.onclick = () => {
        if (content.bookmark) {
          content.bookmark.shared = content.bookmark.shared === 'no' ? 'yes' : 'no'
          // Refresh overlay
          this.show(content)
          debugLog('Privacy toggled', content.bookmark.shared)
        }
      }

      // Read status toggle button
      const readBtn = this.document.createElement('button')
      const isToRead = content.bookmark?.toread === 'yes'
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
      readBtn.textContent = isToRead ? '📖 To Read' : '📋 Read'
      readBtn.onclick = () => {
        if (content.bookmark) {
          content.bookmark.toread = content.bookmark.toread === 'yes' ? 'no' : 'yes'
          // Refresh overlay
          this.show(content)
          debugLog('Read status toggled', content.bookmark.toread)
        }
      }

      actionsContainer.appendChild(privateBtn)
      actionsContainer.appendChild(readBtn)

      // Page info section (matching desired overlay)
      const pageInfo = this.document.createElement('div')
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
          ${content.bookmark?.description || content.pageTitle || 'No Title'}
        </div>
        <div>${content.bookmark?.url || content.pageUrl || ''}</div>
      `

      debugLog('Overlay structure created with enhanced styling')

      // Assemble the overlay (matching desired structure)
      mainContainer.appendChild(currentTagsContainer)
      mainContainer.appendChild(recentContainer)
      mainContainer.appendChild(transparencyContainer)
      mainContainer.appendChild(actionsContainer)
      mainContainer.appendChild(pageInfo)

      this.overlayElement.appendChild(mainContainer)
      this.currentContent = content

      debugLog('Overlay structure assembled')

      // Position and show overlay
      this.positionOverlay()
      this.overlayElement.style.display = 'block'
      this.isVisible = true

      debugLog('Overlay positioned and displayed')
      console.log('🎨 [Overlay Debug] Overlay element styles:', {
        display: this.overlayElement.style.display,
        position: this.overlayElement.style.position,
        left: this.overlayElement.style.left,
        top: this.overlayElement.style.top,
        zIndex: this.overlayElement.style.zIndex,
        opacity: this.overlayElement.style.opacity,
        transform: this.overlayElement.style.transform
      })

      // Set up event handlers
      this.setupOverlayInteractions()

      // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
      // Apply transparency and positioning modes
      this.applyTransparencyMode()
      
      // Add CSS animations
      this.addShowAnimation()

      debugLog('Overlay shown successfully')
      console.log('🎨 [Overlay Debug] Final overlay visibility check:', {
        isVisible: this.isVisible,
        elementExists: !!this.overlayElement,
        elementInDOM: document.body.contains(this.overlayElement),
        computedDisplay: window.getComputedStyle(this.overlayElement).display,
        computedOpacity: window.getComputedStyle(this.overlayElement).opacity
      })
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

    // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
    // Check if using bottom-fixed positioning mode
    if (this.positionMode === 'bottom-fixed') {
      // Apply bottom-fixed positioning instead of calculated position
      this.applyBottomFixedPositioning()
      return
    }

    // Position overlay in top-right corner like the desired overlay
    this.overlayElement.style.position = 'fixed'
    this.overlayElement.style.top = '20px'
    this.overlayElement.style.right = '20px'
    this.overlayElement.style.left = 'auto'
    this.overlayElement.style.bottom = 'auto'
    this.overlayElement.style.zIndex = '9998'

    debugLog('Overlay positioned in top-right corner')
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

    // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
    // Apply transparency mode after base styles
    this.applyTransparencyMode()
  }

  /**
   * 🔺 UI-005: Transparent overlay manager - 🔧 Position and transparency control
   * Apply bottom-fixed positioning for transparent overlays
   */
  applyBottomFixedPositioning () {
    if (!this.overlayElement) return

    // Apply bottom-fixed positioning class
    this.overlayElement.classList.add('hoverboard-overlay-bottom')
    
    // Override base positioning styles
    this.overlayElement.style.position = 'fixed'
    this.overlayElement.style.bottom = '0'
    this.overlayElement.style.left = '0'
    this.overlayElement.style.width = '100vw'
    this.overlayElement.style.maxWidth = 'none'
    this.overlayElement.style.minWidth = '100vw'
    this.overlayElement.style.height = 'auto'
    this.overlayElement.style.minHeight = '48px'
    this.overlayElement.style.maxHeight = '200px'
    this.overlayElement.style.borderRadius = '0'
    this.overlayElement.style.zIndex = '999999'

    debugLog('Applied bottom-fixed positioning')
  }

  /**
   * 🔺 UI-005: Transparency manager - 🔧 Opacity and positioning control
   * Apply transparency styling based on configuration
   */
  applyTransparencyMode () {
    if (!this.overlayElement) return

    // Remove existing transparency classes
    this.overlayElement.classList.remove(
      'hoverboard-overlay-transparent',
      'hoverboard-overlay-invisible'
    )

    // Get opacity values from configuration
    const normalOpacity = this.config?.overlayOpacityNormal || 0.05
    const hoverOpacity = this.config?.overlayOpacityHover || 0.15
    const focusOpacity = this.config?.overlayOpacityFocus || 0.25
    const blurAmount = this.config?.overlayBlurAmount || 2

    // Apply transparency mode with dynamic opacity
    switch (this.transparencyMode) {
      case 'nearly-transparent':
        this.overlayElement.classList.add('hoverboard-overlay-transparent')
        // Apply dynamic opacity
        this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity})`
        this.overlayElement.style.backdropFilter = `blur(${blurAmount}px)`
        this.overlayElement.style.border = '1px solid rgba(255, 255, 255, 0.2)'
        this.setupTransparencyInteractions()
        debugLog('Applied nearly-transparent mode with opacity:', normalOpacity)
        break
      case 'fully-transparent':
        this.overlayElement.classList.add('hoverboard-overlay-invisible')
        // Apply very low opacity for fully transparent
        this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity * 0.5})`
        this.overlayElement.style.backdropFilter = `blur(${Math.max(1, blurAmount - 1)}px)`
        this.overlayElement.style.border = '1px solid rgba(255, 255, 255, 0.1)'
        this.setupTransparencyInteractions()
        debugLog('Applied fully-transparent mode with opacity:', normalOpacity * 0.5)
        break
      default:
        // Opaque mode - reset to default
        this.overlayElement.style.background = 'white'
        this.overlayElement.style.backdropFilter = 'none'
        this.overlayElement.style.border = '1px solid #ccc'
        debugLog('Using default opaque mode')
        break
    }

    // Apply position mode
    if (this.positionMode === 'bottom-fixed') {
      this.applyBottomFixedPositioning()
    }

    // Setup adaptive visibility if enabled
    if (this.adaptiveVisibility && 
        (this.transparencyMode === 'nearly-transparent' || this.transparencyMode === 'fully-transparent')) {
      this.setupAdaptiveVisibility()
    }
  }

  /**
   * 🔶 UI-005: Adaptive visibility - 🎯 Context-aware transparency
   * Setup adaptive visibility based on mouse proximity
   */
  setupAdaptiveVisibility () {
    if (this.proximityListener) {
      this.document.removeEventListener('mousemove', this.proximityListener)
    }

    this.proximityListener = (e) => {
      const distanceFromBottom = window.innerHeight - e.clientY
      
      if (distanceFromBottom < 100) {
        this.overlayElement.classList.add('proximity-active')
      } else if (distanceFromBottom > 200) {
        this.overlayElement.classList.remove('proximity-active')
      }
    }

    this.document.addEventListener('mousemove', this.proximityListener)
    debugLog('Adaptive visibility enabled')
  }

  /**
   * 🔺 UI-005: Transparency manager - 🔧 Interaction enhancement setup
   * Setup hover and focus interactions for transparent overlays
   */
  setupTransparencyInteractions () {
    if (!this.overlayElement) return

    // Get opacity values from configuration
    const normalOpacity = this.config?.overlayOpacityNormal || 0.05
    const hoverOpacity = this.config?.overlayOpacityHover || 0.15
    const focusOpacity = this.config?.overlayOpacityFocus || 0.25
    const blurAmount = this.config?.overlayBlurAmount || 2

    // Store original styles for restoration
    const originalBackground = this.overlayElement.style.background
    const originalBackdropFilter = this.overlayElement.style.backdropFilter

    // Hover enhancement
    this.overlayElement.addEventListener('mouseenter', () => {
      if (this.transparencyMode === 'nearly-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${hoverOpacity})`
      } else if (this.transparencyMode === 'fully-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${hoverOpacity * 0.5})`
      }
      debugLog('Overlay hover - increasing visibility to:', hoverOpacity)
    })

    this.overlayElement.addEventListener('mouseleave', () => {
      if (this.transparencyMode === 'nearly-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity})`
      } else if (this.transparencyMode === 'fully-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity * 0.5})`
      }
      debugLog('Overlay leave - resetting visibility to:', normalOpacity)
    })

    // Focus enhancement for accessibility
    this.overlayElement.addEventListener('focusin', () => {
      if (this.transparencyMode === 'nearly-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${focusOpacity})`
      } else if (this.transparencyMode === 'fully-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${focusOpacity * 0.5})`
      }
      debugLog('Overlay focus - enhancing visibility for accessibility to:', focusOpacity)
    })

    this.overlayElement.addEventListener('focusout', () => {
      if (this.transparencyMode === 'nearly-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity})`
      } else if (this.transparencyMode === 'fully-transparent') {
        this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity * 0.5})`
      }
      debugLog('Overlay blur - resetting focus visibility to:', normalOpacity)
    })
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
    if (!this.overlayElement) {
      return
    }

    if (this.config.overlayAnimations) {
      this.overlayElement.style.opacity = '0'
      this.overlayElement.style.transform = 'scale(0.9) translateY(-10px)'
      this.overlayElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease'

      // Trigger animation on next frame
      requestAnimationFrame(() => {
        this.overlayElement.style.opacity = '1'
        this.overlayElement.style.transform = 'scale(1) translateY(0)'
      })
    } else {
      // Ensure overlay is visible even without animations
      this.overlayElement.style.opacity = '1'
      this.overlayElement.style.transform = 'scale(1) translateY(0)'
    }
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
        z-index: 9998 !important;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #90ee90;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        max-width: 400px;
        max-height: 80vh;
        font-family: 'Futura PT', system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: #333;
        font-weight: 600;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        cursor: pointer;
        backdrop-filter: none;
        width: auto;
        height: auto;
        min-height: auto;
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
      }
      
      .hoverboard-overlay * {
        box-sizing: border-box;
      }

      /* Desired overlay styling components */
      .scrollmenu {
        overflow-x: auto;
        white-space: nowrap;
      }

      .tiny {
        font-size: 12px;
        display: inline-block;
      }

      .iconTagDeleteInactive {
        transition: all 0.2s ease;
      }

      .iconTagDeleteInactive:hover {
        background: #e0f0e0 !important;
        color: #60c060 !important;
      }

      .tag-input {
        outline: none;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: 12px;
      }

      .tag-input:focus {
        border-color: #90ee90;
        box-shadow: 0 0 0 2px rgba(144, 238, 144, 0.2);
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

      /* ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system */
      .hoverboard-overlay-transparent {
        background: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(2px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #000000;
        text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
        transition: background-color 0.2s ease-in-out;
      }

      .hoverboard-overlay-invisible {
        background: transparent !important;
        backdrop-filter: blur(1px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #333333;
        transition: background-color 0.2s ease-in-out;
      }

      /* 🔺 UI-005: Transparent overlay positioning - 🎨 Bottom-fixed transparency */
      .hoverboard-overlay-bottom {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: auto !important;
        min-height: 48px;
        max-height: 200px;
        max-width: none !important;
        min-width: 100vw !important;
        border-radius: 0 !important;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        border-left: none;
        border-right: none;
        border-bottom: none;
        animation: hoverboard-slide-up 0.3s ease-out;
        padding: 8px 16px !important; /* Add horizontal padding for content spacing */
        box-sizing: border-box;
      }

      /* Layout adjustments for bottom-fixed overlays */
      .hoverboard-overlay-bottom .hoverboard-container {
        max-width: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .hoverboard-overlay-bottom .hoverboard-section {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
        flex: 1;
        min-width: 200px;
      }

      .hoverboard-overlay-bottom .section-header {
        font-size: 12px;
        margin-bottom: 4px;
        white-space: nowrap;
      }

      .hoverboard-overlay-bottom .add-tag-container {
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 6px;
      }

      .hoverboard-overlay-bottom .add-tag-input {
        flex: 1;
        min-width: 120px;
        max-width: 200px;
      }

      .hoverboard-overlay-bottom .add-tag-button {
        flex-shrink: 0;
      }

      .hoverboard-overlay-bottom .actions {
        justify-content: flex-end;
        gap: 12px;
        flex-shrink: 0;
      }

      .hoverboard-overlay-bottom .tags-container {
        justify-content: flex-start;
        max-width: 100%;
        overflow-x: auto;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */
      }

      .hoverboard-overlay-bottom .tags-container::-webkit-scrollbar {
        display: none; /* Chrome/Safari */
      }

      /* Responsive adjustments for bottom-fixed */
      @media (max-width: 768px) {
        .hoverboard-overlay-bottom .hoverboard-container {
          flex-direction: column;
          gap: 8px;
        }
        
        .hoverboard-overlay-bottom .hoverboard-section {
          min-width: unset;
          width: 100%;
        }
        
        .hoverboard-overlay-bottom .add-tag-container {
          flex-direction: row;
          justify-content: space-between;
        }
        
        .hoverboard-overlay-bottom .add-tag-input {
          max-width: 200px;
        }
        
        .hoverboard-overlay-bottom .actions {
          gap: 8px;
          justify-content: center;
        }
      }

      /* Hover state - Increased visibility on interaction */
      .hoverboard-overlay-transparent:hover,
      .hoverboard-overlay-invisible:hover {
        background: rgba(255, 255, 255, 0.25) !important;
      }

      /* Focus state - Enhanced visibility for accessibility */
      .hoverboard-overlay-transparent:focus-within,
      .hoverboard-overlay-invisible:focus-within {
        background: rgba(255, 255, 255, 0.4) !important;
      }

      /* 🔶 UI-005: Adaptive visibility - 🎯 Context-aware transparency */
      .hoverboard-overlay-transparent.proximity-active,
      .hoverboard-overlay-invisible.proximity-active {
        background: rgba(255, 255, 255, 0.2) !important;
      }

      /* Slide-up animation for bottom-fixed overlays */
      @keyframes hoverboard-slide-up {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
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
    this.config = { ...this.config, ...newConfig }
    
    // Update transparency-related properties
    if (newConfig.overlayTransparencyMode !== undefined) {
      this.transparencyMode = newConfig.overlayTransparencyMode
    }
    if (newConfig.overlayPositionMode !== undefined) {
      this.positionMode = newConfig.overlayPositionMode
    }
    if (newConfig.overlayAdaptiveVisibility !== undefined) {
      this.adaptiveVisibility = newConfig.overlayAdaptiveVisibility
    }
    
    debugLog('Configuration updated', { 
      transparencyMode: this.transparencyMode,
      positionMode: this.positionMode,
      adaptiveVisibility: this.adaptiveVisibility,
      newConfig 
    })
  }

  /**
   * Cleanup resources
   */
  destroy () {
    this.removeOverlay()

    // 🔻 UI-005: Content protection - 🛡️ Page interaction safeguards  
    // Clean up transparency-related listeners
    if (this.proximityListener) {
      this.document.removeEventListener('mousemove', this.proximityListener)
      this.proximityListener = null
    }

    // Remove injected styles
    const styleElement = this.document.getElementById('hoverboard-overlay-styles')
    if (styleElement) {
      styleElement.remove()
    }
  }
}

export { OverlayManager }
