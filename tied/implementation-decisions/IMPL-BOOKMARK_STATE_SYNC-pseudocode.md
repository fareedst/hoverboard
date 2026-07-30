# [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.

## MAIN

- [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
- Contract:
  - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: consistent bookmark state across overlay, popup, badge
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
  - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
  - 2.   SEND message to backend; await processMessage result
  - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
  - How (sub-block): Re-fetch bookmark state for current URL.
  - 4. PopupController (listener for BOOKMARK_UPDATED):
  - 5.   ON BOOKMARK_UPDATED: refresh popup data (re-fetch bookmark state for current URL)
  - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
  - 6. Badge manager:
  - 7.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
