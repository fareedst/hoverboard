# Migration Guide: Requirements File Structure

**TIED Methodology Version**: 1.4.0  
**Audience**: AI Agents and Contributors

This document provides step-by-step instructions for migrating a project from a **monolithic** `requirements.md` file to the **scalable index + detail files** structure.

---

## When to Migrate

Consider migration when:
- The `requirements.md` file exceeds ~500 lines
- Navigating or searching the file becomes slow
- Multiple contributors frequently encounter merge conflicts
- The file takes too long for AI agents to process in context

---

## Pre-Migration Checklist

Before starting migration:

- [ ] Confirm `requirements.md` exists and contains requirements
- [ ] Identify all `[REQ-*]` tokens in the file
- [ ] Verify `semantic-tokens.md` has entries for all `[REQ-*]` tokens
- [ ] Create a backup of the current file (or ensure git history is clean)
- [ ] Review the target structure in `requirements.template.md`

---

## Migration Process

### Step 1: Create the Detail Files Directory

```bash
mkdir -p tied/requirements
```

### Step 2: Identify All Requirement Sections

Scan the monolithic file for sections. Each section typically follows this pattern:

```markdown
### [REQ-TOKEN_NAME] Requirement Name

**Priority: P0 (Critical)**

- **Description**: What the requirement specifies
- **Rationale**: Why it exists
...
```

Create a list of all `[REQ-*]` tokens found:

```bash
grep -oE '\[REQ-[A-Z_]+\]' tied/requirements.md | sort -u
```

### Step 3: Extract Each Section to a Detail File

For each `[REQ-TOKEN_NAME]` found:

1. **Determine the filename**:
   - Token: `[REQ-USER_AUTH]`
   - Filename: `REQ-USER_AUTH.md` (remove brackets, keep hyphen)

2. **Create the detail file** with this structure:

```markdown
# [REQ-TOKEN_NAME] Requirement Name

**Category**: Functional | Non-Functional | Immutable  
**Priority**: P0 (Critical) | P1 (Important) | P2 (Nice-to-have) | P3 (Future)  
**Status**: ✅ Implemented | ⏳ Planned  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Description

(Copy the description from the original section)

## Rationale

(Copy or derive rationale from the original section)

## Satisfaction Criteria

(Copy satisfaction criteria from the original section)

## Validation Criteria

(Copy validation criteria from the original section)

## Traceability

- **Architecture**: See `architecture-decisions.md` § [ARCH-IDENTIFIER]
- **Implementation**: See `implementation-decisions.md` § [IMPL-IDENTIFIER]
- **Tests**: (list test references)
- **Code**: (list code references)

## Related Requirements

- **Depends on**: (list dependencies)
- **Related to**: (list related requirements)
- **Supersedes**: (if applicable)

---

*Migrated from monolithic requirements.md on YYYY-MM-DD*
```

3. **Write the file**:
   ```bash
   # Example for each token
   touch tied/requirements/REQ-USER_AUTH.md
   # Then populate with content
   ```

### Step 4: Build the Index Table

After all detail files are created, build the index table for the main file.

For each extracted section, create an index row:

```markdown
| `[REQ-TOKEN_NAME]` | Title | P0 | ✅ Implemented | Category | [ARCH-*] | [IMPL-*] | [Detail](requirements/REQ-TOKEN_NAME.md) |
```

### Step 5: Replace Monolithic Content with Index

Transform `requirements.md`:

**Before (monolithic):**
```markdown
# Requirements Directory

## Overview
...

## Notes
...

---

## Detailed Requirements

### [REQ-TIED_SETUP] TIED Methodology Setup
(50+ lines of content)

### [REQ-MODULE_VALIDATION] Independent Module Validation
(80+ lines of content)

### [REQ-USER_AUTH] User Authentication
(60+ lines of content)
```

**After (index):**
```markdown
# Requirements Directory

## Overview
This document serves as the **index** for all requirements...

## Directory Structure
...

## Filename Convention
...

## Notes
...

## How to Add a New Requirement
...

---

## Requirements Index

### Functional Requirements

| Token | Requirement | Priority | Status | Category | Architecture | Implementation | Detail File |
|-------|------------|----------|--------|----------|--------------|----------------|-------------|
| `[REQ-TIED_SETUP]` | TIED Setup | P0 | ✅ Implemented | Core | [ARCH-TIED_STRUCTURE] | [IMPL-TIED_FILES] | [Detail](requirements/REQ-TIED_SETUP.md) |
| `[REQ-MODULE_VALIDATION]` | Module Validation | P0 | ✅ Implemented | Core | [ARCH-MODULE_VALIDATION] | [IMPL-MODULE_VALIDATION] | [Detail](requirements/REQ-MODULE_VALIDATION.md) |
| `[REQ-USER_AUTH]` | User Authentication | P0 | ✅ Implemented | Auth | [ARCH-AUTH_FLOW] | [IMPL-AUTH_HANDLER] | [Detail](requirements/REQ-USER_AUTH.md) |

### Status Values
...

---

## Detail File Template
...
```

### Step 6: Update semantic-tokens.yaml

Update token records in `semantic-tokens.yaml` if any requirement tokens changed status or cross-references.

### Step 7: Verify All Links

Check that all detail file links in the index are valid:

