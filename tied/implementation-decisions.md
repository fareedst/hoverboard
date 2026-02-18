# Implementation Decisions

**TIED Methodology Version**: 1.5.0

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

