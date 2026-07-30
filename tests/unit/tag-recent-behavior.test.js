/**
 * === IMPL-FULL-BLOCK: IMPL-RECENT_TAGS_POPUP_REFRESH ===
 * [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] — Contract: event-driven async; void; failures → empty chips + logged error (no unhandled reject from loadRecentTags).
 * 
 * ## SETUP_AUTO_REFRESH
 * 
 * - [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] How: Implements setupAutoRefresh() behavior for IMPL-RECENT_TAGS_POPUP_REFRESH.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SETUP_AUTO_REFRESH
 *   - REGISTER document.addEventListener("visibilitychange", handler)
 *   - How (sub-block): How: gate on visible + initialized + !isLoading; then await loadRecentTags (same tokens as top).
 * 
 * ## HANDLER
 * 
 * - [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] How: Implements handler() behavior for IMPL-RECENT_TAGS_POPUP_REFRESH.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLER
 *   - IF document.visibilityState !== "visible" THEN RETURN
 *   - IF NOT controller.initialized OR controller.isLoading THEN RETURN
 *   - AWAIT loadRecentTags()
 * 
 * ## LOAD_RECENT_TAGS
 * 
 * - [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-MESSAGE_HANDLING] [IMPL-TAG_SYSTEM] How: sendMessage routes to SW processMessage → handleGetRecentBookmarks → tagService.getUserRecentTagsExcludingCurrent; map to chip strings; defensive second filter vs currentTags; cross-IMPL dependency on message + TagService layers.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[])) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_RECENT_TAGS
 *   - currentTags = normalizeTags(controller.currentPin?.tags OR [])
 *   - TRY:
 *   - response = AWAIT sendMessage({ type: "getRecentBookmarks", data: { currentTags, senderUrl: currentTab.url } })
 *   - names = MAP response.recentTags to string names (string OR .name)
 *   - filtered = FILTER names where not in currentTags
 *   - uiManager.updateRecentTags(filtered)
 *   - CATCH:
 *   - LOG error; uiManager.updateRecentTags([])
 * 
 * ## BLOCK_4
 * 
 * - How: satisfies REQ-RECENT_TAGS_SYSTEM “refresh when UI shown” for popup; shared SW state with side panel path ([IMPL-SIDE_PANEL_TABS] loadRecentTags on focus) — either may refresh; ordering independent; both use same message contract.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_4
 *   - How (sub-block): --- Composition / cross-IMPL ---
 * 
 * === END IMPL-FULL-BLOCK: IMPL-RECENT_TAGS_POPUP_REFRESH ===
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
import { TagService } from '../../src/features/tagging/tag-service.js'
import { MessageHandler } from '../../src/core/message-handler.js'
import { ConfigManager } from '../../src/config/config-manager.js'

// Mock chrome.runtime.getBackgroundPage
global.chrome = {
  runtime: {
    getBackgroundPage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  }
}

describe('[REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH] [IMPL-TAG_SYSTEM] Recent Tags Behavior', () => {
  let tagService
  let messageHandler
  let configManager
  let mockBackgroundPage

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock background page with shared memory
    mockBackgroundPage = {
      recentTagsMemory: {
        getRecentTags: jest.fn(),
        getRecentTagsForUi: jest.fn(),
        addTag: jest.fn(),
        clearRecentTags: jest.fn(),
        getMemoryStatus: jest.fn()
      }
    }
    
    // Mock direct shared memory access (returns null to force fallback to background page)
    // Don't override global.self or global.globalThis as it causes Jest errors
    // Instead, mock the specific properties that the service will access
    
    chrome.runtime.getBackgroundPage.mockResolvedValue(mockBackgroundPage)
    
    // Initialize services
    configManager = new ConfigManager()
    tagService = new TagService()
    messageHandler = new MessageHandler()
  })

  describe('TagService - User-Driven Recent Tags', () => {
    test('should return empty array when no shared memory available', async () => {
      chrome.runtime.getBackgroundPage.mockResolvedValue(null)
      
      const result = await tagService.getUserRecentTags()
      
      expect(result).toEqual([])
    })

    test('should return empty array when shared memory has no tags', async () => {
      mockBackgroundPage.recentTagsMemory.getRecentTagsForUi.mockResolvedValue([])

      const result = await tagService.getUserRecentTags()

      expect(result).toEqual([])
    })

    test('should return sorted tags from shared memory', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 },
        { name: 'development', lastUsed: '2024-12-19T09:00:00Z', count: 2 }
      ]

      mockBackgroundPage.recentTagsMemory.getRecentTagsForUi.mockResolvedValue([
        mockTags[1],
        mockTags[0],
        mockTags[2]
      ])

      const result = await tagService.getUserRecentTags()

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('web') // Most recent first
      expect(result[1].name).toBe('javascript')
      expect(result[2].name).toBe('development')
    })

    test('should add tag to user recent list for current site only', async () => {
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      const result = await tagService.addTagToUserRecentList('javascript', 'https://example.com')
      
      expect(result).toBe(true)
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('javascript', 'https://example.com')
    })

    test('should fail to add invalid tag', async () => {
      const result = await tagService.addTagToUserRecentList('', 'https://example.com')
      
      expect(result).toBe(false)
      expect(mockBackgroundPage.recentTagsMemory.addTag).not.toHaveBeenCalled()
    })

    test('should filter out current site tags', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 },
        { name: 'development', lastUsed: '2024-12-19T09:00:00Z', count: 2 }
      ]

      mockBackgroundPage.recentTagsMemory.getRecentTagsForUi.mockResolvedValue([
        mockTags[1],
        mockTags[0],
        mockTags[2]
      ])

      const currentTags = ['javascript', 'react']
      const result = await tagService.getUserRecentTagsExcludingCurrent(currentTags)
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('web')
      expect(result[1].name).toBe('development')
      expect(result.find(tag => tag.name === 'javascript')).toBeUndefined()
    })

    test('should return empty array when all tags are filtered out', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 }
      ]

      mockBackgroundPage.recentTagsMemory.getRecentTagsForUi.mockResolvedValue([
        mockTags[1],
        mockTags[0]
      ])

      const currentTags = ['javascript', 'web']
      const result = await tagService.getUserRecentTagsExcludingCurrent(currentTags)
      
      expect(result).toEqual([])
    })
  })

  describe('MessageHandler - Recent Tags Integration', () => {
    test('should handle getRecentBookmarks with user-driven tags', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 }
      ]

      mockBackgroundPage.recentTagsMemory.getRecentTagsForUi.mockResolvedValue([
        mockTags[1],
        mockTags[0]
      ])

      const data = { currentTags: ['javascript'] }
      const result = await messageHandler.handleGetRecentBookmarks(data, 'https://example.com')
      
      expect(result.recentTags).toHaveLength(1)
      expect(result.recentTags[0].name).toBe('web')
    })

    test('should handle addTagToRecent message', async () => {
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      const data = {
        tagName: 'javascript',
        currentSiteUrl: 'https://example.com'
      }
      
      const result = await messageHandler.handleAddTagToRecent(data)
      
      expect(result.success).toBe(true)
    })

    test('should fail addTagToRecent with missing parameters', async () => {
      const data = { tagName: 'javascript' } // Missing currentSiteUrl
      
      const result = await messageHandler.handleAddTagToRecent(data)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('should handle getUserRecentTags message', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 }
      ]

      mockBackgroundPage.recentTagsMemory.getRecentTagsForUi.mockResolvedValue(mockTags)

      const result = await messageHandler.handleGetUserRecentTags({})
      
      expect(result.recentTags).toEqual(mockTags)
    })
  })

  describe('Configuration - Recent Tags Settings', () => {
    test('should have recent tags configuration defaults', async () => {
      const config = await configManager.getConfig()
      
      expect(config.recentTagsMaxListSize).toBe(50)
      expect(config.recentTagsMaxDisplayCount).toBe(10)
      expect(config.recentTagsSharedMemoryKey).toBe('hoverboard_recent_tags_shared')
      expect(config.recentTagsEnableUserDriven).toBe(true)
      expect(config.recentTagsClearOnReload).toBe(true)
      expect(config.recentTagsActivityWindowMinutes).toBe(15)
    })
  })

  describe('Tag Scope Validation', () => {
    test('should validate tag scope for current site only', async () => {
      const validUrl = 'https://example.com/page'
      const invalidUrl = ''
      
      // Mock the background page addTag method to return true for valid URL
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      const validResult = await tagService.addTagToUserRecentList('javascript', validUrl)
      const invalidResult = await tagService.addTagToUserRecentList('javascript', invalidUrl)
      
      expect(validResult).toBe(true)
      expect(invalidResult).toBe(false)
    })

    test('should sanitize tag names before adding', async () => {
      const sanitizedTag = tagService.sanitizeTag('  javascript  ')
      
      expect(sanitizedTag).toBe('javascript')
    })

    test('should reject invalid tag names', async () => {
      const invalidTags = ['', '   ', null, undefined]
      
      for (const tag of invalidTags) {
        const result = await tagService.addTagToUserRecentList(tag, 'https://example.com')
        expect(result).toBe(false)
      }
    })
  })

  describe('Shared Memory Management', () => {
    test('should handle shared memory errors gracefully', async () => {
      chrome.runtime.getBackgroundPage.mockRejectedValue(new Error('Background page not available'))
      
      const result = await tagService.getUserRecentTags()
      
      expect(result).toEqual([])
    })

    test('should handle background page without recentTagsMemory', async () => {
      chrome.runtime.getBackgroundPage.mockResolvedValue({})
      
      const result = await tagService.getUserRecentTags()
      
      expect(result).toEqual([])
    })
  })
}) 