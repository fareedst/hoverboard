/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Unit tests for getTagsToDisplay: implements validation of "tags to display" logic (all tags vs only checked);
 * compact tag selector and all/checked toggle requirement.
 */

import { getTagsToDisplay } from '../../src/ui/side-panel/tags-tree-data.js'

describe('getTagsToDisplay [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] When showAllTags is true, returns allTags so selector shows every tag.
  test('returns allTags when showAllTags is true', () => {
    const allTags = ['a', 'b', 'c']
    const selectedTagOrder = ['b', 'a']
    expect(getTagsToDisplay(allTags, selectedTagOrder, true)).toEqual(['a', 'b', 'c'])
  })

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] When showAllTags is false, returns only selected tags (filtered by allTags to avoid stale tags).
  test('returns selectedTagOrder filtered by allTags when showAllTags is false', () => {
    const allTags = ['a', 'b', 'c']
    const selectedTagOrder = ['b', 'a']
    expect(getTagsToDisplay(allTags, selectedTagOrder, false)).toEqual(['b', 'a'])
  })

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] When "only checked", stale tags not in allTags are omitted.
  test('filters out stale tags from selectedTagOrder when showAllTags is false', () => {
    const allTags = ['a', 'c']
    const selectedTagOrder = ['b', 'a', 'd', 'c']
    expect(getTagsToDisplay(allTags, selectedTagOrder, false)).toEqual(['a', 'c'])
  })

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Empty allTags yields empty list in both modes.
  test('returns empty array when allTags is empty', () => {
    expect(getTagsToDisplay([], [], true)).toEqual([])
    expect(getTagsToDisplay([], ['x'], false)).toEqual([])
  })

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Empty selectedTagOrder with showAllTags false yields empty list.
  test('returns empty array when showAllTags is false and selectedTagOrder is empty', () => {
    const allTags = ['a', 'b']
    expect(getTagsToDisplay(allTags, [], false)).toEqual([])
  })
})
