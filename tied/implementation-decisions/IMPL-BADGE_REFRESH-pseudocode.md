# [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS]
# Service worker refreshes badge after saveTag, deleteTag, saveBookmark so icon reflects tag count and flags.

# Contract: input = processMessage result (saveTag | deleteTag | saveBookmark); output = badge updated for tab.
INPUT: message result (after processMessage) with type saveTag | deleteTag | saveBookmark
OUTPUT: badge updated for the affected tab (icon label and optional private/toread indicators)
DATA: handleMessage in service worker; updateBadgeForTab(tab)

# Resolve tab (sender.tab or query active for saveBookmark); call updateBadgeForTab(tab).
AFTER processMessage(message) succeeds:
  IF message.type IN [saveTag, deleteTag, saveBookmark]:
    tab = sender.tab IF present
    IF no tab AND message.type = saveBookmark: tab = query active tab
    IF tab: updateBadgeForTab(tab)
