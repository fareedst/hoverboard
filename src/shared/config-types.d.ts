/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-CONFIG_STRUCT] [ARCH-CONFIG_STRUCTURE]
 * Type definitions for merged extension config (aligned with ConfigManager.getDefaultConfiguration and mergedConfigSchema).
 */

export type StorageMode = 'local' | 'pinboard' | 'file' | 'sync'

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
  [key: string]: unknown
}
