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

/** [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Placeholder bookmarks keyed by clean URL for chrome.storage.local hoverboard_local_bookmarks. Rich set (15+) and hero Pinboard entry for robust screenshot/demo media. */
const localBookmarks = {
  [PINBOARD_URL]: {
    url: PINBOARD_URL,
    description: PINBOARD_TITLE,
    extended: 'Main bookmarking service. Syncs with extension and file export.',
    tags: ['bookmarks', 'pinboard', 'reading', 'tools', 'sync', 'reference', 'favorites'],
    time: '2025-01-15T12:00:00Z',
    updated_at: '2025-01-15T12:00:00Z',
    shared: 'yes',
    toread: 'yes',
    hash: ''
  },
  'https://example.com': {
    url: 'https://example.com',
    description: 'Example Domain',
    extended: 'Placeholder for screenshots and demos.',
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
    extended: 'Code hosting and collaboration.',
    tags: ['development', 'code', 'git', 'repos'],
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
    tags: ['docs', 'reference', 'web', 'javascript', 'html', 'css'],
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
    tags: ['javascript', 'packages', 'node'],
    time: '2025-01-11T07:00:00Z',
    updated_at: '2025-01-11T07:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://playwright.dev': {
    url: 'https://playwright.dev',
    description: 'Playwright',
    extended: 'Browser automation and E2E testing.',
    tags: ['testing', 'e2e',],
    time: '2025-01-10T14:00:00Z',
    updated_at: '2025-01-10T14:00:00Z',
    shared: 'yes',
    toread: 'yes',
    hash: ''
  },
  'https://nodejs.org': {
    url: 'https://nodejs.org',
    description: 'Node.js',
    extended: '',
    tags: ['node', 'javascript', 'runtime'],
    time: '2025-01-09T11:00:00Z',
    updated_at: '2025-01-09T11:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://stackoverflow.com': {
    url: 'https://stackoverflow.com',
    description: 'Stack Overflow',
    extended: 'Q&A for developers.',
    tags: ['qa', 'programming', 'help'],
    time: '2025-01-08T16:00:00Z',
    updated_at: '2025-01-08T16:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://docs.npmjs.com': {
    url: 'https://docs.npmjs.com',
    description: 'npm documentation',
    extended: '',
    tags: ['npm', 'docs', 'packages'],
    time: '2025-01-07T09:30:00Z',
    updated_at: '2025-01-07T09:30:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://web.dev': {
    url: 'https://web.dev',
    description: 'web.dev',
    extended: 'Web development guides and best practices.',
    tags: ['web', 'docs', 'performance'],
    time: '2025-01-06T13:00:00Z',
    updated_at: '2025-01-06T13:00:00Z',
    shared: 'yes',
    toread: 'yes',
    hash: ''
  },
  'https://www.typescriptlang.org': {
    url: 'https://www.typescriptlang.org',
    description: 'TypeScript',
    extended: '',
    tags: ['typescript', 'javascript'],
    time: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://eslint.org': {
    url: 'https://eslint.org',
    description: 'ESLint',
    extended: 'Linting for JavaScript.',
    tags: ['lint', 'javascript'],
    time: '2025-01-04T08:00:00Z',
    updated_at: '2025-01-04T08:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://jestjs.io': {
    url: 'https://jestjs.io',
    description: 'Jest',
    extended: '',
    tags: ['testing', 'javascript'],
    time: '2025-01-03T12:00:00Z',
    updated_at: '2025-01-03T12:00:00Z',
    shared: 'yes',
    toread: 'no',
    hash: ''
  },
  'https://nodejs.org/docs': {
    url: 'https://nodejs.org/docs',
    description: 'Node.js docs',
    extended: '',
    tags: ['node', 'docs', 'api'],
    time: '2025-01-02T14:00:00Z',
    updated_at: '2025-01-02T14:00:00Z',
    shared: 'yes',
    toread: 'yes',
    hash: ''
  }
}

/** Storage index: url -> 'local' for each placeholder bookmark */
const storageIndex = {}
for (const url of Object.keys(localBookmarks)) {
  storageIndex[url] = 'local'
}

/** [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Sample suggested tags for screenshot/demo so Suggested Tags section is visible. */
export const placeholderSuggestedTags = ['bookmarks', 'reading', 'reference', 'sync', 'tools', 'favorites']

/** [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] Sample recent tags for screenshot/demo so Recent Tags section is visible (distinct from Current so both show). */
export const placeholderRecentTags = ['demo', 'reading', 'tools', 'reference', 'sync']

/**
 * Object to pass to chrome.storage.local.set() for seeding extension storage.
 * Keys: hoverboard_local_bookmarks, hoverboard_storage_index, hoverboard_theme (for dark popup in screenshots), hoverboard_demo_suggested_tags, hoverboard_demo_recent_tags (for Suggested/Recent Tags in screenshot/demo).
 */
export const placeholderStorageSeed = {
  hoverboard_local_bookmarks: localBookmarks,
  hoverboard_storage_index: storageIndex,
  hoverboard_theme: 'dark',
  hoverboard_demo_suggested_tags: placeholderSuggestedTags,
  hoverboard_demo_recent_tags: placeholderRecentTags
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

/**
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] Rich usage seed for screenshot/demo so Usage tab shows robust data.
 * Returns hoverboard_bookmark_usage with varied visitCount and lastVisitedAt (relative to baseDate).
 * @param {number} [baseDate=Date.now()]
 * @returns {{ hoverboard_bookmark_usage: Record<string, { url: string, visitCount: number, lastVisitedAt: string, firstVisitedAt: string, recentVisits: string[] }> }}
 */
export function getPlaceholderUsageSeed (baseDate = Date.now()) {
  const t = (minsAgo) => new Date(baseDate - minsAgo * 60 * 1000).toISOString()
  const entries = [
    { url: 'https://pinboard.in', visitCount: 42, lastMinsAgo: 120, firstMinsAgo: 60 * 24 * 30 },
    { url: 'https://github.com', visitCount: 28, lastMinsAgo: 5, firstMinsAgo: 60 * 24 * 14 },
    { url: 'https://developer.mozilla.org', visitCount: 18, lastMinsAgo: 60 * 24, firstMinsAgo: 60 * 24 * 21 },
    { url: 'https://example.com', visitCount: 15, lastMinsAgo: 180, firstMinsAgo: 60 * 24 * 7 },
    { url: 'https://www.npmjs.com', visitCount: 12, lastMinsAgo: 30, firstMinsAgo: 60 * 24 * 10 },
    { url: 'https://playwright.dev', visitCount: 10, lastMinsAgo: 60, firstMinsAgo: 60 * 24 * 5 },
    { url: 'https://nodejs.org', visitCount: 8, lastMinsAgo: 60 * 24 * 2, firstMinsAgo: 60 * 24 * 20 },
    { url: 'https://stackoverflow.com', visitCount: 6, lastMinsAgo: 240, firstMinsAgo: 60 * 24 * 3 },
    { url: 'https://docs.npmjs.com', visitCount: 5, lastMinsAgo: 60 * 12, firstMinsAgo: 60 * 24 * 2 },
    { url: 'https://web.dev', visitCount: 4, lastMinsAgo: 60 * 24 * 3, firstMinsAgo: 60 * 24 * 7 }
  ]
  const hoverboard_bookmark_usage = {}
  for (const { url, visitCount, lastMinsAgo, firstMinsAgo } of entries) {
    const lastVisitedAt = t(lastMinsAgo)
    const firstVisitedAt = t(firstMinsAgo)
    const recentVisits = Array.from({ length: Math.min(visitCount, 10) }, (_, i) => t(lastMinsAgo + i))
    hoverboard_bookmark_usage[url] = { url, visitCount, lastVisitedAt, firstVisitedAt, recentVisits }
  }
  return { hoverboard_bookmark_usage }
}

/**
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] Rich navigation edges seed for screenshot/demo so Usage tab graph has multiple sources/targets.
 * Edges are keyed by targetUrl; each value is array of { sourceUrl, targetUrl, count, lastTraversedAt, firstTraversedAt }.
 * @param {number} [baseDate=Date.now()]
 * @returns {{ hoverboard_bookmark_nav_edges: Record<string, Array<{ sourceUrl: string, targetUrl: string, count: number, lastTraversedAt: string, firstTraversedAt: string }>> }}
 */
export function getPlaceholderEdgesSeed (baseDate = Date.now()) {
  const t = (minsAgo) => new Date(baseDate - minsAgo * 60 * 1000).toISOString()
  const hoverboard_bookmark_nav_edges = {
    'https://github.com': [
      { sourceUrl: 'https://pinboard.in', targetUrl: 'https://github.com', count: 12, lastTraversedAt: t(10), firstTraversedAt: t(60 * 24 * 5) },
      { sourceUrl: 'https://example.com', targetUrl: 'https://github.com', count: 5, lastTraversedAt: t(30), firstTraversedAt: t(60 * 24 * 2) },
      { sourceUrl: 'https://developer.mozilla.org', targetUrl: 'https://github.com', count: 3, lastTraversedAt: t(60), firstTraversedAt: t(60 * 24) }
    ],
    'https://developer.mozilla.org': [
      { sourceUrl: 'https://github.com', targetUrl: 'https://developer.mozilla.org', count: 8, lastTraversedAt: t(60 * 23), firstTraversedAt: t(60 * 24 * 14) },
      { sourceUrl: 'https://stackoverflow.com', targetUrl: 'https://developer.mozilla.org', count: 4, lastTraversedAt: t(60 * 24 * 2), firstTraversedAt: t(60 * 24 * 7) }
    ],
    'https://www.npmjs.com': [
      { sourceUrl: 'https://github.com', targetUrl: 'https://www.npmjs.com', count: 6, lastTraversedAt: t(45), firstTraversedAt: t(60 * 24 * 3) },
      { sourceUrl: 'https://nodejs.org', targetUrl: 'https://www.npmjs.com', count: 5, lastTraversedAt: t(60 * 24), firstTraversedAt: t(60 * 24 * 10) }
    ],
    'https://playwright.dev': [
      { sourceUrl: 'https://github.com', targetUrl: 'https://playwright.dev', count: 7, lastTraversedAt: t(90), firstTraversedAt: t(60 * 24 * 4) },
      { sourceUrl: 'https://developer.mozilla.org', targetUrl: 'https://playwright.dev', count: 2, lastTraversedAt: t(60 * 24), firstTraversedAt: t(60 * 24 * 2) }
    ],
    'https://nodejs.org': [
      { sourceUrl: 'https://pinboard.in', targetUrl: 'https://nodejs.org', count: 4, lastTraversedAt: t(60 * 24 * 2 + 30), firstTraversedAt: t(60 * 24 * 15) }
    ],
    'https://example.com': [
      { sourceUrl: 'https://pinboard.in', targetUrl: 'https://example.com', count: 3, lastTraversedAt: t(200), firstTraversedAt: t(60 * 24 * 6) }
    ]
  }
  return { hoverboard_bookmark_nav_edges }
}

export { cleanUrl, localBookmarks, storageIndex }
