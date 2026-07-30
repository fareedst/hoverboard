# [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] — How: create/update/delete bookmarks via MessageHandler without leaving the page; tag suggestions remain available.

## SAVE_BOOKMARK

- [IMPL-BOOKMARKING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: validate envelope/data then route save through storage backend; broadcast update on success.
- Contract:
  - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_BOOKMARK
  - validated = validateMessageData(message)
  - IF invalid: RETURN error payload
  - result = AWAIT bookmarkRouter.save(validated)
  - IF result.ok: BROADCAST BOOKMARK_UPDATED
  - RETURN result
  - How (sub-block): How: load current bookmark for URL for overlay/popup display.

## GET_CURRENT_BOOKMARK

- [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements GET_CURRENT_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
- Contract:
  - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: GET_CURRENT_BOOKMARK
  - RETURN AWAIT bookmarkRouter.get(url) OR empty bookmark view
  - How (sub-block): How: delete bookmark for URL and notify listeners.

## DELETE_BOOKMARK

- [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements DELETE_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
- Contract:
  - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: DELETE_BOOKMARK
  - result = AWAIT bookmarkRouter.delete(url)
  - IF result.ok: BROADCAST BOOKMARK_UPDATED
  - RETURN result
