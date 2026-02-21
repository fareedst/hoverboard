/**
 * [REQ-AI_TAGGING_POPUP] [IMPL-AI_TAGGING_POPUP_UI] Pure helpers for AI tagging popup flow (split inSession vs suggested).
 */

/**
 * Split AI-returned tags into those that are in the session set (auto-apply) and the rest (suggested).
 * @param {string[]} aiTags - Tags returned by AI
 * @param {Set<string>|string[]} sessionTags - Session tags (lowercase for comparison)
 * @returns {{ inSession: string[], suggested: string[] }}
 */
export function splitAiTagsBySession (aiTags, sessionTags) {
  const set = sessionTags instanceof Set ? sessionTags : new Set((sessionTags || []).map(t => String(t).toLowerCase()))
  const inSession = []
  const suggested = []
  for (const tag of aiTags || []) {
    const t = String(tag).trim()
    if (!t) continue
    if (set.has(t.toLowerCase())) {
      inSession.push(t)
    } else {
      suggested.push(t)
    }
  }
  return { inSession, suggested }
}
