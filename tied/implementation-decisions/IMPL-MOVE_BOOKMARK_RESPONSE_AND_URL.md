# [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move Bookmark Response Handling and URL

**Status**: Active  
**Cross-references**: REQ-MOVE_BOOKMARK_STORAGE_UI, IMPL-MOVE_BOOKMARK_UI, IMPL-BOOKMARK_ROUTER

---

## Summary

The move-bookmark UI must reflect the **actual** move result, and the move must use the **bookmark's URL** and allow bookmarks **without a time** field.

1. **Popup: inner result** – The service worker wraps handler responses as `{ success: true, data: routerResult }`. The popup must use `result = response?.data ?? response` and then `result?.success` / `result?.message` so success/error UI matches the router outcome (no false success when router returns e.g. `not_found`).

2. **Popup: bookmark URL for move** – When sending moveBookmarkToStorage, use `url = this.currentPin?.url || this.currentTab?.url` so the move uses the same URL key as storage (avoids mismatch when tab URL differs, e.g. query string).

3. **Router: allow bookmark without time** – Move treats a bookmark as found when it has `bookmark.url`. If `bookmark.time` is missing, set it when saving to target (`toSave = { ...bookmark, time: new Date().toISOString() }`) so moves succeed for legacy data or providers that return bookmarks without time.

## Code locations

- PopupController.js: handleStorageBackendChange – url from currentPin; result = response?.data ?? response; result?.success and result?.message.
- bookmark-router.js: moveBookmarkToStorage – check bookmark.url (not time); toSave with time when missing.

## Related

- REQ-MOVE_BOOKMARK_STORAGE_UI, IMPL-MOVE_BOOKMARK_UI, IMPL-BOOKMARK_ROUTER
