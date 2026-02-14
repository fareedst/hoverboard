# [IMPL-MOVE_BOOKMARK_UI] Move Bookmark Storage UI

**Status**: Active  
**Cross-references**: REQ-MOVE_BOOKMARK_STORAGE_UI, ARCH-MOVE_BOOKMARK_UI

---

## Summary

Popup includes a **Storage** section with a `<select>` (or buttons) for Pinboard, Local, File. On load, popup sends getStorageBackendForUrl(currentUrl) and sets the select value. On change, popup sends moveBookmarkToStorage(url, targetBackend) and refreshes bookmark data.

## Code locations

- popup.html: storage section and select element
- PopupController.js: fetch storage backend when loading bookmark data; on storage select change send move message and refresh

## Related

- IMPL-BOOKMARK_ROUTER (moveBookmarkToStorage, getStorageBackendForUrl)
