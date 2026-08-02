const COLOR_FIELDS = ['background', 'text', 'link']
export const SOURCE_PRESENTATION_PROFILE_MAX_BYTES = 512

function parseChannel (value) {
  const text = String(value).trim()
  if (text.endsWith('%')) {
    const percentage = Number(text.slice(0, -1))
    return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100
      ? Math.round(percentage * 2.55)
      : undefined
  }
  const channel = Number(text)
  return Number.isFinite(channel) && channel >= 0 && channel <= 255
    ? Math.round(channel)
    : undefined
}

function parseAlpha (value) {
  const alpha = String(value).trim()
  if (alpha.endsWith('%')) {
    const percentage = Number(alpha.slice(0, -1))
    return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100
      ? percentage / 100
      : undefined
  }
  const numeric = Number(alpha)
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1 ? numeric : undefined
}

/**
 * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: reduce raw computed presentation data to a bounded allowlisted archive field and keep it outside content identity hashes.
 */
export function parseSourceColor (value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'transparent' || text.includes('url(') || text.includes('var(') || text.includes('gradient(')) return undefined

  const hex = text.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)
  if (hex) {
    const value = hex[1]
    const hasAlpha = value.length === 4 || value.length === 8
    const alpha = hasAlpha
      ? (value.length === 4 ? parseInt(value[3] + value[3], 16) : parseInt(value.slice(6, 8), 16))
      : 255
    if (alpha !== 255) return undefined
    const channels = value.length <= 4
      ? value.slice(0, 3).split('').map(channel => channel + channel)
      : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)]
    return `#${channels.join('')}`
  }

  const rgb = text.match(/^rgba?\((.*)\)$/)
  if (!rgb) return undefined
  const parts = rgb[1].split(',').map(part => part.trim())
  if (parts.length !== 3 && parts.length !== 4) return undefined
  const channels = parts.slice(0, 3).map(parseChannel)
  if (channels.some(channel => channel === undefined)) return undefined
  if (parts.length === 4 && parseAlpha(parts[3]) !== 1) return undefined
  return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

/**
 * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: reduce raw computed presentation data to a bounded allowlisted archive field and keep it outside content identity hashes.
 */
export function normalizeSourcePresentationProfile (raw, maxBytes = SOURCE_PRESENTATION_PROFILE_MAX_BYTES) {
  if (!raw || typeof raw !== 'object') return undefined
  const profile = {}
  for (const field of COLOR_FIELDS) {
    const color = parseSourceColor(raw[field])
    if (color) profile[field] = color
  }
  const colorScheme = String(raw.colorScheme || '').trim().toLowerCase()
  if (colorScheme === 'light' || colorScheme === 'dark') profile.colorScheme = colorScheme
  if (!Object.keys(profile).length) return undefined
  const serialized = JSON.stringify(profile)
  const serializedBytes = typeof globalThis.TextEncoder === 'function'
    ? new globalThis.TextEncoder().encode(serialized).length
    : serialized.length
  if (serializedBytes > maxBytes) return undefined
  return profile
}

export function sourceColorToRgb (value) {
  const normalized = parseSourceColor(value)
  if (!normalized) return undefined
  return {
    red: parseInt(normalized.slice(1, 3), 16),
    green: parseInt(normalized.slice(3, 5), 16),
    blue: parseInt(normalized.slice(5, 7), 16)
  }
}

export function getSourceContrastRatio (foreground, background) {
  const fg = sourceColorToRgb(foreground)
  const bg = sourceColorToRgb(background)
  if (!fg || !bg) return 0
  const luminance = ({ red, green, blue }) => {
    const channel = [red, green, blue].map(value => {
      const normalized = value / 255
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4
    })
    return (0.2126 * channel[0]) + (0.7152 * channel[1]) + (0.0722 * channel[2])
  }
  const lighter = Math.max(luminance(fg), luminance(bg))
  const darker = Math.min(luminance(fg), luminance(bg))
  return (lighter + 0.05) / (darker + 0.05)
}
