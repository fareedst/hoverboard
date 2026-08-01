/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING]
 * Fill tool-page brand-row version from the extension manifest.
 * Used by Index, Import, Options, Browser Bookmarks, Visit History (tool page shell).
 */

/**
 * @param {ParentNode} [root=document]
 * @param {string} [version] - Override for tests; otherwise chrome.runtime.getManifest().version
 */
export function initToolPageVersion (root = document, version) {
  const el = root.querySelector?.('[data-extension-version]')
  if (!el) return
  const v = version ?? (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.()?.version) ?? ''
  el.textContent = v ? `v${v}` : ''
}
