/**
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Placeholder bookmark data for screenshot generation.
 * Seed shape: hoverboard_local_bookmarks, hoverboard_storage_index; hoverboard_theme, hoverboard_settings optional.
 */

const PINBOARD_URL = 'https://pinboard.in'
const PINBOARD_TITLE = 'Pinboard: social bookmarking'

function cleanUrl (url) {
  if (!url) return ''
  return url.trim().replace(/\/+$/, '')
}

/** Placeholder bookmarks keyed by clean URL for chrome.storage.local hoverboard_local_bookmarks */
const localBookmarks = {
  [PINBOARD_URL]: {
    url: PINBOARD_URL,
    description: PINBOARD_TITLE,
    extended: '',
    tags: ['Pinboard', 'tags'],
    time: '2025-01-15T12:00:00Z',
    updated_at: '2025-01-15T12:00:00Z',
    shared: 'yes',
    toread: 'yes',
    hash: ''
  },
  'https://example.com': {
    url: 'https://example.com',
    description: 'Example Domain',
    extended: 'Placeholder for screenshots',
    tags: ['example', 'placeholder'],
    time: '2025-01-14T10:00:00Z',
    updated_at: '2025-01-14T10:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://github.com': {
    url: 'https://github.com',
    description: 'GitHub',
    extended: '',
    tags: ['development', 'code'],
    time: '2025-01-13T09:00:00Z',
    updated_at: '2025-01-13T09:00:00Z',
    shared: 'yes',
    toread: 'yes',
    hash: ''
  },
  'https://developer.mozilla.org': {
    url: 'https://developer.mozilla.org',
    description: 'MDN Web Docs',
    extended: '',
    tags: ['docs', 'reference', 'web'],
    time: '2025-01-12T08:00:00Z',
    updated_at: '2025-01-12T08:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://www.npmjs.com': {
    url: 'https://www.npmjs.com',
    description: 'npm',
    extended: '',
    tags: ['javascript', 'packages'],
    time: '2025-01-11T07:00:00Z',
    updated_at: '2025-01-11T07:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  }
}

/** Storage index: url -> 'local' for each placeholder bookmark */
const storageIndex = {}
for (const url of Object.keys(localBookmarks)) {
  storageIndex[url] = 'local'
}

/**
 * Object to pass to chrome.storage.local.set() for seeding extension storage.
 * Keys: hoverboard_local_bookmarks, hoverboard_storage_index, hoverboard_theme (for dark popup in screenshots).
 */
export const placeholderStorageSeed = {
  hoverboard_local_bookmarks: localBookmarks,
  hoverboard_storage_index: storageIndex,
  hoverboard_theme: 'dark'
}

/**
 * Optional sync storage seed so overlay shows on page load (showHoverOnPageLoad: true).
 * Pass to chrome.storage.sync.set() in the same page.evaluate as local seed.
 */
export const placeholderSyncSeed = {
  hoverboard_settings: { showHoverOnPageLoad: true }
}

/** URL and title for popup screenshot mode (Pinboard page) */
export const screenshotPopupUrl = PINBOARD_URL
export const screenshotPopupTitle = PINBOARD_TITLE

export { cleanUrl, localBookmarks, storageIndex }
