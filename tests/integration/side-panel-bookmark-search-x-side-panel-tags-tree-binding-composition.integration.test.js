/**
 * [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-USABILITY] How: Passes filtered side-panel bookmark rows into tag-tree grouping without invoking the side-panel UI.
 * Contract:
 *   INPUT: bookmark rows, search query, available tags
 *   PRE: search filter and tag-tree grouping procedures are available
 *   OUTPUT: grouped matching bookmarks
 *   POST:
 *     success => non-matching rows and empty groups are excluded
 *   EFFECTS: pure
 *   TERMINATION: total
 * PROCEDURE: SEARCH_TAG_TREE_COMPOSITION
 *   matching = FILTER_BOOKMARKS_BY_SEARCH(bookmarks, query)
 *   grouped = BUILD_TAG_TO_BOOKMARKS(matching, available tags)
 *   RETURN grouped
 *
 * Pattern: UNKNOWN binding resolved as side-panel data composition.
 * Composition: side-panel search result -> tag tree grouping. Pure modules
 * are composed without invoking the side-panel UI.
 */

import { filterBookmarksBySearch } from '../../src/ui/side-panel/tags-tree-filter.js'
import { buildTagToBookmarks } from '../../src/ui/side-panel/tags-tree-data.js'

describe('[IMPL-SIDE_PANEL_BOOKMARK_SEARCH] tags tree composition', () => {
  test('search filters the source rows before tag grouping', () => {
    const bookmarks = [
      { url: 'https://example.com/one', description: 'Keep', tags: ['work'] },
      { url: 'https://example.com/two', description: 'Drop', tags: ['personal'] }
    ]

    const matching = filterBookmarksBySearch(bookmarks, 'keep')
    const grouped = buildTagToBookmarks(matching, ['work', 'personal'])

    expect(matching).toHaveLength(1)
    expect(grouped.get('work')).toEqual([
      { title: 'Keep', url: 'https://example.com/one' }
    ])
    expect(grouped.has('personal')).toBe(false)
  })
})
