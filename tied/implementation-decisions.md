# Implementation Decisions

**TIED Methodology Version**: 2.2.0

## Overview

This document serves as the **index** for all implementation decisions in this project. Each implementation decision is stored in its own file within the `implementation-decisions/` directory for scalability.

All decisions are cross-referenced with architecture decisions using `[ARCH-*]` tokens and requirements using `[REQ-*]` tokens for traceability.

## Directory Structure

```
tied/
├── implementation-decisions.md              # This guide file (you are here)
├── implementation-decisions.yaml            # YAML index/database of all implementation decisions
├── implementation-decisions/                # Detail files directory (YAML)
│   ├── IMPL-CONFIG_STRUCT.yaml
│   ├── IMPL-TIED_FILES.yaml
│   ├── IMPL-MODULE_VALIDATION.yaml
│   └── ...
```

## Filename Convention

Token names contain `:` which is invalid in filenames on many operating systems. Use this mapping:

| Token Format | Filename Format |
|--------------|-----------------|
| `[IMPL-CONFIG_STRUCT]` | `IMPL-CONFIG_STRUCT.yaml` |
| `[IMPL-MODULE_VALIDATION]` | `IMPL-MODULE_VALIDATION.yaml` |

**Rule**: Replace `[`, `]`, and `:` → Remove brackets, replace `:` with `-`, append `.yaml`

## Notes

- All implementation decisions MUST be recorded IMMEDIATELY when made
- Each decision MUST include `[IMPL-*]` token and cross-reference both `[ARCH-*]` and `[REQ-*]` tokens
- Implementation decisions are dependent on both architecture decisions and requirements
- DO NOT defer implementation documentation - record decisions as they are made
- Record where code/tests are annotated so `[PROC-TOKEN_AUDIT]` can succeed later
- Include the most recent `[PROC-TOKEN_VALIDATION]` run information so future contributors know the last verified state
- **Language-Specific Implementation**: Language-specific implementation details (APIs, libraries, syntax patterns, idioms) belong in implementation decisions. Code examples in documentation should use `[your-language]` placeholders or be language-agnostic pseudo-code unless demonstrating a specific language requirement. Requirements and architecture decisions should remain language-agnostic.

---

## Core data object (IMPL detail YAML)

Every IMPL **detail** file in `implementation-decisions/` must use a single **root key** equal to the IMPL token (e.g. `IMPL-STORAGE_INDEX`). All content is nested under that key. This keeps each file self-identifying and machine-parseable and matches the index structure. This section is the **canonical schema** for validation and tooling.

### Core (required) fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Short human-readable title for the implementation decision. |
| `status` | string | One of: `Active`, `Deprecated`, `Template`, `Superseded`. |
| `cross_references` | list of strings | Tokens this IMPL links to (REQ-\*, ARCH-\*, other IMPL-\*). May be empty `[]`. |
| `rationale` | object | `why` (string), `problems_solved` (list of strings), `benefits` (list of strings). Lists may be empty. |
| `implementation_approach` | object | `summary` (string), `details` (list of strings). `details` may be empty. |
| `code_locations` | object | `files` (list of objects with `path`, optional `description`, optional `lines`), `functions` (list of objects with `name`, `file`, optional `description`). Either list may be empty. |
| `traceability` | object | `architecture` (list of ARCH-\* tokens), `requirements` (list of REQ-\* tokens), `tests` (list of test names or paths), `code_annotations` (list of tokens to appear in code). Lists may be empty. |
| `related_decisions` | object | `depends_on` (list), `supersedes` (list), `see_also` (list). All lists of decision tokens. |
| `detail_file` | string | Path to this detail file relative to `tied/` (e.g. `implementation-decisions/IMPL-STORAGE_INDEX.yaml`). |
| `metadata` | object | `created` (`date`, `author`), `last_updated` (`date`, `author`, `reason`), optional `last_validated` (`date`, `validator`, `result`). |
| `essence_pseudocode` | string (multiline) | **Mandatory.** Language-agnostic step-wise pseudo-code (main steps, data flow, control flow). Required for identifying collisions between implementation decisions (overlapping logic, data flow, ordering). See **Mandatory essence_pseudocode** below. |

### Optional but standard fields

Same shape in all files that use them:

| Field | Type | Description |
|-------|------|-------------|
| `related_decisions.composed_with` | list of strings | IMPL tokens routinely composed with this one in a single algorithm. |

See **Optional fields for composition and workflow** below for usage.

### Mandatory essence_pseudocode

Every IMPL detail file **must** include an `essence_pseudocode` field. It is used to:

- Capture the implementation’s core algorithm in language-agnostic form (INPUT/OUTPUT/DATA, procedure names, key branches).
- Support **collision detection**: when IMPLs are composed or share code paths, comparing their `essence_pseudocode` blocks helps identify overlapping steps, shared data, ordering dependencies, and conflicting assumptions.
- Keep documentation aligned with tests and code; the pseudo-code should reflect what the implementation (and its tests) do.

