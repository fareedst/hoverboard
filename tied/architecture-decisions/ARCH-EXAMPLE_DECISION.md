# [ARCH-EXAMPLE_DECISION] Core Architecture Example

**Cross-References**: [REQ-EXAMPLE_FEATURE]  
**Status**: Template  
**Created**: YYYY-MM-DD  
**Last Updated**: YYYY-MM-DD

---

## Decision

[Your Architecture Choice - describe the high-level architectural decision]

## Rationale

- Matches requirement [REQ-EXAMPLE_FEATURE]
- Provides benefits X, Y, Z
- Simpler implementation
- [Add more rationale points]

## Alternatives Considered

- **Alternative approach 1**: Why it was rejected - more complex, less maintainable
- **Alternative approach 2**: Why it was rejected - performance concerns
- **Alternative approach 3**: Why it was rejected - doesn't meet requirements

## Implementation Approach

- High-level approach description
- Key components and their responsibilities
- Integration points with other systems
- Data flow overview

### Key Components

1. **Component A**: Description of what it does
2. **Component B**: Description of what it does
3. **Component C**: Description of what it does

### Integration Points

- External System 1: How we integrate
- External System 2: How we integrate

## Token Coverage `[PROC-TOKEN_AUDIT]`

Code files expected to carry `[IMPL-*] [ARCH-*] [REQ-*]` comments:
- [ ] `path/to/main.ext` - Annotate entry points with `[IMPL-EXAMPLE_IMPLEMENTATION] [ARCH-EXAMPLE_DECISION] [REQ-EXAMPLE_FEATURE]`

Tests expected to reference `[REQ-*]` / `[TEST-*]` tokens:
- [ ] `testCoreFeature_REQ_EXAMPLE_FEATURE` plus inline `[REQ-EXAMPLE_FEATURE]` comments validate behavior

## Validation Evidence `[PROC-TOKEN_VALIDATION]`

| Date | Commit | Validation Result | Notes |
|------|--------|-------------------|-------|
| YYYY-MM-DD | `abc1234` | ⏳ Pending | Awaiting implementation |

## Related Decisions

- Depends on: [REQ-EXAMPLE_FEATURE]
- Informs: [IMPL-EXAMPLE_IMPLEMENTATION]
- See also: —

---

*Last validated: YYYY-MM-DD by [agent/contributor]*
