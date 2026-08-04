# [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] — Service worker refreshes badge after saveTag, deleteTag, saveBookmark so icon reflects tag count and flags.

## MAIN

- [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: Logical block for IMPL-BADGE_REFRESH.
- Contract:
  - INPUT: message result (after processMessage) with type saveTag | deleteTag | saveBookmark
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: badge updated for the affected tab (icon label and optional private/toread indicators)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: handleMessage in service worker; updateBadgeForTab(tab)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Resolve tab (sender.tab or query active for saveBookmark); call updateBadgeForTab(tab).
  - 1. AFTER processMessage(message) succeeds:
  - 2.   IF message.type IN [saveTag, deleteTag, saveBookmark]:
  - 3.     tab = sender.tab IF present
  - 4.     IF no tab AND message.type = saveBookmark: tab = query active tab
  - 5.     IF tab: updateBadgeForTab(tab)

## MESSAGE_DISPATCH_BADGE_REFRESH

- [IMPL-BADGE_REFRESH] [IMPL-MESSAGE_HANDLING] [ARCH-BADGE] [ARCH-MESSAGE_HANDLING] [REQ-BADGE_INDICATORS] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Completes a successful message dispatch before refreshing the affected tab badge.
- Contract:
  - INPUT: message, sender tab, message-processing result
  - PRE: message processing has a resolvable result; badge updater is available
  - OUTPUT: updated badge state for the affected tab
  - POST:
    - success => badge refresh runs only for saveTag, deleteTag, or saveBookmark
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: MESSAGE_DISPATCH_BADGE_REFRESH
  - AWAIT processMessage(message)
  - IF message type is saveTag, deleteTag, or saveBookmark:
    - tab = sender tab when present
    - IF tab is absent and message type is saveBookmark: AWAIT active-tab lookup
    - IF tab exists: AWAIT updateBadgeForTab(tab)
