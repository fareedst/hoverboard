/**
 * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP]
 * In-session set of tags added to any URL this session; getSessionTags, recordSessionTags; auto-apply when AI returns.
 */

const SESSION_TAGS_KEY = 'hoverboard_session_tags'

/** In-memory fallback when chrome.storage.session is not available (e.g. MV2 or tests) */
let inMemorySessionTags = []

function hasSessionStorage () {
  return typeof chrome !== 'undefined' && chrome.storage && typeof chrome.storage.session !== 'undefined' && chrome.storage.session.get
}

/**
 * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Get the set of tags (lowercase) added this session.
 * @returns {Promise<string[]>}
 */
export async function getSessionTags () {
  if (hasSessionStorage()) {
    try {
      const result = await chrome.storage.session.get(SESSION_TAGS_KEY)
      const arr = result[SESSION_TAGS_KEY]
      return Array.isArray(arr) ? arr.map(t => String(t).toLowerCase()) : []
    } catch {
      return []
    }
  }
  return inMemorySessionTags.map(t => String(t).toLowerCase())
}

/**
 * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Add tags to the session set (lowercase, deduplicated).
 * @param {string[]} tags - Tags to add
 */
export async function recordSessionTags (tags) {
  if (!Array.isArray(tags) || tags.length === 0) return
  const current = await getSessionTags()
  const set = new Set(current)
  for (const tag of tags) {
    const t = String(tag).trim().toLowerCase()
    if (t) set.add(t)
  }
  const arr = Array.from(set)
  if (hasSessionStorage()) {
    try {
      await chrome.storage.session.set({ [SESSION_TAGS_KEY]: arr })
    } catch {
      inMemorySessionTags = arr
    }
  } else {
    inMemorySessionTags = arr
  }
}