```bash
# List all detail files
ls tied/requirements/

# Verify each link in the index resolves
grep -oE 'requirements/REQ-[A-Z_]+\.md' tied/requirements.md | while read f; do
  if [ ! -f "tied/$f" ]; then
    echo "MISSING: $f"
  fi
done
```

---

## Post-Migration Verification

### Verification Checklist

- [ ] All `[REQ-*]` tokens from the original file have corresponding detail files
- [ ] All detail files follow the standard template structure
- [ ] The index table has an entry for each detail file
- [ ] All links in the index table are valid
- [ ] `semantic-tokens.yaml` has been updated
- [ ] Cross-references (`[ARCH-*]`, `[IMPL-*]`) are preserved in detail files
- [ ] The original content is fully preserved (nothing lost)

### Validation Commands

```bash
# Count tokens in original (if backup exists)
grep -c '\[REQ-' tied/requirements.md.bak

# Count detail files created
ls tied/requirements/REQ-*.md | wc -l

# These counts should match (or detail files >= tokens if some tokens appeared multiple times)
```

### Token Traceability Check

For each `[REQ-*]` token, verify the chain:
1. Token exists in `semantic-tokens.yaml` registry
2. Token has an entry in `requirements.md` index
3. Token has a detail file in `requirements/`
4. Detail file cross-references correct `[ARCH-*]` and `[IMPL-*]` tokens
5. Detail file has traceability section linking to tests and code

---

## Handling Special Cases

### Sections Without Proper Tokens

If a section lacks a `[REQ-*]` token:
1. Create an appropriate token following the naming convention
2. Add the token to `semantic-tokens.yaml`
3. Proceed with extraction

### Sections with Multiple Tokens

If a section contains multiple `[REQ-*]` tokens:
1. Evaluate if they should be separate requirements
2. If yes: Split into multiple detail files
3. If no: Use the primary token for the filename, list others as aliases

### Duplicate Section Numbers

The original file may have duplicate section numbers (e.g., two "### 3." sections). This is a documentation bug. During migration:
1. Assign unique identifiers in the index
2. Document the issue in the detail file if relevant

### Cross-References Between Requirements

If one `[REQ-*]` references another:
1. Use the "Related Requirements" section in the detail file
2. Ensure bidirectional references where appropriate

---

## Rollback Procedure

If migration needs to be reverted:

1. Restore the backup:
   ```bash
   cp tied/requirements.md.bak tied/requirements.md
   ```

2. Remove the detail files directory:
   ```bash
   rm -rf tied/requirements/
   ```

3. Revert `semantic-tokens.yaml` changes:
   ```bash
   git checkout tied/semantic-tokens.yaml
   ```

---

## Example: Complete Migration of One Section

### Original Section (in monolithic file)

```markdown
### [REQ-USER_AUTH] User Authentication Requirements

**Priority: P0 (Critical)**

- **Description**: Users must be able to authenticate securely using credentials
- **Rationale**: Security requirement for access control and user identity verification
- **Satisfaction Criteria**:
  - Users can log in with username/password
  - Passwords are hashed securely
  - Session management works correctly
- **Validation Criteria**: 
  - Authentication tests pass
  - Security audit passes
  - Session tests validate behavior

**Status**: ✅ Implemented
```

### Extracted Detail File: `REQ-USER_AUTH.md`

```markdown
# [REQ-USER_AUTH] User Authentication Requirements

**Category**: Functional  
**Priority**: P0 (Critical)  
**Status**: ✅ Implemented  
**Created**: 2026-01-15  
**Last Updated**: 2026-01-15

---

## Description

Users must be able to authenticate securely using credentials

## Rationale

Security requirement for access control and user identity verification

## Satisfaction Criteria

- Users can log in with username/password
- Passwords are hashed securely
- Session management works correctly

## Validation Criteria

- Authentication tests pass
- Security audit passes
- Session tests validate behavior

## Traceability

- **Architecture**: See `architecture-decisions.md` § Authentication Flow [ARCH-AUTH_FLOW]
- **Implementation**: See `implementation-decisions.md` § Auth Handler [IMPL-AUTH_HANDLER]
- **Tests**: `testUserAuthentication_REQ_USER_AUTH` in auth test files
- **Code**: `// [REQ-USER_AUTH] Authentication implementation` in auth handler

## Related Requirements

- **Depends on**: [REQ-TIED_SETUP]
- **Related to**: [REQ-SESSION_MGMT]
- **Supersedes**: None

---

*Migrated from monolithic requirements.md on 2026-01-15*
```

### Index Entry Added

```markdown
| `[REQ-USER_AUTH]` | User Authentication | P0 | ✅ Implemented | Auth | [ARCH-AUTH_FLOW] | [IMPL-AUTH_HANDLER] | [Detail](requirements/REQ-USER_AUTH.md) |
```

---

## AI Agent Workflow Summary

When asked to migrate requirements:

1. **Read** the current `requirements.md` file
2. **List** all `[REQ-*]` tokens found
3. **Create** the `requirements/` directory
4. **For each token**:
   - Create detail file `REQ-{TOKEN}.md`
   - Populate with content from original section
   - Add metadata (Category, Priority, Status, Created, Last Updated)
5. **Replace** monolithic content with index structure
6. **Update** `semantic-tokens.yaml` reference
7. **Verify** all links and cross-references
8. **Report** migration summary to user

---

**Last Updated**: 2026-02-06
