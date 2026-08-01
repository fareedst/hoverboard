/**
 * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX]
 * Keep archived-content browsing read-only with respect to bookmark metadata actions.
 */

export const ARCHIVE_SEARCH_SCOPE = 'archive'

export const ARCHIVE_METADATA_MUTATION_ACTIONS = Object.freeze([
  'select',
  'move',
  'delete',
  'addTags',
  'deleteTags',
  'regexReplace',
  'export'
])

export function isArchiveScopeValue (scope) {
  return scope === ARCHIVE_SEARCH_SCOPE
}

export function isArchiveMetadataMutationAllowed (scope, action) {
  if (isArchiveScopeValue(scope) && ARCHIVE_METADATA_MUTATION_ACTIONS.includes(action)) return false
  return true
}
