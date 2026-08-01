/**
 * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Standalone Visit History page entry.
 */
import { initVisitHistoryPage } from './visit-history-panel.js'
import { initToolPageVersion } from '../styles/tool-page-version.js'

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING_UI ===
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-NON_WEB_TOOLS_TOOLBAR] How: visit-history.js DOMContentLoaded → tool-page-version + initVisitHistoryPage(); not a side-panel tab.
 *
 * ## INIT_VISIT_HISTORY_PAGE
 *
 * - Contract:
 *   - INPUT: DOMContentLoaded on visit-history.html; or tools-toolbar btn-visit-history tabs.create
 *   - PRE: visit-history.html shell with #visitHistoryPanel in document when init runs
 *   - OUTPUT: page chrome versioned; Most Visited / Recently Visited / Navigation Graph initialized
 *   - POST: side panel has no Usage tab button; TAB_IDS exclude usage
 *   - EFFECTS: IO (tabs.create from toolbar; usage/graph messages from page)
 *   - TERMINATION: total
 * - PROCEDURE: INIT_VISIT_HISTORY_PAGE
 *   - ON DOMContentLoaded: initToolPageVersion(); initVisitHistoryPage()
 *   - initVisitHistoryPage(): send getBookmarkUsageStats({ n: 10 }), getBookmarkNavigationGraph(); render Most Visited (mostFrequent), Recently Visited (mostRecent), Navigation Graph (edges grouped by sourceUrl)
 *   - ON tools-toolbar btn-visit-history: tabs.create(getURL('src/ui/visit-history/visit-history.html'))
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING_UI ===
 */
export function bindVisitHistoryPage () {
  initToolPageVersion()
  initVisitHistoryPage()
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', bindVisitHistoryPage)
}
