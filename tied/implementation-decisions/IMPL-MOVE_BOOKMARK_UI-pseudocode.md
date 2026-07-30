# [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] — Popup Save to five buttons; load backend, move on click, preferredBackend on save. Contract: URL and bookmark and actions; highlighted button and move/save requests.

## MAIN

- [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] How: Logical block for IMPL-MOVE_BOOKMARK_UI.
- Contract:
  - INPUT: currentUrl (tab), currentPin (current bookmark if any), user action (select storage button, save)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: highlighted storage button; move request; save request with preferredBackend | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: storage section with five buttons (Pinboard, Local, File, Sync, Browser); one has aria-pressed="true"
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Http, IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Set highlighted button from getStorageBackendForUrl or default; update Pinboard enabled.
  - 1. ON popup load (or bookmark data load):
  - 2.   IF currentPin exists: backend = send getStorageBackendForUrl(currentUrl)
  - 3.   ELSE: backend = defaultStorageMode
  - 4.   SET highlighted button to backend (data-backend attribute)
  - 5.   updateStoragePinboardEnabled(hasApiToken)
  - How (sub-block): Send move; use inner result; refresh and update UI on success.
  - 6. ON storage button click (user selects different backend):
  - 7.   url = currentPin?.url || currentTab?.url
  - 8.   SEND moveBookmarkToStorage(url, targetBackend)
  - 9.   result = response?.data ?? response   // inner result (IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL)
  - 10.   IF result.success: refresh bookmark data; update highlighted button
  - 11.   ELSE: show error from result
  - How (sub-block): Set preferredBackend from selected button; send saveBookmark so router uses highlighted storage.
  - 12. ON save (createBookmark, addTagsToBookmark, toggle private, toggle read-later):
  - 13.   data.preferredBackend = getSelectedStorageBackend()   // button with aria-pressed="true"
  - 14.   SEND saveBookmark(data)   // router uses preferredBackend
