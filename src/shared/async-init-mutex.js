/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Serialize async init so concurrent callers share one in-flight promise.
 */

/**
 * @param {() => Promise<void>} initFn
 * @returns {() => Promise<void>}
 */
export function createProviderInitMutex (initFn) {
  let inFlight = /** @type {Promise<void>|null} */ (null)
  let done = false
  return async function ensureInitialized () {
    if (done) return
    if (!inFlight) {
      inFlight = Promise.resolve()
        .then(() => initFn())
        .then(() => {
          done = true
        })
        .finally(() => {
          inFlight = null
        })
    }
    await inFlight
  }
}
