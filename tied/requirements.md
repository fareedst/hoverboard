# Requirements Directory

**TIED Methodology Version**: 1.5.0

## Overview
This document serves as the **central listing/registry** for all requirements in this project. Each requirement is stored in its own file within the `requirements/` directory for scalability. Each requirement has a unique semantic token `[REQ-IDENTIFIER]` for traceability.

**For detailed information about how requirements are fulfilled, see:**
- **Architecture decisions**: See `architecture-decisions.md` for high-level design choices that fulfill requirements
- **Implementation decisions**: See `implementation-decisions.md` for detailed implementation approaches, APIs, and algorithms
- **Semantic tokens**: See `semantic-tokens.yaml` (YAML index) for the token registry and `semantic-tokens.md` (guide) for token format and conventions

## Directory Structure

```
tied/
├── requirements.md              # This guide file (you are here)
├── requirements.yaml            # YAML index/database of all requirements
├── requirements/                # Detail files directory (YAML)
│   ├── REQ-TIED_SETUP.yaml
│   ├── REQ-MODULE_VALIDATION.yaml
│   └── ...
```

## Filename Convention

Token names use the same format in text and filenames:

| Token Format | Filename Format |
|--------------|-----------------|
| `[REQ-USER_AUTH]` | `REQ-USER_AUTH.yaml` |
| `[REQ-MODULE_VALIDATION]` | `REQ-MODULE_VALIDATION.yaml` |

**Rule**: Remove brackets, keep hyphen, append `.yaml`

## Notes

- All requirements MUST be documented here with `[REQ-*]` tokens
- Requirements describe WHAT the system should do and WHY, not HOW
- Requirements MUST NOT describe bugs or implementation details
- **Language-Agnostic Requirements**: Requirements MUST be language-agnostic. Language selection, runtime choices, and language-specific implementation details belong in architecture decisions (`architecture-decisions.md`) or implementation decisions (`implementation-decisions.md`), NOT in requirements. The ONLY exception is when language selection is itself a specific requirement (e.g., `[REQ-USE_PYTHON]` for a Python-specific project requirement). When documenting requirements, focus on behavior and capabilities, not on how they are implemented in a specific language.

## How to Add a New Requirement

1. **Create a new detail file** in `requirements/` using the naming convention above
2. **Use the detail file template** (see below)
3. **Add an entry to the index table** below
4. **Update `semantic-tokens.yaml`** registry with the new `[REQ-*]` token

## Requirements Index

**The requirements index is maintained in `requirements.yaml`**, a YAML database file that contains all requirement records with their metadata, cross-references, and status.

To view the index:

```bash
# View entire index
cat tied/requirements.yaml

# View specific requirement
yq '.REQ-TIED_SETUP' tied/requirements.yaml

# Get satisfaction criteria for a requirement
yq '.REQ-TIED_SETUP.satisfaction_criteria[].criterion' tied/requirements.yaml

# Get validation methods for a requirement
yq '.REQ-TIED_SETUP.validation_criteria[].method' tied/requirements.yaml

# Get architecture dependencies for a requirement
yq '.REQ-TIED_SETUP.traceability.architecture[]' tied/requirements.yaml

# List all requirements by status
yq 'to_entries | map(select(.value.status == "Implemented")) | from_entries' tied/requirements.yaml

# Quick grep search
grep -A 30 '^REQ-TIED_SETUP:' tied/requirements.yaml
```

### How to Append a New Requirement

1. Open `requirements.yaml` in your editor
2. Copy the template block at the bottom of the file (REQ-IDENTIFIER)
3. Paste it at the end with a blank line before it
4. Replace `REQ-IDENTIFIER` with your new semantic token
5. Fill in all fields (name, category, priority, status, rationale, etc.)
6. Update the `detail_file` path to match your new `.yaml` file in `requirements/` directory
7. Save the file

Example append operation:

```bash
cat >> tied/requirements.yaml << 'EOF'

REQ-NEW_FEATURE:
  name: New Feature Name
  category: Functional
  priority: P1
  status: "Planned"
  rationale:
    why: "Primary reason for this requirement"
    problems_solved:
      - "Problem 1"
      - "Problem 2"
    benefits:
      - "Benefit 1"
      - "Benefit 2"
  satisfaction_criteria:
    - criterion: "Criterion description 1"
      metric: "Measurable target (optional)"
    - criterion: "Criterion description 2"
  validation_criteria:
    - method: "Unit tests"
      coverage: "All core functions"
    - method: "Integration tests"
      coverage: "End-to-end flows"
  traceability:
    architecture:
      - ARCH-NEW_FEATURE
    implementation:
      - IMPL-NEW_FEATURE
    tests:
      - testNewFeature_REQ_NEW_FEATURE
    code_annotations:
      - REQ-NEW_FEATURE
  related_requirements:
    depends_on: []
    related_to: []
    supersedes: []
  detail_file: requirements/REQ-NEW_FEATURE.yaml
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

- **✅ Implemented**: Requirement is fully implemented and validated
- **⏳ Planned**: Requirement is documented but not yet implemented
- **Template**: Example/template entry for reference

---

## Detail File Template

Use this template when creating a new requirement file in `requirements/`:

```markdown
# [REQ-IDENTIFIER] Requirement Name

**Category**: Functional | Non-Functional | Immutable  
**Priority**: P0 (Critical) | P1 (Important) | P2 (Nice-to-have) | P3 (Future)  
**Status**: ✅ Implemented | ⏳ Planned | Template  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Description

What the requirement specifies (WHAT)

## Rationale

Why the requirement exists (WHY)

## Satisfaction Criteria

- How we know the requirement is satisfied
- Acceptance criteria
- Success conditions

## Validation Criteria

- How we verify/validate the requirement is met
- Testing approach
- Verification methods
- Success metrics

## Traceability

- **Architecture**: See `architecture-decisions.md` § [ARCH-IDENTIFIER]
- **Implementation**: See `implementation-decisions.md` § [IMPL-IDENTIFIER]
- **Tests**: `testFeatureName_REQ_IDENTIFIER` in test files
- **Code**: `// [REQ-IDENTIFIER] Implementation comment` in source files

## Related Requirements

- **Depends on**: (if applicable)
- **Related to**: (if applicable)
- **Supersedes**: (if this replaces another requirement)

---

*Last validated: YYYY-MM-DD by [agent/contributor]*
```

---

## Quick Reference: Creating a New Requirement

```bash
# 1. Create the detail file
touch tied/requirements/REQ-YOUR_TOKEN.yaml

# 2. Copy the template above into the new file

# 3. Fill in the details

# 4. Add entry to the index table in this file

# 5. Update semantic-tokens.yaml registry
```

---

## Grouping by Domain (Optional)

For very large projects, organize detail files by domain:

```
requirements/
├── core/
│   ├── REQ-TIED_SETUP.yaml
│   └── REQ-MODULE_VALIDATION.yaml
├── auth/
│   ├── REQ-USER_LOGIN.yaml
│   └── REQ-SESSION_MGMT.yaml
└── api/
    └── REQ-REST_ENDPOINTS.yaml
```

When using subdirectories, update the Detail File column in the index:
```markdown
| `[REQ-USER_LOGIN]` | User Login | P0 | ✅ Implemented | Auth | ... | [Detail](requirements/auth/REQ-USER_LOGIN.yaml) |
```

---

## Migration from Monolithic File

If migrating from a single monolithic `requirements.md` file, see `migrate-requirements.md` for step-by-step instructions.

---

## Future Enhancements (Out of Scope)

The following features are documented but marked as future enhancements:
- Each requirement should cross-reference architecture and implementation decisions
- Automated requirement validation tools
- Requirement dependency graph visualization

These may be considered for future iterations but are not required for the initial implementation.
