# IMPL-BADGE_REFRESH – Badge refresh on overlay and popup changes

**Status**: Active  
**Cross-references**: [ARCH-BADGE](../architecture-decisions/ARCH-BADGE.md), [REQ-BADGE_INDICATORS](../requirements/REQ-BADGE_INDICATORS.md)

## Summary

The extension badge (icon label showing tag count and optional private/toread indicators) must refresh as soon as the user changes bookmark state from the overlay or popup. This implementation records how the service worker triggers a badge update after handling `saveTag`, `deleteTag`, and `saveBookmark` messages.

## Rationale

- **Why**: Users expect the toolbar icon to reflect the current bookmark state without switching tabs or reloading.
- **Problems solved**: Badge not updating after overlay tag add/remove; badge not updating after overlay or popup private/to-read toggle.
- **Benefits**: Immediate visual feedback; consistent state across icon, overlay, and popup.

## Implementation

- **Chrome** ([src/core/service-worker.js](../../src/core/service-worker.js)): In `handleMessage`, after a successful `processMessage`, if the message type is `saveTag`, `deleteTag`, or `saveBookmark`, resolve the tab (use `sender.tab` when present; for `saveBookmark` when sender has no tab, query active tab) and call `updateBadgeForTab(tab)`.
- **Safari** ([safari/src/core/service-worker.js](../../safari/src/core/service-worker.js)): Same logic using string literals `'saveTag'`, `'deleteTag'`, `'saveBookmark'` and `chrome.tabs.query` for active tab.

## Traceability

- **Requirements**: REQ-BADGE_INDICATORS (badge refreshes on tag and private/toread changes).
- **Architecture**: ARCH-BADGE.
- **Tests**: [tests/unit/badge-refresh-service-worker.test.js](../../tests/unit/badge-refresh-service-worker.test.js).
