# Migration Guide: Architecture Decisions File Structure

**TIED Methodology Version**: 1.4.0  
**Audience**: AI Agents and Contributors

This document provides step-by-step instructions for migrating a project from a **monolithic** `architecture-decisions.md` file to the **scalable index + detail files** structure.

---

## When to Migrate

Consider migration when:
- The `architecture-decisions.md` file exceeds ~500 lines
- Navigating or searching the file becomes slow
- Multiple contributors frequently encounter merge conflicts
- The file takes too long for AI agents to process in context

---

## Pre-Migration Checklist

Before starting migration:

- [ ] Confirm `architecture-decisions.md` exists and contains architecture decisions
- [ ] Identify all `[ARCH-*]` tokens in the file
- [ ] Verify `semantic-tokens.md` has entries for all `[ARCH-*]` tokens
- [ ] Create a backup of the current file (or ensure git history is clean)
- [ ] Review the target structure in `architecture-decisions.template.md`

---

## Migration Process

### Step 1: Create the Detail Files Directory

```bash
mkdir -p tied/architecture-decisions
```

### Step 2: Identify All Architecture Decision Sections

Scan the monolithic file for sections. Each section typically follows this pattern:

```markdown
## N. Section Title [ARCH-TOKEN_NAME] [REQ-*]
```

Create a list of all `[ARCH-*]` tokens found:

```bash
grep -oE '\[ARCH-[A-Z_]+\]' tied/architecture-decisions.md | sort -u
```

### Step 3: Extract Each Section to a Detail File

For each `[ARCH-TOKEN_NAME]` found:

1. **Determine the filename**:
   - Token: `[ARCH-CONFIG_STRUCTURE]`
   - Filename: `ARCH-CONFIG_STRUCTURE.md` (remove brackets, keep hyphen)

2. **Create the detail file** with this structure:

```markdown
# [ARCH-TOKEN_NAME] Architecture Decision Title

**Cross-References**: [REQ-RELATED_REQUIREMENT]  
**Status**: Active  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Decision

(Copy the decision description from the original section)

## Rationale

(Copy or derive rationale from the original section)

## Alternatives Considered

(Copy alternatives from the original section)

## Implementation Approach

(Copy implementation approach from the original section)

## Token Coverage `[PROC-TOKEN_AUDIT]`

(Copy or create audit checklist)

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

(Copy or create validation table)

## Related Decisions

- Depends on: (list dependencies)
- Informs: (list implementation decisions)
- See also: (list related decisions)

---

*Migrated from monolithic architecture-decisions.md on YYYY-MM-DD*
```

3. **Write the file**:
   ```bash
   # Example for each token
   touch tied/architecture-decisions/ARCH-CONFIG_STRUCTURE.md
   # Then populate with content
   ```

### Step 4: Build the Index Table

After all detail files are created, build the index table for the main file.

For each extracted section, create an index row:

```markdown
| `[ARCH-TOKEN_NAME]` | Title | Active | [REQ-*] | [Detail](architecture-decisions/ARCH-TOKEN_NAME.md) |
```

### Step 5: Replace Monolithic Content with Index

Transform `architecture-decisions.md`:

**Before (monolithic):**
```markdown
# Architecture Decisions

## Overview
...

## Notes
...

---

## 1. TIED Structure [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
(50+ lines of content)

## 2. Module Validation [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
(80+ lines of content)

## 3. Error Handling [ARCH-ERROR_HANDLING] [REQ-ERROR_HANDLING]
(60+ lines of content)
```

**After (index):**
```markdown
# Architecture Decisions

## Overview
This document serves as the **index** for all architecture decisions...

## Directory Structure
...

## Filename Convention
...

## Notes
...

## How to Add a New Architecture Decision
...

---

## Architecture Decisions Index

| Token | Title | Status | Cross-References | Detail File |
|-------|-------|--------|------------------|-------------|
| `[ARCH-TIED_STRUCTURE]` | TIED Structure | Active | [REQ-TIED_SETUP] | [Detail](architecture-decisions/ARCH-TIED_STRUCTURE.md) |
| `[ARCH-MODULE_VALIDATION]` | Module Validation | Active | [REQ-MODULE_VALIDATION] | [Detail](architecture-decisions/ARCH-MODULE_VALIDATION.md) |
| `[ARCH-ERROR_HANDLING]` | Error Handling | Active | [REQ-ERROR_HANDLING] | [Detail](architecture-decisions/ARCH-ERROR_HANDLING.md) |

### Status Values
...

---

## Detail File Template
...
```

### Step 6: Update semantic-tokens.yaml

Update token records in `semantic-tokens.yaml` if any architecture tokens changed status or cross-references.

### Step 7: Verify All Links

Check that all detail file links in the index are valid:

```bash
# List all detail files
ls tied/architecture-decisions/

# Verify each link in the index resolves
grep -oE 'architecture-decisions/ARCH-[A-Z_]+\.md' tied/architecture-decisions.md | while read f; do
  if [ ! -f "tied/$f" ]; then
    echo "MISSING: $f"
  fi
done
```

---

## Post-Migration Verification

### Verification Checklist

