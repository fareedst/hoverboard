# [ARCH-URL_TAGS_DISPLAY] URL Tags and Badge Single Source

**Status**: Active  
**Cross-references**: [REQ-URL_TAGS_DISPLAY](../requirements/REQ-URL_TAGS_DISPLAY.md), [REQ-BADGE_INDICATORS](../requirements/REQ-BADGE_INDICATORS.md), [REQ-PER_BOOKMARK_STORAGE_BACKEND](../requirements/REQ-PER_BOOKMARK_STORAGE_BACKEND.md), [IMPL-URL_TAGS_DISPLAY](../implementation-decisions/IMPL-URL_TAGS_DISPLAY.md)

## Summary

A single logical module owns "tags for a URL" and "badge display value." Normalization (tags as array, required fields defaulted) happens at the boundary so badge, popup, and overlay all consume the same contract and never diverge. Storage and retrieval remain in BookmarkRouter and the four providers; this module sits on top and provides display normalization and badge value derivation.

## Rationale

- **Why**: Badge and popup were using the same router but different code paths and validation; popup could reject or show empty tags while badge was correct; adding a tag from popup used in-memory state and overwrote prior tags. When no Pinboard auth, getCurrentBookmark returned early with empty data and popup resolved null, so current tags stayed empty even when the bookmark was in local/file/sync.
- **Problems solved**: Popup showing no tags when badge correct; add-tag losing prior tags; inconsistent tags shape across pinboard/local/file/sync; popup empty when no Pinboard auth although bookmark in local/file/sync.
- **Benefits**: Normalization at the boundary; all consumers get tags as array and same badge value; popup re-fetches and merges on add/remove; getCurrentBookmark always queries router (no early return for no auth) so popup and badge share same data source; getTagsForUrl message exposes centralized tag storage for tests and UI.

## Implementation approach

- URL-tags-manager module (normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue).
- handleGetCurrentBookmark always calls router (no short-circuit when no Pinboard auth); returns normalized bookmark; sets needsAuth on result when !hasAuth.
- Popup getBookmarkData only treats as no bookmark when blocked; when needsAuth still uses returned bookmark and tags.
- GET_TAGS_FOR_URL message and handleGetTagsForUrl return tags from getTagsForUrl(bookmarkProvider, url).
- Message handler and service worker use normalization; BadgeManager uses getBadgeDisplayValue for text/title.
- Router and four providers own storage; URL-tags module owns display normalization and badge value derivation on top.

## Related

- ARCH-STORAGE_INDEX_AND_ROUTER (router + four providers); ARCH-BADGE (badge system).
