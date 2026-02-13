# Suggested Tags Implementation Map

**Purpose**: Quick reference mapping TIED tokens to implemented code and tests for suggested tags feature.

**Last Updated**: 2026-02-13

---

## TIED Token → Code Mapping

### Requirements

#### [REQ-SUGGESTED_TAGS_FROM_CONTENT]

**What**: Intelligent tag suggestions from page content (title, URL, headings, nav, breadcrumbs, images, links)

**Detail File**: [tied/requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.md](../requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.md)

**Implemented In**:

| File | Function/Section | Lines | Description |
|------|------------------|-------|-------------|
| `src/features/tagging/tag-service.js` | `extractSuggestedTagsFromContent()` | ~913-1200 | Core extraction algorithm (overlay) |
| `src/features/content/overlay-manager.js` | Suggested section in `show()` | ~611-686 | Overlay display, click handler |
| `src/ui/popup/PopupController.js` | `loadSuggestedTags()` + inlined | ~339-620 | Popup extraction via script injection |
| `src/ui/popup/UIManager.js` | `updateSuggestedTags()` | ~410-440 | Popup display |

**Safari Mirrors**: `safari/src/features/tagging/tag-service.js`, `safari/src/features/content/overlay-manager.js`

**Tests**: ❌ None (see [REQ-SUGGESTED_TAGS_FROM_CONTENT.md](../requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.md) "Current Test Gap")

---

#### [REQ-SUGGESTED_TAGS_DEDUPLICATION]

**What**: Case-insensitive filtering to exclude tags already in current bookmark

**Detail File**: [tied/requirements/REQ-SUGGESTED_TAGS_DEDUPLICATION.md](../requirements/REQ-SUGGESTED_TAGS_DEDUPLICATION.md)

**Implemented In**:

| File | Function/Section | Lines | Description |
|------|------------------|-------|-------------|
| `src/features/content/overlay-manager.js` | Deduplication in `show()` | ~633-641 | `currentTagsLower` Set, `!currentTagsLower.has(tagLower)` |
| `src/ui/popup/PopupController.js` | Deduplication in `loadSuggestedTags()` | ~596-603 | `currentTagsLower` Set, filter before `updateSuggestedTags` |

**Tests**: ❌ None (see [REQ-SUGGESTED_TAGS_DEDUPLICATION.md](../requirements/REQ-SUGGESTED_TAGS_DEDUPLICATION.md) "Current Test Gap")

---

#### [REQ-SUGGESTED_TAGS_CASE_PRESERVATION]

**What**: Preserve original case, provide both original and lowercase versions for capitalized words

**Detail File**: [tied/requirements/REQ-SUGGESTED_TAGS_CASE_PRESERVATION.md](../requirements/REQ-SUGGESTED_TAGS_CASE_PRESERVATION.md)

**Implemented In**:

| File | Function/Section | Lines | Description |
|------|------------------|-------|-------------|
| `src/features/tagging/tag-service.js` | Case preservation logic | ~1031-1193 | `originalCaseMap`, dual-version generation, exact duplicate removal |
| `src/ui/popup/PopupController.js` | Case preservation in inlined | ~450-590 | Duplicated logic in executeScript function |

**Tests**: ❌ None (see [REQ-SUGGESTED_TAGS_CASE_PRESERVATION.md](../requirements/REQ-SUGGESTED_TAGS_CASE_PRESERVATION.md) "Current Test Gap")

---

### Architecture

#### [ARCH-SUGGESTED_TAGS]

**What**: Multi-source extraction with frequency sorting and case preservation architecture

**Detail File**: [tied/architecture-decisions/ARCH-SUGGESTED_TAGS.md](../architecture-decisions/ARCH-SUGGESTED_TAGS.md)

**Key Design Decisions**:
- Extraction sources and order (title → URL → headings → nav → breadcrumbs → images → links)
- Numeric limits (10/20 extraction, 5 display for overlay)
- Noise word filtering (~200 English stop words)
- Title attribute priority over textContent
- Case preservation rules (first occurrence, dual-version for capitalized)
- Deduplication strategy (case-insensitive Set lookup)
- Popup vs overlay extraction architecture (inlined script vs TagService)

**Realizes Requirements**: REQ-SUGGESTED_TAGS_FROM_CONTENT, REQ-SUGGESTED_TAGS_DEDUPLICATION, REQ-SUGGESTED_TAGS_CASE_PRESERVATION

---

### Implementation

#### [IMPL-SUGGESTED_TAGS]

**What**: Concrete implementation with two extraction paths (TagService for overlay, inlined script for popup)

**Detail File**: [tied/implementation-decisions/IMPL-SUGGESTED_TAGS.md](../implementation-decisions/IMPL-SUGGESTED_TAGS.md)

**Code Components**:

