# [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS]
# How: drive tab-scoped badge text/color from bookmark/overlay state via service-worker badge helpers.
INPUT: tab id / URL; bookmark presence and tag signals from MessageHandler / TagService paths
OUTPUT: chrome.action badge text and background color updated per tab; cleared when no bookmark
DATA: chrome.action API; per-tab badge cache in service worker; composed_with IMPL-BADGE_REFRESH

# [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS]
# How: resolve bookmark state for tab then set badge text/color or clear.
UPDATE_BADGE_FOR_TAB(tab):
  IF NOT tab: RETURN
  state = AWAIT resolveBookmarkStateForTab(tab)
  IF state.hasBookmark: SET badge text/color from state
  ELSE: CLEAR badge for tab.id
  RETURN

# How: after successful saveTag/deleteTag/saveBookmark, refresh badge (delegates to IMPL-BADGE_REFRESH).
ON_BOOKMARK_MUTATION_SUCCESS(message, sender):
  tab = resolveTab(sender, message)
  AWAIT UPDATE_BADGE_FOR_TAB(tab)
