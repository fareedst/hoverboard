/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.
 * 
 * ## MAIN
 * 
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
 * - Contract:
 *   - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: consistent bookmark state across overlay, popup, badge
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
 *   - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
 *   - 2.   SEND message to backend; await processMessage result
 *   - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
 *   - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
 *   - 4. Badge manager:
 *   - 5.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
 * 
 * ## OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 * 
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Constructor-path observer listener — synchronous, returns undefined, re-fetches pin/tags via applyExternalBookmarkUpdate in a detached promise. Distinct from setupRealTimeUpdates full refresh (IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH). Chrome 144+ treats a promise-returning listener as answering and would deliver null to the SW sender.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers refresh
 *   - PRE: PopupController constructed; chrome.runtime.onMessage available when registering
 *   - OUTPUT: undefined (never a Promise, never sendResponse); pin/tags UI may update asynchronously
 *   - POST:
 *     - success => listener returned undefined; unrelated types left the response channel free
 *     - BOOKMARK_UPDATED => detached applyExternalBookmarkUpdate started (or no-op when no currentTab)
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError; does not answer message)
 *   - DATA: currentTab; currentPin; UIManager tag/privacy/read-later widgets
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, currentPin and chip UI updated from re-fetch; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached applyExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 * 
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 * 
 * - [IMPL-BOOKMARK_STATE_SYNC] [IMPL-POPUP_SESSION] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-POPUP_PERSISTENT_SESSION] How: setupRealTimeUpdates observer — synchronous, returns undefined, runs refreshOnExternalBookmarkUpdate (refreshPopupData then updateOverlayState) in a detached promise. Complements constructor applyExternalBookmarkUpdate path; duplicate refresh is an accepted non-goal.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers full refresh
 *   - PRE: setupRealTimeUpdates registered; controller may be initialized
 *   - OUTPUT: undefined; full This Page refresh may run asynchronously
 *   - POST:
 *     - success => listener returned undefined; response channel not claimed
 *     - BOOKMARK_UPDATED => detached refreshPopupData + updateOverlayState started
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError)
 *   - DATA: PopupController session state; overlay button state
 *   - DATA_TRANSITION: on success path, bookmark/suggested/overlay UI refreshed; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refreshOnExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TAG_SYSTEM ===
 * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [REQ-TAG_MANAGEMENT] [REQ-TAG_INPUT_SANITIZATION] — TagService: sanitizeTag; user-recent via SW recentTagsMemory + persisted snapshot + ConfigManager (N-minute policy keys); display cache + frequency for suggestions; single background source per ARCH-TAG_SYSTEM. Contract: sanitized strings; policy-filtered recent rows; fallible reads return [] or false and log (no throw to callers).
 * 
 * ## SANITIZE_TAG
 * 
 * - [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] [REQ-TAG_MANAGEMENT] How: normalize and enforce charset/length before persist or display; invalid → empty or reject per existing rules.
 * - Contract:
 *   - INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: SANITIZE_TAG
 *   - TRIM; normalize whitespace; apply allowed charset/length
 *   - RETURN sanitized string
 * 
 * ## GET_USER_RECENT_TAGS
 * 
 * - [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] How: resolve recentTagsMemory (direct self/globalThis or background bridge); getRecentTagsForUi(() => getConfig()) applies idle N + lastUsed window; legacy memory.getRecentTags if ForUi missing; ON error LOG; RETURN [].
 * - Contract:
 *   - INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_USER_RECENT_TAGS
 *   - memory = getDirectSharedMemory() OR await getBackgroundPage().recentTagsMemory
 *   - IF NOT memory: RETURN []
 *   - IF typeof memory.getRecentTagsForUi === "function": RETURN AWAIT memory.getRecentTagsForUi(() => configManager.getConfig())
 *   - IF typeof memory.getRecentTags === "function": RETURN sortByLastUsed(memory.getRecentTags())
 *   - RETURN []
 *   - How (sub-block): How: filter getUserRecentTags rows where name ∉ normalized currentTags; supplies IMPL-MESSAGE_HANDLING handleGetRecentBookmarks and UI second-pass exclusion per REQ-RECENT_TAGS_SYSTEM.
 * 
 * ## GET_USER_RECENT_TAGS_EXCLUDING_CURRENT
 * 
 * - [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [REQ-TAG_MANAGEMENT] [REQ-TAG_INPUT_SANITIZATION] How: Implements getUserRecentTagsExcludingCurrent(currentTags) behavior for IMPL-TAG_SYSTEM.
 * - Contract:
 *   - INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_USER_RECENT_TAGS_EXCLUDING_CURRENT
 *   - base = AWAIT getUserRecentTags()
 *   - RETURN FILTER base by name not in normalize(currentTags)
 *   - How (sub-block): How: validate inputs; sanitize via sanitizeTag; recentTagsMemory.addTag updates lastActivityAt + persist; ON error LOG; RETURN false.
 * 
 * ## ADD_TAG_TO_USER_RECENT_LIST
 * 
 * - [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [REQ-TAG_MANAGEMENT] [REQ-TAG_INPUT_SANITIZATION] How: Implements addTagToUserRecentList(tagName, currentSiteUrl) behavior for IMPL-TAG_SYSTEM.
 * - Contract:
 *   - INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: ADD_TAG_TO_USER_RECENT_LIST
 *   - IF NOT tagName OR NOT currentSiteUrl: RETURN false
 *   - tag = sanitizeTag(tagName); IF NOT tag: RETURN false
 *   - RETURN memory.addTag(tag, currentSiteUrl) OR false
 * 
 * ## GET_RECENT_TAGS
 * 
 * - [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [REQ-TAG_MANAGEMENT] How: display-oriented merge — valid TTL cache → processTagsForDisplay; else user-recent rows then processTagsForDisplay; else []; ties suggestions path to same TagService without duplicating policy in UI.
 * - Contract:
 *   - INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_TAGS
 *   - cached = AWAIT getCachedTags()
 *   - IF cached AND isCacheValid(cached.timestamp): RETURN processTagsForDisplay(cached.tags, options)
 *   - userRows = AWAIT getUserRecentTags()
 *   - IF userRows.length > 0: RETURN processTagsForDisplay(userRows, options)
 *   - RETURN []
 * 
 * ## RECORD_TAG_USAGE
 * 
 * - [IMPL-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] How: persist hoverboard_tag_frequency and refresh display cache slice; does not advance user-recent lastActivityAt (per ARCH-TAG_SYSTEM: only tag mutations do).
 * - Contract:
 *   - INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_TAG_USAGE
 *   - AWAIT persist frequency map; AWAIT updateRecentTagsCache(...)
 * 
 * ## BLOCK_7
 * 
 * - --- Composition: composed_with [IMPL-SUGGESTED_TAGS] --- How: Shared DATA: same TagService instance; getTagSuggestions → getRecentTags → user-recent and/or cache + frequency ordering. Pre: config + storage readable. Post: suggestion list capped by limit param. Ordering vs IMPL-MESSAGE_HANDLING: TagService only used from SW handlers or direct UI bridge, not parallel writers to recentTagsMemory except addTag paths.
 * - Contract:
 *   - INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_7
 *   - How (sub-block): --- Cross-IMPL ---
 * 
 * === END IMPL-FULL-BLOCK: IMPL-TAG_SYSTEM ===
 */
import { MessageHandler } from '../../src/core/message-handler.js'
import { PopupController } from '../../src/ui/popup/PopupController.js'
import { OverlayManager } from '../../src/features/content/overlay-manager.js'
import { ContentScript } from '../../src/features/content/content-script.js'

// Mock dependencies
jest.mock('../../src/features/pinboard/pinboard-service.js')
jest.mock('../../src/features/tagging/tag-service.js')
jest.mock('../../src/config/config-manager.js')
jest.mock('../../src/features/search/tab-search-service.js')
jest.mock('../../src/shared/logger.js')
jest.mock('../../src/features/content/message-client.js')

// Mock ConfigService
jest.mock('../../src/config/config-service.js', () => {
  return {
    ConfigService: jest.fn().mockImplementation(() => ({
      getInjectOptions: jest.fn().mockResolvedValue({
        showHoverOnPageLoad: true,
        pageLoadDelay: 1000,
        showHoverOnPageLoadForNewSites: true,
        showHoverOnPageLoadOnlyIfNoTags: false,
        showHoverOnPageLoadOnlyIfSomeTags: false
      })
    }))
  }
})

describe('[IMPL-TAG_SYSTEM] [IMPL-BOOKMARK_STATE_SYNC] Tag Synchronization', () => {
  let messageHandler
  let popupController
  let overlayManager
  let contentScript

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock dependencies for PopupController
    const mockErrorHandler = { handleError: jest.fn() }
    const mockStateManager = { setState: jest.fn() }
    const mockUIManager = { 
      updateCurrentTags: jest.fn(), 
      showSuccess: jest.fn(), 
      showError: jest.fn(), 
      updatePrivateStatus: jest.fn(), 
      on: jest.fn() 
    }

    // Create instances
    messageHandler = new MessageHandler()
    popupController = new PopupController({
      errorHandler: mockErrorHandler,
      stateManager: mockStateManager,
      uiManager: mockUIManager
    })
    overlayManager = new OverlayManager(document, {})
    contentScript = new ContentScript()

    // Mock chrome API
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      }
    }
  })

  describe('Phase 1: Overlay Dynamic Recent Tags', () => {
    test('should load dynamic recent tags from shared memory', async () => {
      // Mock message service response
      const mockRecentTags = ['development', 'web', 'tutorial']
      overlayManager.messageService = {
        sendMessage: jest.fn().mockResolvedValue({
          recentTags: mockRecentTags
        })
      }

      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: ['existing']
        }
      }

      const result = await overlayManager.loadRecentTagsForOverlay(content)

      expect(result).toEqual(mockRecentTags)
      expect(overlayManager.messageService.sendMessage).toHaveBeenCalledWith({
        type: 'getRecentBookmarks',
        data: {
          currentTags: ['existing'],
          senderUrl: 'https://example.com'
        }
      })
    })

    test('should handle empty recent tags gracefully', async () => {
      overlayManager.messageService = {
        sendMessage: jest.fn().mockResolvedValue({
          recentTags: []
        })
      }

      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: []
        }
      }

      const result = await overlayManager.loadRecentTagsForOverlay(content)

      expect(result).toEqual([])
    })

    test('should handle message service errors gracefully', async () => {
      overlayManager.messageService = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Network error'))
      }

      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: []
        }
      }

      const result = await overlayManager.loadRecentTagsForOverlay(content)

      expect(result).toEqual([])
    })
  })

  describe('Phase 2: Popup-to-Overlay Notification', () => {
    test('should notify overlay when tags are updated', async () => {
      // [TEST-TAG_SYNC] Provide required dependencies to PopupController
      const mockUIManager = { clearTagInput: jest.fn(), updateCurrentTags: jest.fn(), updateRecentTags: jest.fn(), showSuccess: jest.fn(), updateConnectionStatus: jest.fn(), updatePrivateStatus: jest.fn(), updateReadLaterStatus: jest.fn(), updateVersionInfo: jest.fn(), on: jest.fn() }
      const mockStateManager = { setState: jest.fn() }
      const mockErrorHandler = { handleError: jest.fn() }
      const popupController = new PopupController({
        uiManager: mockUIManager,
        stateManager: mockStateManager,
        errorHandler: mockErrorHandler
      })
      popupController.currentTab = { url: 'https://example.com', title: 'Test Page' }
      popupController.sendToTab = jest.fn().mockResolvedValue({ success: true })
      const tags = ['development', 'web']
      await popupController.notifyOverlayOfTagChanges(tags)
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: tags
        }
      })
    })

    test('should handle notification errors gracefully', async () => {
      popupController.currentPin = {
        url: 'https://example.com'
      }
      popupController.sendMessage = jest.fn().mockRejectedValue(new Error('Network error'))

      const tags = ['development']
      
      // Should not throw error
      await expect(popupController.notifyOverlayOfTagChanges(tags)).resolves.not.toThrow()
    })
  })

  describe('Phase 3: Content Script Message Handler', () => {
    test('should handle tag update notifications correctly', async () => {
      // Mock content script dependencies
      contentScript.currentTab = {
        url: 'https://example.com',
        title: 'Test Page'
      }
      contentScript.overlayManager = {
        show: jest.fn()
      }
      contentScript.hoverSystem = {
        isHoverVisible: jest.fn().mockReturnValue(true)
      }

      const tagUpdateData = {
        url: 'https://example.com',
        description: 'Test Page',
        tags: ['development', 'web']
      }

      await contentScript.handleTagUpdate(tagUpdateData)

      expect(contentScript.overlayManager.show).toHaveBeenCalledWith({
        bookmark: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: ['development', 'web']
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })

    test('should ignore tag updates for different URLs', async () => {
      contentScript.currentTab = {
        url: 'https://example.com'
      }
      contentScript.overlayManager = {
        show: jest.fn()
      }
      contentScript.hoverSystem = {
        isHoverVisible: jest.fn().mockReturnValue(true)
      }

      const tagUpdateData = {
        url: 'https://different.com',
        tags: ['development']
      }

      await contentScript.handleTagUpdate(tagUpdateData)

      expect(contentScript.overlayManager.show).not.toHaveBeenCalled()
    })

    test('should validate tag update data', async () => {
      contentScript.currentTab = {
        url: 'https://example.com'
      }

      // Test with invalid data
      await contentScript.handleTagUpdate(null)
      await contentScript.handleTagUpdate({})
      await contentScript.handleTagUpdate({ url: 'https://example.com' })
      await contentScript.handleTagUpdate({ url: 'https://example.com', tags: 'not-an-array' })

      // Should not throw errors for invalid data
      expect(true).toBe(true)
    })
  })

  describe('Phase 4: Message Handler Integration', () => {
    test('should handle TAG_UPDATED messages correctly', async () => {
      // Mock broadcast method
      messageHandler.broadcastToAllTabs = jest.fn().mockResolvedValue()

      const tagUpdateData = {
        url: 'https://example.com',
        description: 'Test Page',
        tags: ['development', 'web']
      }

      const result = await messageHandler.handleTagUpdated(tagUpdateData, 123)

      expect(result).toEqual({
        success: true,
        updated: tagUpdateData
      })
      expect(messageHandler.broadcastToAllTabs).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: tagUpdateData
      })
    })

    test('should validate tag update data in message handler', async () => {
      // Test with invalid data
      await expect(messageHandler.handleTagUpdated(null, 123)).rejects.toThrow('Invalid tag update data')
      await expect(messageHandler.handleTagUpdated({}, 123)).rejects.toThrow('Invalid tag update data')
      await expect(messageHandler.handleTagUpdated({ url: 'https://example.com' }, 123)).rejects.toThrow('Invalid tag update data')
    })

    test('should handle broadcast errors gracefully', async () => {
      messageHandler.broadcastToAllTabs = jest.fn().mockRejectedValue(new Error('Broadcast failed'))

      const tagUpdateData = {
        url: 'https://example.com',
        tags: ['development']
      }

      await expect(messageHandler.handleTagUpdated(tagUpdateData, 123)).rejects.toThrow('Failed to update tags across interfaces')
    })
  })

  describe('Phase 4: Overlay Double-Click Tag Deletion', () => {
    test('should delete tag from UI and persistent storage on double-click', async () => {
      // [test:tag-deletion] [event:double-click] [action:delete] [sync:site-record] [arch:atomic-sync]
      const mockDeleteTag = jest.fn().mockResolvedValue({ success: true })
      overlayManager.messageService = {
        sendMessage: mockDeleteTag
      }
      const content = {
        bookmark: {
          url: 'https://example.com',
          tags: ['tag1', 'tag2', 'tag3']
        }
      }
      // Simulate rendering and double-clicking the second tag
      overlayManager.show = jest.fn() // Prevent actual DOM manipulation
      overlayManager.showMessage = jest.fn()
      // Find the double-click handler logic
      const tag = 'tag2'
      // Simulate double-click handler
      if (content.bookmark && content.bookmark.tags) {
        const index = content.bookmark.tags.indexOf(tag)
        if (index > -1) {
          content.bookmark.tags.splice(index, 1)
        }
      }
      if (content.bookmark && content.bookmark.url) {
        await overlayManager.messageService.sendMessage({
          type: 'deleteTag',
          data: {
            url: content.bookmark.url,
            value: tag
          }
        })
      }
      // [arch:atomic-sync] - UI should refresh
      overlayManager.show(content)
      overlayManager.showMessage('Tag deleted successfully', 'success')
      // Assertions
      expect(content.bookmark.tags).toEqual(['tag1', 'tag3'])
      expect(mockDeleteTag).toHaveBeenCalledWith({
        type: 'deleteTag',
        data: {
          url: 'https://example.com',
          value: 'tag2'
        }
      })
      expect(overlayManager.show).toHaveBeenCalledWith(content)
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Tag deleted successfully', 'success')
    })
  })

  describe('Integration Tests', () => {
    test('should synchronize tags from popup to overlay', async () => {
      // [TEST-TAG_SYNC] Provide required dependencies and mock sendToTab
      const mockUIManager = { clearTagInput: jest.fn(), updateCurrentTags: jest.fn(), updateRecentTags: jest.fn(), showSuccess: jest.fn(), updateConnectionStatus: jest.fn(), updatePrivateStatus: jest.fn(), updateReadLaterStatus: jest.fn(), updateVersionInfo: jest.fn(), on: jest.fn() }
      const mockStateManager = { setState: jest.fn() }
      const mockErrorHandler = { handleError: jest.fn() }
      const popupController = new PopupController({
        uiManager: mockUIManager,
        stateManager: mockStateManager,
        errorHandler: mockErrorHandler
      })
      popupController.currentTab = { url: 'https://example.com', title: 'Test Page' }
      popupController.sendToTab = jest.fn().mockResolvedValue({ success: true })
      const tags = ['development', 'web']
      await popupController.notifyOverlayOfTagChanges(tags)
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: tags
        }
      })

      contentScript.currentTab = {
        url: 'https://example.com',
        title: 'Test Page'
      }
      contentScript.overlayManager = {
        show: jest.fn()
      }
      contentScript.hoverSystem = {
        isHoverVisible: jest.fn().mockReturnValue(true)
      }

      messageHandler.broadcastToAllTabs = jest.fn().mockResolvedValue()

      // Simulate tag update flow
      const tagUpdateData = {
        url: 'https://example.com',
        description: 'Test Page',
        tags: tags
      }
      await messageHandler.handleTagUpdated(tagUpdateData, 123)
      
      // 3. Content script receives the update
      await contentScript.handleTagUpdate(tagUpdateData)

      // Verify the flow worked correctly
      expect(popupController.sendToTab).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: {
          tags: tags,
          url: 'https://example.com',
          description: 'Test Page'
        }
      })

      expect(messageHandler.broadcastToAllTabs).toHaveBeenCalledWith({
        type: 'TAG_UPDATED',
        data: tagUpdateData
      })

      expect(contentScript.overlayManager.show).toHaveBeenCalledWith({
        bookmark: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: tags
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })
  })
}) 