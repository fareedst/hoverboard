# [ARCH-STORAGE_INDEX_AND_ROUTER] Storage Index and Bookmark Router

**Status**: Active  
**Cross-references**: REQ-PER_BOOKMARK_STORAGE_BACKEND, ARCH-LOCAL_STORAGE_PROVIDER, ARCH-FILE_BOOKMARK_PROVIDER, IMPL-STORAGE_INDEX, IMPL-BOOKMARK_ROUTER

---

## Summary

A **storage index** in chrome.storage.local maps each bookmark URL to its backend (`pinboard` | `local` | `file`). The **BookmarkRouter** holds references to all three providers and delegates getBookmarkForUrl, saveBookmark, deleteBookmark, saveTag, deleteTag to the provider indicated by the index (or the default storage mode for new bookmarks). getRecentBookmarks aggregates results from all three providers and returns a single list sorted by time. MessageHandler uses the router as its bookmark provider (duck-typed).

## Rationale

- Single global provider cannot support per-bookmark storage; routing by URL enables move and default for new bookmarks.
- Default storage mode (config) extended to include 'file'; migration seeds index from existing local bookmarks.

## Related

- IMPL-STORAGE_INDEX, IMPL-BOOKMARK_ROUTER
- ARCH-MOVE_BOOKMARK_UI (move = copy + delete + index update)
