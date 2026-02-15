# [IMPL-MOVE_BOOKMARK_UI] Move Bookmark Storage UI

**Status**: Active  
**Cross-references**: REQ-MOVE_BOOKMARK_STORAGE_UI, ARCH-MOVE_BOOKMARK_UI

---

## Summary

Popup includes a **Storage** section with a `<select>` (or buttons) for Pinboard, Local, File. On load, popup sends getStorageBackendForUrl(currentUrl) and sets the select value. On change, popup sends moveBookmarkToStorage(url, targetBackend) and refreshes bookmark data.

**File ↔ browser toggle**: When the current bookmark exists and its backend is `local` or `file`, a button is shown ("Move to File" or "Move to browser"). Click emits `storageLocalToggle` with target backend; controller reuses handleStorageBackendChange so the same move path runs. Toggle is hidden when backend is pinboard or when there is no bookmark. After a successful move, both the select value and the toggle are updated (updateStorageBackendValue, updateStorageLocalToggle).

## Code locations

- popup.html: storage section, select element, and storageLocalToggleWrap / storageLocalToggleBtn
- UIManager.js: updateStorageLocalToggle(backend, hasBookmark); storageLocalToggle event on button click
- PopupController.js: fetch storage backend when loading bookmark data; call updateStorageLocalToggle after load; on storage select change or storageLocalToggle send move message and refresh; on move success update dropdown and toggle

**Response and URL handling** ([IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL](IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL.md)): Popup uses inner result (`response.data`) for success/error so UI matches router outcome; move uses bookmark URL (`currentPin.url`) when available; router allows move when bookmark has url but no time (sets time when saving to target).

## Related

- IMPL-BOOKMARK_ROUTER (moveBookmarkToStorage, getStorageBackendForUrl)
- IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL (inner result, bookmark URL, allow no-time)
