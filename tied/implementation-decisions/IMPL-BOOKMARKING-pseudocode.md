# [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING]
# How: create/update/delete bookmarks via MessageHandler without leaving the page; tag suggestions remain available.
INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload
DATA: MessageHandler; BookmarkRouter / Pinboard / local / file providers; overlay and popup callers

# [IMPL-BOOKMARKING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING]
# How: validate envelope/data then route save through storage backend; broadcast update on success.
SAVE_BOOKMARK(message):
  validated = validateMessageData(message)
  IF invalid: RETURN error payload
  result = AWAIT bookmarkRouter.save(validated)
  IF result.ok: BROADCAST BOOKMARK_UPDATED
  RETURN result

# How: load current bookmark for URL for overlay/popup display.
GET_CURRENT_BOOKMARK(url):
  RETURN AWAIT bookmarkRouter.get(url) OR empty bookmark view

# How: delete bookmark for URL and notify listeners.
DELETE_BOOKMARK(url):
  result = AWAIT bookmarkRouter.delete(url)
  IF result.ok: BROADCAST BOOKMARK_UPDATED
  RETURN result
