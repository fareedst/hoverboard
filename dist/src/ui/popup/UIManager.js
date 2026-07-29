/**
 * UIManager - Handles all UI interactions and DOM manipulation
 * [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Optional container:
 * when set, cacheElements resolves elements via container.querySelector('[data-popup-ref="id"]') for panel context.
 */

import {
  currentTagDisplayLabel,
  isEmptyOrWhitespaceOnlyTag,
  isTagCaseFoldingMode,
  tagChipDisplayAndAddValue
} from '../../shared/tag-case-folding.js'
import {
  isTagChipSortMode,
  lookupBookmarkFrequency,
  sortTagChipRows
} from '../../shared/tag-chip-sort.js'

export class UIManager {
  constructor ({ errorHandler, stateManager, config = {}, container = null } = {}) {
    this.errorHandler = errorHandler
    this.stateManager = stateManager
    this.config = config
    this.eventHandlers = new Map()
    // [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Scoped root for side panel Bookmark tab
    this.container = container || null

    // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] This Page tag chip case folding (original | lower | upper); default first session load.
    /** @type {import('../../shared/tag-case-folding.js').TagCaseFoldingMode} */
    this.tagCaseFoldingMode = 'original'
    // [REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] Side panel only when tagSortToggle present; default alphabetical.
    /** @type {import('../../shared/tag-chip-sort.js').TagChipSortMode} */
    this.tagSortMode = 'alphabetical'
    /** @type {Record<string, number>} hoverboard_tag_frequency copy for chip ordering */
    this.tagFrequencyMap = {}
    /** @type {boolean} */
    this._tagSortUiEnabled = false
    /** @type {{ current: string[], recent: string[], suggested: Array<{ tag: string, relevance: number, inPageFrequency: number }> }} */
    this._tagChipSourceCache = { current: [], recent: [], suggested: [] }

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
   * Update section labels visibility based on configuration.
   * [IMPL-UIManager_SCOPED_ROOT] When container set, scope to container so only Bookmark panel labels are updated.
   */
  updateSectionLabelsVisibility (showLabels) {
    const root = this.container || document
    const sectionTitles = root.querySelectorAll('.section-title')
    sectionTitles.forEach(title => {
      if (showLabels) {
        title.style.display = ''
      } else {
        title.style.display = 'none'
      }
    })
  }

  /**
   * Cache frequently used DOM elements.
   * [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] When this.container is set,
   * resolve each element via container.querySelector('[data-popup-ref="key"]'); otherwise document.getElementById(key).
   */
  cacheElements () {
    const root = this.container || document
    const get = (key) => {
      if (this.container) {
        return this.container.querySelector(`[data-popup-ref="${key}"]`)
      }
      return document.getElementById(key)
    }
    this.elements = {
      // Container elements
      mainInterface: get('mainInterface'),
      loadingState: get('loadingState'),
      errorState: get('errorState'),
      errorMessage: get('errorMessage'),
      retryBtn: get('retryBtn'),

      // Status elements
      bookmarkStatus: get('bookmarkStatus'),
      versionInfo: get('versionInfo'),

      // Action buttons
      showHoverBtn: get('showHoverBtn'),
      togglePrivateBtn: get('togglePrivateBtn'),
      toggleReadBtn: get('toggleReadBtn'),
      deleteBtn: get('deleteBtn'),
      reloadBtn: get('reloadBtn'),
      optionsBtn: get('optionsBtn'),
      bookmarksIndexBtn: get('bookmarksIndexBtn'),
      openTagsTreeBtn: get('openTagsTreeBtn'),
      browserBookmarkImportBtn: get('browserBookmarkImportBtn'),
      settingsBtn: get('settingsBtn'),

      // Input elements
      newTagInput: get('newTagInput'),
      addTagBtn: get('addTagBtn'),
      tagWithAiBtn: get('tagWithAiBtn'),
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Popup Test API key button and status span.
      testAiApiBtn: get('testAiApiBtn'),
      popupAiTestStatus: get('popupAiTestStatus'),
      searchInput: get('searchInput'),
      searchBtn: get('searchBtn'),
      searchSuggestions: get('searchSuggestions'),

      // Tag display
      currentTagsContainer: get('currentTagsContainer'),
      recentTagsContainer: get('recentTagsContainer'),
      suggestedTagsContainer: get('suggestedTagsContainer'),
      // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Side panel This Page only; absent in standalone popup.html
      tagCaseFoldingToggle: get('tagCaseFoldingToggle'),
      // [REQ-THIS_PAGE_TAG_SORT] Side panel This Page only
      tagSortToggle: get('tagSortToggle'),

      // Status displays
      privateIcon: get('privateIcon'),
      privateStatus: get('privateStatus'),
      readIcon: get('readIcon'),
      readStatus: get('readStatus'),

      // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Add checkbox element reference
      showHoverOnPageLoad: get('showHoverOnPageLoad'),

      // [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Storage backend select-one buttons (pinboard | file | local | sync)
      storageBackendButtons: get('storageBackendButtons'),

      // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI] This Page inline usage section
      usageStatsSection: get('usageStatsSection'),
      usageStatsText: get('usageStatsText'),
      usageReferrerText: get('usageReferrerText')
    }
    this._tagSortUiEnabled = !!this.elements.tagSortToggle
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
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Emit refreshData event for manual refresh
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

    // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Tags tree button: emit openTagsTree so PopupController sends OPEN_SIDE_PANEL and SW opens side panel.
    this.elements.openTagsTreeBtn?.addEventListener('click', () => {
      this.emit('openTagsTree')
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

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced input handling with validation
    this.elements.addTagBtn?.addEventListener('click', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && this.isValidTag(tagText)) {
        this.emit('addTag', tagText)
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Clear input after successful addition
        this.elements.newTagInput.value = ''
      } else if (tagText && !this.isValidTag(tagText)) {
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Show validation error
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
          // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Clear input after successful addition
          this.elements.newTagInput.value = ''
        } else if (tagText && !this.isValidTag(tagText)) {
          // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Show validation error
          this.showError('Invalid tag format')
        }
      }
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Add input validation on blur
    this.elements.newTagInput?.addEventListener('blur', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && !this.isValidTag(tagText)) {
        this.showError('Invalid tag format')
      }
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Add input validation on input change
    this.elements.newTagInput?.addEventListener('input', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && !this.isValidTag(tagText)) {
        this.elements.newTagInput.classList.add('invalid')
      } else {
        this.elements.newTagInput.classList.remove('invalid')
      }
    })

    this.elements.searchBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      const searchText = this.elements.searchInput?.value
      if (searchText) {
        this.emit('search', searchText)
      }
    })

    this.elements.searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
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

    // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Add checkbox event listener
    this.elements.showHoverOnPageLoad?.addEventListener('change', () => {
      this.emit('showHoverOnPageLoadChange')
    })

    // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Tag case folding (Original / lower / UPPER); only when side-panel markup includes toggle
    const caseToggleRoot = this.elements.tagCaseFoldingToggle
    if (caseToggleRoot) {
      caseToggleRoot.querySelectorAll('[data-case-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = btn.getAttribute('data-case-mode')
          if (isTagCaseFoldingMode(m)) this.setTagCaseFoldingMode(m)
        })
      })
      this.syncTagCaseFoldingToggleDom()
    }

    // [REQ-THIS_PAGE_TAG_SORT] Tag sort (A–Z | frequency | relevance); side-panel markup only
    const sortToggleRoot = this.elements.tagSortToggle
    if (sortToggleRoot) {
      sortToggleRoot.querySelectorAll('[data-sort-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = btn.getAttribute('data-sort-mode')
          if (isTagChipSortMode(m)) this.setTagSortMode(m)
        })
      })
      this.syncTagSortToggleDom()
    }
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Session-only tag label casing for This Page tag chips.
   * @returns {import('../../shared/tag-case-folding.js').TagCaseFoldingMode}
   */
  getTagCaseFoldingMode () {
    return this.tagCaseFoldingMode
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Set casing mode and redraw cached tag chips (no refetch).
   * @param {string} mode
   */
  setTagCaseFoldingMode (mode) {
    if (!isTagCaseFoldingMode(mode)) return
    this.tagCaseFoldingMode = mode
    this.syncTagCaseFoldingToggleDom()
    this.redrawTagChipsFromCache()
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Update aria-pressed on segment buttons when present.
   */
  syncTagCaseFoldingToggleDom () {
    const root = this.elements.tagCaseFoldingToggle
    if (!root) return
    root.querySelectorAll('[data-case-mode]').forEach((btn) => {
      const m = btn.getAttribute('data-case-mode')
      const on = m === this.tagCaseFoldingMode
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Re-render Current / Recent / Suggested chips from last update* payload (mode change).
   * [REQ-THIS_PAGE_TAG_SORT] Suggested list re-painted from normalized cache (objects with relevance).
   */
  redrawTagChipsFromCache () {
    const { current, recent } = this._tagChipSourceCache
    this.updateCurrentTags([...current])
    this.updateRecentTags([...recent])
    this._paintSuggestedTags()
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] Bookmark usage counts from chrome.storage.local (hoverboard_tag_frequency).
   * @param {Record<string, number>|null|undefined} map
   */
  setTagFrequencyMapForSort (map) {
    this.tagFrequencyMap = map && typeof map === 'object' ? { ...map } : {}
    // Caller updates chip lists (updateCurrentTags / loadRecentTags) or calls redrawTagChipsFromCache after map changes.
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] When sort toggle absent (popup), preserve incoming list order from controller.
   * @returns {import('../../shared/tag-chip-sort.js').TagChipSortMode | null}
   */
  getEffectiveTagSortMode () {
    if (!this._tagSortUiEnabled) return null
    return this.tagSortMode
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] Set sort mode and redraw cached chips.
   * @param {string} mode
   */
  setTagSortMode (mode) {
    if (!isTagChipSortMode(mode)) return
    this.tagSortMode = mode
    this.syncTagSortToggleDom()
    this.redrawTagChipsFromCache()
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] aria-pressed on sort segment buttons.
   */
  syncTagSortToggleDom () {
    const root = this.elements.tagSortToggle
    if (!root) return
    root.querySelectorAll('[data-sort-mode]').forEach((btn) => {
      const m = btn.getAttribute('data-sort-mode')
      const on = m === this.tagSortMode
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }

  /**
   * @param {unknown[]} input
   * @returns {Array<{ tag: string, relevance: number, inPageFrequency: number }>}
   */
  _normalizeSuggestedList (input) {
    if (!Array.isArray(input)) return []
    const out = []
    for (const item of input) {
      if (typeof item === 'string') {
        if (!isEmptyOrWhitespaceOnlyTag(item)) {
          out.push({ tag: item.trim(), relevance: 0, inPageFrequency: 0 })
        }
        continue
      }
      if (item && typeof item === 'object' && typeof item.tag === 'string') {
        const t = item.tag.trim()
        if (isEmptyOrWhitespaceOnlyTag(t)) continue
        const relevance = typeof item.relevance === 'number' && !Number.isNaN(item.relevance) ? item.relevance : 0
        let inPageFrequency = 0
        if (typeof item.inPageFrequency === 'number' && !Number.isNaN(item.inPageFrequency)) {
          inPageFrequency = item.inPageFrequency
        } else if (typeof item.frequency === 'number' && !Number.isNaN(item.frequency)) {
          inPageFrequency = item.frequency
        }
        out.push({ tag: t, relevance, inPageFrequency })
      }
    }
    return out
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
   * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
   * Update This Page inline usage section: show when visitCount > 0 with stats and optional referrer line; hide otherwise.
   * @param {{ visitCount: number, lastVisitedAgoText: string } | null} usage - null or { visitCount, lastVisitedAgoText } (e.g. "2 hours ago")
   * @param {string} [topReferrerDisplay] - e.g. "example.com/docs" or ''
   */
  updateUsageSection (usage, topReferrerDisplay = '') {
    const section = this.elements.usageStatsSection
    const statsEl = this.elements.usageStatsText
    const referrerEl = this.elements.usageReferrerText
    if (!section) return
    const show = usage && usage.visitCount > 0
    section.classList.toggle('hidden', !show)
    if (show && statsEl) {
      const n = usage.visitCount
      const ago = usage.lastVisitedAgoText || ''
      statsEl.textContent = `Visited ${n} time${n !== 1 ? 's' : ''} — last ${ago}`
    }
    if (referrerEl) {
      const ref = (topReferrerDisplay || '').trim()
      referrerEl.textContent = ref ? `Referred from: ${ref}` : ''
      referrerEl.setAttribute('aria-hidden', ref ? 'false' : 'true')
    }
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
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Label casing from tagCaseFoldingMode; remove uses stored string.
   * [REQ-THIS_PAGE_TAG_SORT] When side-panel sort toggle present, order by selected mode within Current Tags only.
   */
  updateCurrentTags (tags) {
    if (!this.elements.currentTagsContainer) return

    // Clear existing tags
    this.elements.currentTagsContainer.innerHTML = ''

    // Create tag elements
    const tagsArray = Array.isArray(tags) ? tags : tags.split(' ').filter(tag => tag.length > 0)
    this._tagChipSourceCache.current = [...tagsArray]

    const visible = tagsArray.filter(tag => !isEmptyOrWhitespaceOnlyTag(tag))

    // If no tags, show empty state
    if (visible.length === 0) {
      this.elements.currentTagsContainer.innerHTML = '<div class="no-tags">No tags</div>'
      return
    }

    const mode = this.getEffectiveTagSortMode()
    /** @type {string[]} */
    let ordered = visible
    if (mode) {
      const rows = visible.map((tag, stableIndex) => ({
        canonical: String(tag),
        displayKey: tagChipDisplayAndAddValue(String(tag), this.tagCaseFoldingMode).display,
        stableIndex,
        bookmarkFreq: lookupBookmarkFrequency(this.tagFrequencyMap, tag),
        relevance: 0,
        inPageFreq: 0
      }))
      ordered = sortTagChipRows(rows, mode).map((r) => r.canonical)
    }

    ordered.forEach(tag => {
      const tagElement = this.createTagElement(tag)
      this.elements.currentTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Update recent tags display with user-driven behavior
   * [REQ-THIS_PAGE_TAG_SORT] Sort within Recent Tags when side-panel toggle present (bookmark frequency map).
   * @param {string[]|Array<{ name?: string }>} recentTags - Tag names or objects with name (from service)
   */
  updateRecentTags (recentTags) {
    if (!this.elements.recentTagsContainer) return

    // Clear existing recent tags
    this.elements.recentTagsContainer.innerHTML = ''

    const raw = Array.isArray(recentTags) ? recentTags : []
    const source = raw.map((t) => {
      if (typeof t === 'string') return t
      if (t && typeof t === 'object' && t.name != null) return String(t.name)
      return String(t)
    })
    this._tagChipSourceCache.recent = [...source]
    const visible = source.filter(tag => !isEmptyOrWhitespaceOnlyTag(tag))

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Show empty state for user-driven recent tags
    if (visible.length === 0) {
      this.elements.recentTagsContainer.innerHTML = '<div class="no-tags">No recent tags</div>'
      return
    }

    const mode = this.getEffectiveTagSortMode()
    /** @type {string[]} */
    let ordered = visible
    if (mode) {
      const rows = visible.map((tag, stableIndex) => ({
        canonical: String(tag),
        displayKey: tagChipDisplayAndAddValue(String(tag), this.tagCaseFoldingMode).display,
        stableIndex,
        bookmarkFreq: lookupBookmarkFrequency(this.tagFrequencyMap, tag),
        relevance: 0,
        inPageFreq: 0
      }))
      ordered = sortTagChipRows(rows, mode).map((r) => r.canonical)
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Create recent tag elements (clickable to add to current site only)
    ordered.forEach(tag => {
      const tagElement = this.createRecentTagElement(tag)
      this.elements.recentTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Create a recent tag element (clickable to add to current site only)
   * @param {string} tag - Tag name
   * @returns {HTMLElement} Tag element
   */
  createRecentTagElement (tag) {
    const { display, addValue } = tagChipDisplayAndAddValue(tag, this.tagCaseFoldingMode)
    const tagElement = document.createElement('div')
    tagElement.className = 'tag recent clickable'
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(display)}</span>
    `

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Add click handler to add this tag to current site only
    // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Persisted string matches displayed casing mode
    tagElement.addEventListener('click', () => {
      this.emit('addTag', addValue)
    })

    return tagElement
  }

  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
   * [REQ-THIS_PAGE_TAG_SORT] Accept legacy string[] or { tag, relevance, inPageFrequency } from page extract.
   * @param {unknown[]} suggestedTags
   */
  updateSuggestedTags (suggestedTags) {
    if (!this.elements.suggestedTagsContainer) return
    const normalized = this._normalizeSuggestedList(Array.isArray(suggestedTags) ? suggestedTags : [])
    this._tagChipSourceCache.suggested = normalized
    this._paintSuggestedTags()
  }

  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] Paint suggested chips from normalized cache (sort when toggle present).
   */
  _paintSuggestedTags () {
    if (!this.elements.suggestedTagsContainer) return

    this.elements.suggestedTagsContainer.innerHTML = ''

    // [IMPL-UIManager_SCOPED_ROOT] Resolve suggestedTags section from container when set
    const suggestedTagsSection = this.container ? this.container.querySelector('[data-popup-ref="suggestedTags"]') : document.getElementById('suggestedTags')

    const source = this._tagChipSourceCache.suggested
    const visible = source.filter(s => !isEmptyOrWhitespaceOnlyTag(s.tag))

    if (visible.length === 0) {
      if (suggestedTagsSection) {
        suggestedTagsSection.style.display = 'none'
      }
      return
    }

    if (suggestedTagsSection) {
      suggestedTagsSection.style.display = 'block'
    }

    const mode = this.getEffectiveTagSortMode()
    /** @type {typeof visible} */
    let ordered = visible
    if (mode) {
      const rows = visible.map((item, stableIndex) => ({
        canonical: item.tag,
        displayKey: tagChipDisplayAndAddValue(item.tag, this.tagCaseFoldingMode).display,
        stableIndex,
        bookmarkFreq: lookupBookmarkFrequency(this.tagFrequencyMap, item.tag),
        relevance: item.relevance ?? 0,
        inPageFreq: item.inPageFrequency ?? 0,
        _itemRef: item
      }))
      ordered = sortTagChipRows(rows, mode).map((r) => r._itemRef)
    }

    ordered.forEach((item) => {
      const tagElement = this.createRecentTagElement(item.tag)
      this.elements.suggestedTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * Create a tag element
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Display label follows tagCaseFoldingMode; removeTag uses stored `tag`.
   */
  createTagElement (tag) {
    const label = currentTagDisplayLabel(String(tag), this.tagCaseFoldingMode)
    const tagElement = document.createElement('div')
    tagElement.className = 'tag'
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(label)}</span>
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
   * [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX]
   * Show search no-match feedback: add class to search button, remove after 2s so border fades to default.
   */
  showSearchNoMatchFeedback () {
    if (!this.elements.searchBtn) return
    this.elements.searchBtn.classList.add('search-no-match')
    setTimeout(() => {
      this.elements.searchBtn?.classList.remove('search-no-match')
    }, 2000)
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
