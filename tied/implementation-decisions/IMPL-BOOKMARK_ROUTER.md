# [IMPL-BOOKMARK_ROUTER] Bookmark Router

**Status**: Active  
**Cross-references**: REQ-PER_BOOKMARK_STORAGE_BACKEND, ARCH-STORAGE_INDEX_AND_ROUTER, IMPL-STORAGE_INDEX

---

## Summary

**BookmarkRouter** holds pinboardProvider, localProvider, fileProvider, storageIndex, and defaultStorageMode (from config). Implements provider contract: getBookmarkForUrl(url), getRecentBookmarks(count), saveBookmark(data), deleteBookmark(url), saveTag(data), deleteTag(data), testConnection(). Resolves provider per URL via getBackendForUrl(url) or defaultStorageMode. getRecentBookmarks fetches from all three providers, merges, sorts by time descending, slices to count. Extra methods for move UI: getStorageBackendForUrl(url), moveBookmarkToStorage(url, targetBackend) (get from current, save to target, delete from source, update index).

## Code locations

- `src/features/storage/bookmark-router.js`: BookmarkRouter class.

## Related

- IMPL-STORAGE_INDEX, IMPL-LOCAL_BOOKMARK_SERVICE, IMPL-FILE_BOOKMARK_SERVICE
- ARCH-STORAGE_INDEX_AND_ROUTER
