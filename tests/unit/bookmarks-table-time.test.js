/**
 * Local Bookmarks Index time column formatters - [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_CREATE_UPDATE_TIMES]
 * formatTimeAbsolute (YYYY-MM-DD HH:mm:ss) and formatTimeAge (two largest units).
 */

import { formatTimeAbsolute, formatTimeAge } from '../../src/ui/bookmarks-table/bookmarks-table-time.js'

describe('formatTimeAbsolute [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  test('formats ISO string as YYYY-MM-DD HH:mm:ss (local time)', () => {
    const out = formatTimeAbsolute('2025-06-15T14:30:00.000Z')
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(out.length).toBe(19)
  })

  test('pads month, day, hours, minutes, seconds to two digits', () => {
    const out = formatTimeAbsolute('2025-01-05T09:07:03.000Z')
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(out).toMatch(/2025-01-05/) // date part
  })

  test('returns empty string for empty, null, undefined', () => {
    expect(formatTimeAbsolute('')).toBe('')
    expect(formatTimeAbsolute(null)).toBe('')
    expect(formatTimeAbsolute(undefined)).toBe('')
  })

  test('returns empty string for invalid date', () => {
    expect(formatTimeAbsolute('not-a-date')).toBe('')
    expect(formatTimeAbsolute(NaN)).toBe('')
  })

  test('accepts timestamp number', () => {
    const ts = new Date('2025-12-31T23:59:59.000Z').getTime()
    const out = formatTimeAbsolute(ts)
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(out.length).toBe(19)
  })
})

describe('formatTimeAge [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns two largest units (e.g. N days O hours)', () => {
    const now = new Date('2025-06-15T12:00:00.000Z').getTime()
    const past = new Date('2025-06-13T07:00:00.000Z') // 2 days 5 hours ago
    expect(formatTimeAge(past.toISOString(), now)).toBe('2 days 5 hours')
  })

  test('returns single unit when only one applies', () => {
    const now = new Date('2025-06-15T12:00:00.000Z').getTime()
    const past = new Date('2025-06-15T11:59:15.000Z') // 45 seconds ago
    expect(formatTimeAge(past.toISOString(), now)).toBe('45 seconds')
  })

  test('returns "just now" for same second or future', () => {
    const now = new Date('2025-06-15T12:00:00.000Z').getTime()
    const same = new Date('2025-06-15T12:00:00.500Z')
    expect(formatTimeAge(same.toISOString(), now)).toBe('just now')
    const future = new Date('2025-06-15T12:00:01.000Z')
    expect(formatTimeAge(future.toISOString(), now)).toBe('just now')
  })

  test('returns "just now" for sub-second past', () => {
    const now = new Date('2025-06-15T12:00:00.000Z').getTime()
    const past = new Date('2025-06-15T11:59:59.500Z')
    expect(formatTimeAge(past.toISOString(), now)).toBe('just now')
  })

  test('handles minutes and seconds (two units)', () => {
    const now = new Date('2025-06-15T12:00:00.000Z').getTime()
    const past = new Date('2025-06-15T11:56:30.000Z') // 3 min 30 sec
    expect(formatTimeAge(past.toISOString(), now)).toBe('3 minutes 30 seconds')
  })

  test('handles years and months (two units)', () => {
    const now = new Date('2026-08-15T12:00:00.000Z').getTime()
    const past = new Date('2025-06-15T12:00:00.000Z') // ~1 year 2 months
    const out = formatTimeAge(past.toISOString(), now)
    expect(out).toContain('year')
    expect(out).toContain('month')
  })

  test('uses singular unit label when value is 1 (1 day, 1 hour)', () => {
    const now = new Date('2025-06-16T12:00:00.000Z').getTime()
    const oneDayAgo = new Date('2025-06-15T12:00:00.000Z')
    expect(formatTimeAge(oneDayAgo.toISOString(), now)).toBe('1 day')
    const now2 = new Date('2025-06-15T13:00:00.000Z').getTime()
    const oneHourAgo = new Date('2025-06-15T12:00:00.000Z')
    expect(formatTimeAge(oneHourAgo.toISOString(), now2)).toBe('1 hour')
  })

  test('returns empty string for empty, null, undefined', () => {
    expect(formatTimeAge('')).toBe('')
    expect(formatTimeAge(null)).toBe('')
    expect(formatTimeAge(undefined)).toBe('')
  })

  test('returns empty string for invalid date', () => {
    expect(formatTimeAge('not-a-date')).toBe('')
  })
})
