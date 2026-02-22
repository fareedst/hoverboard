/**
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
 * Single source for tags-for-URL and badge display; normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue.
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] normalizeBookmarkForDisplay includes updated_at (default to time when missing).
 */

/**
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] Normalize raw bookmark from any provider for display.
 * Ensures tags is always Array<string> and required fields exist.
 * @param {Object|null|undefined} bookmark - Raw bookmark from pinboard/local/file/sync
 * @returns {Object} Normalized bookmark with tags array and defaulted fields
 */
export function normalizeBookmarkForDisplay (bookmark) {
  if (!bookmark || typeof bookmark !== 'object') {
    return {
      url: '',
      description: '',
      extended: '',
      tags: [],
      time: '',
      updated_at: '',
      shared: 'yes',
      toread: 'no',
      hash: ''
    }
  }
  const tags = bookmark.tags == null
    ? []
    : Array.isArray(bookmark.tags)
      ? bookmark.tags.filter(t => t != null && String(t).trim())
      : String(bookmark.tags).split(/\s+/).filter(Boolean)
  const time = bookmark.time ?? ''
  return {
    url: bookmark.url ?? '',
    description: bookmark.description ?? '',
    extended: bookmark.extended ?? '',
    tags,
    time,
    updated_at: bookmark.updated_at ?? time ?? '',
    shared: bookmark.shared === 'no' ? 'no' : 'yes',
    toread: bookmark.toread === 'yes' ? 'yes' : 'no',
    hash: bookmark.hash ?? ''
  }
}

/**
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] Fetch bookmark for a URL and return normalized for display.
 * @param {Object} bookmarkProvider - Duck-typed { getBookmarkForUrl(url, title) }
 * @param {string} url - Page URL
 * @param {string} [title=''] - Optional title fallback
 * @returns {Promise<Object>} Normalized bookmark (tags always array)
 */
export async function getBookmarkForDisplay (bookmarkProvider, url, title = '') {
  if (!bookmarkProvider || typeof bookmarkProvider.getBookmarkForUrl !== 'function') {
    return normalizeBookmarkForDisplay(null)
  }
  const raw = await bookmarkProvider.getBookmarkForUrl(url, title)
  return normalizeBookmarkForDisplay(raw)
}

/**
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] Get tags array for a URL from the same source as display.
 * @param {Object} bookmarkProvider - Duck-typed { getBookmarkForUrl(url, title) }
 * @param {string} url - Page URL
 * @returns {Promise<string[]>} Normalized tags array
 */
export async function getTagsForUrl (bookmarkProvider, url) {
  const bookmark = await getBookmarkForDisplay(bookmarkProvider, url)
  return bookmark.tags || []
}

/**
 * Default badge config when none provided.
 */
const DEFAULT_BADGE_CONFIG = {
  badgeTextIfNotBookmarked: '-',
  badgeTextIfPrivate: '*',
  badgeTextIfQueued: '!',
  badgeTextIfBookmarkedNoTags: '0'
}

/**
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] Compute badge display value from bookmark.
 * Single place for tag count and flags so badge and popup never diverge.
 * @param {Object} bookmark - Raw or normalized bookmark
 * @param {Object} [config] - Badge config (badgeTextIfNotBookmarked, etc.)
 * @returns {{ text: string, tagCount: number, isPrivate: boolean, isToRead: boolean, isBookmarked: boolean, title: string }}
 */
export function getBadgeDisplayValue (bookmark, config = {}) {
  const cfg = { ...DEFAULT_BADGE_CONFIG, ...config }
  const norm = normalizeBookmarkForDisplay(bookmark)
  const isBookmarked = !!(norm.hash && norm.hash.length > 0)
  const tagCount = norm.tags ? norm.tags.length : 0
  const isPrivate = norm.shared === 'no'
  const isToRead = norm.toread === 'yes'

  let text = ''
  if (!isBookmarked) {
    text = cfg.badgeTextIfNotBookmarked || '-'
  } else {
    if (isPrivate) text += cfg.badgeTextIfPrivate || '*'
    text += String(tagCount)
    if (isToRead) text += cfg.badgeTextIfQueued || '!'
  }

  const title = isBookmarked
    ? ['Hoverboard']
        .concat(norm.description ? [`"${norm.description}"`] : [])
        .concat(norm.tags && norm.tags.length ? [`Tags: ${norm.tags.join(', ')}`] : [])
        .concat(isPrivate ? ['(Private)'] : [])
        .concat(isToRead ? ['(Read Later)'] : [])
        .join(' | ')
    : 'Hoverboard - Page not bookmarked'

  return {
    text,
    tagCount,
    isPrivate,
    isToRead,
    isBookmarked,
    title
  }
}
