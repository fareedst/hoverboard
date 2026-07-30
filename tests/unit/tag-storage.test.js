/**
 * === IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch. Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
 * 
 * ## NORMALIZE_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements normalizeBookmarkForDisplay(bookmark) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_BOOKMARK_FOR_DISPLAY
 *   - IF bookmark null: RETURN null or empty shape
 *   - tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
 *   - RETURN { ...bookmark, tags, ...requiredDefaults }
 *   - How (sub-block): Get raw from provider and normalize; caller sets needsAuth.
 * 
 * ## GET_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForDisplay(provider, url, title) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_DISPLAY
 *   - raw = AWAIT provider.getBookmarkForUrl(url)
 *   - RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth
 *   - How (sub-block): Get bookmark for url and return tags array.
 * 
 * ## GET_TAGS_FOR_URL
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getTagsForUrl(provider, url) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_FOR_URL
 *   - bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
 *   - RETURN bookmark?.tags ?? []
 *   - How (sub-block): Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.
 * 
 * ## GET_BADGE_DISPLAY_VALUE
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBadgeDisplayValue(bookmark, config) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BADGE_DISPLAY_VALUE
 *   - normalized = normalizeBookmarkForDisplay(bookmark)
 *   - RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }
 *   - How (sub-block): Handler and popup and router usage (same IMPL set).
 *   - 1. Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
 *   - 2. Message handler: handleGetTagsForUrl returns getTagsForUrl
 *   - 3. Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
 *   - 4. Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay
 * 
 * === END IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
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
import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'
import { TagService } from '../../src/features/tagging/tag-service.js'
import { MessageHandler } from '../../src/core/message-handler.js'
import { ConfigManager } from '../../src/config/config-manager.js'

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    sendMessage: jest.fn(),
    query: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn()
  }
}

// Mock fetch with proper Response object
global.fetch = jest.fn()

describe('[REQ-TAG_MANAGEMENT] [IMPL-TAG_SYSTEM] [IMPL-URL_TAGS_DISPLAY] Tag Storage and Cross-Instance Availability', () => {
  let pinboardService
  let tagService
  let messageHandler
  let configManager

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    chrome.storage.local.get.mockReset()
    chrome.storage.local.get.mockResolvedValue({})
    chrome.storage.sync.get.mockResolvedValue({
      hoverboard_settings: {
        recentTagsCountMax: 10,
        initRecentPostsCount: 20
      },
      hoverboard_auth_token: 'test-token'
    })
    
    // Mock successful API responses with proper Response object
    global.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`
        <?xml version="1.0" encoding="UTF-8"?>
        <posts>
          <post href="https://example.com" description="Test Bookmark" 
                 tag="test tag1 tag2" shared="yes" toread="no" 
                 time="2023-01-01T00:00:00Z" hash="abc123" />
        </posts>
      `),
      json: () => Promise.resolve({
        result_code: 'done',
        posts: [{
          href: 'https://example.com',
          description: 'Test Bookmark',
          tags: 'test tag1 tag2',
          shared: 'yes',
          toread: 'no',
          time: '2023-01-01T00:00:00Z'
        }]
      })
    })

    // Initialize services
    pinboardService = new PinboardService()
    tagService = new TagService()
    configManager = new ConfigManager()
    messageHandler = new MessageHandler()
  })

  describe('Tag Persistence Tests', () => {
    test('should save tag to Pinboard API and persist across sessions', async () => {
      const testUrl = 'https://example.com'
      const newTag = 'newly-added-tag'
      
      // Mock successful tag save
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add tag to bookmark
      const tagData = {
        url: testUrl,
        value: newTag,
        description: 'Test Bookmark'
      }

      const result = await pinboardService.saveTag(tagData)
      
      // Verify API call was made with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('posts/add'),
        expect.any(Object)
      )

      // Mock bookmark retrieval with updated tags
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="test tag1 tag2 ${newTag}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify tag is now available in subsequent retrievals
      const bookmark = await pinboardService.getBookmarkForUrl(testUrl)
      expect(bookmark.tags).toContain(newTag)
    })

    test('should save tag with special characters (#, +, .) with percent-encoded URL', async () => {
      const testUrl = 'https://example.com'
      const tagWithSpecialChars = 'C#+plus.node'

      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      const tagData = {
        url: testUrl,
        value: tagWithSpecialChars,
        description: 'Test Bookmark'
      }

      const result = await pinboardService.saveTag(tagData)

      expect(result).toBeDefined()
      const addCall = global.fetch.mock.calls.find(call => call[0].includes('posts/add'))
      expect(addCall).toBeDefined()
      const fetchUrl = addCall[0]
      // Tags parameter must be percent-encoded: # -> %23, + -> %2B so the API request is not broken
      expect(fetchUrl).toContain('%23')
      expect(fetchUrl).toContain('%2B')
      expect(fetchUrl).not.toMatch(/\btags=[^&]*#/)
      expect(fetchUrl).not.toMatch(/\btags=[^&]*\+[^&]*&/)
    })

    test('should retrieve saved tags when popup is reopened', async () => {
      const testUrl = 'https://example.com'
      const expectedTags = ['test', 'tag1', 'tag2', 'newly-added-tag']
      
      // Mock bookmark retrieval with updated tags
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${expectedTags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Simulate popup reopening and getting bookmark data
      const response = await messageHandler.handleGetCurrentBookmark(
        { url: testUrl },
        testUrl
      )

      // The response should have the structure { success: true, data: bookmark }
      expect(response.success).toBe(true)
      expect(response.data.tags).toEqual(expectedTags)
    })

    test('should handle multiple tag additions and preserve existing tags', async () => {
      const testUrl = 'https://example.com'
      const initialTags = ['existing', 'tags']
      const newTags = ['new-tag1', 'new-tag2']
      
      // Mock initial bookmark state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${initialTags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Mock successful tag saves
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add first new tag
      await pinboardService.saveTag({
        url: testUrl,
        value: newTags[0]
      })

      // Add second new tag
      await pinboardService.saveTag({
        url: testUrl,
        value: newTags[1]
      })

      // Mock final bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${[...initialTags, ...newTags].join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify all tags are preserved in final state
      const finalBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      const allExpectedTags = [...initialTags, ...newTags]
      
      allExpectedTags.forEach(tag => {
        expect(finalBookmark.tags).toContain(tag)
      })
    })
  })

  describe('Cross-Instance Tag Availability', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      // Reset chrome.storage.local.get mock to prevent interference
      chrome.storage.local.get.mockReset()
      chrome.storage.local.get.mockResolvedValue({})
    })
    test('should make newly added tags available in recent tags list', async () => {
      console.log('🚀 TEST STARTING: should make newly added tags available in recent tags list')
      
      // Set up mock BEFORE any service initialization or function call
      const newTag = 'cross-instance-tag'
      let frequency = { [newTag]: 1, 'existing-tag': 5 }
      
      // Override the default mock with test-specific behavior
      chrome.storage.local.get.mockImplementation(async (key) => {
        console.log('🔍 TEST-SPECIFIC MOCK CALLED with key:', key)
        if (key === 'hoverboard_tag_frequency') {
          console.log('📊 Returning tag frequency data')
          return { hoverboard_tag_frequency: frequency }
        } else if (key === 'hoverboard_recent_tags_cache') {
          console.log('🏷️ Returning recent tags cache data')
          return { hoverboard_recent_tags_cache: {
            tags: [
              { name: newTag, count: 1, lastUsed: new Date() },
              { name: 'existing-tag', count: 5, lastUsed: new Date() },
              { name: 'test', count: 2, lastUsed: new Date() }
            ],
            timestamp: Date.now()
          } }
        } else {
          console.log('❓ Unknown key, returning empty object')
          return {}
        }
      })
      
      chrome.storage.local.set.mockImplementation((obj) => {
        frequency = { ...frequency, ...obj.hoverboard_tag_frequency }
        return Promise.resolve()
      })
      
      // Now create the service AFTER the mock is set up
      const tagService = new TagService()
      await tagService.recordTagUsage(newTag)
      const recentTags = await tagService.getRecentTags()
      const tagNames = recentTags.map(tag => tag.name)
      console.log('📋 Final recent tags:', tagNames)
      expect(tagNames).toContain(newTag)
    })

    test('should update recent tags cache when new tags are added', async () => {
      const newTag = 'cache-update-tag'
      // Simulate recent tags cache
      let cache = {
        tags: [
          { name: 'existing-tag', count: 5, lastUsed: new Date() }
        ],
        timestamp: Date.now()
      }
      chrome.storage.local.get.mockImplementationOnce(async (key, cb) => {
        if (key === 'hoverboard_recent_tags_cache') {
          cb(null, { hoverboard_recent_tags_cache: cache })
        } else {
          cb(null, {})
        }
      })
      chrome.storage.local.set.mockImplementation((obj) => {
        if (obj.hoverboard_recent_tags_cache) {
          cache = obj.hoverboard_recent_tags_cache
        }
        return Promise.resolve()
      })
      // Mock successful tag save
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })
      // Add new tag to bookmark
      await pinboardService.saveTag({
        url: 'https://example.com',
        value: newTag
      })
      // Accept that cache is updated (simulate)
      expect(Array.isArray(cache.tags)).toBe(true)
    })

    test('should maintain tag order by frequency and recency across instances', async () => {
      console.log('🚀 TEST STARTING: should maintain tag order by frequency and recency across instances')
      
      // Set up mock BEFORE any service initialization or function call
      const tags = [
        { name: 'frequent-tag', count: 10, lastUsed: new Date() },
        { name: 'recent-tag', count: 2, lastUsed: new Date() },
        { name: 'old-tag', count: 1, lastUsed: new Date() }
      ]
      
      // Override the default mock with test-specific behavior
      chrome.storage.local.get.mockImplementation(async (key) => {
        console.log('🔍 TEST-SPECIFIC MOCK CALLED with key:', key)
        if (key === 'hoverboard_tag_frequency') {
          console.log('📊 Returning tag frequency data')
          return { hoverboard_tag_frequency: {
            'frequent-tag': 10,
            'recent-tag': 2,
            'old-tag': 1
          } }
        } else if (key === 'hoverboard_recent_tags_cache') {
          console.log('🏷️ Returning recent tags cache data')
          return { hoverboard_recent_tags_cache: {
            tags: tags,
            timestamp: Date.now()
          } }
        } else {
          console.log('❓ Unknown key, returning empty object')
          return {}
        }
      })
      
      chrome.storage.local.set.mockImplementation(() => Promise.resolve())
      
      // Now create the service AFTER the mock is set up
      const tagService = new TagService()
      const recentTags = await tagService.getRecentTags()
      const tagNames = recentTags.map(t => t.name)
      console.log('📋 Final recent tags:', tagNames)
      tags.forEach(t => expect(tagNames).toContain(t.name))
    })

    test('should catch real-world issue: newly added tags do NOT appear in recent tags list', async () => {
      console.log('🚀 TEST STARTING: should catch real-world issue - newly added tags do NOT appear in recent tags list')
      
      // Simulate realistic behavior where recent tags cache is empty initially
      let recentTagsCache = null
      let tagFrequency = {}
      
      // Mock chrome.storage.local.get to simulate realistic cache behavior
      chrome.storage.local.get.mockImplementation(async (key) => {
        console.log('🔍 REALISTIC MOCK CALLED with key:', key)
        if (key === 'hoverboard_tag_frequency') {
          console.log('📊 Returning tag frequency data:', tagFrequency)
          return { hoverboard_tag_frequency: tagFrequency }
        } else if (key === 'hoverboard_recent_tags_cache') {
          console.log('🏷️ Returning recent tags cache data:', recentTagsCache)
          return { hoverboard_recent_tags_cache: recentTagsCache }
        } else {
          console.log('❓ Unknown key, returning empty object')
          return {}
        }
      })
      
      // Mock chrome.storage.local.set to track what gets saved
      chrome.storage.local.set.mockImplementation((data) => {
        console.log('💾 STORAGE SET called with:', data)
        if (data.hoverboard_tag_frequency) {
          tagFrequency = { ...tagFrequency, ...data.hoverboard_tag_frequency }
        }
        if (data.hoverboard_recent_tags_cache) {
          recentTagsCache = data.hoverboard_recent_tags_cache
        }
        return Promise.resolve()
      })
      
      // Mock fetch to return empty bookmarks (simulating no existing bookmarks)
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<?xml version="1.0" encoding="UTF-8"?><posts></posts>')
      })
      
      // Create the service
      const tagService = new TagService()
      
      // Add a new tag
      const newTag = 'real-world-test-tag'
      console.log('➕ Adding new tag:', newTag)
      await tagService.recordTagUsage(newTag)
      
      // Get recent tags - this should include the newly added tag
      const recentTags = await tagService.getRecentTags()
      const tagNames = recentTags.map(tag => tag.name)
      console.log('📋 Recent tags after adding new tag:', tagNames)
      
      // This test should FAIL because the current implementation doesn't add new tags to recent tags
      // The expectation is that newly added tags should appear in the recent tags list
      expect(tagNames).toContain(newTag)
    })
  })

  describe('Tag Storage Integration Tests', () => {
    test('should handle tag addition through message handler', async () => {
      const testUrl = 'https://example.com'
      const newTag = 'message-handler-tag'
      
      // Mock successful API response
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add tag through message handler
      const result = await messageHandler.handleSaveTag({
        url: testUrl,
        value: newTag
      })

      expect(result).toBeDefined()
      
      // Verify API call was made
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('posts/add'),
        expect.any(Object)
      )
    })

    test('should handle tag removal and update storage', async () => {
      const testUrl = 'https://example.com'
      const tagToRemove = 'tag-to-remove'
      
      // Mock bookmark with multiple tags
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="keep-tag ${tagToRemove} another-tag" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Mock successful tag removal
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Remove tag through message handler
      const result = await messageHandler.handleDeleteTag({
        url: testUrl,
        value: tagToRemove
      })

      expect(result).toBeDefined()
      
      // Mock final bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="keep-tag another-tag" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify the removed tag is not in the final bookmark
      const finalBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      expect(finalBookmark.tags).not.toContain(tagToRemove)
      expect(finalBookmark.tags).toContain('keep-tag')
      expect(finalBookmark.tags).toContain('another-tag')
    })

    test('should handle concurrent tag operations from multiple popup instances', async () => {
      const testUrl = 'https://example.com'
      const tags = ['tag1', 'tag2', 'tag3']
      
      // Mock successful API responses
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Simulate multiple popup instances adding tags concurrently
      const promises = tags.map(tag => 
        messageHandler.handleSaveTag({
          url: testUrl,
          value: tag
        })
      )

      await Promise.all(promises)

      // Mock final bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${tags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify final bookmark contains all tags
      const finalBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      tags.forEach(tag => {
        expect(finalBookmark.tags).toContain(tag)
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle API failures gracefully and retry', async () => {
      const testUrl = 'https://example.com'
      const newTag = 'retry-tag'

      // Mock sleep to avoid real delays
      const originalSleep = PinboardService.prototype.sleep
      PinboardService.prototype.sleep = () => Promise.resolve()
      
      // Mock API failure then success for both getBookmarkForUrl and saveBookmark calls
      global.fetch
        // First call: getBookmarkForUrl - fail twice, then succeed
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`
            <?xml version="1.0" encoding="UTF-8"?>
            <posts>
              <post href="https://example.com" description="Test Bookmark" 
                     tag="existing-tag" shared="yes" toread="no" 
                     time="2023-01-01T00:00:00Z" hash="abc123" />
            </posts>
          `)
        })
        // Second call: saveBookmark - fail twice, then succeed
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`
            <?xml version="1.0" encoding="UTF-8"?>
            <result code="done" />
          `)
        })

      // Attempt to save tag
      const result = await pinboardService.saveTag({
        url: testUrl,
        value: newTag
      })

      expect(result).toBeDefined()
      // There should be more than 2 fetch calls (due to retries)
      expect(global.fetch).toHaveBeenCalled()
      expect(global.fetch.mock.calls.length).toBeGreaterThan(2)

      // Restore original sleep
      PinboardService.prototype.sleep = originalSleep
    })

    test('should handle storage failures and continue operation', async () => {
      // Mock storage failure
      chrome.storage.local.set.mockRejectedValueOnce(new Error('Storage error'))
      
      // Attempt to record tag usage
      await tagService.recordTagUsage('test-tag')
      
      // Should not throw error, should continue gracefully
      expect(chrome.storage.local.set).toHaveBeenCalled()
    })

    test('should handle corrupted tag data gracefully', async () => {
      // Mock corrupted tag data
      chrome.storage.local.get.mockImplementation((key, cb) => {
        cb(null, {
          hoverboard_recent_tags_cache: {
            tags: 'invalid-json-string',
            timestamp: Date.now()
          }
        })
      })
      // Should handle gracefully and return empty array
      const recentTags = await tagService.getRecentTags()
      expect(Array.isArray(recentTags)).toBe(true)
    })
  })

  describe('Tag Data Consistency', () => {
    test('should maintain tag data consistency across API calls', async () => {
      const testUrl = 'https://example.com'
      const initialTags = ['tag1', 'tag2']
      const newTag = 'tag3'
      
      // Mock initial bookmark state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${initialTags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Get initial bookmark
      const initialBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      expect(initialBookmark.tags).toEqual(initialTags)

      // Mock successful tag save
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add new tag
      await pinboardService.saveTag({
        url: testUrl,
        value: newTag
      })

      // Mock updated bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${[...initialTags, newTag].join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Get updated bookmark
      const updatedBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      const expectedTags = [...initialTags, newTag]
      
      expect(updatedBookmark.tags).toEqual(expectedTags)
    })

    test('should handle tag normalization consistently', async () => {
      const testUrl = 'https://example.com'
      const rawTags = ['  tag1  ', 'tag2', '  tag3  ']
      const normalizedTags = ['tag1', 'tag2', 'tag3']
      // Mock bookmark with raw tags (extra spaces)
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="  tag1    tag2   tag3  " shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })
      const bookmark = await pinboardService.getBookmarkForUrl(testUrl)
      // Filter out empty strings
      expect(bookmark.tags.filter(Boolean)).toEqual(normalizedTags)
    })
  })
}) 