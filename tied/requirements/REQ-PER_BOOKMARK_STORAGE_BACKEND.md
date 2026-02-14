# [REQ-PER_BOOKMARK_STORAGE_BACKEND] Per-Bookmark Storage Backend

**Status**: Planned  
**Cross-references**: ARCH-STORAGE_INDEX_AND_ROUTER, IMPL-STORAGE_INDEX, IMPL-BOOKMARK_ROUTER

---

## Summary

Each bookmark is **tagged with a storage method**: `pinboard`, `local`, or `file`. A **storage index** (in chrome.storage.local) maps URL → backend. A **BookmarkRouter** delegates get/save/delete to the correct provider per URL; new bookmarks use a **configurable default** backend when the URL is not in the index. getRecentBookmarks aggregates from all three providers.

## Purpose

- Allow mixing bookmarks across Pinboard, local browser storage, and file.
- Enable moving a bookmark from one storage method to another (copy to target, delete from source, update index).
- Default storage for new bookmarks from config (extended to include 'file').

## Satisfaction Criteria

- Storage index: key `hoverboard_storage_index`, shape `{ "<url>": "pinboard"|"local"|"file" }`; getIndex, setBackendForUrl, getBackendForUrl, removeUrl.
- BookmarkRouter: getBookmarkForUrl, saveBookmark, deleteBookmark, saveTag, deleteTag use index or default; getRecentBookmarks aggregates all three, sorted by time.
- Migration: existing local bookmarks get index entry 'local'.

## Related

- ARCH-STORAGE_INDEX_AND_ROUTER, IMPL-STORAGE_INDEX, IMPL-BOOKMARK_ROUTER
- REQ-MOVE_BOOKMARK_STORAGE_UI (move UI uses getStorageBackendForUrl and moveBookmarkToStorage)
