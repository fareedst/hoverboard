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

describe('[REQ-TAG_INPUT_SANITIZATION] [IMPL-TAG_SYSTEM] Tag Sanitization Fix Validation', () => {
  let tagService

  beforeEach(() => {
    // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Create tag service instance
    tagService = new TagService()
  })

  describe('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] HTML Tag Sanitization', () => {
    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should properly sanitize HTML tags', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test HTML tag sanitization
      const result = tagService.sanitizeTag('<script>alert("xss")</script>')
      expect(result).toBe('scriptalertxss')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle multiple HTML tags', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test multiple HTML tags
      const result = tagService.sanitizeTag('<div><span>content</span></div>')
      expect(result).toBe('divspancontentspan')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle nested HTML tags', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test nested HTML tags
      const result = tagService.sanitizeTag('<p><strong><em>text</em></strong></p>')
      expect(result).toBe('pstrongemtextemstrong')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle HTML tags with attributes', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test HTML tags with attributes
      const result = tagService.sanitizeTag('<a href="https://example.com">link</a>')
      expect(result).toBe('alink')
    })
  })

  describe('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] Special Character Removal', () => {
    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should remove special characters', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test special character removal
      const result = tagService.sanitizeTag('tag@#$%^&*()')
      expect(result).toBe('tag')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should preserve valid characters', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test valid character preservation
      const result = tagService.sanitizeTag('valid-tag_123')
      expect(result).toBe('valid-tag_123')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle mixed content', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test mixed content
      const result = tagService.sanitizeTag('<script>alert("xss")</script>@#$%^&*()')
      expect(result).toBe('scriptalertxss')
    })
  })

  describe('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] Length Limitation', () => {
    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should limit tag length to 50 characters', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test length limitation
      const longTag = 'a'.repeat(100)
      const result = tagService.sanitizeTag(longTag)
      expect(result.length).toBeLessThanOrEqual(50)
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle tags exactly 50 characters', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test exact length
      const exactTag = 'a'.repeat(50)
      const result = tagService.sanitizeTag(exactTag)
      expect(result.length).toBe(50)
    })
  })

  describe('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] Invalid Input Handling', () => {
    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle empty string', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test empty string
      const result = tagService.sanitizeTag('')
      expect(result).toBe(null)
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle null input', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test null input
      const result = tagService.sanitizeTag(null)
      expect(result).toBe(null)
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle undefined input', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test undefined input
      const result = tagService.sanitizeTag(undefined)
      expect(result).toBe(null)
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle non-string input', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test non-string input
      const result = tagService.sanitizeTag(123)
      expect(result).toBe(null)
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle whitespace-only input', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test whitespace-only input
      const result = tagService.sanitizeTag('   ')
      expect(result).toBe(null)
    })
  })

  describe('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] Edge Cases', () => {
    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle single character tags', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test single character
      const result = tagService.sanitizeTag('a')
      expect(result).toBe('a')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle tags with only HTML', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test tags with only HTML
      const result = tagService.sanitizeTag('<div></div>')
      expect(result).toBe('div')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle self-closing tags', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test self-closing tags
      const result = tagService.sanitizeTag('<br/>')
      expect(result).toBe('br')
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle complex HTML structures', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test complex HTML
      const result = tagService.sanitizeTag('<div class="container"><p>Hello <strong>World</strong>!</p></div>')
      expect(result).toBe('divclasscontainerpHelloWorld')
    })
  })

  describe('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] Security Validation', () => {
    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should prevent XSS attacks', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test XSS prevention
      const maliciousInputs = [
        '<img src="x" onerror="alert(\'xss\')">',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '<svg onload="alert(\'xss\')"></svg>'
      ]

      maliciousInputs.forEach(input => {
        const result = tagService.sanitizeTag(input)
        expect(result).not.toContain('<script>')
        expect(result).not.toContain('alert')
        expect(result).not.toContain('javascript:')
      })
    })

    test('[IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] should handle encoded HTML', () => {
      // [IMPL-TESTING] [ARCH-TESTING_STRATEGY] [REQ-CODE_QUALITY] [TEST-UNIT_FRAMEWORK]-SANITIZE] - Test encoded HTML
      const result = tagService.sanitizeTag('&lt;script&gt;alert("xss")&lt;/script&gt;')
      expect(result).toBe('ltscriptgtalertxssltscriptgt')
    })
  })
}) 