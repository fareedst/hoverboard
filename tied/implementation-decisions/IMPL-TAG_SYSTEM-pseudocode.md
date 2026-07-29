# [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [REQ-TAG_MANAGEMENT] [REQ-TAG_INPUT_SANITIZATION]
# TagService: sanitizeTag; user-recent via SW recentTagsMemory + persisted snapshot + ConfigManager (N-minute policy keys); display cache + frequency for suggestions; single background source per ARCH-TAG_SYSTEM.
# Contract: sanitized strings; policy-filtered recent rows; fallible reads return [] or false and log (no throw to callers).
INPUT: raw tag string (sanitize); options (getRecentTags); currentTags string[] (exclude for UI); tagName + currentSiteUrl (add user-recent); bookmark/tag mutation data (recordTagUsage, caches)
OUTPUT: sanitized string; arrays of { name, lastUsed, ... } for display/suggestions; boolean for add success
DATA: self/globalThis.recentTagsMemory (RecentTagsMemoryManager): in-memory entries + chrome.storage.local snapshot; ConfigManager keys including recentTagsActivityWindowMinutes (N), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey; TagService hoverboard_recent_tags_cache + tagFrequencyKey for TTL cache and frequency map

# [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] [REQ-TAG_MANAGEMENT]
# How: normalize and enforce charset/length before persist or display; invalid → empty or reject per existing rules.
sanitizeTag(raw):
  TRIM; normalize whitespace; apply allowed charset/length
  RETURN sanitized string

# [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM]
# How: resolve recentTagsMemory (direct self/globalThis or background bridge); getRecentTagsForUi(() => getConfig()) applies idle N + lastUsed window; legacy memory.getRecentTags if ForUi missing; ON error LOG; RETURN [].
getUserRecentTags():
  memory = getDirectSharedMemory() OR await getBackgroundPage().recentTagsMemory
  IF NOT memory: RETURN []
  IF typeof memory.getRecentTagsForUi === "function": RETURN AWAIT memory.getRecentTagsForUi(() => configManager.getConfig())
  IF typeof memory.getRecentTags === "function": RETURN sortByLastUsed(memory.getRecentTags())
  RETURN []

# How: filter getUserRecentTags rows where name ∉ normalized currentTags; supplies IMPL-MESSAGE_HANDLING handleGetRecentBookmarks and UI second-pass exclusion per REQ-RECENT_TAGS_SYSTEM.
getUserRecentTagsExcludingCurrent(currentTags):
  base = AWAIT getUserRecentTags()
  RETURN FILTER base by name not in normalize(currentTags)

# How: validate inputs; sanitize via sanitizeTag; recentTagsMemory.addTag updates lastActivityAt + persist; ON error LOG; RETURN false.
addTagToUserRecentList(tagName, currentSiteUrl):
  IF NOT tagName OR NOT currentSiteUrl: RETURN false
  tag = sanitizeTag(tagName); IF NOT tag: RETURN false
  RETURN memory.addTag(tag, currentSiteUrl) OR false

# [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [REQ-TAG_MANAGEMENT]
# How: display-oriented merge — valid TTL cache → processTagsForDisplay; else user-recent rows then processTagsForDisplay; else []; ties suggestions path to same TagService without duplicating policy in UI.
getRecentTags(options):
  cached = AWAIT getCachedTags()
  IF cached AND isCacheValid(cached.timestamp): RETURN processTagsForDisplay(cached.tags, options)
  userRows = AWAIT getUserRecentTags()
  IF userRows.length > 0: RETURN processTagsForDisplay(userRows, options)
  RETURN []

# [IMPL-TAG_SYSTEM] [REQ-TAG_MANAGEMENT]
# How: persist hoverboard_tag_frequency and refresh display cache slice; does not advance user-recent lastActivityAt (per ARCH-TAG_SYSTEM: only tag mutations do).
recordTagUsage(tagName):
  AWAIT persist frequency map; AWAIT updateRecentTagsCache(...)

# --- Composition: composed_with [IMPL-SUGGESTED_TAGS] ---
# Shared DATA: same TagService instance; getTagSuggestions → getRecentTags → user-recent and/or cache + frequency ordering. Pre: config + storage readable. Post: suggestion list capped by limit param. Ordering vs IMPL-MESSAGE_HANDLING: TagService only used from SW handlers or direct UI bridge, not parallel writers to recentTagsMemory except addTag paths.

# --- Cross-IMPL ---
# Called by [IMPL-MESSAGE_HANDLING] handleGetRecentBookmarks / handleAddTagToRecent / handleGetUserRecentTags (SW). Config N supplied via [IMPL-CONFIG_STRUCT] getConfig merge consumed inside getRecentTagsForUi callback.