- [ ] All `[ARCH-*]` tokens from the original file have corresponding detail files
- [ ] All detail files follow the standard template structure
- [ ] The index table has an entry for each detail file
- [ ] All links in the index table are valid
- [ ] `semantic-tokens.yaml` has been updated
- [ ] Cross-references (`[REQ-*]`, `[IMPL-*]`) are preserved in detail files
- [ ] The original content is fully preserved (nothing lost)

### Validation Commands

```bash
# Count tokens in original (if backup exists)
grep -c '\[ARCH-' tied/architecture-decisions.md.bak

# Count detail files created
ls tied/architecture-decisions/ARCH-*.md | wc -l

# These counts should match (or detail files >= tokens if some tokens appeared multiple times)
```

### Token Traceability Check

For each `[ARCH-*]` token, verify the chain:
1. Token exists in `semantic-tokens.yaml` registry
2. Token has an entry in `architecture-decisions.md` index
3. Token has a detail file in `architecture-decisions/`
4. Detail file cross-references correct `[REQ-*]` tokens
5. Detail file lists expected `[IMPL-*]` tokens it informs

---

## Handling Special Cases

### Sections Without Proper Tokens

If a section lacks an `[ARCH-*]` token:
1. Create an appropriate token following the naming convention
2. Add the token to `semantic-tokens.yaml`
3. Proceed with extraction

### Sections with Multiple Tokens

If a section contains multiple `[ARCH-*]` tokens:
1. Evaluate if they should be separate decisions
2. If yes: Split into multiple detail files
3. If no: Use the primary token for the filename, list others as aliases

### Duplicate Section Numbers

The original file may have duplicate section numbers (e.g., two "## 3." sections). This is a documentation bug. During migration:
1. Assign unique identifiers in the index
2. Document the issue in the detail file if relevant

### Cross-References Between Architecture Decisions

If one `[ARCH-*]` references another:
1. Use the "Related Decisions" section in the detail file
2. Ensure bidirectional references where appropriate

---

## Rollback Procedure

If migration needs to be reverted:

1. Restore the backup:
   ```bash
   cp tied/architecture-decisions.md.bak tied/architecture-decisions.md
   ```

2. Remove the detail files directory:
   ```bash
   rm -rf tied/architecture-decisions/
   ```

3. Revert `semantic-tokens.yaml` changes:
   ```bash
   git checkout tied/semantic-tokens.yaml
   ```

---

## Example: Complete Migration of One Section

### Original Section (in monolithic file)

```markdown
## 5. Error Handling Strategy [ARCH-ERROR_HANDLING] [REQ-ERROR_HANDLING]

### Decision: [Your Error Handling Approach]
**Rationale:**
- Idiomatic for chosen language/framework
- Clear error propagation
- Easy to test

**Pattern:**
- Error types
- Error propagation
- Error reporting

**Alternatives Considered:**
- Exceptions: Too magic, hard to trace
- Error codes: Too verbose, easy to ignore
```

### Extracted Detail File: `ARCH-ERROR_HANDLING.md`

```markdown
# [ARCH-ERROR_HANDLING] Error Handling Strategy

**Cross-References**: [REQ-ERROR_HANDLING]  
**Status**: Active  
**Created**: 2026-01-17  
**Last Updated**: 2026-01-17

---

## Decision

Structured error handling approach idiomatic for the chosen language/framework.

## Rationale

- Idiomatic for chosen language/framework
- Clear error propagation
- Easy to test

## Alternatives Considered

- **Exceptions**: Rejected - too magic, hard to trace
- **Error codes**: Rejected - too verbose, easy to ignore

## Implementation Approach

### Pattern
- **Error types**: Typed errors for different failure modes
- **Error propagation**: Errors wrap with context as they propagate
- **Error reporting**: Errors logged with appropriate level, user receives sanitized message

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] `pkg/errors/types.ext` - `[IMPL-ERROR_HANDLING]`
- [ ] `pkg/errors/wrap.ext` - `[IMPL-ERROR_HANDLING]`

Tests expected to reference `[REQ-*]`:
- [ ] `testErrorHandling_REQ_ERROR_HANDLING`

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2026-01-17 | — | ⏳ Pending | Post-migration validation needed |

## Related Decisions

- Depends on: [REQ-ERROR_HANDLING]
- Informs: [IMPL-ERROR_HANDLING]
- See also: —

---

*Migrated from monolithic architecture-decisions.md on 2026-01-17*
```

### Index Entry Added

```markdown
| `[ARCH-ERROR_HANDLING]` | Error Handling Strategy | Active | [REQ-ERROR_HANDLING] | [Detail](architecture-decisions/ARCH-ERROR_HANDLING.md) |
```

---

## AI Agent Workflow Summary

When asked to migrate architecture decisions:

1. **Read** the current `architecture-decisions.md` file
2. **List** all `[ARCH-*]` tokens found
3. **Create** the `architecture-decisions/` directory
4. **For each token**:
   - Create detail file `ARCH-{TOKEN}.md`
   - Populate with content from original section
   - Add metadata (Status, Created, Last Updated, Cross-References)
5. **Replace** monolithic content with index structure
6. **Update** `semantic-tokens.yaml` reference
7. **Verify** all links and cross-references
8. **Report** migration summary to user

---

**Last Updated**: 2026-01-17
