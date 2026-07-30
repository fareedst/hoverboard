/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Zod schemas for runtime validation of extension messages at the service worker boundary.
 * Validation is incremental: only critical message types have data schemas; others pass through.
 * @ts-check
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
 * === IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 * [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] — How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.
 *
 * ## VALIDATE_INCOMING_MESSAGE
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY] How: validate envelope then per-type data schema before handler body runs.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_INCOMING_MESSAGE
 *   - envelope = validateMessageEnvelope(message)
 *   - IF envelope fails: RETURN error
 *   - data = validateMessageData(message.type, message.data)
 *   - IF data fails: RETURN error
 *   - RETURN { type, data }
 *   - How (sub-block): How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.
 *
 * ## VALIDATE_MERGED_CONFIG
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] How: Implements VALIDATE_MERGED_CONFIG(merged) behavior for IMPL-RUNTIME_VALIDATION.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_MERGED_CONFIG
 *   - parsed = configSchema.safeParse(merged)
 *   - IF NOT parsed.success: LOG; RETURN fallback OR error
 *   - RETURN parsed.data
 *
 * === END IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
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
import { z } from 'zod'

/** @typedef {import('./message-types').MessageEnvelope} MessageEnvelope */

// Message envelope: all messages must have a type; data is optional (plain object or undefined).
export const messageEnvelopeSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()).optional()
})

// Optional URL (string; handler accepts any string for data.url in getCurrentBookmark).
const optionalUrlSchema = z.string().optional().nullable()
const requiredUrlSchema = z.string().min(1)

// getCurrentBookmark: optional data.url; allow extra keys (e.g. title, tabId from overlay-manager) [IMPL-RUNTIME_VALIDATION]
export const getCurrentBookmarkDataSchema = z.object({
  url: optionalUrlSchema
}).passthrough().optional()

// getTagsForUrl: data.url required
export const getTagsForUrlDataSchema = z.object({
  url: requiredUrlSchema
}).strict()

// saveBookmark: url required; tags optional (array or string); shared/toread optional (boolean, number, or Pinboard-style 'yes'/'no')
export const saveBookmarkDataSchema = z.object({
  url: requiredUrlSchema,
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  description: z.string().optional(),
  toread: z.union([z.boolean(), z.number(), z.enum(['yes', 'no'])]).optional(),
  shared: z.union([z.boolean(), z.number(), z.enum(['yes', 'no'])]).optional(),
  title: z.string().optional()
}).passthrough()

// deleteBookmark: data.url required; optional preferredBackend for Index Delete [REQ-LOCAL_BOOKMARKS_INDEX]
export const deleteBookmarkDataSchema = z.object({
  url: requiredUrlSchema,
  preferredBackend: z.enum(['pinboard', 'local', 'file', 'sync', 'browser']).optional()
}).strict()

// saveTag: url and value (tag name) required
export const saveTagDataSchema = z.object({
  url: requiredUrlSchema,
  value: z.string().min(1)
}).strict()

// deleteTag: url and value (tag name) required
export const deleteTagDataSchema = z.object({
  url: requiredUrlSchema,
  value: z.string().min(1)
}).strict()

// [IMPL-RUNTIME_VALIDATION] moveBookmarkToStorage: url and targetBackend required (per-bookmark storage move)
export const moveBookmarkToStorageDataSchema = z.object({
  url: requiredUrlSchema,
  targetBackend: z.enum(['pinboard', 'local', 'file', 'sync', 'browser'])
}).strict()

// [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] getBookmarkUsage: optional url (single) or omit for all
export const getBookmarkUsageDataSchema = z.object({
  url: z.string().optional().nullable()
}).strict().optional()

// [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] getBookmarkUsageStats: optional n (limit, default 10)
export const getBookmarkUsageStatsDataSchema = z.object({
  n: z.number().int().min(1).max(100).optional()
}).strict().optional()

// [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] getBookmarkInboundLinks: optional url
export const getBookmarkInboundLinksDataSchema = z.object({
  url: z.string().optional().nullable()
}).strict().optional()

const dataSchemasByType = {
  getCurrentBookmark: getCurrentBookmarkDataSchema,
  getTagsForUrl: getTagsForUrlDataSchema,
  saveBookmark: saveBookmarkDataSchema,
  deleteBookmark: deleteBookmarkDataSchema,
  saveTag: saveTagDataSchema,
  deleteTag: deleteTagDataSchema,
  moveBookmarkToStorage: moveBookmarkToStorageDataSchema,
  getBookmarkUsage: getBookmarkUsageDataSchema,
  getBookmarkUsageStats: getBookmarkUsageStatsDataSchema,
  getBookmarkInboundLinks: getBookmarkInboundLinksDataSchema
}

/**
 * Validate message envelope (type + optional data object). Returns { success: true, data } or { success: false, error }.
 * @param {unknown} message - Raw message object
 * @returns {{ success: true, data: MessageEnvelope } | { success: false, error: import('zod').ZodError }}
 */
export function validateMessageEnvelope (message) {
  const result = messageEnvelopeSchema.safeParse(message)
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: result.error }
}

/**
 * Validate message data for a given type. If no schema exists for the type, returns success (incremental validation).
 * @param {string} type - Message type (e.g. MESSAGE_TYPES.SAVE_BOOKMARK)
 * @param {unknown} data - Message data payload
 * @returns {{ success: true, data: unknown } | { success: false, error: z.ZodError }}
 */
export function validateMessageData (type, data) {
  const schema = dataSchemasByType[type]
  if (!schema) return { success: true, data }
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: result.error }
}
