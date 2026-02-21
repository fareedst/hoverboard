/**
 * [REQ-AI_TAGGING_POPUP] [IMPL-SESSION_TAGS] Unit tests for session tags
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
