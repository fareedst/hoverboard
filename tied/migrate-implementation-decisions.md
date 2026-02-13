# Migration Guide: Implementation Decisions File Structure

**TIED Methodology Version**: 1.4.0  
**Audience**: AI Agents and Contributors

This document provides step-by-step instructions for migrating a project from a **monolithic** `implementation-decisions.md` file to the **scalable index + detail files** structure.

---

## When to Migrate

Consider migration when:
- The `implementation-decisions.md` file exceeds ~500 lines
- Navigating or searching the file becomes slow
- Multiple contributors frequently encounter merge conflicts
- The file takes too long for AI agents to process in context

---

## Pre-Migration Checklist

Before starting migration:

- [ ] Confirm `implementation-decisions.md` exists and contains implementation decisions
- [ ] Identify all `[IMPL-*]` tokens in the file
- [ ] Verify `semantic-tokens.md` has entries for all `[IMPL-*]` tokens
- [ ] Create a backup of the current file (or ensure git history is clean)
- [ ] Review the target structure in `implementation-decisions.template.md`

---

## Migration Process

### Step 1: Create the Detail Files Directory

```bash
mkdir -p tied/implementation-decisions
```

### Step 2: Identify All Implementation Decision Sections

Scan the monolithic file for sections. Each section typically follows this pattern:

```markdown
## N. Section Title [IMPL-TOKEN_NAME] [ARCH-*] [REQ-*]
```

Create a list of all `[IMPL-*]` tokens found:

```bash
grep -oE '\[IMPL-[A-Z_]+\]' tied/implementation-decisions.md | sort -u
```

### Step 3: Extract Each Section to a Detail File

For each `[IMPL-TOKEN_NAME]` found:

1. **Determine the filename**:
   - Token: `[IMPL-CONFIG_STRUCT]`
   - Filename: `IMPL-CONFIG_STRUCT.md` (replace `:` with `-`, remove brackets)

2. **Create the detail file** with this structure:

```markdown
# [IMPL-TOKEN_NAME] Implementation Title

**Cross-References**: [ARCH-RELATED] [REQ-RELATED]  
**Status**: Active  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Decision

(Copy the decision description from the original section)

## Rationale

(Copy or derive rationale from the original section)

## Implementation Approach

(Copy implementation details, code examples, etc.)

## Code Markers

(Copy or identify code locations)

## Token Coverage `[PROC-TOKEN_AUDIT]`

(Copy or create audit checklist)

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

(Copy or create validation table)

## Related Decisions

- Depends on: (list dependencies)
- See also: (list related decisions)

---

*Migrated from monolithic implementation-decisions.md on YYYY-MM-DD*
```

3. **Write the file**:
   ```bash
   # Example for each token
   touch tied/implementation-decisions/IMPL-CONFIG_STRUCT.md
   # Then populate with content
   ```

### Step 4: Build the Index Table

After all detail files are created, build the index table for the main file.

For each extracted section, create an index row:

```markdown
| `[IMPL-TOKEN_NAME]` | Title | Active | [ARCH-*] [REQ-*] | [Detail](implementation-decisions/IMPL-TOKEN_NAME.md) |
```

### Step 5: Replace Monolithic Content with Index

Transform `implementation-decisions.md`:

**Before (monolithic):**
```markdown
# Implementation Decisions

## Overview
...

## Notes
...

---

## 1. Config Structure [IMPL-CONFIG_STRUCT] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIGURATION]
(50+ lines of content)

## 2. Error Handling [IMPL-ERROR_HANDLING] [ARCH-ERROR_HANDLING] [REQ-ERROR_HANDLING]
(80+ lines of content)

## 3. Module Validation [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
(100+ lines of content)
```

**After (index):**
```markdown
# Implementation Decisions

## Overview
This document serves as the **index** for all implementation decisions...

## Directory Structure
...

## Filename Convention
...

## Notes
...

## How to Add a New Implementation Decision
...

---

## Implementation Decisions Index

| Token | Title | Status | Cross-References | Detail File |
|-------|-------|--------|------------------|-------------|
| `[IMPL-CONFIG_STRUCT]` | Config Structure | Active | [ARCH-CONFIG_STRUCTURE] [REQ-CONFIGURATION] | [Detail](implementation-decisions/IMPL-CONFIG_STRUCT.md) |
| `[IMPL-ERROR_HANDLING]` | Error Handling | Active | [ARCH-ERROR_HANDLING] [REQ-ERROR_HANDLING] | [Detail](implementation-decisions/IMPL-ERROR_HANDLING.md) |
| `[IMPL-MODULE_VALIDATION]` | Module Validation | Active | [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION] | [Detail](implementation-decisions/IMPL-MODULE_VALIDATION.md) |

### Status Values
...

---

## Detail File Template
...
```

### Step 6: Update semantic-tokens.yaml

Update token records in `semantic-tokens.yaml` if any implementation tokens changed status or cross-references.

### Step 7: Verify All Links

Check that all detail file links in the index are valid:

```bash
# List all detail files
ls tied/implementation-decisions/

# Verify each link in the index resolves
grep -oE 'implementation-decisions/IMPL-[A-Z_]+\.md' tied/implementation-decisions.md | while read f; do
  if [ ! -f "tied/$f" ]; then
    echo "MISSING: $f"
  fi
done
```

---

## Post-Migration Verification

### Verification Checklist

- [ ] All `[IMPL-*]` tokens from the original file have corresponding detail files
- [ ] All detail files follow the standard template structure
- [ ] The index table has an entry for each detail file
- [ ] All links in the index table are valid
- [ ] `semantic-tokens.yaml` has been updated
- [ ] Cross-references (`[ARCH-*]`, `[REQ-*]`) are preserved in detail files
- [ ] The original content is fully preserved (nothing lost)

