/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Sticky Table Display: set CSS variable --table-display-sticky-height on root from tableDisplayEl height
 * so thead sticky top aligns below the Table Display block.
 */

/**
 * Set --table-display-sticky-height on rootEl to tableDisplayEl.offsetHeight (px).
 * No-op if either argument is null or undefined.
 * @param {HTMLElement | null | undefined} tableDisplayEl - Table Display fieldset (or wrapper) element
 * @param {HTMLElement | null | undefined} rootEl - Element on which to set the CSS variable (e.g. .container or document.documentElement)
 */
function setTableDisplayStickyHeight (tableDisplayEl, rootEl) {
  if (!tableDisplayEl || !rootEl) return
  const height = tableDisplayEl.offsetHeight
  rootEl.style.setProperty('--table-display-sticky-height', `${height}px`)
}

export { setTableDisplayStickyHeight }
