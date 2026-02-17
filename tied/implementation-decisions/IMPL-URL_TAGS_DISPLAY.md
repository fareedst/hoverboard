# [IMPL-URL_TAGS_DISPLAY] URL Tags and Badge Display Module

**Status**: Active  
**Cross-references**: [ARCH-URL_TAGS_DISPLAY](../architecture-decisions/ARCH-URL_TAGS_DISPLAY.md), [REQ-URL_TAGS_DISPLAY](../requirements/REQ-URL_TAGS_DISPLAY.md), [REQ-BADGE_INDICATORS](../requirements/REQ-BADGE_INDICATORS.md)

## Summary

Single source for tags-for-URL and badge display value: `url-tags-manager.js` with normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue. **Fixes**: handleGetCurrentBookmark always uses router (no early return when no Pinboard auth), normalizes, sets needsAuth when !hasAuth; GET_TAGS_FOR_URL message and handleGetTagsForUrl for centralized tag storage; popup getBookmarkData only resolves null when blocked (when needsAuth still returns bookmark with tags).

## Implementation

- **url-tags-manager.js**: normalizeBookmarkForDisplay(bookmark) — tags always array; getBookmarkForDisplay(provider, url, title); getTagsForUrl(provider, url); getBadgeDisplayValue(bookmark, config) — text, tagCount, isPrivate, isToRead, isBookmarked, title.
- **message-handler.js**: handleGetCurrentBookmark uses getBookmarkForDisplay(bookmarkProvider, targetUrl, data?.title) (single source; no short-circuit when !hasAuth); sets normalized.needsAuth when !hasAuth. handleSaveBookmark uses getTagsForUrl(bookmarkProvider, data.url) for previous tags so added-tag tracking uses the same source as badge/popup. GET_TAGS_FOR_URL message and handleGetTagsForUrl(data) return { tags } from getTagsForUrl(bookmarkProvider, data.url).
- **bookmark-router.js**: _hasTags and _isEmptyBookmark use normalizeBookmarkForDisplay(bookmark) for tag shape (string/array) so router best-candidate logic matches display contract.
- **service-worker.js**: updateBadgeForTab gets raw bookmark, normalizes with normalizeBookmarkForDisplay, then calls BadgeManager.updateBadge.
- **badge-manager.js**: calculateBadgeData uses getBadgeDisplayValue(bookmark, config) for text and title.
- **PopupController.js**: getBookmarkData resolves(null) only when bookmarkData.blocked; when needsAuth still returns bookmark (with tags). handleAddTag and handleRemoveTag re-fetch current tags via getBookmarkData before building payload; validateBookmarkData normalizes data.tags to array when not array (instead of rejecting).

## Traceability

- **Requirements**: REQ-URL_TAGS_DISPLAY, REQ-BADGE_INDICATORS.
- **Architecture**: ARCH-URL_TAGS_DISPLAY.
- **Tests**: tests/unit/url-tags-manager.test.js, tests/unit/popup-live-data.test.js (including bookmark with tags when needsAuth, getBookmarkData null when blocked), tests/unit/message-handler-url-tags.test.js (handleGetTagsForUrl, handleGetCurrentBookmark normalization/needsAuth/blocked), tests/unit/bookmark-router.test.js (best-candidate selection).
