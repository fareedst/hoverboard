/**
 * === IMPL-FULL-BLOCK: IMPL-ARRAY_OBJECT_UTILITIES ===
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — Array and object helpers: unique, chunk, compact; deepClone, isEmpty, pick; pure, no mutation.
 *
 * ## UNIQUE
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements unique(arr) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: UNIQUE
 *   - RETURN array of distinct elements (order preserved or by first occurrence)
 *
 * ## CHUNK
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements chunk(arr, size) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CHUNK
 *   - SPLIT arr into subarrays of length size; last chunk may be shorter
 *   - RETURN array of chunks
 *
 * ## COMPACT
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements compact(arr) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: COMPACT
 *   - RETURN array with falsy elements removed (false, null, undefined, 0, "", NaN)
 *
 * ## DEEP_CLONE
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements deepClone(obj) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: DEEP_CLONE
 *   - RETURN deep copy of obj (nested objects/arrays copied recursively)
 *
 * ## IS_EMPTY
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements isEmpty(obj) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_EMPTY
 *   - IF obj is null or undefined: RETURN true
 *   - FOR each enumerable key: IF any exists RETURN false
 *   - RETURN true
 *
 * ## PICK
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements pick(obj, keys) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
 * - Contract:
 *   - INPUT: array or object; optional keys (for pick), size (for chunk)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: transformed array or object; no mutation of inputs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions; same file as urlUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: PICK
 *   - result = {}
 *   - FOR each key IN keys: IF obj[key] present THEN result[key] = obj[key]
 *   - RETURN result
 *
 * ## SHARED_UTILITIES_COMPOSITION
 *
 * - [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-URL_UTILITIES] [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Composes pure shared utility modules so URL normalization can consume the same non-mutating helper contract as array and object utilities.
 * - Contract:
 *   - INPUT: bookmark URL and shared utility functions
 *   - PRE: utility functions are imported from the shared module
 *   - OUTPUT: normalized URL and unchanged source data
 *   - POST:
 *     - success => normalization returns the expected URL while helper inputs remain unchanged
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHARED_UTILITIES_COMPOSITION
 *   - Preserve source bookmark data
 *   - APPLY URL normalization
 *   - RETURN normalized URL
 *
 * === END IMPL-FULL-BLOCK: IMPL-ARRAY_OBJECT_UTILITIES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TEXT_UTILITIES ===
 * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — truncate, normalizeText, escapeHtml for UI and user input. Contract: string and optional maxLen; truncated/normalized/escaped string.
 *
 * ## TRUNCATE
 *
 * - [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements truncate(str, maxLen) behavior for IMPL-TEXT_UTILITIES.
 * - Contract:
 *   - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: string (truncated, normalized, or HTML-escaped)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ellipsis string (e.g. "…")
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: TRUNCATE
 *   - IF str.length <= maxLen RETURN str
 *   - RETURN str.slice(0, maxLen) + ellipsis
 *   - How (sub-block): Trim and collapse whitespace; normalize Unicode.
 *
 * ## NORMALIZE_TEXT
 *
 * - [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements normalizeText(str) behavior for IMPL-TEXT_UTILITIES.
 * - Contract:
 *   - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: string (truncated, normalized, or HTML-escaped)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ellipsis string (e.g. "…")
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_TEXT
 *   - NORMALIZE whitespace and Unicode (e.g. trim, collapse spaces) for display or comparison
 *   - RETURN normalized string
 *   - How (sub-block): Encode <, >, &, " for safe textContent/attribute use.
 *
 * ## ESCAPE_HTML
 *
 * - [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements escapeHtml(str) behavior for IMPL-TEXT_UTILITIES.
 * - Contract:
 *   - INPUT: string and optional max length (truncate); string (normalizeText, escapeHtml)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: string (truncated, normalized, or HTML-escaped)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ellipsis string (e.g. "…")
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: ESCAPE_HTML
 *   - ENCODE characters that are significant in HTML (e.g. <, >, &, ") so string is safe for textContent or attribute use
 *   - RETURN encoded string
 *
 * ## SHARED_UTILITIES_COMPOSITION
 *
 * - [IMPL-TEXT_UTILITIES] [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Keeps text normalization available to the shared URL and array/object utility composition without mutating caller data.
 * - Contract:
 *   - INPUT: text or URL value and shared helper module
 *   - PRE: text helper functions are available
 *   - OUTPUT: normalized text value consumed by a shared utility
 *   - POST:
 *     - success => normalized output is deterministic and source input is unchanged
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHARED_UTILITIES_COMPOSITION
 *   - Receive text value
 *   - NORMALIZE text
 *   - RETURN normalized value to the composing utility
 *
 * === END IMPL-FULL-BLOCK: IMPL-TEXT_UTILITIES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TIME_ASYNC_UTILITIES ===
 * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — delay (Promise), formatTimestamp, getRelativeTime for API/UI. Contract: ms or timestamp in; Promise or formatted/relative string out.
 * 
 * ## DELAY
 * 
 * - [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements delay(ms) behavior for IMPL-TIME_ASYNC_UTILITIES.
 * - Contract:
 *   - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: current time for relative calculation
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: DELAY
 *   - RETURN new Promise such that resolve() is called after ms (e.g. setTimeout(resolve, ms))
 *   - How (sub-block): Convert to locale date/time string.
 * 
 * ## FORMAT_TIMESTAMP
 * 
 * - [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements formatTimestamp(ts) behavior for IMPL-TIME_ASYNC_UTILITIES.
 * - Contract:
 *   - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: current time for relative calculation
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: FORMAT_TIMESTAMP
 *   - CONVERT timestamp to display format (e.g. locale date/time string)
 *   - RETURN formatted string
 *   - How (sub-block): Return "X s/m/h/d ago" from delta.
 * 
 * ## GET_RELATIVE_TIME
 * 
 * - [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements getRelativeTime(ts) behavior for IMPL-TIME_ASYNC_UTILITIES.
 * - Contract:
 *   - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: current time for relative calculation
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_RELATIVE_TIME
 *   - delta = now - ts
 *   - IF delta in seconds/minutes/hours/days THEN RETURN "X s/m/h/d ago" (or similar)
 *   - RETURN human-readable relative string
 * 
 * === END IMPL-FULL-BLOCK: IMPL-TIME_ASYNC_UTILITIES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-URL_UTILITIES ===
 * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — processUrl (strip hash), isValidUrl, getDomain for bookmark management. Contract: url string in; normalized url or boolean or domain out.
 *
 * ## PROCESS_URL
 *
 * - [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements processUrl(url) behavior for IMPL-URL_UTILITIES.
 * - Contract:
 *   - INPUT: url (string)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: PROCESS_URL
 *   - IF url empty or invalid: RETURN url or default
 *   - OPTIONALLY strip hash, trailing slash, normalize scheme
 *   - RETURN normalized url string
 *   - How (sub-block): Parse with URL constructor or regex; return true if valid.
 *
 * ## IS_VALID_URL
 *
 * - [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements isValidUrl(url) behavior for IMPL-URL_UTILITIES.
 * - Contract:
 *   - INPUT: url (string)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_VALID_URL
 *   - TRY parse url with URL constructor (or regex)
 *   - RETURN true if valid else false
 *   - How (sub-block): Parse and return hostname or host.
 *
 * ## GET_DOMAIN
 *
 * - [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements getDomain(url) behavior for IMPL-URL_UTILITIES.
 * - Contract:
 *   - INPUT: url (string)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: GET_DOMAIN
 *   - parsed = parse url
 *   - RETURN parsed.hostname or parsed.host or ""
 *
 * ## SHARED_UTILITIES_COMPOSITION
 *
 * - [IMPL-URL_UTILITIES] [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Exposes URL normalization as a pure shared-utility composition alongside array/object and text helpers.
 * - Contract:
 *   - INPUT: URL string and shared helper module
 *   - PRE: URL helper and shared utility functions are available
 *   - OUTPUT: normalized URL, validity result, or domain
 *   - POST:
 *     - success => URL helper returns deterministic output without mutating input
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHARED_UTILITIES_COMPOSITION
 *   - Receive URL input
 *   - APPLY shared text/array helper contracts where needed
 *   - RETURN URL utility result
 *
 * === END IMPL-FULL-BLOCK: IMPL-URL_UTILITIES ===
 */

