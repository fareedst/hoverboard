# [REQ-SUGGESTED_TAGS_DEDUPLICATION] Suggested Tags Deduplication

**Category**: Functional  
**Priority**: P1  
**Status**: ✅ Implemented  
**Created**: 2025-07-14  
**Last Updated**: 2026-02-13

---

## Description

The extension must filter suggested tags to exclude any tags already present in the current bookmark's tag list, using case-insensitive comparison. This prevents redundant suggestions and keeps the suggestions list clean and relevant.

## Rationale

### Why This Requirement Exists

Users should only see tag suggestions they don't already have. Showing tags already applied to the current bookmark clutters the UI and wastes user attention.

### Problems Solved

- **Redundant tag suggestions**: Without deduplication, users see tags they've already added, creating confusion and UI clutter.
- **Cluttered suggestions list**: Irrelevant suggestions reduce the value of the feature.

### Benefits

- **Clean suggestions**: Only new, relevant tags appear in the suggestions section.
- **Relevant-only tags**: Users can focus on discovering and adding new tags without filtering out duplicates mentally.

---

## Satisfaction Criteria

1. **Case-insensitive comparison with current tags**: Compare suggested tags to current bookmark tags using lowercase normalization (e.g., "Git" in current tags excludes both "Git" and "git" from suggestions).

2. **Tags present in current list excluded from suggestions**: Any suggested tag whose lowercase form matches a current tag's lowercase form is filtered out before display.

3. **Works in both popup and overlay**: Deduplication logic is applied in both popup (PopupController) and overlay (overlay-manager) contexts.

---

## Validation Criteria

### Unit Tests

**Coverage**: Case-insensitive filtering logic

**Test Scope** (currently **not implemented**; see "Current Test Gap" below):
- Verify exact match exclusion: if current tags include "javascript", suggestion "javascript" is excluded
- Verify case-insensitive exclusion: if current tags include "JavaScript", suggestion "javascript" is excluded
- Verify case-insensitive exclusion (reverse): if current tags include "javascript", suggestion "JavaScript" is excluded
- Verify non-matching tags pass through: tags not in current list appear in suggestions
- Verify empty current tags: all suggestions shown when bookmark has no tags

### Current Test Gap

**No dedicated unit tests** exist for suggested tags deduplication. The requirements.yaml references "Suggested tags deduplication tests", but these have not been implemented.

### Recommended Tests for Future Modification

1. **Unit test for deduplication in overlay**:
   - Mock overlay with current tags ["React", "tutorial"]
   - Mock TagService to return ["react", "React", "TypeScript", "tutorial", "coding"]
   - Verify only ["TypeScript", "coding"] displayed (case-insensitive exclusion)

2. **Unit test for deduplication in popup**:
   - Mock currentPin with tags ["Python", "data"]
   - Mock executeScript result ["python", "Python", "analysis", "data", "science"]
   - Verify only ["analysis", "science"] passed to updateSuggestedTags

---

## Traceability

### Architecture

- **[ARCH-SUGGESTED_TAGS]**: Multi-source extraction with case-insensitive deduplication

### Implementation

- **[IMPL-SUGGESTED_TAGS]**: Deduplication implemented in both overlay and popup display logic

### Code Locations

| File | Function/Section | Lines | Description |
|------|------------------|-------|-------------|
| `src/features/content/overlay-manager.js` | Suggested section build in `show()` | ~633-641 | Creates `currentTagsLower` Set, filters suggestions with `!currentTagsLower.has(tagLower)` |
| `src/ui/popup/PopupController.js` | `loadSuggestedTags()` filtering | ~596-603 | Creates `currentTagsLower` Set from `currentPin.tags`, filters with `!currentTagsLower.has(tag.toLowerCase())` |
| `safari/src/features/content/overlay-manager.js` | (mirror) | ~625-633 | Safari mirror of overlay deduplication |

**Code Annotations**: Deduplication sections marked with `[REQ-SUGGESTED_TAGS_DEDUPLICATION]` in comments

### Tests

- **Expected**: "Suggested tags deduplication tests" (referenced in requirements.yaml)
- **Actual**: None implemented (see "Current Test Gap" above)

---

## Related Requirements

### Depends On

None

### Related To

- **[REQ-SUGGESTED_TAGS_FROM_CONTENT]**: Provides the suggestions to be deduplicated
- **[REQ-SUGGESTED_TAGS_CASE_PRESERVATION]**: Deduplication must work with both original and lowercase tag versions

### Supersedes

None

---

## Modifiable Decisions

The following design choice is documented in [IMPL-SUGGESTED_TAGS] and can be modified:

1. **Case-insensitive comparison strategy**: Currently uses `Set` of lowercased current tags for O(1) lookup. Alternative approaches (case-insensitive indexOf, normalize-compare-compare) would have different performance characteristics but same user-facing behavior.

2. **Deduplication location**: Currently duplicated in overlay-manager and PopupController. Could be centralized in TagService or a shared utility.

---

*Last validated: 2026-02-13 by AI agent*
