// MV3-001: Service worker implementation for Manifest V3 migration
/**
 * Hoverboard Extension - Service Worker (Manifest V3)
 * Main background service for handling extension events and API communication
 */

// MV3-001: Modern ES6 module imports for V3 architecture
import { MessageHandler, MESSAGE_TYPES } from './message-handler.js'
import { PinboardService } from '../features/pinboard/pinboard-service.js'
import { LocalBookmarkService } from '../features/storage/local-bookmark-service.js'
import { SyncBookmarkService } from '../features/storage/sync-bookmark-service.js'
import { FileBookmarkService } from '../features/storage/file-bookmark-service.js'
import { InMemoryFileBookmarkAdapter } from '../features/storage/file-bookmark-storage-adapter.js'
import { MessageFileBookmarkAdapter, ensureOffscreenDocument } from '../features/storage/message-file-bookmark-adapter.js'
import { NativeHostFileBookmarkAdapter } from '../features/storage/native-host-file-bookmark-adapter.js'
import { StorageIndex } from '../features/storage/storage-index.js'
import { BookmarkRouter } from '../features/storage/bookmark-router.js'
import { normalizeBookmarkForDisplay } from '../features/storage/url-tags-manager.js'
import { ConfigManager } from '../config/config-manager.js'
import { BadgeManager } from './badge-manager.js'
// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser } from '../shared/safari-shim.js' // [SAFARI-EXT-SHIM-001]
// [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] Optional message log for testing/debugging
import * as uiInspector from '../shared/ui-inspector.js'

/**
 * [IMMUTABLE-REQ-TAG-003] - Recent Tags Memory Manager
 * Manages shared memory for user-driven recent tags across extension windows
 */
