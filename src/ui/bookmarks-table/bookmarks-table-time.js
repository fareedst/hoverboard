/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_CREATE_UPDATE_TIMES]
 * Time column formatting for Local Bookmarks Index: absolute (YYYY-MM-DD HH:mm:ss) and age (two largest units).
 */

/**
 * Format a date as YYYY-MM-DD HH:mm:ss (24-hour). Invalid/empty input returns ''.
 * @param {string|number} value - ISO date string or timestamp
 * @returns {string}
 */
export function formatTimeAbsolute (value) {
  if (value === '' || value === null || value === undefined) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const AVG_MONTH_DAYS = 30
const MONTH = AVG_MONTH_DAYS * DAY
const YEAR = 365 * DAY

/**
 * Format a date as relative age: two largest non-zero units (e.g. "2 days 5 hours", "45 seconds").
 * Past dates only; future or same-second returns "just now".
 * @param {string|number} value - ISO date string or timestamp
 * @param {number} [nowMs=Date.now()] - Reference time for tests
 * @returns {string}
 */
export function formatTimeAge (value, nowMs = Date.now()) {
  if (value === '' || value === null || value === undefined) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  let deltaMs = nowMs - d.getTime()
  if (deltaMs < 0) return 'just now'
  if (deltaMs < SEC) return 'just now'

  const units = [
    { ms: YEAR, name: 'year', names: 'years' },
    { ms: MONTH, name: 'month', names: 'months' },
    { ms: DAY, name: 'day', names: 'days' },
    { ms: HOUR, name: 'hour', names: 'hours' },
    { ms: MIN, name: 'minute', names: 'minutes' },
    { ms: SEC, name: 'second', names: 'seconds' }
  ]
  const parts = []
  for (const u of units) {
    const n = Math.floor(deltaMs / u.ms)
    if (n > 0) {
      parts.push(`${n} ${n === 1 ? u.name : u.names}`)
      deltaMs -= n * u.ms
      if (parts.length >= 2) break
    }
  }
  if (parts.length === 0) return 'just now'
  return parts.join(' ')
}
