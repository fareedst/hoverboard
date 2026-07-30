/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_QUERY_API ===
 * [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] — Localhost HTTP API over File bookmarks + optional aggregate-snapshot; bearer token; 127.0.0.1 only; extension REFRESH_API_SNAPSHOT.
 *
 * ## Auth and bind
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Bind loopback only; require Bearer token from api-token file.
 * - Contract:
 *   - INPUT: installDir, port, request Authorization header
 *   - PRE: token file exists or generated on first start
 *   - OUTPUT: authorized request proceeds | { error: Unauthorized | ForbiddenBind }
 *   - POST:
 *     - success => listen address is 127.0.0.1:port
 *     - error Unauthorized => HTTP 401
 *   - FAILURE_MODES: Unauthorized, ForbiddenBind
 *   - EFFECTS: IO, Http
 *   - TERMINATION: may_diverge (HTTP server loop — intentional)
 * - PROCEDURE: ENSURE_TOKEN_AND_LISTEN
 *   - 1. IF api-token missing THEN generate random token; WRITE installDir/api-token
 *   - 2. LISTEN only on 127.0.0.1:port
 *   - 3. ON each request: IF Authorization != "Bearer "+token THEN 401
 *
 * ## Load bookmarks (File or snapshot)
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Prefer aggregate-snapshot.json when present; else hoverboard-bookmarks.json version-1 shape.
 * - Contract:
 *   - INPUT: bookmarksFilePath, snapshotFilePath
 *   - PRE: paths may be missing
 *   - OUTPUT: list of bookmark objects | empty list
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_BOOKMARKS
 *   - 1. IF aggregate-snapshot.json exists THEN TRY PARSE snapshot.bookmarks; RETURN list
 *   - 2. IF hoverboard-bookmarks.json missing THEN RETURN []
 *   - 3. PARSE JSON { version, bookmarks: map url -> pin }
 *   - 4. RETURN values as array (default storage "file")
 *
 * ## List and filter
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: GET /v1/bookmarks with q, tag, url filters.
 * - Contract:
 *   - INPUT: bookmarks[], query params q, tag, url
 *   - PRE: auth passed
 *   - OUTPUT: JSON { bookmarks: [...], count }
 *   - EFFECTS: pure (filter) + Http
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BOOKMARKS
 *   - 1. IF url set THEN keep exact url match
 *   - 2. IF tag set THEN keep bookmarks whose tags contain tag (case-insensitive)
 *   - 3. IF q set THEN keep substring match on description, url, tags, extended (case-insensitive)
 *   - 4. RETURN filtered
 *
 * ## File write and delete
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: POST/PATCH merge pin into File JSON; DELETE by url query (File only, not snapshot).
 * - Contract:
 *   - INPUT: pin JSON (POST/PATCH) or url query (DELETE)
 *   - PRE: auth passed; url required
 *   - OUTPUT: { ok, bookmark|deleted } | HTTP 400/500
 *   - FAILURE_MODES: MissingUrl, InvalidJSON, IO
 *   - EFFECTS: IO, Http
 *   - TERMINATION: total
 * - PROCEDURE: WRITE_OR_DELETE_FILE_BOOKMARK
 *   - 1. POST/PATCH: Decode pin; IF url empty THEN 400; MERGE into hoverboard-bookmarks.json; RETURN ok
 *   - 2. DELETE: IF url query empty THEN 400; REMOVE url from File map; RETURN ok
 *
 * ## Health
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: GET /v1/health returns ok, source file|snapshot, bind.
 * - Contract:
 *   - INPUT: none (auth required)
 *   - OUTPUT: { ok: true, source, bind, port }
 *   - EFFECTS: Http, IO (stat snapshot)
 *   - TERMINATION: total
 * - PROCEDURE: HEALTH
 *   - 1. source = IF snapshot exists THEN "snapshot" ELSE "file"
 *   - 2. RETURN { ok: true, source, bind: "127.0.0.1", port }
 *
 * ## Build aggregate snapshot payload
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Pure map from aggregated Index rows to snapshot JSON.
 * - Contract:
 *   - INPUT: bookmarks[] from getAggregatedBookmarksForIndex
 *   - OUTPUT: { version: 1, updatedAt, bookmarks: [...] }
 *   - EFFECTS: pure (clock for updatedAt)
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_AGGREGATE_SNAPSHOT_PAYLOAD
 *   - 1. MAP each row to pin fields + storage; DROP rows without url
 *   - 2. RETURN { version: 1, updatedAt: now ISO, bookmarks }
 *
 * ## Refresh API snapshot (extension)
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: REFRESH_API_SNAPSHOT aggregates providers and writes aggregate-snapshot.json via native host.
 * - Contract:
 *   - INPUT: none (message from Index/Options)
 *   - PRE: BookmarkRouter ready; native messaging available
 *   - OUTPUT: { success, count } | { success: false, error }
 *   - FAILURE_MODES: RouterNotReady, NativeUnavailable, WriteFailed
 *   - EFFECTS: IO, Async, State
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_API_SNAPSHOT
 *   - 1. agg = handleGetAggregatedBookmarksForIndex()
 *   - 2. payload = BUILD_AGGREGATE_SNAPSHOT_PAYLOAD(agg.bookmarks)
 *   - 3. SEND native writeBookmarksFile path ~/.hoverboard/aggregate-snapshot.json data payload
 *   - 4. ON success RETURN { success: true, count: payload.bookmarks.length }
 *   - 5. ON failure RETURN { success: false, error }
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_QUERY_API ===
 */
export function buildAggregateSnapshotPayload (bookmarks = []) {
  const list = Array.isArray(bookmarks) ? bookmarks : []
  const mapped = list.map((b) => ({
    url: b.url || '',
    description: b.description || '',
    extended: b.extended || '',
    tags: b.tags != null ? b.tags : '',
    shared: b.shared != null ? b.shared : 'yes',
    toread: b.toread != null ? b.toread : 'no',
    time: b.time || b.dt || '',
    hash: b.hash || '',
    storage: b.storage || b.preferredBackend || ''
  })).filter((b) => b.url)
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    bookmarks: mapped
  }
}

export const AGGREGATE_SNAPSHOT_RELATIVE_PATH = 'aggregate-snapshot.json'
