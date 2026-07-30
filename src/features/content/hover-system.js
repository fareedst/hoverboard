/**
 * Hover System Module
 * Manages hover display, tag rendering, and user interactions
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 * [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] — How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.
 *
 * ## VALIDATE_INCOMING_MESSAGE
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY] How: validate envelope then per-type data schema before handler body runs.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_INCOMING_MESSAGE
 *   - envelope = validateMessageEnvelope(message)
 *   - IF envelope fails: RETURN error
 *   - data = validateMessageData(message.type, message.data)
 *   - IF data fails: RETURN error
 *   - RETURN { type, data }
 *   - How (sub-block): How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.
 *
 * ## VALIDATE_MERGED_CONFIG
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] How: Implements VALIDATE_MERGED_CONFIG(merged) behavior for IMPL-RUNTIME_VALIDATION.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_MERGED_CONFIG
 *   - parsed = configSchema.safeParse(merged)
 *   - IF NOT parsed.success: LOG; RETURN fallback OR error
 *   - RETURN parsed.data
 *
 * === END IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 */
import { MessageService } from '../../core/message-service.js'
import { Logger } from '../../shared/logger.js'
import { TagRenderer } from './tag-renderer.js'

class HoverSystem {
  constructor (document, config, overlayManager) {
    this.document = document
    this.config = config
    this.overlayManager = overlayManager
    this.messageService = new MessageService()
    this.logger = new Logger('HoverSystem')
    this.tagRenderer = new TagRenderer(config)

    this.currentPin = null
    this.isVisible = false
    this.autoCloseTimer = null
  }

  /**
   * Display hover with pin data
   */
  async displayHover (hoverConfig) {
    try {
      this.logger.debug('Displaying hover with config:', hoverConfig)

      if (this.isVisible) {
        this.hideHover()
      }

      // Get pin data for current page
      const pinData = await this.loadSiteData(hoverConfig)

      if (!pinData) {
        this.overlayManager.showMessage('No data available')
        return
      }

      this.currentPin = pinData

      // Build hover content
      const hoverContent = await this.buildHoverContent(pinData)

      // Display in overlay
      this.overlayManager.show(hoverContent)
      this.isVisible = true

      // Set up auto-close timer if configured
      if (this.config.autoCloseTimeout > 0 && hoverConfig.pageLoad) {
        this.setAutoCloseTimer(this.config.autoCloseTimeout)
      }

      this.logger.debug('Hover displayed successfully')
    } catch (error) {
      this.logger.error('Error displaying hover:', error)
      this.overlayManager.showMessage('Error loading data')
    }
  }

  /**
   * Hide the hover overlay
   */
  hideHover () {
    if (this.isVisible) {
      this.overlayManager.hide()
      this.isVisible = false
      this.currentPin = null
      this.clearAutoCloseTimer()
      this.logger.debug('Hover hidden')
    }
  }

  /**
   * Toggle hover visibility
   */
  async toggleHover () {
    if (this.isVisible) {
      this.hideHover()
    } else {
      await this.displayHover({
        displayNow: true,
        pageLoad: false,
        useBlock: false
      })
    }
  }

  /**
   * Refresh hover with updated data
   */
  async refreshHover () {
    if (this.isVisible) {
      const hoverConfig = {
        displayNow: true,
        pageLoad: false,
        useBlock: false
      }
      await this.displayHover(hoverConfig)
    }
  }

  /**
   * Check if hover is currently visible
   */
  isHoverVisible () {
    return this.isVisible
  }

  /**
   * Load site data from background
   */
  async loadSiteData (hoverConfig) {
    try {
      const response = await this.messageService.sendMessage('getCurrentPin', {
        tabId: hoverConfig.tabId,
        title: this.document.title,
        url: window.location.href,
        useBlock: hoverConfig.useBlock || false
      })

      if (!response || !response.url) {
        this.logger.warn('No pin data received')
        return null
      }

      // Enhance pin data with additional properties
      const pin = response
      this.logger.debug('Site data loaded:', pin)
      return pin
    } catch (error) {
      this.logger.error('Error loading site data:', error)
      return null
    }
  }

  /**
   * Build hover content structure
   */
  async buildHoverContent (pin) {
    const container = this.document.createElement('div')
    container.className = 'hoverboard-container'

    // Add current tags section
    if (pin.tags && pin.tags.length > 0) {
      const currentSection = await this.buildCurrentTagsSection(pin)
      container.appendChild(currentSection)
    }

    // Add recent tags section if enabled
    if (this.config.showRecentTags) {
      const recentSection = await this.buildRecentTagsSection(pin)
      if (recentSection) {
        container.appendChild(recentSection)
      }
    }

    // Add content tags section if enabled
    if (this.config.showContentTags) {
      const contentSection = await this.buildContentTagsSection(pin)
      if (contentSection) {
        container.appendChild(contentSection)
      }
    }

    // Add action buttons
    const actionsSection = this.buildActionsSection(pin)
    container.appendChild(actionsSection)

    return container
  }

