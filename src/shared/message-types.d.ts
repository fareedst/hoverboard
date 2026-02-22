/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Type definitions for extension message envelope and payloads (aligned with message-schemas.js).
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