class RecentTagsMemoryManager {
  constructor () {
    // [IMMUTABLE-REQ-TAG-003] - Shared memory for recent tags
    this.recentTags = []
    this.maxListSize = 50 // Configurable maximum list size
    this.lastUpdated = null
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get all recent tags from shared memory
   * @returns {Array} Array of recent tag objects
   */
  getRecentTags () {
    return [...this.recentTags] // Return copy to prevent external modification
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Add tag to recent list (current site only)
   * @param {string} tagName - Tag name to add
   * @param {string} currentSiteUrl - Current site URL for scope validation
   * @returns {boolean} Success status
   */
  addTag (tagName, currentSiteUrl) {
    try {
      if (!tagName || !currentSiteUrl) {
        console.error('[IMMUTABLE-REQ-TAG-003] Invalid parameters for addTag:', { tagName, currentSiteUrl })
        return false
      }

      const now = new Date()

      // Check if tag already exists in list
      const existingTagIndex = this.recentTags.findIndex(tag => tag.name === tagName)

      if (existingTagIndex >= 0) {
        // Update existing tag
        this.recentTags[existingTagIndex] = {
          ...this.recentTags[existingTagIndex],
          count: (this.recentTags[existingTagIndex].count || 0) + 1,
          lastUsed: now.toISOString()
        }
      } else {
        // Add new tag to list
        const newTag = {
          name: tagName,
          count: 1,
          lastUsed: now.toISOString(),
          addedFromSite: currentSiteUrl
        }
        this.recentTags.push(newTag)
      }

      // Sort by lastUsed timestamp (most recent first) and limit list size
      this.recentTags.sort((a, b) => {
        const dateA = new Date(a.lastUsed)
        const dateB = new Date(b.lastUsed)
        return dateB - dateA
      })

      // Limit list size
      if (this.recentTags.length > this.maxListSize) {
        this.recentTags = this.recentTags.slice(0, this.maxListSize)
      }

      this.lastUpdated = now.toISOString()

      console.log('[IMMUTABLE-REQ-TAG-003] Successfully added tag to shared memory:', { tagName, currentSiteUrl })
      return true
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-003] Error adding tag to shared memory:', error)
      return false
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Clear all recent tags (called on extension reload)
   */
  clearRecentTags () {
    this.recentTags = []
    this.lastUpdated = null
    console.log('[IMMUTABLE-REQ-TAG-003] Cleared recent tags from shared memory')
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get memory status for debugging
   * @returns {Object} Memory status information
   */
  getMemoryStatus () {
    return {
      tagCount: this.recentTags.length,
      maxListSize: this.maxListSize,
      lastUpdated: this.lastUpdated,
      tags: this.recentTags.map(tag => ({
        name: tag.name,
        count: tag.count,
        lastUsed: tag.lastUsed
      }))
    }
  }
}

// MV3-001: Main service worker class for V3 architecture
class HoverboardServiceWorker {
  constructor () {
    // MV3-001: Initialize core service components (default provider until async init)
    this.messageHandler = new MessageHandler()
    this.configManager = new ConfigManager()
    this.badgeManager = new BadgeManager()
    // [ARCH-LOCAL_STORAGE_PROVIDER] Active bookmark provider (set by initBookmarkProvider)
    this.bookmarkProvider = this.messageHandler.bookmarkProvider

    // [IMMUTABLE-REQ-TAG-003] - Initialize shared memory for recent tags
    this.recentTagsMemory = new RecentTagsMemoryManager()

    this._providerInitialized = false
    // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Cached normal windowId for sidePanel.open(). Implements open-from-popup by keeping a windowId so open() can be called synchronously in onMessage (user gesture requirement: no await before open).
    this._sidePanelWindowId = null

    // MV3-001: Set up V3 event listeners
    this.setupEventListeners()
    this._seedSidePanelWindowCache()
  }

  /**
   * [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] File adapter: path set → NativeHost; else picker → Message; else InMemory.
   * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Create providers, storage index, router; wire MessageHandler.
   */
  async initBookmarkProvider () {
    const tagService = this.messageHandler.tagService
    const pinboardProvider = new PinboardService(tagService)
    const localProvider = new LocalBookmarkService(tagService)
    const syncProvider = new SyncBookmarkService(tagService)

    let fileAdapter = new InMemoryFileBookmarkAdapter()
    const storage = await chrome.storage.local.get(['hoverboard_file_storage_configured', 'hoverboard_file_storage_path'])
    const pathSet = !!(storage.hoverboard_file_storage_path && String(storage.hoverboard_file_storage_path).trim())
    const fileStorageConfigured = !!storage.hoverboard_file_storage_configured

    if (pathSet) {
      fileAdapter = new NativeHostFileBookmarkAdapter()
      console.log('[SERVICE-WORKER] [IMPL-FILE_STORAGE_TYPED_PATH] File storage using native host path:', storage.hoverboard_file_storage_path)
    } else if (fileStorageConfigured && typeof chrome.offscreen !== 'undefined') {
      try {
        await ensureOffscreenDocument()
        fileAdapter = new MessageFileBookmarkAdapter()
      } catch (e) {
        console.warn('[SERVICE-WORKER] File storage offscreen not available, using in-memory:', e.message)
      }
    }
    const fileProvider = new FileBookmarkService(fileAdapter, tagService)

    const storageIndex = new StorageIndex()
    await storageIndex.ensureMigrationFromLocal(localProvider)

    const getDefaultStorageMode = () => this.configManager.getStorageMode()
    const router = new BookmarkRouter(
      pinboardProvider,
      localProvider,
      fileProvider,
      syncProvider,
      storageIndex,
      getDefaultStorageMode
    )

    tagService.pinboardService = router
    this.bookmarkProvider = router
    this.messageHandler.setBookmarkProvider(router)
    this._providerInitialized = true
    const mode = await this.configManager.getStorageMode()
    console.log('[SERVICE-WORKER] [ARCH-STORAGE_INDEX_AND_ROUTER] Bookmark router initialized; default mode:', mode)
  }

  // MV3-001: Set up all V3 service worker event listeners
  setupEventListeners () {
    // MV3-001: Handle extension installation and updates
    browser.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details)
    })

    // MV3-001: Handle messages from content scripts and popup
    // [SAFARI-EXT-IMPL-001] Use browser API for cross-browser compatibility
    /** @type {(message: { type: string, data?: Record<string, unknown> }, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void} */
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[SERVICE-WORKER] Received message:', message)

      // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Handle OPEN_SIDE_PANEL in listener with no await so sidePanel.open() runs in user-gesture context. Implements requirement "open tags tree from popup" by calling chrome.sidePanel.open({ windowId }) using cached _sidePanelWindowId (normal window); responds success or error.
      if (message.type === MESSAGE_TYPES.OPEN_SIDE_PANEL) {
        const windowId = this._sidePanelWindowId
        const openFn = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.sidePanel && globalThis.chrome.sidePanel.open
        if (windowId != null && openFn) {
          try {
            globalThis.chrome.sidePanel.open({ windowId })
            sendResponse({ success: true })
          } catch (e) {
            sendResponse({ success: false, error: e?.message ?? String(e) })
          }
        } else {
          sendResponse({ success: false, error: windowId == null ? 'No browser window available for side panel. Switch to a browser tab and try again.' : 'Side panel is not available.' })
        }
        return true
      }

      // Handle async response properly for Manifest V3
      this.handleMessage(message, sender)
        .then(response => {
          console.log('[SERVICE-WORKER] Sending response:', response)
          sendResponse(response)
        })
        .catch(error => {
          console.error('[SERVICE-WORKER] Message error:', error)
          sendResponse({ success: false, error: error.message })
        })

      // Return true to indicate we will respond asynchronously
      return true
    })

