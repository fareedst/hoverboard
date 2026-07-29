# [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM]
# Central message allowlist + validation + handler dispatch; recent-tag message types delegate to [IMPL-TAG_SYSTEM] TagService and SW recentTagsMemory policy per ARCH-TAG_SYSTEM. Contract: Promise result or reject on validation; recent handlers return safe shapes on internal failure.
INPUT: message { type, payload/data }; sender (tab/popup/background)
OUTPUT: Promise resolving to handler result or rejecting on validation/routing error
DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths

# [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING]
# How: client-side validate type/payload; dispatch to background; return Promise (path for popup/content/offscreen callers).
send(message):
  VALIDATE message.type in allowlist
  VALIDATE payload shape
  ROUTE to handler for message.type
  handler(message) -> result; RETURN Promise.resolve(result)
  ON error: RETURN Promise.reject; optional log

# How: SW entry resolves handler by message.type; missing handler → reject or structured error per router; AWAIT handler(data, senderUrl); optional BOOKMARK_UPDATED broadcast after mutating handlers ([REQ-BOOKMARK_STATE_SYNCHRONIZATION]).
processMessage(message) (in message-handler):
  handler = lookup(message.type)
  IF handler is null/undefined: RETURN reject OR { error: "unknown_type" } per existing router rules
  result = AWAIT handler(message.payload OR message.data, senderUrl)
  RETURN result; (caller may broadcast BOOKMARK_UPDATED etc.)

# [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] [IMPL-TAG_SYSTEM]
# How: getRecentBookmarks UI contract — delegate tagService.getUserRecentTagsExcludingCurrent; merges payload; primary caller [IMPL-RECENT_TAGS_POPUP_REFRESH] / panel loadRecentTags; senderUrl from router for logging.
handleGetRecentBookmarks(data, senderUrl):
  recentTags = AWAIT tagService.getUserRecentTagsExcludingCurrent(data?.currentTags OR [])
  RETURN { ...data, recentTags }

# How: addTagToRecent — validate tagName + currentSiteUrl; tagService.addTagToUserRecentList; structured { success } / error (same REQ/ARCH/IMPL cross-IMPL set as handleGetRecentBookmarks).
handleAddTagToRecent(data):
  VALIDATE tagName AND currentSiteUrl present
  success = AWAIT tagService.addTagToUserRecentList(tagName, currentSiteUrl)
  RETURN { success } OR { success: false, error: message }

# How: getUserRecentTags message — raw policy list for diagnostics/tools; TRY/CATCH → { recentTags: [], error } on failure.
handleGetUserRecentTags(data):
  TRY: RETURN { recentTags: AWAIT tagService.getUserRecentTags() }
  CATCH: LOG; RETURN { recentTags: [], error }

# --- Composition: composed_with [IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-BOOKMARK_STATE_SYNC] ---
# Ordering: client send may apply timeout/retry ([IMPL-POPUP_MESSAGE_TIMEOUT]) before this IMPL’s send completes. Post successful bookmark mutations, [IMPL-BOOKMARK_STATE_SYNC] may broadcast; recent-tag handlers are read/mutation for user-recent only unless caller chains. Shared DATA: single MessageHandler TagService reference; no second recentTagsMemory writer.

# --- Cross-IMPL ---
# Recent paths call [IMPL-TAG_SYSTEM] only (no direct memory access from handler). Config N flows via TagService → getConfig ([IMPL-CONFIG_STRUCT]).
