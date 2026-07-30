/**
 * === IMPL-FULL-BLOCK: IMPL-SESSION_TAGS ===
 * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — In-session tags (lowercase) for auto-apply when AI returns; getSessionTags, recordSessionTags; session or in-memory. Contract: recordSessionTags(tags) or getSessionTags(); array of lowercase tags or void.
 * 
 * ## GET_SESSION_TAGS
 * 
 * - [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements getSessionTags() behavior for IMPL-SESSION_TAGS.
 * - Contract:
 *   - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_SESSION_TAGS
 *   - IF chrome.storage.session:
 *   - result = await chrome.storage.session.get('hoverboard_session_tags')
 *   - RETURN (result.hoverboard_session_tags ?? []).map(t => t.toLowerCase())
 *   - RETURN inMemorySet ? Array.from(inMemorySet) : []
 *   - How (sub-block): Merge tags (lowercase) into set; persist to session storage or in-memory.
 * 
 * ## RECORD_SESSION_TAGS
 * 
 * - [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements recordSessionTags(tags) behavior for IMPL-SESSION_TAGS.
 * - Contract:
 *   - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_SESSION_TAGS
 *   - current = await getSessionTags()
 *   - set = new Set(current.map(t => t.toLowerCase()))
 *   - FOR tag IN tags: set.add(String(tag).trim().toLowerCase())
 *   - arr = Array.from(set)
 *   - IF chrome.storage.session: await chrome.storage.session.set({ hoverboard_session_tags: arr })
 *   - ELSE: inMemorySet = set
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SESSION_TAGS ===
 */
import { getSessionTags, recordSessionTags } from '../../src/features/ai/session-tags.js'

describe('session-tags [IMPL-SESSION_TAGS]', () => {
  let sessionStore
  beforeEach(() => {
    sessionStore = {}
    global.chrome = {
      storage: {
        session: {
          get: jest.fn((key) => Promise.resolve(key ? { [key]: sessionStore[key] } : sessionStore)),
          set: jest.fn((obj) => {
            Object.assign(sessionStore, obj)
            return Promise.resolve()
          })
        }
      }
    }
  })

  test('getSessionTags returns empty array when nothing stored', async () => {
    const tags = await getSessionTags()
    expect(tags).toEqual([])
  })

  test('recordSessionTags adds tags and getSessionTags returns them lowercase', async () => {
    await recordSessionTags(['Tag1', 'tag2', 'TAG3'])
    const tags = await getSessionTags()
    expect(tags.sort()).toEqual(['tag1', 'tag2', 'tag3'])
  })

  test('recordSessionTags deduplicates case-insensitively', async () => {
    await recordSessionTags(['foo', 'Foo', 'FOO'])
    const tags = await getSessionTags()
    expect(tags).toEqual(['foo'])
  })

  test('recordSessionTags appends to existing', async () => {
    await recordSessionTags(['a', 'b'])
    await recordSessionTags(['b', 'c'])
    const tags = await getSessionTags()
    expect(tags.sort()).toEqual(['a', 'b', 'c'])
  })

  test('recordSessionTags ignores empty strings', async () => {
    await recordSessionTags(['ok', '', '  ', 'x'])
    const tags = await getSessionTags()
    expect(tags.sort()).toEqual(['ok', 'x'])
  })

  test('recordSessionTags no-op for empty array', async () => {
    await recordSessionTags([])
    const tags = await getSessionTags()
    expect(tags).toEqual([])
  })
})
