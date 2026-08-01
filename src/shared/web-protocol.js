/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR]
 * Web-protocol allowlist for side-panel / badge routing (http/https only).
 * Distinct from classifyScriptInjectionUrl (extensions gallery may be https but non-injectable).
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
 * [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: Allowlist http/https only for web-protocol routing (distinct from script inject classifier).
 *
 * ## IS_WEB_PROTOCOL_URL
 *
 * - Contract:
 *   - INPUT: url (string | unknown)
 *   - PRE: none
 *   - OUTPUT: boolean
 *   - POST: true iff trimmed lower starts with http:// or https://
 *   - EFFECTS: none
 *   - TERMINATION: total
 * - PROCEDURE: IS_WEB_PROTOCOL_URL
 *   - IF typeof url !== 'string' RETURN false
 *   - lower = trim(url).toLowerCase()
 *   - IF lower === '' RETURN false
 *   - RETURN lower.startsWith('http://') OR lower.startsWith('https://')
 *
 * === END IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
 */

/**
 * @param {unknown} url
 * @returns {boolean}
 */
export function isWebProtocolUrl (url) {
  if (typeof url !== 'string') return false
  const lower = url.trim().toLowerCase()
  if (!lower) return false
  return lower.startsWith('http://') || lower.startsWith('https://')
}
