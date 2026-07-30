# [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] — How: drive tab-scoped badge text/color from bookmark/overlay state via service-worker badge helpers.

## UPDATE_BADGE_FOR_TAB

- [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: resolve bookmark state for tab then set badge text/color or clear.
- Contract:
  - INPUT: tab id / URL; bookmark presence and tag signals from MessageHandler / TagService paths
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: chrome.action badge text and background color updated per tab; cleared when no bookmark
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: chrome.action API; per-tab badge cache in service worker; composed_with IMPL-BADGE_REFRESH
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: UPDATE_BADGE_FOR_TAB
  - IF NOT tab: RETURN
  - state = AWAIT resolveBookmarkStateForTab(tab)
  - IF state.hasBookmark: SET badge text/color from state
  - ELSE: CLEAR badge for tab.id
  - RETURN
  - How (sub-block): How: after successful saveTag/deleteTag/saveBookmark, refresh badge (delegates to IMPL-BADGE_REFRESH).

## ON_BOOKMARK_MUTATION_SUCCESS

- [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: Implements ON_BOOKMARK_MUTATION_SUCCESS(message, sender) behavior for IMPL-BADGE.
- Contract:
  - INPUT: tab id / URL; bookmark presence and tag signals from MessageHandler / TagService paths
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: chrome.action badge text and background color updated per tab; cleared when no bookmark
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: chrome.action API; per-tab badge cache in service worker; composed_with IMPL-BADGE_REFRESH
  - EFFECTS: Async, Http, IO
  - TERMINATION: total
- PROCEDURE: ON_BOOKMARK_MUTATION_SUCCESS
  - tab = resolveTab(sender, message)
  - AWAIT UPDATE_BADGE_FOR_TAB(tab)