import { urlUtils, stringUtils, arrayUtils, objectUtils, timeUtils } from '../../src/shared/utils.js'

describe('[IMPL-URL_UTILITIES] urlUtils', () => {
  test('PROCESS_URL strips hash when requested', () => {
    expect(urlUtils.processUrl('https://ex.com/a#frag', true)).toBe('https://ex.com/a')
  })

  test('PROCESS_URL returns empty for falsy input', () => {
    expect(urlUtils.processUrl('')).toBe('')
  })

  test('IS_VALID_URL accepts http URLs and rejects garbage', () => {
    expect(urlUtils.isValidUrl('https://example.com')).toBe(true)
    expect(urlUtils.isValidUrl('not a url')).toBe(false)
  })

  test('GET_DOMAIN returns hostname or empty', () => {
    expect(urlUtils.getDomain('https://sub.example.com/path')).toBe('sub.example.com')
    expect(urlUtils.getDomain(':::')).toBe('')
  })
})

describe('[IMPL-TEXT_UTILITIES] stringUtils', () => {
  test('truncate shortens long strings with suffix', () => {
    expect(stringUtils.truncate('abcdefghij', 6)).toBe('abc...')
  })

  test('cleanText trims and collapses whitespace', () => {
    expect(stringUtils.cleanText('  a   b  ')).toBe('a b')
  })

  test('escapeHtml escapes angle brackets', () => {
    expect(stringUtils.escapeHtml('<b>')).toBe('&lt;b&gt;')
  })
})