### Managed code and block token rules (REQ / ARCH / IMPL in pseudo-code)

These rules apply to **managed code** everywhere (source, tests, data, and pseudo-code in TIED detail YAML). Code for processing, support, or management of code (e.g. build scripts, linters, token validators) is **not** managed code.

1. **What is managed code**
   - Managed code is code developed with the TIED methodology to ensure correctness.
   - It appears in: **source code**, **tests**, **data**, and **pseudo-code in TIED detail YAML** (e.g. `essence_pseudocode` in IMPL detail files).

2. **Block and token naming**
   - Every **block** of managed code must include a comment that names all **REQ**, **ARCH**, and **IMPL** reflected in that block (i.e. whose implementation depends on that block), and states **how** that block implements the requirements.
   - For TIED tokens, a **block** is a contiguous sequence of code (complete logical units) that all implement the **same set** of REQ / ARCH / IMPL. A single block may contain **nested blocks** that implement a **different set** of REQ / ARCH / IMPL.

3. **Using token names selectively**
   - **Name tokens only where the set is defined or changes.** At the start of a block, name the full set (REQ, ARCH, IMPL) that the block implements. For nested blocks that implement the **same** set, do **not** repeat the token names; use a comment that only describes *how* that sub-block implements the requirements.
   - For a nested block that implements a **different** set (e.g. adds another IMPL or REQ), add a comment at the start of that nested block naming the tokens for **that** set (and briefly how it implements them).

4. **Applying this to IMPL pseudo-code**
   - In `essence_pseudocode`, add one top-level comment naming the IMPL, ARCH, and REQ tokens for the whole decision and a one-line summary of what the pseudo-code implements.
   - For each logical sub-block (e.g. INPUT/OUTPUT, a procedure, an event handler): if it implements the **same** set as the top level, comment only the *how* (no token list). If a sub-block implements a **different** set (e.g. depends on another IMPL), start that sub-block with a comment listing the tokens for that set and how the sub-block implements them.

### Extra fields

Any other **top-level keys** under the IMPL root (e.g. domain-specific prose or format keys) are allowed and need not be shared across files. Naming should avoid clashing with the core and optional-but-standard field names above.

### Canonical YAML shape

```yaml
IMPL-TOKEN:           # root key = IMPL token; required
  name: string
  status: Active | Deprecated | Template | Superseded
  cross_references: [ string ]
  rationale:
    why: string
    problems_solved: [ string ]
    benefits: [ string ]
  implementation_approach:
    summary: string
    details: [ string ]
  code_locations:
    files:
      - path: string
        description: string   # optional
        lines: [ number ]    # optional
    functions:
      - name: string
        file: string
        description: string   # optional
  traceability:
    architecture: [ string ]
    requirements: [ string ]
    tests: [ string ]
    code_annotations: [ string ]
  related_decisions:
    depends_on: [ string ]
    supersedes: [ string ]
    see_also: [ string ]
    composed_with: [ string ]   # optional
  essence_pseudocode: |         # required (collision detection)
    ...
  detail_file: string
  metadata:
    created: { date: string, author: string }
    last_updated: { date: string, author: string, reason: string }
    last_validated: { date: string, validator: string, result: string }  # optional
  # extra fields allowed below
```

---

## How to Add a New Implementation Decision

1. **Create a new detail file** in `implementation-decisions/` using the naming convention above
2. **Use the detail file template** (see below)
3. **Add an entry to the index table** below
4. **Update `semantic-tokens.yaml`** registry with the new `[IMPL-*]` token

---

## Implementation Decisions Index

**The implementation decisions index is maintained in `implementation-decisions.yaml`**, a YAML database file that contains all implementation decision records with their metadata, cross-references, and status.

To view the index:

```bash
# View entire index
cat tied/implementation-decisions.yaml

# View specific decision
yq '.IMPL-MODULE_VALIDATION' tied/implementation-decisions.yaml

# Get implementation approach summary
yq '.IMPL-MODULE_VALIDATION.implementation_approach.summary' tied/implementation-decisions.yaml

# Get code file locations
yq '.IMPL-TIED_FILES.code_locations.files[].path' tied/implementation-decisions.yaml

# Get function locations
yq '.IMPL-MODULE_VALIDATION.code_locations.functions[].name' tied/implementation-decisions.yaml

# Get architecture dependencies
yq '.IMPL-MODULE_VALIDATION.traceability.architecture[]' tied/implementation-decisions.yaml

# List all active decisions
yq 'to_entries | map(select(.value.status == "Active")) | from_entries' tied/implementation-decisions.yaml

# Quick grep search
grep -A 30 '^IMPL-MODULE_VALIDATION:' tied/implementation-decisions.yaml
```

### How to Append a New Implementation Decision

1. Open `implementation-decisions.yaml` in your editor
2. Copy the template block at the bottom of the file (IMPL-IDENTIFIER)
3. Paste it at the end with a blank line before it
4. Replace `IMPL-IDENTIFIER` with your new semantic token
5. Fill in all fields (name, status, cross_references, rationale, implementation_approach, etc.)
6. Update the `detail_file` path to match your new `.yaml` file in `implementation-decisions/` directory
7. Save the file

Example append operation:

```bash
cat >> tied/implementation-decisions.yaml << 'EOF'

IMPL-NEW_IMPLEMENTATION:
  name: New Implementation
  status: Active
  cross_references:
    - ARCH-RELATED_ARCHITECTURE
    - REQ-RELATED_REQUIREMENT
  rationale:
    why: "Primary reason for this implementation approach"
    problems_solved:
      - "Problem 1"
      - "Problem 2"
    benefits:
      - "Benefit 1"
      - "Benefit 2"
  implementation_approach:
    summary: "High-level description of implementation"
    details:
      - "Specific technical detail 1"
      - "Code structure or pattern"
      - "API design decision"
  code_locations:
    files:
      - path: "path/to/file.ext"
        description: "What's implemented there"
        lines: [10, 50]
    functions:
      - name: "exampleFunction"
        file: "path/to/file.ext"
        description: "What it does"
  traceability:
    architecture:
      - ARCH-RELATED_ARCHITECTURE
    requirements:
      - REQ-RELATED_REQUIREMENT
    tests:
      - testFeatureName_REQ_RELATED_REQUIREMENT
    code_annotations:
      - IMPL-NEW_IMPLEMENTATION
  related_decisions:
    depends_on: []
    supersedes: []
    see_also: []
    composed_with: []   # optional: list of IMPL tokens routinely composed with this one
  detail_file: implementation-decisions/IMPL-NEW_IMPLEMENTATION.yaml
  metadata:
    created:
      date: 2026-02-06
      author: "Your Name"
    last_updated:
      date: 2026-02-06
      author: "Your Name"
      reason: "Initial creation"
    last_validated:
      date: 2026-02-06
      validator: "Your Name"
      result: "pass"
EOF
```

### Status Values

- **Active**: Currently in use and maintained
- **Deprecated**: No longer recommended; kept for historical reference
- **Template**: Example/template entry for reference
- **Superseded**: Replaced by another decision (note the replacement in the detail file)

---

## Detail File Template

Use this template when creating a new implementation decision file in `implementation-decisions/`:

```markdown
# [IMPL-IDENTIFIER] Implementation Title

**Cross-References**: [ARCH-RELATED_ARCHITECTURE] [REQ-RELATED_REQUIREMENT]  
**Status**: Active  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Decision

Brief description of the implementation decision.

## Rationale

- Why this implementation approach was chosen
- What problems it solves
- How it fulfills the architecture decision

## Implementation Approach

- Specific technical details
- Code structure or patterns
- API design decisions

### Data Structures

```[your-language]
// [IMPL-IDENTIFIER] [ARCH-RELATED_ARCHITECTURE] [REQ-RELATED_REQUIREMENT]
// Define your data structures here
type ExampleStruct struct {
    Field1 string
    Field2 int
}
```

### Key Algorithms

Description of key algorithms and their implementation.

### Platform-Specific Considerations

- Platform 1: Specific considerations
- Platform 2: Specific considerations

## Code Locations

Specific code locations, function names, or patterns to look for:
- **Files**:
  - `path/to/file.ext` (lines 10-50): Description of what's implemented there
- **Functions**:
  - `exampleFunction()` in `path/to/file.ext`: What it does

## Token Coverage `[PROC-TOKEN_AUDIT]`

Files/functions that must carry the `[IMPL-*] [ARCH-*] [REQ-*]` annotations:
- [ ] `path/to/implementation.ext` - Main implementation
- [ ] `path/to/helper.ext` - Helper functions

Tests that must reference the matching `[REQ-*]`:
- [ ] `testFeatureName_REQ_IDENTIFIER` in `path/to/test_file.ext`

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| YYYY-MM-DD | `abc1234` | ✅ Pass | Initial validation |

Latest `./scripts/validate_tokens.sh` output summary:
```
(paste relevant output here)
```

## Related Decisions

- Depends on: [IMPL-OTHER_DECISION]
- Supersedes: (if applicable)
- See also: [ARCH-RELATED_ARCHITECTURE]

---

*Last validated: YYYY-MM-DD by [agent/contributor]*
```

### Optional fields for composition and workflow

Detail YAML files may include the following to support composing multiple IMPLs in one algorithm and to guide combined workflow description and test design:

