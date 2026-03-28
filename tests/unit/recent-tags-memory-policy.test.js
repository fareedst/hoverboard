/**
 * [REQ-RECENT_TAGS_SYSTEM] Recent tags idle + rolling window (spec side-panel order 4)
 */

import { applyRecentTagsIdleAndAge } from '../../src/features/tagging/recent-tags-memory-manager.js'

describe('[REQ-RECENT_TAGS_SYSTEM] applyRecentTagsIdleAndAge', () => {
  const windowMs = 15 * 60 * 1000
  const now = Date.parse('2026-03-28T12:00:00.000Z')

  test('clears all tags when Hoverboard idle exceeds N minutes', () => {
    const tags = [{ name: 'cod', lastUsed: '2026-03-28T11:59:00.000Z' }]
    const lastActivityAt = now - windowMs - 1
    const out = applyRecentTagsIdleAndAge(tags, lastActivityAt, now, windowMs)
    expect(out.tags).toEqual([])
    expect(out.lastActivityAt).toBeNull()
    expect(out.mutated).toBe(true)
  })

  test('drops tags whose lastUsed is older than N minutes (activity fresh)', () => {
    const tags = [
      { name: 'fresh', lastUsed: '2026-03-28T11:50:00.000Z' },
      { name: 'stale', lastUsed: '2026-03-28T11:00:00.000Z' }
    ]
    const lastActivityAt = now - 60 * 1000
    const out = applyRecentTagsIdleAndAge(tags, lastActivityAt, now, windowMs)
    expect(out.tags.map((t) => t.name)).toEqual(['fresh'])
    expect(out.mutated).toBe(true)
  })

  test('keeps tags when idle and ages are within window', () => {
    const tags = [{ name: 'bee', lastUsed: '2026-03-28T11:55:00.000Z' }]
    const lastActivityAt = now - 60 * 1000
    const out = applyRecentTagsIdleAndAge(tags, lastActivityAt, now, windowMs)
    expect(out.tags).toHaveLength(1)
    expect(out.tags[0].name).toBe('bee')
    expect(out.mutated).toBe(false)
  })
})
