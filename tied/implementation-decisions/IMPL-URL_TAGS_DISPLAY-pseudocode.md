# [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch.
# Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router

# Tags as array; required defaults; null -> empty shape.
normalizeBookmarkForDisplay(bookmark):
  IF bookmark null: RETURN null or empty shape
  tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
  RETURN { ...bookmark, tags, ...requiredDefaults }

# Get raw from provider and normalize; caller sets needsAuth.
getBookmarkForDisplay(provider, url, title):
  raw = AWAIT provider.getBookmarkForUrl(url)
  RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth

# Get bookmark for url and return tags array.
getTagsForUrl(provider, url):
  bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
  RETURN bookmark?.tags ?? []

# Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.
getBadgeDisplayValue(bookmark, config):
  normalized = normalizeBookmarkForDisplay(bookmark)
  RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }

# Handler and popup and router usage (same IMPL set).
Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
Message handler: handleGetTagsForUrl returns getTagsForUrl
Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay
