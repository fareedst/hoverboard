# [IMPL-SUGGESTED_TAGS] Suggested Tags Implementation

**Cross-References**: [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION]  
**Status**: Active  
**Created**: 2025-07-14  
**Last Updated**: 2026-02-13

---

## Decision

Implement suggested tags with two extraction paths: TagService for overlay (content script context) and inlined script injection for popup (page context). Both paths use multi-source extraction, frequency ranking, case preservation, and deduplication, with slight differences in limits and sanitization.

---

## Rationale

### Why This Implementation

- **Realizes [ARCH-SUGGESTED_TAGS]**: Multi-source extraction with frequency sorting and case preservation
- **Meets [REQ-SUGGESTED_TAGS_FROM_CONTENT]**: Extracts from title, URL, headings, nav, breadcrumbs, images, links
- **Meets [REQ-SUGGESTED_TAGS_DEDUPLICATION]**: Case-insensitive filtering against current tags
- **Meets [REQ-SUGGESTED_TAGS_CASE_PRESERVATION]**: Preserves original case, provides lowercase variants

### Problems Solved

- **Manual tag entry**: Users can click suggested tags instead of typing
- **No context awareness**: Suggestions reflect actual page content

### Benefits

- **Smart suggestions**: Frequency-ranked, noise-filtered tags from page semantics
- **Faster tagging**: Click-to-add reduces keystrokes and cognitive load

---

## Implementation Approach

### Overview

Two extraction paths exist due to execution context constraints:

1. **Overlay Path**: Content script has DOM access → calls TagService directly
2. **Popup Path**: Popup has no DOM access → injects script into page context → duplicates extraction logic

Both paths follow the same algorithm but have **implementation drift** (different limits, different sanitization).

### Extraction Algorithm (Common to Both Paths)

```javascript
// Pseudo-code for extraction algorithm
function extractSuggestedTags(document, url, limit) {
  // 1. Extract text from sources
  allTexts = []
  allTexts.push(document.title)
  allTexts.push(extractURLSegments(url))
  allTexts.push(extractHeadings(document))  // h1, h2, h3
  allTexts.push(extractNav(document))       // first 20 nav links
  allTexts.push(extractBreadcrumbs(document))
  allTexts.push(extractImages(document))    // first 5 main images alt
  allTexts.push(extractLinks(document))     // first 10 main links
  
  // 2. Tokenize
  words = tokenize(allTexts.join(' '))
  
  // 3. Filter noise words
  filteredWords = words.filter(w => !noiseWords.has(w.toLowerCase()) && w.length >= 2 && !isPureNumber(w))
  
  // 4. Count frequency (case-insensitive grouping)
  wordFrequency = Map<lowercase, count>
  originalCaseMap = Map<lowercase, firstOriginalCase>
  
  // 5. Sort by frequency (descending), then alphabetically
  sortedWords = sort(wordFrequency, (a, b) => b.frequency - a.frequency || a.lowercase.localeCompare(b.lowercase))
  
  // 6. Case preservation: generate both versions for capitalized words
  tagsWithVersions = []
  for (lowerWord, frequency in sortedWords) {
    originalCase = originalCaseMap.get(lowerWord)
    tagsWithVersions.push(originalCase)
    if (originalCase !== lowerWord) {
      tagsWithVersions.push(lowerWord)  // add lowercase variant
    }
  }
  
  // 7. Sanitize
  sanitizedTags = tagsWithVersions.map(sanitize).filter(notEmpty)
  
  // 8. Remove exact duplicates
  uniqueTags = deduplicate(sanitizedTags)
  
  // 9. Apply limit
  return uniqueTags.slice(0, limit * 2)  // Allow both case variants
}
```

### Helper Function: Extract Element Text (Title Attribute Priority)

```javascript
function extractElementText(element) {
  // [REQ-SUGGESTED_TAGS_FROM_CONTENT] - Prioritize title attribute
  if (element.title && element.title.trim().length > 0) {
    return element.title.trim()
  }
  
  // Check child elements for title attribute
  const childWithTitle = element.querySelector('[title]')
  if (childWithTitle && childWithTitle.title.trim().length > 0) {
    return childWithTitle.title.trim()
  }
  
  // Fall back to textContent
  return (element.textContent || '').trim()
}
```

---

## Code Locations

### Core Extraction

| File | Function/Method | Lines | Description |
|------|----------------|-------|-------------|
| `src/features/tagging/tag-service.js` | `extractSuggestedTagsFromContent(document, url, limit)` | ~913-1200 | **Primary extraction** for overlay path; limit default 10; comprehensive algorithm with TagService sanitization |
| `src/ui/popup/PopupController.js` | `loadSuggestedTags()` | ~339-620 | **Popup extraction** via chrome.scripting.executeScript; inlined function duplicates algorithm; limit 20; simple sanitization |

### Display Components

| File | Function/Method | Lines | Description |
|------|----------------|-------|-------------|
| `src/features/content/overlay-manager.js` | Suggested section in `show()` | ~611-686 | Builds "Suggested:" section; calls TagService; filters with `currentTagsLower`; shows 5 tags; click → saveTag + refresh |
| `src/ui/popup/UIManager.js` | `updateSuggestedTags(suggestedTags)` | ~410-440 | Renders suggested tags in popup; shows/hides section; reuses `createRecentTagElement` for styling |
| `src/ui/popup/PopupController.js` | Filtering in `loadSuggestedTags()` | ~596-604 | Filters suggestions vs `currentPin.tags` (case-insensitive); calls `updateSuggestedTags` |

### Safari Mirrors

| File | Description |
|------|-------------|
| `safari/src/features/tagging/tag-service.js` | Mirror of TagService extraction (~913-1200) |
| `safari/src/features/content/overlay-manager.js` | Mirror of overlay display (~603-678) |

---

## Modifiable Implementation Decisions

### 1. Extraction Sources and Order

**Current Order**: Title → URL path → Headings → Nav → Breadcrumbs → Images → Links

**Code Locations**:
- TagService: Lines ~930-1022
- PopupController inlined: Lines ~365-436

**How to Modify**:
- Add new source: Insert extraction code in both TagService and PopupController
- Reorder: Change sequence of `allTexts.push()` calls
- Remove source: Comment out or delete extraction section

**Sync Requirement**: Changes must be made in **both** TagService and PopupController inlined script.

### 2. Numeric Limits

| Component | Limit | Code Location | How to Modify |
|-----------|-------|---------------|---------------|
| Overlay extraction | 10 | `tag-service.js` line ~921 (default parameter) | Change `limit = 10` to desired value |
| Popup extraction | 20 | `PopupController.js` line ~590 (`.slice(0, 20)`) | Change `20` to desired value |
| Overlay display | 5 | `overlay-manager.js` line ~637 (`.slice(0, 5)`) | Change `5` to desired value |
| Popup display | No cap | `PopupController.js` ~596-604 (shows all filtered) | Add `.slice(0, n)` before `updateSuggestedTags()` |

**Considerations**: Higher limits increase computational cost; lower limits may miss relevant suggestions.

### 3. URL Path Segment Filtering

**Current Exclusions**: `www`, `com`, `org`, `net`, `html`, `htm`, `php`, `asp`, `aspx`, `index`, `home`, `page`, pure numbers, length <2

**Code Locations**:
- TagService: Lines ~940-950
- PopupController inlined: Lines ~378-388

**How to Modify**:
- Add exclusion: Add to array in filter condition (e.g., `['www', 'com', ..., 'blog', 'posts']`)
- Remove exclusion: Remove from array
- Change length threshold: Modify `seg.length >= 2` to different value

**Sync Requirement**: Must update in both TagService and PopupController.

### 4. Noise Word List

**Current**: ~200 English stop words hard-coded in both TagService and PopupController

**Code Locations**:
- TagService: Lines ~1043-1075 (`noiseWords` Set)
- PopupController inlined: Lines ~460-492 (`noiseWords` Set)

**How to Modify**:
- Add noise word: Add to Set (e.g., `'blog', 'post', 'page'`)
- Remove noise word: Remove from Set
- Replace list: Swap entire Set definition

**Sync Requirement**: Must update in both locations.

**Refactoring Options**:
- **Centralize**: Move to shared constant file, import in both paths
- **Localize**: Detect page language, use language-specific stop word list
- **User-configurable**: Store in chrome.storage, load at runtime

### 5. Title Attribute Priority

**Current**: Check `element.title` → `childElement.title` → `textContent`

**Code Locations**:
- TagService: Lines ~959-971 (`extractElementText` helper)
- PopupController inlined: Lines ~365-377 (`extractElementText` helper)

**How to Modify**:
- Add aria-label: Insert `if (element.ariaLabel) return element.ariaLabel` before title check
- Change priority: Reorder if-conditions
- Remove title check: Delete title-checking code, use only textContent

**Sync Requirement**: Must update in both locations.

### 6. Case Preservation and Dual-Version Generation

**Current Logic**:
1. Track first occurrence of each word (by lowercase key)
2. For capitalized words: add both original case and lowercase
3. For all-lowercase words: add only once
4. Remove exact string duplicates

**Code Locations**:
- TagService: Lines ~1079-1167
- PopupController inlined: Lines ~494-567

**How to Modify**:

**Change to most-frequent case**:
```javascript
// Replace originalCaseMap tracking with frequency map
const caseCounts = new Map() // lowercase -> Map<originalCase, count>
// Track all case variants with counts
// Select most-frequent case variant instead of first occurrence
```

**Always generate both versions** (would duplicate lowercase words):
```javascript
// Remove check for `if (originalCase !== lowerWord)`
// Always add both versions
```

**Apply limit before dual-version generation**:
```javascript
// Move limit slice before case variant generation
// Would reduce total suggestions but ensure all unique words within limit
```

### 7. Sanitization

**TagService Path** (overlay):
- Uses `this.sanitizeTag(word)` method (comprehensive XSS prevention)
- Location: `tag-service.js` line ~1169-1172

**Popup Inlined Path**:
- Uses simple regex: `word.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)`
- Location: `PopupController.js` line ~573-575

**Issue**: Inconsistent sanitization produces different results from same page content.

**How to Modify**:

**Unify sanitization** (recommended):
```javascript
// Option 1: Inline full sanitizeTag logic in popup script
// Option 2: Extract TagService to shared module, import in popup
// Option 3: Create minimal shared sanitization function
```

**Accept difference** (document only):
- Add comment explaining why different sanitization is acceptable
- Document in IMPL and ARCH decision files

### 8. Deduplication vs Current Tags

**Current**: Build `Set<lowercase>` from current tags, filter suggestions with `!currentTagsLower.has(tag.toLowerCase())`

**Code Locations**:
- Overlay: `overlay-manager.js` lines ~633-641
- Popup: `PopupController.js` lines ~596-603

**How to Modify**:

**Add fuzzy matching**:
```javascript
// Use Levenshtein distance or similar
function isSimilar(tag1, tag2) {
  // Compare normalized forms
  return levenshtein(tag1, tag2) <= 2
}
// Filter suggestions that are similar to any current tag
```

**Add partial match exclusion**:
```javascript
// Exclude suggestions that contain or are contained by current tags
currentTags.forEach(currentTag => {
  if (suggestion.includes(currentTag) || currentTag.includes(suggestion)) {
    // exclude
  }
})
```

### 9. Popup vs Overlay Extraction Architecture

**Current**: Two separate implementations (TagService for overlay, inlined script for popup)

**Issue**: Implementation drift risk; must maintain two copies of extraction logic, noise word list, and sanitization.

**How to Modify**:

**Option A: Centralize extraction** (bundle TagService into content script):
```javascript
// Package TagService as ES module
// Import in popup content script
// Call TagService.extractSuggestedTagsFromContent directly
// Benefits: Single source of truth, no drift
// Drawback: Larger content script bundle
```

**Option B: Keep inlined but document sync** (current approach):
```javascript
// Add prominent comments noting that changes must be synced
// Create shared test suite to verify both implementations produce same results
// Benefits: No bundling complexity
// Drawback: Ongoing maintenance burden
```

**Option C: Extract shared module**:
```javascript
// Create src/shared/tag-extraction.js with pure extraction logic
// Import in both TagService and popup
// Benefits: DRY, smaller than bundling full TagService
// Drawback: Requires build tooling for shared module
```

---

## Implementation Details

### Tokenization

**Regex**: `/[\s\.,;:!?\-_\(\)\[\]{}"']+/`

**Splits on**: Whitespace, punctuation, brackets, quotes

**Preserves**: Alphanumeric characters, case

### Frequency Counting

**Data Structure**: `Map<lowercase, count>`

**Grouping**: Case-insensitive (all variants of "JavaScript" counted together)

