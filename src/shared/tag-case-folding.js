/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Suggested Tags label case folding for This Page chips (original | lower | upper).
 * Unicode case mapping via String.prototype.toLowerCase / toUpperCase (product default).
 */

/** @typedef {'original' | 'lower' | 'upper'} TagCaseFoldingMode */

export const TAG_CASE_FOLDING_MODES = /** @type {const} */ (['original', 'lower', 'upper'])

/**
 * @param {string} mode
 * @returns {mode is TagCaseFoldingMode}
 */
export function isTagCaseFoldingMode (mode) {
  return TAG_CASE_FOLDING_MODES.includes(/** @type {TagCaseFoldingMode} */ (mode))
}

/**
 * Whether a source string should be omitted from chip lists (empty / whitespace-only).
 * @param {unknown} source
 * @returns {boolean}
 */
export function isEmptyOrWhitespaceOnlyTag (source) {
  if (source == null) return true
  if (typeof source !== 'string') return true
  return source.trim().length === 0
}

/**
 * Display label and value used when adding a Suggested Tag from a chip.
 * @param {string} source - Non-empty trimmed or raw from caller; caller should skip empties
 * @param {TagCaseFoldingMode} mode
 * @returns {{ display: string, addValue: string }}
 */
export function tagChipDisplayAndAddValue (source, mode) {
  const t = typeof source === 'string' ? source.trim() : ''
  if (mode === 'lower') return { display: t.toLowerCase(), addValue: t.toLowerCase() }
  if (mode === 'upper') return { display: t.toUpperCase(), addValue: t.toUpperCase() }
  return { display: t, addValue: t }
}

/**
 * Label shown for a tag already on the bookmark; Current/Recent Tags retain source casing.
 * @param {string} stored
 * @returns {string}
 */
export function currentTagDisplayLabel (stored) {
  return typeof stored === 'string' ? stored.trim() : ''
}
