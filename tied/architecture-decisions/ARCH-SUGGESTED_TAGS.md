# [ARCH-SUGGESTED_TAGS] Suggested Tags from Page Content Architecture

**Cross-References**: [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION]  
**Status**: Active  
**Created**: 2025-07-14  
**Last Updated**: 2026-02-13

---

## Decision

Implement intelligent tag suggestions by extracting and analyzing text from multiple page content sources (title, URL, headings, navigation, breadcrumbs, images, links), filtering noise words, counting word frequency, preserving original case with lowercase variants, and deduplicating against current tags.

---

## Rationale

### Why This Architecture

Intelligent tag suggestions speed up bookmarking workflow by providing context-aware tag candidates without requiring manual typing. Multi-source extraction ensures comprehensive coverage of page semantics; frequency sorting prioritizes common/important terms; case preservation respects proper nouns and brand names while offering lowercase alternatives.

### Problems Solved

- **Manual tag entry**: Users previously typed all tags manually, slowing bookmarking.
- **No context awareness**: Without page analysis, users invented tags without semantic guidance.

### Benefits

- **Faster tagging**: Click-to-add suggestions reduce keystrokes and cognitive load.
- **Context-aware suggestions**: Tags reflect actual page content, improving discoverability.
- **User choice in capitalization**: Both original and lowercase versions give users flexibility.

---

## Alternatives Considered

No formal alternatives were documented. The current multi-source extraction approach was implemented directly based on requirements.

---

## Implementation Approach

### High-Level Strategy

**Extract → Filter → Rank → Deduplicate → Display**

1. **Extract text** from multiple page sources (title, URL segments, headings, nav, breadcrumbs, images, links)
2. **Tokenize and filter** (remove noise words, short words, pure numbers)
3. **Rank by frequency** (count occurrences, sort descending)
4. **Preserve case** (track original case, generate lowercase variants for capitalized words)
5. **Sanitize** (remove special characters, limit length)
6. **Deduplicate** (exclude tags already in current bookmark, case-insensitive)
7. **Display** (show suggestions in UI, allow click-to-add)

### Key Components

#### 1. Extraction Sources (in order)

| Source | Selector/Method | Limit | Priority |
|--------|----------------|-------|----------|
| Document title | `document.title` | Full text | High |
| URL path segments | `URL.pathname.split('/')` | All segments (filtered) | High |
| H1/H2/H3 headings | `querySelectorAll('h1, h2, h3')` | All headings | High |
| Navigation links | `nav a`, `header nav a`, `[role="navigation"] a` | First 20 links | Medium |
| Breadcrumbs | `[aria-label*="breadcrumb"]`, `.breadcrumb`, etc. | All breadcrumb links | Medium |
| Main images | `main img`, `article img`, etc. | First 5 images (alt text) | Low |
| Main links | `main a`, `article a`, etc. | First 10 links | Low |

**Title Attribute Priority**: For all elements, check `element.title` first, then `childElement.title`, then fall back to `textContent`.

#### 2. Filtering Rules

**URL Path Segments**: Exclude `www`, `com`, `org`, `net`, `html`, `htm`, `php`, `asp`, `aspx`, `index`, `home`, `page`; exclude pure numeric segments; exclude segments shorter than 2 characters.

**Noise Words**: Large English stop word list (~200 words: "a", "an", "and", "the", "is", "of", etc.) filters common words with no semantic value.

**Word Rules**: Minimum length 2 characters; exclude pure numbers.

#### 3. Frequency Ranking

- Count occurrences of each word (case-insensitive grouping via lowercase key)
- Sort by frequency (descending), then alphabetically (ascending)

#### 4. Case Preservation

- Track first occurrence of each word (by lowercase key) to preserve original case
- For words with uppercase letters: generate both original case and lowercase as separate suggestions
- For all-lowercase words: include only once
- Remove exact string duplicates (so "JavaScript" from 3 sources = 1 suggestion, but "JavaScript" and "javascript" both kept)

#### 5. Sanitization

- **TagService**: `sanitizeTag()` method (strict XSS prevention, character filtering)
- **Popup inlined script**: Simple `replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)`

#### 6. Deduplication vs Current Tags

- Build `Set` of current bookmark tags (lowercased)
- Filter suggestions: exclude any suggestion whose lowercase form is in current tags
- Comparison is case-insensitive (e.g., "React" in current tags excludes both "React" and "react" from suggestions)

#### 7. Display

- **Overlay**: "Suggested:" section below recent tags; shows up to 5 suggestions; click adds tag via `saveTag` message and refreshes overlay
- **Popup**: "Suggested Tags" section (shown/hidden); shows all filtered suggestions; click adds tag via standard tag-add flow

### Data Flow Diagram

```
Page Content (DOM + URL)
         ↓
    [Extraction]
    ├─ Title
    ├─ URL segments
    ├─ Headings (h1/h2/h3)
    ├─ Nav links (20)
    ├─ Breadcrumbs
    ├─ Images alt (5)
    └─ Main links (10)
         ↓
    [Tokenization]
    Split on whitespace/punctuation
         ↓
    [Filtering]
    ├─ Remove noise words
    ├─ Remove short words (<2)
    ├─ Remove pure numbers
    └─ Filter URL segments
         ↓
    [Frequency Counting]
    Count occurrences (case-insensitive)
         ↓
    [Case Preservation]
    ├─ Track original case (first occurrence)
    ├─ Generate lowercase variant (if has uppercase)
    └─ Remove exact duplicates
         ↓
    [Sorting]
    Sort by frequency ↓, then alphabetically ↑
         ↓
    [Sanitization]
    Remove special chars, limit length
         ↓
    [Deduplication vs Current Tags]
    Exclude suggestions in current tags (case-insensitive)
         ↓
    [Display]
    ├─ Overlay: show 5 tags, click → saveTag + refresh
    └─ Popup: show all tags, click → add tag
```

