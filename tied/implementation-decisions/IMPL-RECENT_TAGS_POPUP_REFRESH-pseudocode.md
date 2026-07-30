# [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] — Contract: event-driven async; void; failures → empty chips + logged error (no unhandled reject from loadRecentTags).

## SETUP_AUTO_REFRESH

- [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] How: Implements setupAutoRefresh() behavior for IMPL-RECENT_TAGS_POPUP_REFRESH.
- Contract:
  - INPUT: none (event-driven)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: SETUP_AUTO_REFRESH
  - REGISTER document.addEventListener("visibilitychange", handler)
  - How (sub-block): How: gate on visible + initialized + !isLoading; then await loadRecentTags (same tokens as top).

## HANDLER

- [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] How: Implements handler() behavior for IMPL-RECENT_TAGS_POPUP_REFRESH.
- Contract:
  - INPUT: none (event-driven)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: HANDLER
  - IF document.visibilityState !== "visible" THEN RETURN
  - IF NOT controller.initialized OR controller.isLoading THEN RETURN
  - AWAIT loadRecentTags()

## LOAD_RECENT_TAGS

- [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-MESSAGE_HANDLING] [IMPL-TAG_SYSTEM] How: sendMessage routes to SW processMessage → handleGetRecentBookmarks → tagService.getUserRecentTagsExcludingCurrent; map to chip strings; defensive second filter vs currentTags; cross-IMPL dependency on message + TagService layers.
- Contract:
  - INPUT: none (event-driven)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: void (side effect — uiManager.updateRecentTags(string[])) | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: LOAD_RECENT_TAGS
  - currentTags = normalizeTags(controller.currentPin?.tags OR [])
  - TRY:
  - response = AWAIT sendMessage({ type: "getRecentBookmarks", data: { currentTags, senderUrl: currentTab.url } })
  - names = MAP response.recentTags to string names (string OR .name)
  - filtered = FILTER names where not in currentTags
  - uiManager.updateRecentTags(filtered)
  - CATCH:
  - LOG error; uiManager.updateRecentTags([])

## BLOCK_4

- How: satisfies REQ-RECENT_TAGS_SYSTEM “refresh when UI shown” for popup; shared SW state with side panel path ([IMPL-SIDE_PANEL_TABS] loadRecentTags on focus) — either may refresh; ordering independent; both use same message contract.
- Contract:
  - INPUT: none (event-driven)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: BLOCK_4
  - How (sub-block): --- Composition / cross-IMPL ---