### Validation Commands

```bash
# Count tokens in original (if backup exists)
grep -c '\[IMPL-' tied/implementation-decisions.md.bak

# Count detail files created
ls tied/implementation-decisions/IMPL-*.md | wc -l

# These counts should match (or detail files >= tokens if some tokens appeared multiple times)
```

### Token Traceability Check

For each `[IMPL-*]` token, verify the chain:
1. Token exists in `semantic-tokens.yaml` registry
2. Token has an entry in `implementation-decisions.md` index
3. Token has a detail file in `implementation-decisions/`
4. Detail file cross-references correct `[ARCH-*]` and `[REQ-*]` tokens

---

## Handling Special Cases

### Sections Without Proper Tokens

If a section lacks an `[IMPL-*]` token:
1. Create an appropriate token following the naming convention
2. Add the token to `semantic-tokens.yaml`
3. Proceed with extraction

### Sections with Multiple Tokens

If a section contains multiple `[IMPL-*]` tokens:
1. Evaluate if they should be separate decisions
2. If yes: Split into multiple detail files
3. If no: Use the primary token for the filename, list others as aliases

### Duplicate Section Numbers

The original file may have duplicate section numbers (e.g., two "## 2." sections). This is a documentation bug. During migration:
1. Assign unique identifiers in the index
2. Document the issue in the detail file if relevant

### Cross-References Between Implementation Decisions

If one `[IMPL-*]` references another:
1. Use the "Related Decisions" section in the detail file
2. Ensure bidirectional references where appropriate

---

## Rollback Procedure

If migration needs to be reverted:

1. Restore the backup:
   ```bash
   cp tied/implementation-decisions.md.bak tied/implementation-decisions.md
   ```

2. Remove the detail files directory:
   ```bash
   rm -rf tied/implementation-decisions/
   ```

3. Revert `semantic-tokens.yaml` changes:
   ```bash
   git checkout tied/semantic-tokens.yaml
   ```

---

## Example: Complete Migration of One Section

### Original Section (in monolithic file)

```markdown
## 3. Error Handling Implementation [IMPL-ERROR_HANDLING] [ARCH-ERROR_HANDLING] [REQ-ERROR_HANDLING]

### Error Types
- ValidationError: Invalid input
- NetworkError: Connection failures
- TimeoutError: Operation timeout

### Error Wrapping
Errors are wrapped with context using the standard pattern.

### Error Reporting
- Errors logged at ERROR level
- User receives sanitized message
```

### Extracted Detail File: `IMPL-ERROR_HANDLING.md`

```markdown
# [IMPL-ERROR_HANDLING] Error Handling Implementation

**Cross-References**: [ARCH-ERROR_HANDLING] [REQ-ERROR_HANDLING]  
**Status**: Active  
**Created**: 2025-01-17  
**Last Updated**: 2025-01-17

---

## Decision

Implement structured error handling with typed errors, context wrapping, and appropriate reporting.

## Rationale

- Fulfills [REQ-ERROR_HANDLING] requirement for robust error handling
- Follows [ARCH-ERROR_HANDLING] architecture decision
- Provides clear error types for different failure modes

## Implementation Approach

### Error Types

- **ValidationError**: Invalid input from users or external systems
- **NetworkError**: Connection failures, DNS issues, unreachable hosts
- **TimeoutError**: Operations exceeding configured time limits

### Error Wrapping

Errors are wrapped with context using the standard pattern to preserve the original error while adding contextual information.

### Error Reporting

- Errors logged at ERROR level with full stack trace
- User receives sanitized message without internal details
- Error codes returned for programmatic handling

## Code Markers

- `pkg/errors/types.go`: Error type definitions
- `pkg/errors/wrap.go`: Error wrapping utilities

## Token Coverage `[PROC-TOKEN_AUDIT]`

Files/functions that must carry annotations:
- [ ] `pkg/errors/types.go` - `[IMPL-ERROR_HANDLING]`
- [ ] `pkg/errors/wrap.go` - `[IMPL-ERROR_HANDLING]`

Tests that must reference `[REQ-ERROR_HANDLING]`:
- [ ] `testErrorTypes_REQ_ERROR_HANDLING`
- [ ] `testErrorWrapping_REQ_ERROR_HANDLING`

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2025-01-17 | — | ⏳ Pending | Post-migration validation needed |

## Related Decisions

- Depends on: —
- See also: [ARCH-ERROR_HANDLING], [REQ-ERROR_HANDLING]

---

*Migrated from monolithic implementation-decisions.md on 2025-01-17*
```

### Index Entry Added

```markdown
| `[IMPL-ERROR_HANDLING]` | Error Handling | Active | [ARCH-ERROR_HANDLING] [REQ-ERROR_HANDLING] | [Detail](implementation-decisions/IMPL-ERROR_HANDLING.md) |
```

---

## AI Agent Workflow Summary

When asked to migrate implementation decisions:

1. **Read** the current `implementation-decisions.md` file
2. **List** all `[IMPL-*]` tokens found
3. **Create** the `implementation-decisions/` directory
4. **For each token**:
   - Create detail file `IMPL-{TOKEN}.md`
   - Populate with content from original section
   - Add metadata (Status, Created, Last Updated, Cross-References)
5. **Replace** monolithic content with index structure
6. **Update** `semantic-tokens.yaml` reference
7. **Verify** all links and cross-references
8. **Report** migration summary to user

---

**Last Updated**: 2025-01-17
