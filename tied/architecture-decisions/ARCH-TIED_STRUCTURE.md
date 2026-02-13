# [ARCH-TIED_STRUCTURE] TIED Project Structure

**Cross-References**: [REQ-TIED_SETUP]  
**Status**: Active  
**Created**: 2025-12-18  
**Last Updated**: 2025-12-18

---

## Decision

Centralized `tied/` directory for all TIED methodology documentation.

## Rationale

- Keeps documentation close to code but organized in a dedicated namespace
- Ensures the AI agent can easily find all context in one place
- Separates meta-documentation from project source code
- Clear separation of concerns
- Standard project layout
- Testable components

## Alternatives Considered

- **Root-level files**: Rejected - clutters the root directory
- **`.github` or `.docs` folder**: Rejected - `tied` is more specific to the methodology

## Implementation Approach

- Create `tied/` directory at project root
- Populate with template files:
  - `requirements.md`
  - `architecture-decisions.md` (index)
  - `architecture-decisions/` (detail files)
  - `implementation-decisions.md` (index)
  - `implementation-decisions/` (detail files)
  - `semantic-tokens.yaml` (YAML index)
  - `semantic-tokens.md` (guide)
  - `processes.md`

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] Bootstrap scripts with `// [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]`

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `TestTIEDSetup_REQ_TIED_SETUP` ensures docs + registry exist

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| 2025-12-18 | — | ✅ Pass | Initial structure validated |

## Related Decisions

- Depends on: [REQ-TIED_SETUP]
- Informs: [IMPL-TIED_FILES]
- See also: —

---

*Last validated: 2025-12-18*