describe('[IMPL-ARRAY_OBJECT_UTILITIES] arrayUtils and objectUtils', () => {
  test('UNIQUE preserves first occurrence order', () => {
    expect(arrayUtils.unique([1, 2, 1, 3])).toEqual([1, 2, 3])
  })

  test('CHUNK splits into sized groups', () => {
    expect(arrayUtils.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  test('COMPACT removes nullish and empty string', () => {
    expect(arrayUtils.compact([0, 1, null, '', 2])).toEqual([0, 1, 2])
  })

  test('deepClone does not mutate original nested object', () => {
    const src = { a: { b: 1 } }
    const copy = objectUtils.deepClone(src)
    copy.a.b = 9
    expect(src.a.b).toBe(1)
  })

  test('isEmpty and pick', () => {
    expect(objectUtils.isEmpty({})).toBe(true)
    expect(objectUtils.pick({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 })
  })
})

describe('[IMPL-TIME_ASYNC_UTILITIES] timeUtils', () => {
  test('sleep returns a Promise that resolves', async () => {
    await expect(timeUtils.sleep(0)).resolves.toBeUndefined()
  })

  test('getRelativeTime returns minute-ago string for recent past', () => {
    const RealDate = Date
    const fixedNow = new RealDate('2021-12-31T16:00:00.000Z')
    class MockDate extends RealDate {
      constructor (...args) {
        if (args.length === 0) {
          super(fixedNow.getTime())
          return
        }
        super(...args)
      }

      static now () {
        return fixedNow.getTime()
      }
    }
    global.Date = MockDate
    try {
      const twoMinAgo = fixedNow.getTime() - 2 * 60 * 1000
      expect(timeUtils.getRelativeTime(twoMinAgo)).toBe('2 minutes ago')
    } finally {
      global.Date = RealDate
    }
  })

  test('formatTimestamp returns a non-empty locale string', () => {
    expect(timeUtils.formatTimestamp(new Date('2021-12-31T16:00:00.000Z')).length).toBeGreaterThan(0)
  })
})