| Component | File | Function | Lines | Purpose |
|-----------|------|----------|-------|---------|
| **Core Extraction** | `src/features/tagging/tag-service.js` | `extractSuggestedTagsFromContent()` | ~913-1200 | Primary algorithm (overlay path) |
| **Popup Extraction** | `src/ui/popup/PopupController.js` | `loadSuggestedTags()` | ~339-620 | Script injection with inlined logic |
| **Overlay Display** | `src/features/content/overlay-manager.js` | Suggested section in `show()` | ~611-686 | "Suggested:" UI, click handler |
| **Popup Display** | `src/ui/popup/UIManager.js` | `updateSuggestedTags()` | ~410-440 | Render suggestions in popup |

**Modifiable Decisions** (see [IMPL-SUGGESTED_TAGS.md](../implementation-decisions/IMPL-SUGGESTED_TAGS.md) for details):
1. Extraction sources and order
2. Numeric limits (10/20/5)
3. URL path segment filtering
4. Noise word list (200+ English stop words)
5. Title attribute priority
6. Case preservation and dual-version generation
7. Sanitization (TagService vs simple regex)
8. Deduplication strategy
9. Popup vs overlay extraction architecture (implementation drift risk)

---

## Testing Status

### Current State

❌ **No dedicated tests** for suggested tags feature

**Expected Tests** (from requirements.yaml):
- "Suggested tags tests"
- "Suggested tags deduplication tests"
- "Suggested tags case preservation tests"

**Existing Tests** (do not cover suggested tags):
- `tests/unit/tag-storage.test.js` - Tag persistence
- `tests/unit/tag-recent-tracking.test.js` - Recent tags
- `tests/unit/tag-sanitization-fix.test.js` - Tag sanitization

### Recommended Tests

See detail files for comprehensive test recommendations:
- [REQ-SUGGESTED_TAGS_FROM_CONTENT.md](../requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.md) §"Recommended Tests"
- [REQ-SUGGESTED_TAGS_DEDUPLICATION.md](../requirements/REQ-SUGGESTED_TAGS_DEDUPLICATION.md) §"Recommended Tests"
- [REQ-SUGGESTED_TAGS_CASE_PRESERVATION.md](../requirements/REQ-SUGGESTED_TAGS_CASE_PRESERVATION.md) §"Recommended Tests"
- [IMPL-SUGGESTED_TAGS.md](../implementation-decisions/IMPL-SUGGESTED_TAGS.md) §"Testing Strategy"

**Quick Summary**:
1. Unit test `TagService.extractSuggestedTagsFromContent` (sources, frequency, noise, case)
2. Unit test deduplication logic (case-insensitive exclusion)
3. Unit test case preservation (dual-version generation, exact duplicates)
4. Integration test overlay display (section shown, click adds tag)
5. Integration test popup display (section shown/hidden, deduplication)

---

## Code Search Tips

### Find all suggested tags code

```bash
# Grep for suggested tags token annotations
rg "REQ-SUGGESTED_TAGS" --type js

# Find extraction functions
rg "extractSuggestedTagsFromContent" --type js

# Find display code
rg "updateSuggestedTags|suggested-container|Suggested:" --type js
```

### Find modifiable decisions in code

```bash
# Extraction limits
rg "limit = 10|slice\(0, 5\)|slice\(0, 20\)" src/

# Noise word lists
rg "noiseWords = new Set" --type js

# URL exclusions
rg "www.*com.*org" --type js
```

---

## Modification Workflow

When modifying suggested tags behavior:

1. **Identify decision to modify**: Check [ARCH-SUGGESTED_TAGS.md](../architecture-decisions/ARCH-SUGGESTED_TAGS.md) §"Key Modifiable Decisions"

2. **Locate code**: Use table above or [IMPL-SUGGESTED_TAGS.md](../implementation-decisions/IMPL-SUGGESTED_TAGS.md) §"Code Locations"

3. **Check sync requirements**: Many decisions exist in **both** TagService and PopupController inlined script
   - Extraction sources and order
   - Numeric limits
   - URL segment filtering
   - Noise word list
   - Title attribute priority
   - Case preservation logic

4. **Update code**: Make changes in all required locations

5. **Update TIED docs**: Update detail files to reflect new decisions

6. **Add/update tests**: Add tests for new behavior (or update existing when tests exist)

7. **Validate**: Run tests, check both overlay and popup behavior

---

## Implementation Drift Risks

⚠️ **Known Issue**: Popup and overlay use different extraction implementations

**TagService Path** (overlay):
- Extraction: `TagService.extractSuggestedTagsFromContent()`
- Sanitization: `TagService.sanitizeTag()` (comprehensive XSS prevention)
- Limit: 10 extraction, 5 display

**Popup Inlined Path**:
- Extraction: Inlined function in `chrome.scripting.executeScript`
- Sanitization: Simple regex `replace(/[^a-zA-Z0-9_-]/g, '')`
- Limit: 20 extraction, no display cap

**Drift Risk**: Changes to one path may not be reflected in the other, causing inconsistent behavior.

**Mitigation** (see [IMPL-SUGGESTED_TAGS.md](../implementation-decisions/IMPL-SUGGESTED_TAGS.md) §"Popup vs Overlay Extraction Architecture"):
- Document all changes in both locations
- Consider centralizing extraction (bundle TagService into content script)
- Add cross-implementation tests to verify consistency

---

*Last updated: 2026-02-13 by AI agent*
