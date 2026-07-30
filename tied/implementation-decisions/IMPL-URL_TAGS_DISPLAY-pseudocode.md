# [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch. Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
> Five-backend note: BookmarkRouter five backends (pinboard|local|file|sync|browser).


## NORMALIZE_BOOKMARK_FOR_DISPLAY

- [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements normalizeBookmarkForDisplay(bookmark) behavior for IMPL-URL_TAGS_DISPLAY.
- Contract:
  - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: NORMALIZE_BOOKMARK_FOR_DISPLAY
  - IF bookmark null: RETURN null or empty shape
  - tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
  - RETURN { ...bookmark, tags, ...requiredDefaults }
  - How (sub-block): Get raw from provider and normalize; caller sets needsAuth.

## GET_BOOKMARK_FOR_DISPLAY

- [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForDisplay(provider, url, title) behavior for IMPL-URL_TAGS_DISPLAY.
- Contract:
  - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
  - EFFECTS: Async
  - TERMINATION: total
- PROCEDURE: GET_BOOKMARK_FOR_DISPLAY
  - raw = AWAIT provider.getBookmarkForUrl(url)
  - RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth
  - How (sub-block): Get bookmark for url and return tags array.

## GET_TAGS_FOR_URL

- [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getTagsForUrl(provider, url) behavior for IMPL-URL_TAGS_DISPLAY.
- Contract:
  - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
  - EFFECTS: Async
  - TERMINATION: total
- PROCEDURE: GET_TAGS_FOR_URL
  - bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
  - RETURN bookmark?.tags ?? []
  - How (sub-block): Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.

## GET_BADGE_DISPLAY_VALUE

- [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBadgeDisplayValue(bookmark, config) behavior for IMPL-URL_TAGS_DISPLAY.
- Contract:
  - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Http, State
  - TERMINATION: total
- PROCEDURE: GET_BADGE_DISPLAY_VALUE
  - normalized = normalizeBookmarkForDisplay(bookmark)
  - RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }
  - How (sub-block): Handler and popup and router usage (same IMPL set).
  - 1. Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
  - 2. Message handler: handleGetTagsForUrl returns getTagsForUrl
  - 3. Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
  - 4. Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay