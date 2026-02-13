# [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Suggested Tags Case Preservation

**Category**: Functional  
**Priority**: P1  
**Status**: ✅ Implemented  
**Created**: 2025-07-14  
**Last Updated**: 2026-02-13

---

## Description

The extension must preserve the original capitalization of words found in page content when generating suggested tags. For words containing uppercase letters, both the original case version and a lowercase version must be offered as separate tag suggestions, giving users flexibility to choose their preferred capitalization style.

## Rationale

### Why This Requirement Exists

Page content often contains proper nouns, acronyms, and brand names with specific capitalization (e.g., "JavaScript", "GitHub", "AI"). Forcing all suggestions to lowercase would lose semantic meaning, while offering only original case would prevent users from choosing consistent lowercase tagging. Providing both options respects the content's semantics while giving users control.

### Problems Solved

- **Lost original case from content**: Previous implementations might have lowercased all suggestions, losing important semantic information.
- **No capitalization choice**: Users had no way to choose between "JavaScript" and "javascript" if only one was offered.

### Benefits

- **Preserved original case**: Proper nouns and brand names maintain their canonical capitalization.
- **User choice in capitalization**: Users can select either the original-case or lowercase version based on their tagging preferences.

---

## Satisfaction Criteria

1. **Preserves original case from content**: The first occurrence of each word in the extracted content preserves its original capitalization (e.g., "JavaScript" from a heading appears as "JavaScript").

2. **For words with uppercase, includes both original and lowercase versions as separate tags**: If a word contains any uppercase letters (e.g., "JavaScript"), both "JavaScript" and "javascript" appear as separate suggestions.

3. **All-lowercase words appear once**: If a word is already all-lowercase (e.g., "tutorial"), it appears only once in suggestions (not duplicated).

4. **Both versions displayed to users**: The UI shows both versions in the suggestions list, allowing users to click either one.

---

## Validation Criteria

### Unit Tests

**Coverage**: Case preservation logic, dual-version generation

**Test Scope** (currently **not implemented**; see "Current Test Gap" below):
- Verify original case preserved: word "GitHub" in content produces suggestion "GitHub"
- Verify lowercase version generated: word "GitHub" in content also produces suggestion "github"
- Verify all-lowercase words appear once: word "tutorial" in content produces only "tutorial" (not duplicated)
- Verify mixed-case acronyms: word "AI" produces both "AI" and "ai"
- Verify exact duplicate removal: if "javascript" appears twice, only one "javascript" suggestion remains
- Verify both versions preserved through sanitization: sanitization doesn't incorrectly merge case variants

### Current Test Gap

**No dedicated unit tests** exist for suggested tags case preservation. The requirements.yaml references "Suggested tags case preservation tests", but these have not been implemented.

### Recommended Tests for Future Modification

1. **Unit test for case preservation in TagService.extractSuggestedTagsFromContent**:
   - Mock document with title "Learning JavaScript and Python"
   - Verify suggestions include ["JavaScript", "javascript", "Python", "python", "Learning", "learning"]
   - Verify all-lowercase word "and" appears only once (or filtered as noise word)

2. **Unit test for exact duplicate removal**:
   - Mock content with "React" appearing 5 times and "react" appearing 3 times
   - Verify both "React" and "react" in suggestions (not 8 duplicate entries)
   - Verify frequency reflects combined count (8 total occurrences)

---

## Traceability

### Architecture

- **[ARCH-SUGGESTED_TAGS]**: Case preservation with dual-version generation

### Implementation

- **[IMPL-SUGGESTED_TAGS]**: Original case tracking, lowercase variant generation, exact duplicate removal

### Code Locations

| File | Function/Section | Lines | Description |
|------|------------------|-------|-------------|
| `src/features/tagging/tag-service.js` | Case preservation in `extractSuggestedTagsFromContent` | ~1031-1193 | Tracks `originalCaseMap` (lowercase → first original case seen); generates both versions; sorts and deduplicates |
| `src/ui/popup/PopupController.js` | Case preservation in inlined extraction | ~450-590 | Duplicated logic: `originalCaseMap`, dual-version generation, exact duplicate removal with `seenExact` Set |
| `safari/src/features/tagging/tag-service.js` | (mirror) | ~1031-1193 | Safari mirror of TagService case preservation |

**Code Annotations**: Case preservation sections marked with `[REQ-SUGGESTED_TAGS_CASE_PRESERVATION]` in comments

### Tests

- **Expected**: "Suggested tags case preservation tests" (referenced in requirements.yaml)
- **Actual**: None implemented (see "Current Test Gap" above)

---

## Related Requirements

### Depends On

None

### Related To

- **[REQ-SUGGESTED_TAGS_FROM_CONTENT]**: Case preservation applied to extracted suggestions
- **[REQ-SUGGESTED_TAGS_DEDUPLICATION]**: Deduplication must use case-insensitive comparison while preserving both case variants in suggestions

### Supersedes

None

---

## Modifiable Decisions

The following design choices are documented in [IMPL-SUGGESTED_TAGS] and can be modified:

1. **First-occurrence case preference**: Currently, the first occurrence of each word (by lowercase key) sets the "original case" for that word. Alternative: use most-frequent case variant, or most-recently-seen case.

2. **Dual-version generation rule**: Currently generates lowercase version only if word contains uppercase letters. Alternative: always generate both versions for all words (but would duplicate all-lowercase words).

3. **Exact duplicate removal strategy**: Currently uses a `Set` (`seenExact`) to track exact string matches. This correctly preserves "Git" and "git" as distinct while removing true duplicates. Alternative: use `Map` to track and merge frequency counts.

4. **Sort order for case variants**: Currently sorts all tags (both versions) by frequency, then alphabetically. This may interleave "JavaScript" and "javascript" based on frequency. Alternative: group case variants together in sort.

5. **Limit application**: Currently applies limit *after* dual-version generation, so limit of 10 may return 20 tags (original + lowercase for each). This is intentional to give users more choices, but could be adjusted to apply limit to unique lowercase words before dual-version generation.

---

*Last validated: 2026-02-13 by AI agent*
