# [REQ-URL_TAGS_DISPLAY] URL Tags and Badge Single Source

**Status**: Implemented  
**Cross-references**: [ARCH-URL_TAGS_DISPLAY](../architecture-decisions/ARCH-URL_TAGS_DISPLAY.md), [IMPL-URL_TAGS_DISPLAY](../implementation-decisions/IMPL-URL_TAGS_DISPLAY.md), [REQ-BADGE_INDICATORS](REQ-BADGE_INDICATORS.md), [REQ-PER_BOOKMARK_STORAGE_BACKEND](REQ-PER_BOOKMARK_STORAGE_BACKEND.md)

## Summary

The badge and popup (and overlay) must show the same tag count and tag list for a given URL. A single logical source provides the list of tags for a URL and the value the badge displays; normalization (e.g. tags as array) is guaranteed for all consumers so the popup never shows no tags when the badge shows the correct count, and adding a tag never overwrites prior tags.

## Rationale

- **Why**: Inconsistent consumption of bookmark/tags (badge in service worker, popup via message) and strict popup validation (tags must be array) caused popup to reject valid bookmarks or show empty tags; adding a tag then sent only the new tag and wiped existing ones. When no Pinboard auth, the message handler returned early with empty tags and popup treated that as no bookmark, so current tags stayed empty even when the bookmark lived in local/file/sync.
- **Problems solved**: Popup showing no current tags when badge showed correct count; adding a tag losing prior tags; inconsistent tags shape (string vs array) across four storage providers; popup empty when no Pinboard auth although bookmark exists in local/file/sync.
- **Benefits**: Single module normalizes bookmark/tags for display; badge and popup use same contract; popup re-fetches and merges when adding/removing tags so prior tags are never lost; getCurrentBookmark always from router (no short-circuit when no Pinboard auth) so popup shows tags from local/file/sync; getTagsForUrl message centralizes tag storage for tests and UI.

## Satisfaction criteria

- Badge shows the same tag count and flags as popup/overlay for the same URL.
- List of tags for a URL is provided by a single logical source (normalized to array) for all consumers.
- Message handler returns normalized bookmark (tags array) for getCurrentBookmark; never short-circuits on no Pinboard auth so router (local/file/sync) data is returned; sets needsAuth on result when no auth.
- Popup treats needsAuth as bookmark present and displays returned tags; only treats as no bookmark when blocked.
- Popup re-fetches current tags from backend before add/remove tag and merges.
- getTagsForUrl message returns tags array for URL from same source (router + url-tags-manager) to facilitate tests.

## Traceability

- **Architecture**: ARCH-URL_TAGS_DISPLAY.
- **Implementation**: IMPL-URL_TAGS_DISPLAY.
- **Tests**: tests/unit/url-tags-manager.test.js, tests/unit/popup-live-data.test.js.
