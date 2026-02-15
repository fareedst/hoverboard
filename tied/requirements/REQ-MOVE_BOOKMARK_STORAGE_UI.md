# [REQ-MOVE_BOOKMARK_STORAGE_UI] Move Bookmark Storage UI

**Status**: Implemented  
**Cross-references**: ARCH-MOVE_BOOKMARK_UI, IMPL-MOVE_BOOKMARK_UI, REQ-PER_BOOKMARK_STORAGE_BACKEND

---

## Summary

The user can see the **current storage** of the current page's bookmark (Pinboard, Local, or File) and **move** it to another storage method via a UI control in the popup. Move is implemented as copy to target backend, delete from source, and update storage index. Options page explains default storage for new bookmarks with a three-way choice.

## Satisfaction Criteria

- Popup shows current bookmark storage and a control (e.g. dropdown) to move to Pinboard, Local, or File.
- When the bookmark is stored in **Local (browser)** or **File (folder)**, a dedicated one-click control allows toggling between file and browser storage ("Move to File" when current is local, "Move to browser" when current is file). Hidden when storage is Pinboard or when there is no bookmark for the current URL.
- **UI reflects actual move result**: Popup uses the inner router result (service worker wraps as `{ success: true, data: routerResult }`); success/error message and UI updates only when the move actually succeeded.
- **Move uses bookmark URL**: When sending moveBookmarkToStorage, popup uses the current bookmark's URL (e.g. `currentPin.url`) when available so the move key matches storage (avoids query-string or tab-URL mismatch).
- **Move succeeds when bookmark has url but no time**: Router treats a bookmark as found when it has `bookmark.url`; if `time` is missing, it is set when saving to the target so legacy or provider-returned bookmarks without time can be moved.
- Message types getStorageBackendForUrl and moveBookmarkToStorage implemented and used.
- Options: "Default storage for new bookmarks" with three options.

## Related

- IMPL-MOVE_BOOKMARK_UI, ARCH-MOVE_BOOKMARK_UI, IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL
- REQ-PER_BOOKMARK_STORAGE_BACKEND (router provides move)
