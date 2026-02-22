/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Zod schemas for runtime validation of extension messages at the service worker boundary.
 * Validation is incremental: only critical message types have data schemas; others pass through.
 */

import { z } from 'zod'

// Message envelope: all messages must have a type; data is optional (plain object or undefined).
export const messageEnvelopeSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.any()).optional()
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

// saveBookmark: url required; tags optional (array or string); other fields optional; passthrough for provider-specific keys
export const saveBookmarkDataSchema = z.object({
  url: requiredUrlSchema,
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  description: z.string().optional(),
  toread: z.union([z.boolean(), z.number()]).optional(),
  shared: z.union([z.boolean(), z.number()]).optional(),
  title: z.string().optional()
}).passthrough()

// deleteBookmark: data.url required
export const deleteBookmarkDataSchema = z.object({
  url: requiredUrlSchema
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

const dataSchemasByType = {
  getCurrentBookmark: getCurrentBookmarkDataSchema,
  getTagsForUrl: getTagsForUrlDataSchema,
  saveBookmark: saveBookmarkDataSchema,
  deleteBookmark: deleteBookmarkDataSchema,
  saveTag: saveTagDataSchema,
  deleteTag: deleteTagDataSchema
}

/**
 * Validate message envelope (type + optional data object). Returns { success: true, data } or { success: false, error }.
 * @param {unknown} message - Raw message object
 * @returns {{ success: true, data: { type: string, data?: object } } | { success: false, error: z.ZodError }}
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
