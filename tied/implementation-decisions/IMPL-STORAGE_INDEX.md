# [IMPL-STORAGE_INDEX] Storage Index

**Status**: Active  
**Cross-references**: REQ-PER_BOOKMARK_STORAGE_BACKEND, ARCH-STORAGE_INDEX_AND_ROUTER

---

## Summary

**StorageIndex** manages the per-URL storage backend mapping in chrome.storage.local under key `hoverboard_storage_index`. Shape: `{ "<url>": "pinboard"|"local"|"file" }`. Methods: getIndex(), setBackendForUrl(url, backend), getBackendForUrl(url), removeUrl(url). Migration: on first use (or when index empty), seed from LocalBookmarkService.getAllBookmarks() by setting index[url] = 'local' for each URL.

## Code locations

- `src/features/storage/storage-index.js`: StorageIndex class; optional migration when index is empty (requires LocalBookmarkService for migration).

## Related

- IMPL-BOOKMARK_ROUTER (consumes index)
- ARCH-STORAGE_INDEX_AND_ROUTER
