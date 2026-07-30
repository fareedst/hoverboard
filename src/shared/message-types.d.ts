/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Type definitions for extension message envelope and payloads (aligned with message-schemas.js).
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING ===
 * [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] — Record visit and optional referrer; debounce; persist usage + nav edges in chrome.storage.local.
 * 
 * ## RECORD_VISIT
 * 
 * - [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] How: Implements recordVisit(url, referrer?) behavior for IMPL-BOOKMARK_USAGE_TRACKING.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_VISIT
 *   - url = cleanUrl(url); if !url return
 *   - IF now - _lastRecordedVisit[url] < DEBOUNCE_MS return  // debounce
 *   - _lastRecordedVisit[url] = now
 *   - usage = read usage[url] or create { visitCount:0, firstVisitedAt:'', lastVisitedAt:'', recentVisits:[] }
 *   - usage.visitCount++; usage.lastVisitedAt = now; if !usage.firstVisitedAt then usage.firstVisitedAt = now
 *   - usage.recentVisits = [now, ...usage.recentVisits].slice(0, RECENT_VISITS_CAP)
 *   - write usage map
 *   - IF referrer: ref = cleanUrl(referrer); IF ref && ref !== url && /^https?:/.test(ref): add/increment edge ref→url; write edges map
 *   - 1. getUsage(url), getAllUsage(): read from storage; return normalized records
 *   - 2. getMostFrequent(n), getMostRecent(n): sort by visitCount / lastVisitedAt; return top n
 *   - 3. getInboundLinks(url): edges[url] or []
 *   - 4. getOutboundLinks(url): all edges where sourceUrl === url (scan edges map)
 *   - 5. getNavigationGraph(): all edges as { sourceUrl, targetUrl, count, ... }
 *   - 6. clearUsage(url): delete usage[url]; delete edges[url]; remove url from any edge as sourceUrl
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 * [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] — How: incremental type-check without full TS rewrite — tsconfig noEmit, // @ts-check on key JS, shared .d.ts. Status: Active tooling; not a Deferred Safari path. Expand when more files adopt @ts-check.
 * 
 * ## TYPECHECK_GATE
 * 
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: validate gate runs typecheck before build/push.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: TYPECHECK_GATE
 *   - RUN tsc --noEmit with allowJs
 *   - ON errors: FAIL validate
 *   - RETURN pass
 *   - How (sub-block): How: checked modules document contracts via JSDoc/.d.ts; Zod remains runtime source for messages.
 * 
 * ## MAINTAIN_CHECKED_SURFACE
 * 
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: Implements MAINTAIN_CHECKED_SURFACE behavior for IMPL-TYPESCRIPT_MIGRATION.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MAINTAIN_CHECKED_SURFACE
 *   - KEEP // @ts-check on boundary modules
 *   - UPDATE .d.ts when message/config shapes change
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 */
export interface MessageEnvelope {
  type: string
  data?: Record<string, unknown>
}

export interface GetCurrentBookmarkData {
  url?: string | null
}

export interface GetTagsForUrlData {
  url: string
}

export interface SaveBookmarkData {
  url: string
  tags?: string[] | string
  description?: string
  toread?: boolean | number
  shared?: boolean | number
  title?: string
  [key: string]: unknown
}

export interface DeleteBookmarkData {
  url: string
}

export interface SaveTagData {
  url: string
  value: string
}

export interface DeleteTagData {
  url: string
  value: string
}

/** [REQ-BOOKMARK_USAGE_TRACKING] getBookmarkUsage: optional url for single URL; omit for all */
export interface GetBookmarkUsageData {
  url?: string | null
}

/** [REQ-BOOKMARK_USAGE_TRACKING] getBookmarkUsageStats: optional n (limit) */
export interface GetBookmarkUsageStatsData {
  n?: number
}
