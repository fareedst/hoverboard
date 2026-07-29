# [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM]
# Popup document: visibilitychange → loadRecentTags → extension messaging getRecentBookmarks → [IMPL-MESSAGE_HANDLING] → [IMPL-TAG_SYSTEM] user-recent policy; updates Recent Tags chips with current-bookmark exclusion. Register setupAutoRefresh after controller sets initialized / isLoading semantics (ARCH-POPUP_SESSION).
# Contract: event-driven async; void; failures → empty chips + logged error (no unhandled reject from loadRecentTags).
INPUT: none (event-driven)
OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }

# How: single visibilitychange listener for popup lifecycle (same tokens as top).
setupAutoRefresh():
  REGISTER document.addEventListener("visibilitychange", handler)

# How: gate on visible + initialized + !isLoading; then await loadRecentTags (same tokens as top).
handler():
  IF document.visibilityState !== "visible" THEN RETURN
  IF NOT controller.initialized OR controller.isLoading THEN RETURN
  AWAIT loadRecentTags()

# [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-MESSAGE_HANDLING] [IMPL-TAG_SYSTEM]
# How: sendMessage routes to SW processMessage → handleGetRecentBookmarks → tagService.getUserRecentTagsExcludingCurrent; map to chip strings; defensive second filter vs currentTags; cross-IMPL dependency on message + TagService layers.
loadRecentTags():
  currentTags = normalizeTags(controller.currentPin?.tags OR [])
  TRY:
    response = AWAIT sendMessage({ type: "getRecentBookmarks", data: { currentTags, senderUrl: currentTab.url } })
    names = MAP response.recentTags to string names (string OR .name)
    filtered = FILTER names where not in currentTags
    uiManager.updateRecentTags(filtered)
  CATCH:
    LOG error; uiManager.updateRecentTags([])

# How: satisfies REQ-RECENT_TAGS_SYSTEM “refresh when UI shown” for popup; shared SW state with side panel path ([IMPL-SIDE_PANEL_TABS] loadRecentTags on focus) — either may refresh; ordering independent; both use same message contract.

# --- Composition / cross-IMPL ---
# Overlap: [IMPL-SIDE_PANEL_BOOKMARK] / panel PopupController also exposes loadRecentTags; identical getRecentBookmarks + exclusion semantics. Pre: chrome.runtime messaging available. Post: chips match policy snapshot at call time. No composed_with entry; see_also IMPL-TAG_SYSTEM for data owner.
