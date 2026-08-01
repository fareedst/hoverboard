/**
 * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX]
 * Composition: archived-content scope keeps Reader navigation available while blocking metadata mutations.
 * No Playwright / no bookmarks-table.js init(); DOM presentation and navigation are covered by extension E2E.
 */

import {
  ARCHIVE_METADATA_MUTATION_ACTIONS,
  isArchiveMetadataMutationAllowed,
  isArchiveScopeValue
} from '../../src/ui/bookmarks-table/bookmarks-table-archive-scope.js'

describe('[REQ-ARCHIVED_CONTENT_SEARCH] archived-content scope isolation', () => {
  test('archive scope blocks every metadata mutation action', () => {
    expect(isArchiveScopeValue('archive')).toBe(true)
    for (const action of ARCHIVE_METADATA_MUTATION_ACTIONS) {
      expect(isArchiveMetadataMutationAllowed('archive', action)).toBe(false)
    }
  })

  test('metadata scope retains ordinary mutation behavior', () => {
    expect(isArchiveScopeValue('metadata')).toBe(false)
    for (const action of ARCHIVE_METADATA_MUTATION_ACTIONS) {
      expect(isArchiveMetadataMutationAllowed('metadata', action)).toBe(true)
    }
  })
})
