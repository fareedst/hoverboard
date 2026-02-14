# [REQ-MOVE_BOOKMARK_STORAGE_UI] Move Bookmark Storage UI

**Status**: Planned  
**Cross-references**: ARCH-MOVE_BOOKMARK_UI, IMPL-MOVE_BOOKMARK_UI, REQ-PER_BOOKMARK_STORAGE_BACKEND

---

## Summary

The user can see the **current storage** of the current page's bookmark (Pinboard, Local, or File) and **move** it to another storage method via a UI control in the popup. Move is implemented as copy to target backend, delete from source, and update storage index. Options page explains default storage for new bookmarks with a three-way choice.

## Satisfaction Criteria

- Popup shows current bookmark storage and a control (e.g. dropdown) to move to Pinboard, Local, or File.
- Message types getStorageBackendForUrl and moveBookmarkToStorage implemented and used.
- Options: "Default storage for new bookmarks" with three options.

## Related

- IMPL-MOVE_BOOKMARK_UI, ARCH-MOVE_BOOKMARK_UI
- REQ-PER_BOOKMARK_STORAGE_BACKEND (router provides move)