- **`essence_pseudocode`** (**mandatory**, see Core data object): Language-agnostic, step-wise pseudo-code that captures the IMPL’s core algorithm: main steps, data flow (inputs, outputs, key structures), and control flow (branches, loops, ordering). Use a multi-line YAML string (e.g. `\|-`) for readability. When multiple IMPLs are combined in the same workflow, this pseudo-code is the primary artifact for deducing how IMPLs affect each other (ordering, shared data, dependencies), for producing a combined algorithm or workflow description, for guiding the design of tests and the structure of code, and for **collision detection** between implementation decisions.

- **`related_decisions.composed_with`** (optional): A list of IMPL tokens (e.g. `[IMPL-BOOKMARK_ROUTER, IMPL-STORAGE_INDEX]`) that record which IMPLs are routinely composed with this one in a single algorithm or workflow. Use this to document composition relationships alongside `depends_on`, `supersedes`, and `see_also`.

---

## Collision detection using essence_pseudocode

When IMPLs are composed (see `related_decisions.composed_with`) or share code paths, compare their **essence_pseudocode** blocks to:

1. **Identify overlapping steps or data** — e.g. both IMPLs read/write the same storage key or structure.
2. **Respect ordering dependencies** — e.g. IMPL-STORAGE_INDEX (index read/update) must be used before or after IMPL-BOOKMARK_ROUTER (resolve provider by URL) when saving; index update follows successful save.
3. **Avoid conflicting assumptions** — e.g. one IMPL assumes sync storage, another async.

**Process**: For each IMPL that lists others in `composed_with`, open the corresponding detail files and compare INPUT/OUTPUT/DATA and procedure names. Document ordering or shared-data notes in the IMPL’s `related_decisions.see_also` or in a short "Collision notes" extra field if needed.

**Key composition pairs (checklist)** — when changing these, re-check ordering and shared data:

| Composed pair / group | Ordering / shared data note |
|----------------------|-----------------------------|
| IMPL-STORAGE_INDEX, IMPL-BOOKMARK_ROUTER, IMPL-LOCAL_BOOKMARK_SERVICE | Router uses index to resolve provider; after save, router updates index. Migration (index seed) uses LocalBookmarkService.getAllBookmarks. |
| IMPL-MESSAGE_HANDLING, IMPL-POPUP_MESSAGE_TIMEOUT | Timeout wraps sendMessage; handler must complete before timeout. |
| IMPL-BADGE_REFRESH, IMPL-MESSAGE_HANDLING, IMPL-BOOKMARK_ROUTER | Badge refresh runs after message handling; may call router for bookmark state. |
| IMPL-URL_TAGS_DISPLAY, IMPL-BOOKMARK_ROUTER | Display reads bookmark/tags via router; no write ordering. |
| IMPL-FILE_STORAGE_TYPED_PATH, IMPL-FILE_BOOKMARK_SERVICE, IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE | Path normalize before typed path use; file service uses resolved path. |
| IMPL-CONFIG_MIGRATION, IMPL-CONFIG_BACKUP_RESTORE, IMPL-FEATURE_FLAGS | Backup/restore and migration read/write config; feature flags read config. |

Run this check when adding or changing `composed_with` or when modifying an IMPL’s core algorithm so that composed behavior remains consistent.

---

## Quick Reference: Creating a New Implementation Decision

```bash
# 1. Create the detail file
touch tied/implementation-decisions/IMPL-YOUR_TOKEN.yaml

# 2. Copy the template above into the new file

# 3. Fill in the details

# 4. Add entry to the index table in this file

# 5. Update semantic-tokens.yaml registry
```

---

## Grouping by Domain (Optional)

For very large projects, organize detail files by domain:

```
implementation-decisions/
├── core/
│   ├── IMPL-CONFIG_STRUCT.yaml
│   └── IMPL-ERROR_HANDLING.yaml
├── auth/
│   ├── IMPL-AUTH_FLOW.yaml
│   └── IMPL-SESSION_MGMT.yaml
└── api/
    └── IMPL-REST_ENDPOINTS.yaml
```

When using subdirectories, update the Detail File column in the index:
```markdown
| `[IMPL-AUTH_FLOW]` | Auth Flow | Active | ... | [Detail](implementation-decisions/auth/IMPL-AUTH_FLOW.yaml) |
```

---

## Migration from Monolithic File

If migrating from a single `implementation-decisions.md` file:

1. Create the `implementation-decisions/` directory
2. For each numbered section in the old file:
   - Create `IMPL-{TOKEN_NAME}.yaml` using the detail template
   - Copy content into the new file
   - Add metadata (Status, Created, Last Updated)
3. Replace section content in this file with an index row
4. Update `semantic-tokens.yaml` to note the new structure
5. Verify all links work correctly