  /**
   * Build current tags section
   */
  async buildCurrentTagsSection (pin) {
    const section = this.document.createElement('div')
    section.className = 'hoverboard-section current-tags'

    // Section header
    const header = this.document.createElement('div')
    header.className = 'section-header'
    header.textContent = 'Current:'
    if (this.config.showTooltips) {
      header.title = 'Tags for this Bookmark (2-click-delete)'
    }
    section.appendChild(header)

    // Tags container
    const tagsContainer = this.document.createElement('div')
    tagsContainer.className = 'tags-container'
    section.appendChild(tagsContainer)

    // Render current tags
    pin.tags.forEach(tag => {
      const tagElement = this.tagRenderer.createCurrentTag(tag, pin, (tagToDelete) => {
        this.handleDeleteTag(pin, tagToDelete)
      })
      tagsContainer.appendChild(tagElement)
    })

    return section
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Build recent tags section with user-driven behavior
   */
  async buildRecentTagsSection (pin) {
    try {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get user recent tags excluding current site
      const response = await this.messageService.sendMessage('getRecentBookmarks', {
        currentTags: pin.tags || [], // Pass current tags for exclusion
        senderUrl: pin.url
      })

      const recentTags = response?.recentTags || []

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Show empty state for user-driven recent tags
      if (!recentTags || recentTags.length === 0) {
        return null
      }

      const section = this.document.createElement('div')
      section.className = 'hoverboard-section recent-tags'

      // Section header
      const header = this.document.createElement('div')
      header.className = 'section-header'
      header.textContent = 'Recent:'
      if (this.config.showTooltips) {
        header.title = 'Recent Tags (click to add to current site)'
      }
      section.appendChild(header)

      // Tags container
      const tagsContainer = this.document.createElement('div')
      tagsContainer.className = 'tags-container'
      section.appendChild(tagsContainer)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Tags are already filtered by the service, but double-check
      const currentTags = pin.tags || []
      const availableTags = recentTags.filter(tag => !currentTags.includes(tag))

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Render recent tags (limited count)
      const displayCount = Math.min(availableTags.length, this.config.recentTagsDisplayLimit || 10)
      for (let i = 0; i < displayCount; i++) {
        const tag = availableTags[i]
        const tagElement = this.tagRenderer.createRecentTag(tag, pin, (tagToAdd) => {
          // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Add tag to current site only
          this.handleAddTag(pin, tagToAdd)
        })
        tagsContainer.appendChild(tagElement)
      }

      return section
    } catch (error) {
      this.logger.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error building recent tags section:', error)
      return null
    }
  }

  /**
   * Build content tags section
   */
  async buildContentTagsSection (pin) {
    try {
      const contentTags = await this.messageService.sendMessage('getContentTags', {
        url: pin.url,
        title: pin.description || this.document.title
      })

      if (!contentTags || contentTags.length === 0) {
        return null
      }

      const section = this.document.createElement('div')
      section.className = 'hoverboard-section content-tags'

      // Section header
      const header = this.document.createElement('div')
      header.className = 'section-header'
      header.textContent = 'Suggested:'
      if (this.config.showTooltips) {
        header.title = 'Content-based Tag Suggestions'
      }
      section.appendChild(header)

      // Tags container
      const tagsContainer = this.document.createElement('div')
      tagsContainer.className = 'tags-container'
      section.appendChild(tagsContainer)

      // Filter out existing tags
      const currentTags = pin.tags || []
      const availableTags = contentTags.filter(tag => !currentTags.includes(tag))

      // Render content tags
      availableTags.forEach(tag => {
        const tagElement = this.tagRenderer.createContentTag(tag, pin, (tagToAdd) => {
          this.handleAddTag(pin, tagToAdd)
        })
        tagsContainer.appendChild(tagElement)
      })

      return section
    } catch (error) {
      this.logger.error('Error building content tags section:', error)
      return null
    }
  }

  /**
   * Build actions section
   */
  buildActionsSection (pin) {
    const section = this.document.createElement('div')
    section.className = 'hoverboard-section actions'

    // Close button
    if (this.config.showCloseButton) {
      const closeBtn = this.createActionButton('✕', 'Close Hoverboard', () => {
        this.hideHover()
      })
      closeBtn.className += ' close-button'
      section.appendChild(closeBtn)
    }

    // Private/Public toggle
    if (this.config.showPrivateButton) {
      const privateBtn = this.createActionButton(
        pin.shared === 'no' ? '🔒' : '🌐',
        pin.shared === 'no' ? 'Make Public' : 'Make Private',
        () => this.handleTogglePrivacy(pin)
      )
      section.appendChild(privateBtn)
    }

    // Read Later toggle
    if (this.config.showReadLaterButton) {
      const readBtn = this.createActionButton(
        pin.toread === 'yes' ? '📖' : '📋',
        pin.toread === 'yes' ? 'Remove from Read Later' : 'Mark for Read Later',
        () => this.handleToggleReadLater(pin)
      )
      section.appendChild(readBtn)
    }

    // Add tag input
    if (this.config.showAddTagInput) {
      const inputContainer = this.createAddTagInput(pin)
      section.appendChild(inputContainer)
    }

    // Delete pin button
    if (this.config.showDeleteButton && pin.hash) {
      const deleteBtn = this.createActionButton('🗑️', 'Delete Bookmark', () => {
        this.handleDeletePin(pin)
      })
      deleteBtn.className += ' delete-button'
      section.appendChild(deleteBtn)
    }

    // Block URL button
    if (this.config.showBlockButton) {
      const blockBtn = this.createActionButton('🚫', 'Block this URL', () => {
        this.handleBlockUrl(pin.url)
      })
      section.appendChild(blockBtn)
    }

    return section
  }

  /**
   * Create action button
   */
  createActionButton (text, title, onClick) {
    const button = this.document.createElement('button')
    button.textContent = text
    button.title = title
    button.className = 'action-button'
    button.addEventListener('click', onClick)
    return button
  }

  /**
   * Create add tag input
   */
  createAddTagInput (pin) {
    const container = this.document.createElement('div')
    container.className = 'add-tag-container'

    const input = this.document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Add new tag...'
    input.className = 'add-tag-input'

    const button = this.document.createElement('button')
    button.textContent = '+'
    button.className = 'add-tag-button'
    button.title = 'Add Tag'

    const addTag = () => {
      const tag = input.value.trim()
      if (tag) {
        this.handleAddTag(pin, tag)
        input.value = ''
      }
    }

    button.addEventListener('click', addTag)
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addTag()
      }
    })

    container.appendChild(input)
    container.appendChild(button)
    return container
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle adding a tag to current site only
   */
  async handleAddTag (pin, tag) {
    try {
      this.logger.debug('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Adding tag to current site:', tag)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] [IMPL-RUNTIME_VALIDATION] - saveTag payload must match message-schemas (url + value)
      await this.messageService.sendMessage('saveTag', {
        url: pin.url,
        value: tag
      })

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Track tag addition for current site only
      try {
        await this.messageService.sendMessage('addTagToRecent', {
          tagName: tag,
          currentSiteUrl: pin.url
        })
      } catch (error) {
        this.logger.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to track tag addition:', error)
        // Don't fail the entire operation if tag tracking fails
      }

      setTimeout(() => this.refreshHover(), 500)
    } catch (error) {
      this.logger.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error adding tag:', error)
    }
  }

  /**
   * Handle deleting a tag
   */
  async handleDeleteTag (pin, tag) {
    try {
      this.logger.debug('Deleting tag:', tag)

      // [IMPL-RUNTIME_VALIDATION] deleteTag payload must match message-schemas (url + value)
      await this.messageService.sendMessage('deleteTag', {
        url: pin.url,
        value: tag
      })

      setTimeout(() => this.refreshHover(), 500)
    } catch (error) {
      this.logger.error('Error deleting tag:', error)
    }
  }

  /**
   * Handle toggling privacy
   */
  async handleTogglePrivacy (pin) {
    try {
      const newShared = pin.shared === 'no' ? 'yes' : 'no'
      this.logger.debug('Toggling privacy to:', newShared)

      await this.messageService.sendMessage('updatePin', {
        pin: { ...pin, shared: newShared }
      })

      setTimeout(() => this.refreshHover(), 500)
    } catch (error) {
      this.logger.error('Error toggling privacy:', error)
    }
  }

  /**
   * Handle toggling read later status
   */
  async handleToggleReadLater (pin) {
    try {
      const newToRead = pin.toread === 'yes' ? 'no' : 'yes'
      this.logger.debug('Toggling read later to:', newToRead)

      await this.messageService.sendMessage('updatePin', {
        pin: { ...pin, toread: newToRead }
      })

      setTimeout(() => this.refreshHover(), 500)
    } catch (error) {
      this.logger.error('Error toggling read later:', error)
    }
  }

  /**
   * Handle deleting a pin
   */
  async handleDeletePin (pin) {
    try {
      if (!confirm('Are you sure you want to delete this bookmark?')) {
        return
      }

      this.logger.debug('Deleting pin:', pin.url)

      await this.messageService.sendMessage('deletePin', {
        url: pin.url
      })

      this.hideHover()
    } catch (error) {
      this.logger.error('Error deleting pin:', error)
    }
  }

  /**
   * Handle blocking URL
   */
  async handleBlockUrl (url) {
    try {
      this.logger.debug('Blocking URL:', url)

      await this.messageService.sendMessage('blockUrl', {
        url
      })

      this.hideHover()
    } catch (error) {
      this.logger.error('Error blocking URL:', error)
    }
  }

  /**
   * Set auto-close timer
   */
  setAutoCloseTimer (timeout) {
    this.clearAutoCloseTimer()
    this.autoCloseTimer = setTimeout(() => {
      this.hideHover()
    }, timeout)
  }

  /**
   * Clear auto-close timer
   */
  clearAutoCloseTimer () {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }
  }

  /**
   * Update configuration
   */
  updateConfig (newConfig) {
    this.config = newConfig
    this.tagRenderer.updateConfig(newConfig)
  }

  /**
   * Cleanup resources
   */
  destroy () {
    this.clearAutoCloseTimer()
    this.hideHover()
  }
}

export { HoverSystem }
