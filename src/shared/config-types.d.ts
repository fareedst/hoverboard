/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-CONFIG_STRUCT] [ARCH-CONFIG_STRUCTURE]
 * Type definitions for merged extension config (aligned with ConfigManager.getDefaultConfiguration and mergedConfigSchema).
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
export type StorageMode = 'local' | 'pinboard' | 'file' | 'sync' | 'browser'

export interface MergedConfig {
  storageMode?: StorageMode
  hoverShowRecentTags?: boolean
  hoverShowTooltips?: boolean
  showHoverOnPageLoad?: boolean
  showHoverOPLOnlyIfNoTags?: boolean
  showHoverOPLOnlyIfSomeTags?: boolean
  inhibitSitesOnPageLoad?: boolean
  setIconOnLoad?: boolean
  recentTagsCountMax?: number
  initRecentPostsCount?: number
  uxAutoCloseTimeout?: number
  uxRecentRowWithBlock?: boolean
  uxRecentRowWithBookmarkButton?: boolean
  uxRecentRowWithCloseButton?: boolean
  uxRecentRowWithPrivateButton?: boolean
  uxRecentRowWithDeletePin?: boolean
  uxRecentRowWithInput?: boolean
  uxUrlStripHash?: boolean
  uxShowSectionLabels?: boolean
  recentTagsMaxListSize?: number
  recentTagsMaxDisplayCount?: number
  recentTagsSharedMemoryKey?: string
  recentTagsEnableUserDriven?: boolean
  recentTagsClearOnReload?: boolean
  badgeTextIfNotBookmarked?: string
  badgeTextIfPrivate?: string
  badgeTextIfQueued?: string
  badgeTextIfBookmarkedNoTags?: string
  pinRetryCountMax?: number
  pinRetryDelay?: number
  defaultVisibilityTheme?: string
  defaultTransparencyEnabled?: boolean
  defaultBackgroundOpacity?: number
  overlayPositionMode?: string
  fontSizeSuggestedTags?: number
  fontSizeLabels?: number
  fontSizeTags?: number
  fontSizeBase?: number
  fontSizeInputs?: number
  aiApiKey?: string
  aiProvider?: string
  aiTagLimit?: number
  /** [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Single click on extension icon opens side panel (true) or popup (false). Default true. */
  iconClickOpensSidePanel?: boolean
  /** [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Opt-in Index/SW link health checks. Default false. */
  linkHealthChecksEnabled?: boolean
  [key: string]: unknown
}
