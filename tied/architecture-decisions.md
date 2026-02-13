# Architecture Decisions

**TIED Methodology Version**: 1.5.0

## Overview

This document serves as the **index** for all architecture decisions in this project. Each architecture decision is stored in its own file within the `architecture-decisions/` directory for scalability.

All decisions are cross-referenced with requirements using `[REQ-*]` tokens for traceability.

## Directory Structure

```
tied/
├── architecture-decisions.md              # This guide file (you are here)
├── architecture-decisions.yaml            # YAML index/database of all architecture decisions
├── architecture-decisions/                # Detail files directory
│   ├── ARCH-TIED_STRUCTURE.md
│   ├── ARCH-MODULE_VALIDATION.md
│   ├── ARCH-LANGUAGE_SELECTION.md
│   └── ...
```

## Filename Convention

Token names use the same format in text and filenames:

| Token Format | Filename Format |
|--------------|-----------------|
| `[ARCH-CONFIG_STRUCTURE]` | `ARCH-CONFIG_STRUCTURE.md` |
| `[ARCH-MODULE_VALIDATION]` | `ARCH-MODULE_VALIDATION.md` |

**Rule**: Remove brackets, keep hyphen, append `.md`

## Notes

- All architecture decisions MUST be recorded IMMEDIATELY when made
- Each decision MUST include `[ARCH-*]` token and cross-reference `[REQ-*]` tokens
- Architecture decisions are dependent on requirements
- DO NOT defer architecture documentation - record decisions as they are made
- Document the expected code + test touchpoints so `[PROC-TOKEN_AUDIT]` has concrete files/functions to verify
- Capture the intended validation tooling (e.g., references to `./scripts/validate_tokens.sh`) so `[PROC-TOKEN_VALIDATION]` remains reproducible
- **Language Selection**: Language selection, runtime choices, and language-specific architectural patterns belong in architecture decisions. Document language choice with `[ARCH-LANGUAGE_SELECTION]` token when it's an architectural decision (not a requirement). Language-specific patterns (e.g., async/await, goroutines, callbacks) should be documented here. Requirements should remain language-agnostic unless language selection is itself a specific requirement.

## How to Add a New Architecture Decision

1. **Create a new detail file** in `architecture-decisions/` using the naming convention above
2. **Use the detail file template** (see below)
3. **Add an entry to the index table** below
4. **Update `semantic-tokens.yaml`** registry with the new `[ARCH-*]` token

---

## Architecture Decisions Index

**The architecture decisions index is maintained in `architecture-decisions.yaml`**, a YAML database file that contains all architecture decision records with their metadata, cross-references, and status.

To view the index:

```bash
# View entire index
cat tied/architecture-decisions.yaml

# View specific decision
yq '.ARCH-TIED_STRUCTURE' tied/architecture-decisions.yaml

# Get rationale for a decision
yq '.ARCH-TIED_STRUCTURE.rationale.why' tied/architecture-decisions.yaml

# Get alternatives considered
yq '.ARCH-TIED_STRUCTURE.alternatives_considered[].name' tied/architecture-decisions.yaml

# Get implementation approach summary
yq '.ARCH-TIED_STRUCTURE.implementation_approach.summary' tied/architecture-decisions.yaml

# Get requirement dependencies
yq '.ARCH-TIED_STRUCTURE.traceability.requirements[]' tied/architecture-decisions.yaml

# List all active decisions
yq 'to_entries | map(select(.value.status == "Active")) | from_entries' tied/architecture-decisions.yaml

# Quick grep search
grep -A 30 '^ARCH-TIED_STRUCTURE:' tied/architecture-decisions.yaml
```

### How to Append a New Architecture Decision

1. Open `architecture-decisions.yaml` in your editor
2. Copy the template block at the bottom of the file (ARCH-IDENTIFIER)
3. Paste it at the end with a blank line before it
4. Replace `ARCH-IDENTIFIER` with your new semantic token
5. Fill in all fields (name, status, cross_references, rationale, alternatives, etc.)
6. Update the `detail_file` path to match your new `.md` file in `architecture-decisions/` directory
7. Save the file

Example append operation:

```bash
cat >> tied/architecture-decisions.yaml << 'EOF'

ARCH-NEW_DECISION:
  name: New Architecture Decision
  status: Active
  cross_references:
    - REQ-RELATED_REQUIREMENT
  rationale:
    why: "Primary reason for this decision"
    problems_solved:
      - "Problem 1"
      - "Problem 2"
    benefits:
      - "Benefit 1"
      - "Benefit 2"
  alternatives_considered:
    - name: "Alternative 1"
      pros:
        - "Pro 1"
      cons:
        - "Con 1"
      rejected_reason: "Why it was rejected"
    - name: "Alternative 2"
      pros:
        - "Pro 1"
      cons:
        - "Con 1"
      rejected_reason: "Why it was rejected"
  implementation_approach:
    summary: "High-level description of the approach"
    details:
      - "Key component 1"
      - "Key component 2"
      - "Integration point 1"
  traceability:
    requirements:
      - REQ-RELATED_REQUIREMENT
    implementation:
      - IMPL-NEW_DECISION
    tests:
      - testFeatureName_ARCH_NEW_DECISION
    code_annotations:
      - ARCH-NEW_DECISION
  related_decisions:
    depends_on:
      - REQ-RELATED_REQUIREMENT
    informs:
      - IMPL-NEW_DECISION
    see_also: []
  detail_file: architecture-decisions/ARCH-NEW_DECISION.md
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

Use this template when creating a new architecture decision file in `architecture-decisions/`:

```markdown
# [ARCH-IDENTIFIER] Architecture Decision Title

**Cross-References**: [REQ-RELATED_REQUIREMENT]  
**Status**: Active  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Decision

Brief description of the architectural decision.

## Rationale

- Why this decision was made
- What problems it solves
- What benefits it provides

## Alternatives Considered

- **Alternative 1**: Why it was rejected
- **Alternative 2**: Why it was rejected

## Implementation Approach

- High-level approach
- Key components
- Integration points

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] `path/to/implementation.ext` - Description

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `testFeatureName_REQ_IDENTIFIER` in `path/to/test_file.ext`

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| YYYY-MM-DD | `abc1234` | ✅ Pass | Initial validation |

## Related Decisions

- Depends on: [REQ-REQUIREMENT]
- Informs: [IMPL-IMPLEMENTATION]
- See also: [ARCH-RELATED_DECISION]

---

*Last validated: YYYY-MM-DD by [agent/contributor]*
```

---

## Quick Reference: Creating a New Architecture Decision

```bash
# 1. Create the detail file
touch tied/architecture-decisions/ARCH-YOUR_TOKEN.md

# 2. Copy the template above into the new file

# 3. Fill in the details

# 4. Add entry to the index table in this file

# 5. Update semantic-tokens.yaml registry
```

---

## Grouping by Domain (Optional)

For very large projects, organize detail files by domain:

```
architecture-decisions/
├── core/
│   ├── ARCH-TIED_STRUCTURE.md
│   └── ARCH-MODULE_VALIDATION.md
├── auth/
│   ├── ARCH-AUTH_FLOW.md
│   └── ARCH-SESSION_MGMT.md
└── api/
    └── ARCH-REST_DESIGN.md
```

When using subdirectories, update the Detail File column in the index:
```markdown
| `[ARCH-AUTH_FLOW]` | Auth Flow | Active | ... | [Detail](architecture-decisions/auth/ARCH-AUTH_FLOW.md) |
```

---

## Migration from Monolithic File

If migrating from a single monolithic `architecture-decisions.md` file, see `migrate-architecture-decisions.md` for step-by-step instructions.