**Original Case Tracking**: Separate `Map<lowercase, firstOriginalCase>` preserves first-seen case

### Sorting

**Primary**: Frequency (descending)

**Secondary**: Alphabetical (ascending, using lowercase key)

**Implementation**: `Array.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))`

### Exact Duplicate Removal

**Data Structure**: `Set<exactString>` tracks seen strings

**Preserves**: "JavaScript" and "javascript" as distinct (different exact strings)

**Removes**: Multiple occurrences of identical string (e.g., 5 "react" → 1 "react")

---

## Testing Strategy

### Current State

**No dedicated tests** for suggested tags extraction or display. Requirements reference "Suggested tags tests", "Suggested tags deduplication tests", "Suggested tags case preservation tests" but these are not implemented.

### Recommended Tests

#### Unit Tests for TagService.extractSuggestedTagsFromContent

```javascript
describe('TagService.extractSuggestedTagsFromContent', () => {
  test('extracts from title', () => {
    const doc = createMockDocument({ title: 'Learning JavaScript' })
    const tags = tagService.extractSuggestedTagsFromContent(doc, '', 10)
    expect(tags).toContain('Learning')
    expect(tags).toContain('JavaScript')
  })
  
  test('filters noise words', () => {
    const doc = createMockDocument({ title: 'The Quick Brown Fox' })
    const tags = tagService.extractSuggestedTagsFromContent(doc, '', 10)
    expect(tags).not.toContain('The')
    expect(tags).toContain('Quick')
  })
  
  test('preserves case and generates lowercase', () => {
    const doc = createMockDocument({ title: 'GitHub Tutorial' })
    const tags = tagService.extractSuggestedTagsFromContent(doc, '', 10)
    expect(tags).toContain('GitHub')
    expect(tags).toContain('github')
  })
  
  test('prioritizes title attribute', () => {
    const doc = createMockDocument({
      headings: [{ textContent: 'Short', title: 'Full Title Here' }]
    })
    const tags = tagService.extractSuggestedTagsFromContent(doc, '', 10)
    expect(tags).toContain('Full')
    expect(tags).not.toContain('Short')
  })
})
```

#### Integration Tests for Display

```javascript
describe('Overlay suggested tags display', () => {
  test('shows suggestions below recent tags', async () => {
    const overlay = createOverlay()
    await overlay.show({ bookmark: { tags: [] } })
    const suggested = overlay.querySelector('.suggested-container')
    expect(suggested).toBeDefined()
    expect(suggested.textContent).toContain('Suggested:')
  })
  
  test('deduplicates against current tags', async () => {
    const overlay = createOverlay()
    mockTagService.extractSuggestedTagsFromContent.mockReturnValue(['react', 'React', 'tutorial'])
    await overlay.show({ bookmark: { tags: ['React'] } })
    const tags = overlay.querySelectorAll('.suggested-container .tag-element')
    expect(tags.length).toBe(1)  // Only 'tutorial' (react and React excluded)
  })
})
```

---

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files carrying `[IMPL-SUGGESTED_TAGS]` annotations:

- [x] `src/features/tagging/tag-service.js` - Extraction method (~913-1200)
- [x] `src/features/content/overlay-manager.js` - Display section (~611-686)
- [x] `src/ui/popup/PopupController.js` - Inlined extraction (~339-620)
- [x] `src/ui/popup/UIManager.js` - Display method (~410-440)
- [x] `safari/src/features/tagging/tag-service.js` - Safari mirror
- [x] `safari/src/features/content/overlay-manager.js` - Safari mirror

Tests expected:
- [ ] Tag extraction tests (not implemented)
- [ ] Deduplication tests (not implemented)
- [ ] Case preservation tests (not implemented)
- [ ] Display tests (not implemented)

---

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2025-07-14 | Initial | ✅ Implemented | Feature implemented with dual extraction paths |
| 2026-02-13 | Migration | ✅ Documented | Migrated from STDD to TIED format |
| 2026-02-13 | Detail file | ✅ Documented | Created IMPL detail file with all modifiable decisions |

---

## Related Decisions

### Depends On

None

### Supersedes

None

### See Also

- **[IMPL-TAG_SYSTEM]**: Tag service implementation (sanitization, recent tags)
- **[ARCH-SUGGESTED_TAGS]**: Architecture decision for suggested tags

---

*Last validated: 2026-02-13 by AI agent*
