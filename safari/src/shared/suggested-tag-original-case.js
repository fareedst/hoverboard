/**
 * [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Pick one HTML spelling per lowercase key for suggested tags.
 * Prefer mixed case (e.g. Apple) over ALL CAPS over all-lowercase so we do not emit a redundant lowercase-only suggestion.
 */

/**
 * @param {string} s
 * @returns {number} 2 = mixed case, 1 = letters all uppercase, 0 = no A–Z or all lowercase letters
 */
export function suggestedOriginalCaseVariantRank (s) {
  if (!s || typeof s !== 'string') return 0
  const hasUpper = /[A-Z]/.test(s)
  const hasLower = /[a-z]/.test(s)
  if (hasUpper && hasLower) return 2
  if (hasUpper && !hasLower) return 1
  return 0
}

/**
 * @param {string} existing
 * @param {string} candidate
 * @returns {string}
 */
export function pickBetterSuggestedOriginalCase (existing, candidate) {
  const rNew = suggestedOriginalCaseVariantRank(candidate)
  const rOld = suggestedOriginalCaseVariantRank(existing)
  if (rNew > rOld) return candidate
  if (rNew < rOld) return existing
  return existing
}
