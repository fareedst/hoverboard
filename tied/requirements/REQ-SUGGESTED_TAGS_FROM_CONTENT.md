# [REQ-SUGGESTED_TAGS_FROM_CONTENT] Suggested Tags from Page Content

**Category**: Functional  
**Priority**: P1  
**Status**: ✅ Implemented  
**Created**: 2025-07-14  
**Last Updated**: 2026-02-13

---

## Description

The extension must intelligently suggest tags based on page content (title, URL, headings, navigation, breadcrumbs, images, and links) to speed up bookmarking workflow. Suggestions appear below recent tags in both the popup and overlay interfaces, allowing users to quickly add relevant tags without manual typing.

## Rationale

### Why This Requirement Exists

Intelligent tag suggestions dramatically speed up bookmarking workflow by providing context-aware tag candidates derived from page semantics. This eliminates the need for manual tag entry while maintaining user control over which suggested tags to accept.

### Problems Solved

- **Manual tag entry required**: Users previously had to type all tags manually, slowing down bookmarking.
- **No context-aware suggestions**: Without page content analysis, users had to recall or invent tags without assistance.

### Benefits

- **Faster tagging**: Click-to-add suggestions reduce keystrokes and cognitive load.
- **Context-aware suggestions**: Tags reflect the actual page content, improving discoverability and organization.

---

## Satisfaction Criteria

1. **Suggested tags section below recent tags**: Both popup and overlay display a "Suggested:" section positioned below the recent tags section.
2. **Extracts from title, URL, headings, nav, breadcrumbs, images, links**: The extraction algorithm must gather text from:
   - Document title
   - URL path segments (filtered for meaningful content)
   - H1, H2, H3 headings
   - Navigation links (first 20)
   - Breadcrumb navigation
   - Main content images alt text (first 5)
   - Main content anchor links (first 10)
3. **Prioritizes title attribute over textContent**: When extracting element text, prefer the `title` attribute (on the element or child elements) over `textContent`.
4. **Filters noise, counts frequency, sorts by frequency**: Remove common English stop words, count word occurrences, and return suggestions sorted by frequency (descending), then alphabetically.

---

## Validation Criteria

### Unit Tests

**Coverage**: Extraction algorithm, frequency sorting, noise filtering

**Test Scope** (currently **not implemented**; see "Current Test Gap" below):
- Verify extraction from each source (title, URL, headings, nav, breadcrumbs, images, links)
- Verify title attribute takes precedence over textContent
- Verify noise words are filtered (test with common stop words)
- Verify frequency counting and sorting (most frequent words first, alphabetical tiebreaker)
- Verify URL path segment exclusions (www, com, org, numeric, short segments)
- Verify limits: extraction returns correct number of suggestions (10 for overlay, 20 for popup script)

### Current Test Gap

**No dedicated unit tests** exist for suggested tags extraction or display. The requirements.yaml references "Suggested tags tests", but these have not been implemented. Existing tag-related tests (`tests/unit/tag-storage.test.js`, `tests/unit/tag-recent-tracking.test.js`) cover tag persistence and recent tags but do not test `extractSuggestedTagsFromContent`.

### Recommended Tests for Future Modification

1. **Unit test for `TagService.extractSuggestedTagsFromContent`**:
   - Mock document with title, headings, nav, breadcrumbs, images, links
   - Verify extraction from each source
   - Verify noise filtering and frequency sorting
   - Verify URL path filtering
   - Verify title attribute priority

2. **Integration test for overlay display**:
   - Inject overlay with mock page content
   - Verify "Suggested:" section appears with correct tags
   - Verify click adds tag and refreshes display

3. **Integration test for popup display**:
   - Mock chrome.scripting.executeScript to return suggested tags
   - Verify UIManager displays tags in suggestedTagsContainer
   - Verify deduplication against current tags

---

## Traceability

### Architecture

- **[ARCH-SUGGESTED_TAGS]**: Multi-source extraction with frequency sorting and case preservation

### Implementation

- **[IMPL-SUGGESTED_TAGS]**: Tag extraction, display, and user interaction

### Code Locations

| File | Function/Section | Lines | Description |
|------|------------------|-------|-------------|
| `src/features/tagging/tag-service.js` | `extractSuggestedTagsFromContent(document, url, limit)` | ~913-1200 | Core extraction algorithm (overlay path) |
| `src/features/content/overlay-manager.js` | Suggested section build in `show()` | ~611-686 | Creates "Suggested:" UI section, calls TagService, handles click |
| `src/ui/popup/PopupController.js` | `loadSuggestedTags()` with inlined extraction | ~339-620 | Injects content script with duplicated extraction logic |
| `src/ui/popup/UIManager.js` | `updateSuggestedTags(suggestedTags)` | ~410-440 | Renders suggested tags in popup UI |
| `safari/src/features/tagging/tag-service.js` | (mirror) | ~913-1200 | Safari mirror of extraction |
| `safari/src/features/content/overlay-manager.js` | (mirror) | ~603-678 | Safari mirror of overlay display |

**Code Annotations**: All functions marked with `[REQ-SUGGESTED_TAGS_FROM_CONTENT]` in comments

### Tests

- **Expected**: "Suggested tags tests" (referenced in requirements.yaml)
- **Actual**: None implemented (see "Current Test Gap" above)

---

## Related Requirements

### Depends On

None

### Related To

- **[REQ-SUGGESTED_TAGS_DEDUPLICATION]**: Case-insensitive filtering to exclude tags already in current bookmark
- **[REQ-SUGGESTED_TAGS_CASE_PRESERVATION]**: Preserves original case and provides lowercase variants
- **[REQ-TAG_MANAGEMENT]**: General tag management infrastructure

### Supersedes

None

---

## Modifiable Decisions

The following design choices are documented in [IMPL-SUGGESTED_TAGS] and can be modified:

1. **Extraction sources and order**: Current order is title → URL → headings → nav → breadcrumbs → images → links. Reordering or adding sources requires changes to both TagService and PopupController inlined script.

2. **Numeric limits**:
   - Overlay extraction limit: 10 (TagService parameter)
   - Popup extraction limit: 20 (inlined script)
   - Overlay display limit: 5 (slice in overlay-manager.js)
   - Popup display limit: no explicit cap (all filtered suggestions shown)

3. **URL path filtering**: Excluded segments include `www`, `com`, `org`, `net`, `html`, `htm`, `php`, `asp`, `aspx`, `index`, `home`, `page`, pure numeric segments, and segments shorter than 2 characters.

4. **Noise word list**: Large static English stop word list (200+ words) exists in both TagService and PopupController. Changes must be kept in sync or extraction centralized.

5. **Title attribute priority**: Elements checked for `title` attribute first (element itself, then child elements) before falling back to `textContent`.

---

*Last validated: 2026-02-13 by AI agent*
