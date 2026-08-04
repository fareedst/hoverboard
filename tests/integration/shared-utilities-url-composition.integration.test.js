/**
 * [IMPL-ARRAY_OBJECT_UTILITIES] [IMPL-URL_UTILITIES] [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Composes pure shared utility modules so URL normalization can consume the same non-mutating helper contract as array and object utilities.
 * Contract:
 *   INPUT: bookmark URL and shared utility functions
 *   PRE: utility functions are imported from the shared module
 *   OUTPUT: normalized URL and unchanged source data
 *   POST:
 *     success => normalization returns the expected URL while helper inputs remain unchanged
 *   EFFECTS: pure
 *   TERMINATION: total
 * PROCEDURE: SHARED_UTILITIES_COMPOSITION
 *   Preserve source bookmark data
 *   APPLY URL normalization
 *   RETURN normalized URL
 *
 * Pattern: UNKNOWN shared utility composition.
 * Composition: text/array normalization -> URL utility consumption. Pure
 * utilities are composed without UI or browser host invocation.
 */

import { arrayUtils, stringUtils, urlUtils } from '../../src/shared/utils.js'

describe('[IMPL-ARRAY_OBJECT_UTILITIES] shared utility composition', () => {
  test('normalized text and deduplicated domains produce stable URL groups', () => {
    const hosts = arrayUtils.unique([
      urlUtils.getDomain('https://example.com/a'),
      urlUtils.getDomain('https://example.com/b'),
      urlUtils.getDomain('https://other.example/')
    ])
    const label = stringUtils.cleanText('  example   bookmarks  ')

    expect(hosts).toEqual(['example.com', 'other.example'])
    expect(label).toBe('example bookmarks')
    expect(urlUtils.processUrl('https://example.com/a#section', true))
      .toBe('https://example.com/a')
  })
})
