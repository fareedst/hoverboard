# [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION]
# BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.

# Contract: input = user actions and processMessage result; output = consistent state across overlay, popup, badge.
INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
OUTPUT: consistent bookmark state across overlay, popup, badge
DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast

# Send message to backend; on success broadcast BOOKMARK_UPDATED.
ON overlay toggle (saveBookmark / saveTag / deleteTag):
  SEND message to backend; await processMessage result
  BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)

# Re-fetch bookmark state for current URL.
PopupController (listener for BOOKMARK_UPDATED):
  ON BOOKMARK_UPDATED: refresh popup data (re-fetch bookmark state for current URL)

# On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
Badge manager:
  ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