---

## Key Modifiable Decisions

These design choices are implementation details that can be changed without breaking requirements:

### 1. Extraction Sources and Order

**Current**: Title → URL → Headings → Nav → Breadcrumbs → Images → Links

**Modifiable**: Reorder sources based on empirical value; add new sources (meta keywords, structured data, page categories); remove low-value sources (links, images if not useful).

### 2. Numeric Limits

**Current**:
- Overlay extraction limit: 10 (TagService default parameter)
- Popup extraction limit: 20 (inlined script)
- Overlay display limit: 5 (hard-coded slice)
- Popup display limit: no cap (all filtered suggestions shown)

**Modifiable**: Adjust limits based on user testing; unify extraction limits between overlay and popup; add configurable limits in settings.

### 3. URL Path Filtering

**Current**: Exclude specific segments (`www`, `com`, `org`, etc.), pure numeric, and short (<2 chars).

**Modifiable**: Add more exclusions (language codes, common CMS paths); use regex patterns; add TLD-aware filtering.

### 4. Noise Word List

**Current**: Large static English stop word list (~200 words) hard-coded in both TagService and PopupController.

**Modifiable**:
- **Centralize**: Move to shared config or constant
- **Localize**: Add non-English stop word lists based on page language
- **User-configurable**: Allow users to add custom noise words
- **Smart filtering**: Use TF-IDF or other NLP techniques instead of static list

### 5. Title Attribute Priority

**Current**: Check `element.title` → `childElement.title` → `textContent`

**Modifiable**: Change priority order; add aria-label checking; use meta description for title extraction.

### 6. Case Preservation Rules

**Current**: First occurrence sets original case; dual-version for capitalized words; exact duplicate removal.

**Modifiable**:
- Use most-frequent case variant instead of first occurrence
- Always generate both versions (would duplicate all-lowercase words)
- Group case variants together in sort order
- Apply limit before dual-version generation (fewer total suggestions but all unique words)

### 7. Deduplication Strategy

**Current**: Case-insensitive `Set` lookup (O(1) performance)

**Modifiable**: Fuzzy matching (Levenshtein distance) to catch similar tags; partial match exclusion (e.g., exclude "JavaScript" if "JS" exists).

### 8. Popup vs Overlay Extraction

**Current**: Overlay uses TagService; popup uses inlined script with duplicated logic.

**Issue**: Implementation drift risk (different sanitization, different limits, must maintain two copies of noise word list and extraction logic).

**Modifiable**:
- **Centralize extraction**: Bundle TagService into content script so popup can call it directly
- **Keep inlined**: Maintain current approach but document sync requirements
- **Hybrid**: Extract core logic to shared module imported by both paths

### 9. Sanitization Differences

**Current**:
- Overlay/TagService: `sanitizeTag()` (comprehensive XSS prevention)
- Popup inlined: `replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)` (simple character filter)

**Issue**: Inconsistent sanitization may produce different suggestions from same page content.

**Modifiable**: Unify sanitization; inline full `sanitizeTag` logic in popup script; or document and accept the difference.

---

## Integration Points

### TagService (Overlay Path)

- **Caller**: overlay-manager.js `show()` method
- **Method**: `extractSuggestedTagsFromContent(document, url, limit)`
- **Parameters**: Native DOM document, current page URL, extraction limit
- **Returns**: Array of sanitized suggested tag strings

### chrome.scripting.executeScript (Popup Path)

- **Caller**: PopupController.js `loadSuggestedTags()` method
- **Script**: Inlined function injected into current tab
- **Context**: Runs in page context (has access to page DOM)
- **Returns**: Array of sanitized suggested tag strings (via `executeScript` result)

### Display Components

- **Overlay**: overlay-manager.js builds suggested section DOM, handles click events
- **Popup**: UIManager.js `updateSuggestedTags()` renders tags in `suggestedTagsContainer`

---

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files carrying `[IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_*]` annotations:

- [x] `src/features/tagging/tag-service.js` - Extraction method with full token annotations
- [x] `src/features/content/overlay-manager.js` - Display section with token annotations
- [x] `src/ui/popup/PopupController.js` - Inlined extraction with token annotations
- [x] `src/ui/popup/UIManager.js` - Display method with token annotations
- [x] `safari/src/features/tagging/tag-service.js` - Safari mirror
- [x] `safari/src/features/content/overlay-manager.js` - Safari mirror

Tests expected to reference tokens:
- [ ] `testExtractSuggestedTags_REQ_SUGGESTED_TAGS_FROM_CONTENT` (not yet implemented)
- [ ] `testSuggestedTagsDeduplication_REQ_SUGGESTED_TAGS_DEDUPLICATION` (not yet implemented)
- [ ] `testSuggestedTagsCasePreservation_REQ_SUGGESTED_TAGS_CASE_PRESERVATION` (not yet implemented)

---

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2025-07-14 | Initial | ✅ Implemented | Feature implemented and deployed |
| 2026-02-13 | Migration | ✅ Documented | Migrated from STDD to TIED format |
| 2026-02-13 | Detail files | ✅ Documented | Created ARCH detail file with modifiable decisions |

---

## Related Decisions

### Depends On

None

### Informs

- **[IMPL-SUGGESTED_TAGS]**: Implementation details for extraction, display, and user interaction

### See Also

- **[ARCH-TAG_SYSTEM]**: General tag system architecture (recent tags, sanitization, storage)
- **[IMPL-TAG_SYSTEM]**: Tag service implementation

---

*Last validated: 2026-02-13 by AI agent*