    // MV3-001: Handle tab activation for badge updates
    browser.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo)
    })

    // MV3-EXT-IMPL-001: Handle tab updates for badge management
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab)
    })

    // [IMMUTABLE-REQ-TAG-003] - Handle extension reload to clear shared memory
    browser.runtime.onStartup.addListener(() => {
      this.handleExtensionStartup()
    })

    // [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] Extension commands: open side panel, options, bookmarks index, import.
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    if (chromeApi?.commands?.onCommand?.addListener) {
      chromeApi.commands.onCommand.addListener((command) => this.handleCommand(command))
    }
  }

  /**
   * [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS]
   * Handle extension command (keyboard shortcut): open side panel, options, bookmarks index, or import page.
   */
  handleCommand (command) {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    const runtime = chromeApi?.runtime || browser.runtime
    const getURL = runtime.getURL ? (path) => runtime.getURL(path) : () => ''
    if (command === 'open-side-panel') {
      const windowId = this._sidePanelWindowId
      if (windowId != null && chromeApi?.sidePanel?.open) {
        chromeApi.sidePanel.open({ windowId })
      }
      return
    }
    if (command === 'open-options') {
      if (runtime.openOptionsPage) runtime.openOptionsPage()
      return
    }
    if (command === 'open-bookmarks-index') {
      const url = getURL('src/ui/bookmarks-table/bookmarks-table.html')
      if (url && (chromeApi?.tabs?.create || browser.tabs?.create)) {
        (chromeApi?.tabs ?? browser.tabs).create({ url })
      }
      return
    }
    if (command === 'open-import') {
      const url = getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html')
      if (url && (chromeApi?.tabs?.create || browser.tabs?.create)) {
        (chromeApi?.tabs ?? browser.tabs).create({ url })
      }
    }
  }

  /** [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Seed _sidePanelWindowId from active tab's normal window. Implements cache so OPEN_SIDE_PANEL handler can open panel without await (user gesture). */
  _seedSidePanelWindowCache () {
    const winApi = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.windows ? globalThis.chrome.windows : browser.windows
    const tabsApi = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.tabs ? globalThis.chrome.tabs : browser.tabs
    const setCache = (windowId) => { if (windowId != null) this._sidePanelWindowId = windowId }
    tabsApi.query({ active: true }).then((tabs) => {
      const tab = tabs && tabs[0]
      if (tab?.windowId != null && winApi.get) winApi.get(tab.windowId).then((w) => { if (w?.type === 'normal') setCache(w.id) }).catch(() => {})
    }).catch(() => {})
  }

  // [IMMUTABLE-REQ-TAG-003] - Handle extension startup (clears shared memory)
  async handleExtensionStartup () {
    console.log('[IMMUTABLE-REQ-TAG-003] Extension startup - clearing recent tags shared memory')
    this.recentTagsMemory.clearRecentTags()
  }

  // MV3-001: Handle extension installation and updates
  async handleInstall (details) {
    console.log('🚀 Hoverboard installed/updated:', details.reason)

    if (details.reason === 'install') {
      // MV3-001: Initialize default settings for first-time installation
      await this.configManager.initializeDefaults()

      // MV3-001: Set up context menus if needed
      this.setupContextMenus()
    }
  }

  async handleMessage (message, sender) {
    // [IMPL-UI_INSPECTOR] Enable inspector in SW from storage (no localStorage in SW)
    try {
      const prefs = await browser.storage.local.get('DEBUG_HOVERBOARD_UI')
      if (prefs.DEBUG_HOVERBOARD_UI) uiInspector.setEnabled(true)
    } catch (_) {}

    try {
      // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] OPEN_SIDE_PANEL is handled in onMessage listener only (synchronous open for user gesture); not processed here.

      // [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] Optional ping to native host for testing connectivity
      if (message.type === 'NATIVE_PING') {
        const pingResult = await this.pingNativeHost()
        const out = { success: true, data: pingResult }
        uiInspector.recordMessage(message.type, message.data, sender, out)
        return out
      }

      // [ARCH-LOCAL_STORAGE_PROVIDER] Lazy-init provider from config (storage mode)
      if (!this._providerInitialized) {
        await this.initBookmarkProvider()
      }

      // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode switch: re-init provider and respond (no processMessage)
      if (message.type === MESSAGE_TYPES.SWITCH_STORAGE_MODE) {
        await this.initBookmarkProvider()
        const out = { success: true, data: { switched: true } }
        uiInspector.recordMessage(message.type, message.data, sender, out)
        return out
      }

      // [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] DEV_COMMAND: only when debug flag set; getStorageSnapshot in SW.
      if (message.type === MESSAGE_TYPES.DEV_COMMAND) {
        let devEnabled = false
        try {
          const prefs = await browser.storage.local.get('DEBUG_HOVERBOARD_UI')
          devEnabled = !!prefs.DEBUG_HOVERBOARD_UI
        } catch (_) {}
        if (!devEnabled) {
          const out = { success: false, error: 'debug not enabled' }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
        if (message.data?.subcommand === 'getStorageSnapshot') {
          const local = await browser.storage.local.get(null)
          const sync = await browser.storage.sync.get(null).catch(() => ({}))
          const redact = (obj) => Object.keys(obj).filter((k) => !/token|password|secret|auth/i.test(k))
          const out = { success: true, data: { local: redact(local), sync: redact(sync) } }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
        if (message.data?.subcommand === 'getLastActions') {
          const n = message.data?.n ?? 20
          const out = { success: true, data: uiInspector.getLastActions(n) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
        if (message.data?.subcommand === 'getLastMessages') {
          const n = message.data?.n ?? 20
          const out = { success: true, data: uiInspector.getLastMessages(n) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
      }

      console.log('[SERVICE-WORKER] Processing message:', message.type)
      const response = await this.messageHandler.processMessage(message, sender)
      console.log('[SERVICE-WORKER] Message processed successfully:', response)

      // [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] After saveTag/deleteTag/saveBookmark success: resolve tab, updateBadgeForTab(tab).
      const badgeRefreshTypes = [MESSAGE_TYPES.SAVE_TAG, MESSAGE_TYPES.DELETE_TAG, MESSAGE_TYPES.SAVE_BOOKMARK]
      if (badgeRefreshTypes.includes(message.type)) {
        let tab = sender.tab
        if (!tab && message.type === MESSAGE_TYPES.SAVE_BOOKMARK) {
          const tabs = await browser.tabs.query({ active: true, currentWindow: true })
          if (tabs.length > 0) tab = tabs[0]
        }
        if (tab) await this.updateBadgeForTab(tab)
      }

      const out = { success: true, data: response }
      uiInspector.recordMessage(message.type, message.data, sender, out)
      return out
    } catch (error) {
      console.error('Service worker message error:', error)
      const out = { success: false, error: error.message }
      uiInspector.recordMessage(message?.type, message?.data, sender, out)
      return out
    }
  }

  /**
   * [REQ-NATIVE_HOST_WRAPPER] Ping native messaging host to verify connectivity.
   * @returns {Promise<{pong?: boolean, error?: string}>}
   */
  async pingNativeHost () {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendNativeMessage) {
      return { error: 'Native messaging not available' }
    }
    return new Promise((resolve) => {
      chrome.runtime.sendNativeMessage('com.hoverboard.native_host', { type: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message })
          return
        }
        resolve(response || { error: 'No response' })
      })
    })
  }

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Update _sidePanelWindowId when user activates a tab in a normal window. Implements cache maintenance so "open Tags tree" has a valid windowId.
  async handleTabActivated (activeInfo) {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId)
      if (tab?.windowId != null) {
        try {
          const win = await (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.windows ? globalThis.chrome.windows : browser.windows).get(tab.windowId)
          if (win?.type === 'normal' && win?.id != null) this._sidePanelWindowId = win.id
        } catch (_) {}
      }
      if (tab.url) {
        await this.updateBadgeForTab(tab)
      }
    } catch (error) {
      console.error('Tab activation error:', error)
    }
  }

  async handleTabUpdated (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      try {
        await this.updateBadgeForTab(tab)
      } catch (error) {
        console.error('Tab update error:', error)
      }
    }
  }

  async updateBadgeForTab (tab) {
    const config = await this.configManager.getConfig()
    if (!config.setIconOnLoad) return

    try {
      if (!this._providerInitialized) {
        await this.initBookmarkProvider()
      }
      const raw = await this.bookmarkProvider.getBookmarkForUrl(tab.url)
      // [IMPL-URL_TAGS_DISPLAY] Normalize so badge and popup use same display contract (tags array)
      const bookmark = normalizeBookmarkForDisplay(raw)
      if (!bookmark.url) bookmark.url = tab.url
      await this.badgeManager.updateBadge(tab.id, bookmark)
    } catch (error) {
      console.error('Badge update error:', error)
    }
  }

  /**
   * [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS]
   * Create context menu parent "Hoverboard" and four items; onClicked performs same four actions as handleCommand.
   */
  setupContextMenus () {
    const api = (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.contextMenus) || browser.contextMenus
    if (!api?.create || !api?.onClicked?.addListener) return
    api.removeAll(() => {
      api.create({ id: 'hoverboard-root', title: 'Hoverboard', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-side-panel', parentId: 'hoverboard-root', title: 'Open side panel', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-options', parentId: 'hoverboard-root', title: 'Open options', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-bookmarks-index', parentId: 'hoverboard-root', title: 'Open bookmarks index', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-import', parentId: 'hoverboard-root', title: 'Open browser bookmark import', contexts: ['all'] })
    })
    const self = this
    api.onClicked.addListener((info) => {
      const menuId = info?.menuItemId
      if (menuId === 'hoverboard-open-side-panel') {
        const windowId = self._sidePanelWindowId
        const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
        if (windowId != null && chromeApi?.sidePanel?.open) chromeApi.sidePanel.open({ windowId })
        return
      }
      if (menuId === 'hoverboard-open-options') {
        const runtime = (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.runtime) || browser.runtime
        if (runtime?.openOptionsPage) runtime.openOptionsPage()
        return
      }
      if (menuId === 'hoverboard-open-bookmarks-index' || menuId === 'hoverboard-open-import') {
        const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
        const runtime = chromeApi?.runtime || browser.runtime
        const getURL = runtime?.getURL ? (path) => runtime.getURL(path) : () => ''
        const path = menuId === 'hoverboard-open-bookmarks-index' ? 'src/ui/bookmarks-table/bookmarks-table.html' : 'src/ui/browser-bookmark-import/browser-bookmark-import.html'
        const url = getURL(path)
        if (url && (chromeApi?.tabs?.create || browser.tabs?.create)) (chromeApi?.tabs ?? browser.tabs).create({ url })
      }
    })
  }
}

// MV3-001: Initialize the service worker for V3 architecture
const serviceWorker = new HoverboardServiceWorker()

// [IMMUTABLE-REQ-TAG-003] - Make shared memory accessible globally
if (serviceWorker.recentTagsMemory) {
  self.recentTagsMemory = serviceWorker.recentTagsMemory
  globalThis.recentTagsMemory = serviceWorker.recentTagsMemory
}

// MV3-001: Export for testing and external access
export { HoverboardServiceWorker }

// MV3-001: Global service worker ready indicator
console.log('✅ Hoverboard Service Worker (V3) loaded and ready!')
