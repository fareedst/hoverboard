# [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES]
# Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.

# Contract: inputs = bookmark data, API response, or raw record; output = bookmark with time and updated_at.
INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
OUTPUT: bookmark with time and updated_at set per provider and context
DATA: time = create time; updated_at = last update time

# Create: time = now, updated_at = now; update: keep time, updated_at = now; persist.
Local/File/Sync saveBookmark(data):
  IF url not in store (create):
    SET time = now, updated_at = now
  ELSE (update):
    KEEP existing time; SET updated_at = now
  PERSIST

# API has no updated_at; set updated_at = time in parse/create; do not send updated_at to API.
Pinboard:
  parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
  SEND to API: do NOT include updated_at

# If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
Normalize (url-tags-manager, display, move, export/import):
  IF bookmark has no updated_at: SET updated_at = time   // legacy
  ELSE: keep updated_at
  Include updated_at in payload/CSV/JSON
