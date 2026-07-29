# LEAP out-of-scope notes — REQ-BROWSER_BOOKMARK_STORAGE

Recorded: 2026-07-29

Future CITDP evaluation candidates (not in this change):

1. **Merge Browser Bookmark Import into Index Import** — Deprecate or thin the dedicated Browser Bookmark Import page once Store B + Import-to Browser cover the same flows.
2. **Route side-panel Bookmarks through BookmarkRouter** — Side-panel Bookmarks tab still talks to `chrome.bookmarks` directly; unify with BrowserBookmarkService for single ownership model.
3. **Sidecar metadata for Private / Read Later / notes on browser nodes** — Chrome has no native fields; optional chrome.storage sidecar keyed by bookmark id/URL.
4. **Centralize VALID_BACKENDS** — Constant is duplicated across storage-index, bookmark-router, PopupController, Zod schemas; extract one exported module.
