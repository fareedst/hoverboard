# Semantic Tokens Directory

**TIED Methodology Version**: 1.6.0

## Overview
This document serves as the **central directory/registry** for all semantic tokens used in the project. Semantic tokens (`[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`) provide a consistent vocabulary and traceability mechanism that ties together all documentation, code, and tests.

**For detailed information about tokens, see:**
- **Requirements tokens**: See `requirements.md` (guide) and `requirements.yaml` (YAML index) for full descriptions, rationale, satisfaction criteria, and validation criteria
- **Architecture tokens**: See `architecture-decisions.md` (guide) and `architecture-decisions.yaml` (YAML index) for architectural decisions, rationale, and alternatives considered
- **Implementation tokens**: See `implementation-decisions.md` (guide) and `implementation-decisions.yaml` (YAML index) for implementation details, code structures, and algorithms

## AI Assistant Integration Guidelines [REQ-DOC_016]

### Token Usage for AI Assistants

AI assistants should use semantic tokens for:

1. **Code Navigation**: Search for `[REQ-*]`, `[ARCH-*]`, `[IMPL-*]` tokens to find related code
2. **Feature Understanding**: Trace features from requirements through architecture to implementation
3. **Change Impact Analysis**: Use token cross-references to identify affected components
4. **Test Discovery**: Find tests for features using `[REQ-*]` tokens in test names

### Token-Based Code Navigation

```bash
# Find all implementations of a requirement
grep -r "\[REQ-FEATURE_NAME\]" --include="*.go" .

# Find all tests for a requirement
grep -r "REQ_FEATURE_NAME" --include="*_test.go" .

# Find architecture decisions for a feature
grep -r "\[ARCH-FEATURE_NAME\]" --include="*.md" .

# Find implementation details
grep -r "\[IMPL-FEATURE_NAME\]" --include="*.go" .
```

### Token Creation Requirements

When implementing features:
1. **ALWAYS** create `[REQ-*]` token in `requirements.md` first
2. **ALWAYS** create `[ARCH-*]` token in `architecture-decisions.md` for design decisions
3. **ALWAYS** add `[IMPL-*]` tokens to code comments
4. **ALWAYS** reference `[REQ-*]` tokens in test names/comments
5. **ALWAYS** update `semantic-tokens.yaml` registry when creating new tokens
6. **ALWAYS** document any `[PROC-*]` process tokens in `processes.md` when defining operational workflows

### Token Audit Workflow `[PROC-TOKEN_AUDIT]`

- Map requirement → architecture → implementation tokens before touching code.
- Annotate every code edit with `[IMPL-*] [ARCH-*] [REQ-*]` (same triplet used in documentation).
- Require tests to include the `[REQ-*]` (and optional `[TEST-*]`) identifiers in both the test name and supporting comments.
- Record the audit result inside the relevant task/subtask so future agents can see when the chain was verified.

### Automated Validation `[PROC-TOKEN_VALIDATION]`

- Run `./scripts/validate_tokens.sh` (or repo-specific equivalent) after each audit to ensure every referenced token exists in the registry.
- Treat validation failures as blocking defects until the registry and documents are synchronized.
- Capture validation outputs in `implementation-decisions.md` so audits remain reproducible.

### Token Validation Requirements

Before marking features complete:
1. **ALWAYS** run token validation scripts (e.g., `./scripts/validate_tokens.sh`) and store the `[PROC-TOKEN_VALIDATION]` result in `implementation-decisions.md`.
2. **ALWAYS** ensure token consistency across all layers
3. **ALWAYS** verify token traceability in documentation
4. **ALWAYS** check that all cross-references are valid

## Token Format

```
[TYPE-IDENTIFIER]
```

## Token Types

- `[REQ-*]` - Requirements (functional/non-functional) - **The source of intent**
- `[ARCH-*]` - Architecture decisions - **High-level design choices that preserve intent**
- `[IMPL-*]` - Implementation decisions - **Low-level choices that preserve intent**
- `[TEST-*]` - Test specifications - **Validation of intent**
- `[PROC-*]` - Process definitions for survey/build/test/deploy work that stay linked to `[REQ-*]`

## Token Naming Convention

- Use UPPER_SNAKE_CASE for identifiers
- Be descriptive but concise
- Example: `[REQ-DUPLICATE_PREVENTION]` not `[REQ-DP]`

## Cross-Reference Format

When referencing other tokens:

```markdown
[IMPL-EXAMPLE] Description [ARCH-DESIGN] [REQ-REQUIREMENT]
```

## Token Registry

**📖 The canonical registry of all tokens lives in `semantic-tokens.yaml`.**

This YAML index serves as the single source of truth for "does this token exist?" and provides structured metadata for all semantic tokens across all types (REQ, ARCH, IMPL, TEST, PROC).

**Quick lookup commands:**
- List all tokens: `yq 'keys' tied/semantic-tokens.yaml`
- Filter by type: `yq 'to_entries | map(select(.value.type == "REQ")) | from_entries' tied/semantic-tokens.yaml`
- Check existence: `yq '.["REQ-TIED_SETUP"]' tied/semantic-tokens.yaml`
- Get token details: `yq '.REQ-TIED_SETUP' tied/semantic-tokens.yaml`

**For full details on each token:**
- **Requirements tokens**: See `requirements.yaml` (YAML index) and `requirements/` (detail files)
- **Architecture tokens**: See `architecture-decisions.yaml` (YAML index) and `architecture-decisions/` (detail files)
- **Implementation tokens**: See `implementation-decisions.yaml` (YAML index) and `implementation-decisions/` (detail files)
- **Process tokens**: See `processes.md`

## Token Relationships

### Hierarchical Relationships
- `[REQ-PARENT_FEATURE]` contains `[REQ-SUB_FEATURE_1]`, `[REQ-SUB_FEATURE_2]`
- `[ARCH-FEATURE]` includes `[ARCH-COMPONENT_1]`, `[ARCH-COMPONENT_2]`

### Flow Relationships
- `[REQ-FEATURE]` → `[ARCH-DESIGN]` → `[IMPL-IMPLEMENTATION]` → Code + Tests

### Dependency Relationships
- `[IMPL-FEATURE]` depends on `[ARCH-DESIGN]` and `[REQ-FEATURE]`
- `[ARCH-DESIGN]` depends on `[REQ-FEATURE]`

## Usage Examples

### In Code Comments
```[your-language]
// [REQ-EXAMPLE_FEATURE] Implementation of example feature
// [IMPL-EXAMPLE_IMPLEMENTATION] [ARCH-EXAMPLE_DECISION] [REQ-EXAMPLE_FEATURE]
function exampleFunction() {
    // ...
}
```
> **NOTE**: Code merged without these annotations is considered incomplete because it fails `[PROC-TOKEN_AUDIT]`.

### In Tests
```[your-language]
// Test validates [REQ-EXAMPLE_FEATURE] is met
function testExampleFeature_REQ_EXAMPLE_FEATURE() {
    // Test implementation
}
```
> **NOTE**: Tests without `[REQ-*]` markers are rejected during `[PROC-TOKEN_VALIDATION]` because they cannot prove intent.

### In Documentation
```markdown
The feature uses [ARCH-ARCHITECTURE_NAME] to fulfill [REQ-FEATURE_NAME].
Implementation details are documented in [IMPL-IMPLEMENTATION_NAME].
```

## Token Validation Guidelines

### Cross-Layer Token Consistency

Every feature must have proper token coverage across all layers:

1. **Requirements Layer**: Feature must have `[REQ-*]` token in `requirements.md`
2. **Architecture Layer**: Architecture decisions must have `[ARCH-*]` tokens in `architecture-decisions.md`
3. **Implementation Layer**: Implementation must have `[IMPL-*]` tokens in code comments
4. **Test Layer**: Tests must reference `[REQ-*]` tokens in test names/comments
5. **Documentation Layer**: All documentation must cross-reference tokens consistently

### Token Format Validation

1. **Token Format**: Must follow `[TYPE-IDENTIFIER]` pattern exactly
2. **Token Types**: Must use valid types (`REQ`, `ARCH`, `IMPL`, `TEST`, `PROC`)
3. **Identifier Format**: Must use UPPER_SNAKE_CASE
4. **Cross-References**: Implementation tokens must reference architecture and requirement tokens

### Token Traceability Validation

1. Every requirement in `requirements.md` must have corresponding implementation tokens
2. Every architecture decision must have corresponding implementation tokens
3. Every test must link to specific requirements via `[REQ-*]` tokens
4. All tokens must be discoverable through automated validation
## Token Creation Requirements

When implementing features:
1. **ALWAYS** create `[REQ-*]` token in `requirements.md` first
2. **ALWAYS** create `[ARCH-*]` token in `architecture-decisions.md` for design decisions
3. **ALWAYS** add `[IMPL-*]` tokens to code comments
4. **ALWAYS** reference `[REQ-*]` tokens in test names/comments
5. **ALWAYS** update `semantic-tokens.yaml` registry when creating new tokens
6. **ALWAYS** document any `[PROC-*]` process tokens in `processes.md` when defining operational workflows

