# AI-First Principles & Process Guide

**Purpose**: This document defines the principles, processes, and conventions that AI agents must follow when working on this project. It should be referenced at the start of every AI agent interaction.

## 🎯 Token-Integrated Engineering & Development (TIED)

This project follows **Token-Integrated Engineering & Development (TIED)**, a methodology where semantic tokens (`[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`) are the central mechanism for preserving intent throughout the entire development lifecycle.

### How Semantic Tokens Preserve Intent

Semantic tokens create a **traceable chain of intent** that ensures the original purpose and reasoning are never lost:

1. **Requirements** (`[REQ-*]`) define the "what" and "why" - the original intent
2. **Architecture** decisions (`[ARCH-*]`) explain the "how" at a high level and link back to requirements via cross-references
3. **Implementation** decisions (`[IMPL-*]`) explain the "how" at a low level and link back to both architecture and requirements
4. **Tests** validate requirements are met, referencing the same tokens in test names and comments
5. **Code** comments include tokens, maintaining the connection to original intent

This creates a **living documentation system** where:
- Every decision can be traced back to its requirement
- The reasoning behind architectural choices is preserved
- Implementation details remain connected to their purpose
- Tests explicitly validate the original intent
- Code comments maintain context even as the codebase evolves

**Semantic tokens are not just labels—they are the mechanism that preserves intent from requirements through architecture, implementation, tests, and code.**

## ⚠️ MANDATORY ACKNOWLEDGMENT

**AI AGENTS MUST** acknowledge adherence to these principles at the start of EVERY response by prefacing with:

**"Observing AI principles!"**

This acknowledgment confirms that the AI agent has:
- Read and understood this document
- Will follow all documented processes
- Will use semantic tokens consistently
- Will prioritize tasks correctly

---

## 📋 Table of Contents

1. [Token-Integrated Engineering & Development (TIED)](#-token-integrated-engineering--development-tied)
2. [AI-First Principles](#ai-first-principles)
3. [Documentation Structure](#documentation-structure)
4. [Semantic Token System](#semantic-token-system)
5. [Bugs vs Requirements: Proper TIED Handling](#-bugs-vs-requirements-proper-tied-handling)
6. [Development Process](#development-process)
7. [How to Present This to AI Agents](#how-to-present-this-to-ai-agents)

---

## 🤖 AI-First Principles

### Core Principles

1. **Semantic Token Cross-Referencing**
   - All code, tests, requirements, architecture decisions, and implementation decisions MUST be cross-referenced using semantic tokens (e.g., `[REQ-FEATURE]`, `[IMPL-IMPLEMENTATION]`).
   - Semantic tokens provide traceability from requirements → architecture → implementation → tests.

2. **Documentation-First Development**
   - Requirements MUST be expanded into pseudo-code and architectural decisions before implementation.
   - No code changes until requirements are fully specified with semantic tokens.

3. **Test-Driven Documentation**
   - Tests MUST reference the requirements they validate using semantic tokens.
   - Test names should include semantic tokens (e.g., `test('duplicate prevention REQ_DUPLICATE_PREVENTION')`).

4. **Code/Test Token Parity** `[PROC-TOKEN_AUDIT]`
   - Code without `[REQ-*]/[ARCH-*]/[IMPL-*]` markers or tests without `[REQ-*]/[TEST-*]` references is considered unusable intent.
   - Before submitting changes, agents MUST perform a token audit to confirm every new/modified source file and test carries the correct tokens and backlinks to documentation.
   - Missing tokens block task completion until the audit succeeds.

5. **Automated Token Validation** `[PROC-TOKEN_VALIDATION]`
   - Run `./scripts/validate_tokens.sh` (or the project-specific equivalent) to ensure semantic tokens exist in the registry and maintain traceability.
   - Validation failures MUST be documented and resolved before proceeding.

6. **Priority-Based Implementation**
   - **Most Important**: Tests, Code, Basic Functions
   - **Least Important**: Environment Orchestration, Enhanced Security, Automated Deployment

7. **Extensive Debug Output During Development**
   - Use extensive diagnostic output (logging functions, debug flags) liberally during initial implementation and debugging
   - Debug output helps AI agents understand execution flow, data transformations, and state changes
   - Include diagnostic output in test functions to trace behavior when tests fail
   - Use descriptive prefixes (e.g., `DIAGNOSTIC:`, `DEBUG:`) to clearly identify debug output
   - **CRITICAL**: Debug statements that identify architecture or implementation decisions MUST be kept in code
   - Debug statements that document key decision points, format string selection, placeholder replacement steps, or other architectural/implementation logic provide ongoing value for understanding code behavior
   - Debug output should remain in code unless explicitly requested to be removed - it is not intrusive and is optional during production use
   - Debug output controlled by `debug` flags or build tags can be conditionally enabled/disabled without removal
   - **Rationale**: AI agents benefit from visibility into execution flow, especially when debugging complex logic like configuration merging, state management, or data transformations. Debug statements that document architecture or implementation decisions serve as inline documentation of key decision points and execution paths. Keeping debug output in code provides ongoing value for future debugging and understanding code behavior.

8. **Separation of Concerns**
   - **Principle**: Each component, function, or module should have a single, well-defined responsibility
   - **When logic is difficult to implement or test within a large application context:**
     - Extract it into a pure function or isolated module
     - Give it a single, clear responsibility
     - Remove dependencies on application-specific context
     - Make it testable in isolation
   - **Benefits**: Improved testability, reusability, maintainability, and clarity
   - **Application**: Apply consistently when designing new features, refactoring existing code, or when complexity makes testing or reasoning difficult
   - **Rationale**: Separating simple, reusable logic from complex application logic enables independent testing, reduces coupling, and makes code easier to understand and maintain. Pure functions with single responsibilities are easier to reason about, test, and reuse across different contexts.

9. **Independent Module Validation Before Integration** (MANDATORY - Required for [REQ-MODULE_VALIDATION])
   - **MANDATORY**: Logical modules MUST be validated independently before integration into code satisfying specific requirements
   - **MANDATORY**: Each module must have clear boundaries, interfaces, and validation criteria defined before development
   - **MANDATORY**: Module validation must include:
     - Unit tests with mocked dependencies
     - Integration tests with test doubles (mocks, stubs, fakes)
     - Contract validation (input/output validation)
     - Edge case testing
     - Error handling validation
   - **MANDATORY**: Modules must pass all validation criteria before integration
   - **MANDATORY**: Integration tasks must be separate from module development and validation tasks
   - **Rationale**: Independent module validation eliminates bugs related to code complexity by ensuring each module works correctly in isolation before combining with other modules. This reduces integration complexity and catches bugs early in the development cycle.

---

## 📚 Documentation Structure

### Required Documentation Sections

All project documentation MUST include these sections with semantic token cross-references:

#### 1. Requirements Section
- Lists all functional and non-functional requirements
- Each requirement has a unique semantic token: `[REQ-IDENTIFIER]`
- Each requirement includes:
  - **Description**: What the requirement specifies
  - **Rationale**: Why the requirement exists
  - **Satisfaction Criteria**: How we know the requirement is satisfied (acceptance criteria, success conditions)
  - **Validation Criteria**: How we verify/validate the requirement is met (testing approach, verification methods, success metrics)
- Example: `[REQ-FEATURE] Description of the feature requirement`
- Implementation status: ✅ (Implemented) or ⏳ (Planned)
- **Note**: Validation criteria defined in requirements inform the testing strategy in `architecture-decisions.yaml` and specific test implementations in `implementation-decisions.yaml`
- **Language Discussions**: Requirements MUST be language-agnostic. Language selection, runtime choices, and language-specific implementation details belong in architecture decisions (`architecture-decisions.yaml`) or implementation decisions (`implementation-decisions.yaml`), NOT in requirements. The ONLY exception is when language selection is itself a specific requirement (e.g., `[REQ-USE_PYTHON]` for a Python-specific project requirement).

#### 2. Architecture Decisions Section
- Documents high-level design choices
- **Location**: `architecture-decisions.yaml` - YAML database of architecture decisions, with `architecture-decisions.md` as guide
- **MANDATORY**: Must be updated IMMEDIATELY when architectural decisions are made
- **DO NOT** defer architecture documentation - record decisions as they are made
- Links to requirements via semantic tokens
- Each decision MUST include semantic token `[ARCH-IDENTIFIER]` and cross-reference to `[REQ-*]` tokens
- Example: `[ARCH-CONCURRENCY_MODEL] Uses Promises/async-await for async execution [REQ-ASYNC_EXECUTION]`
- **Dependency**: Architecture decisions depend on requirements and should reference `[REQ-*]` tokens
- **Update Timing**: Record in `architecture-decisions.yaml` during Phase 1 (Requirements → Pseudo-Code) and update as decisions evolve
- **Language Discussions**: Language selection, runtime choices, and language-specific architectural patterns belong in architecture decisions. Document language choice with `[ARCH-LANGUAGE_SELECTION]` token when it's an architectural decision (not a requirement). Language-specific patterns (e.g., async/await, goroutines, callbacks) should be documented here.

#### 3. Implementation Decisions Section
- Documents low-level implementation choices
- **Location**: `implementation-decisions.md` - dedicated file for implementation decisions
- **MANDATORY**: Must be updated IMMEDIATELY when implementation decisions are made
- **DO NOT** defer implementation documentation - record decisions as they are made
- Links to requirements and architecture via semantic tokens
- Each decision MUST include semantic token `[IMPL-IDENTIFIER]` and cross-reference to `[ARCH-*]` and `[REQ-*]` tokens
- Example: `[IMPL-DUPLICATE_PREVENTION] Track lastText string [ARCH-STATE_TRACKING] [REQ-DUPLICATE_PREVENTION]`
- **Dependency**: Implementation decisions depend on both architecture decisions and requirements
- **Update Timing**: Record in `implementation-decisions.md` during Phase 1 (Requirements → Pseudo-Code) and update during Phase 3 (Implementation) as decisions are refined
- **Language Discussions**: Language-specific implementation details (APIs, libraries, syntax patterns, idioms) belong in implementation decisions. Code examples in documentation should use `[your-language]` placeholders or be language-agnostic pseudo-code unless demonstrating a specific language requirement.

#### 4. Semantic Token Registry
- Central registry of all semantic tokens used in the project
- Maps tokens to their definitions and cross-references
- Links to all documentation layers (requirements, architecture, implementation, tests, code)
- See `semantic-tokens.yaml` for the token registry (YAML index/database)
- See `semantic-tokens.md` for the token guide (format, naming conventions, usage examples)

#### 5. Code References
- Code comments MUST include semantic tokens
- Example: `// [REQ-DUPLICATE_PREVENTION] Skip if text matches lastText`
- Cross-reference architecture and implementation tokens when relevant
- Example: `// [IMPL-DUPLICATE_PREVENTION] [ARCH-STATE_TRACKING] [REQ-DUPLICATE_PREVENTION]`

#### 6. Test References
- Test names and comments MUST include semantic tokens
- Example: `testDuplicatePrevention_REQ_DUPLICATE_PREVENTION()` (language-agnostic pattern)
- Reference the requirement being validated: `// [REQ-DUPLICATE_PREVENTION] Validates duplicate prevention logic`

#### 7. Feature Documentation
- Each feature should have comprehensive cross-references across all documentation layers
- Use the Feature Documentation Format (see Cross-Reference Format section)
- Maintain bi-directional links for traceability
- Update change impact matrix when making modifications
- Document behavioral contracts for critical features
- Map dependencies to understand change impact

#### 8. Code Standards
- Code comments MUST include semantic tokens with full context
- Use clear, descriptive function names that indicate purpose
- Include AI-friendly comments explaining "why" not just "what"
- Reference related features and dependencies in comments
- Example: `// [IMPL-DUPLICATE_PREVENTION] [ARCH-STATE_TRACKING] [REQ-DUPLICATE_PREVENTION] Prevents duplicate processing by tracking last processed text`

---

## 🏷️ Semantic Token System

**Semantic tokens are the foundation of TIED** - they are the mechanism that preserves intent throughout the development lifecycle.

### Token Format

```
[TYPE:IDENTIFIER]
```

### Token Types

- `[REQ-*]` - Requirements (functional/non-functional) - **The source of intent**
- `[ARCH-*]` - Architecture decisions - **High-level design choices that preserve intent**
- `[IMPL-*]` - Implementation decisions - **Low-level choices that preserve intent**
- `[TEST-*]` - Test specifications - **Validation of intent**
- `[CLI/Config]` - Configuration/CLI related
- `[OS Integration]` - OS-specific integration
- `[Logging]` - Logging related
- `[Testability]` - Testability concerns
- `[Security]` - Security considerations

### Intent Preservation Through Tokens

Each token type serves a specific role in preserving intent:

- **`[REQ-*]` tokens** capture the original "what" and "why" - the fundamental intent
- **`[ARCH-*]` tokens** document how high-level design choices fulfill requirements, maintaining the connection to intent
- **`[IMPL-*]` tokens** document how low-level implementation choices fulfill architecture and requirements, preserving the reasoning
- **Cross-references** (`[ARCH-X] [REQ-Y]`) create explicit links that maintain traceability
- **Test names** (`TestFeature_REQ_FEATURE`) explicitly validate that intent is preserved
- **Code comments** (`// [REQ-FEATURE] Implementation`) maintain context even as code evolves

### Token Naming Convention

- Use UPPER_SNAKE_CASE for identifiers
- Be descriptive but concise
- Example: `[REQ-DUPLICATE_PREVENTION]` not `[REQ-DP]`

### Token Trace Checklist `[PROC-TOKEN_AUDIT]`

1. Confirm the requirement token exists in `requirements.md` with satisfaction + validation criteria.
2. Ensure the architecture decision references the requirement and introduces an `[ARCH-*]` token.
3. Record the implementation decision with `[IMPL-*]` connecting back to both `[ARCH-*]` and `[REQ-*]`.
4. Annotate the code change with the same `[IMPL-*]`/`[ARCH-*]`/`[REQ-*]` triplet.
5. Name and document the test with the `[REQ-*]` token (and `[TEST-*]` if defined) so validation can be tied directly to intent.
6. Update `semantic-tokens.yaml` and run `./scripts/validate_tokens.sh` to prove the trace is intact.

#### Intent Chain Example

```text
[REQ-CUSTOM_FORMATS] → [ARCH-FORMAT_PIPELINE] → [IMPL-PLACEHOLDER_ENGINE]
 ├─ Code: `// [IMPL-PLACEHOLDER_ENGINE] [ARCH-FORMAT_PIPELINE] [REQ-CUSTOM_FORMATS]`
 └─ Test: `testCustomFormats_REQ_CUSTOM_FORMATS()` with inline comment `[REQ-CUSTOM_FORMATS] validates placeholder expansion`
```

### Token Drift Troubleshooting

- If any link in the chain is missing, log the drift under `[PROC-TOKEN_AUDIT]` in `implementation-decisions` and block work until fixed.
- Treat missing tokens as bugs: document the gap in `implementation-decisions.md` with a remediation plan.
- Rerun `./scripts/validate_tokens.sh` after every fix to confirm the registry and references are synchronized.

### Cross-Reference Format

When referencing other tokens:

```markdown
[IMPL-DUPLICATE_PREVENTION] Track lastText string [ARCH-STATE_TRACKING] [REQ-DUPLICATE_PREVENTION]
```

#### Feature Documentation Format

For comprehensive feature documentation, use this structured format that links all documentation layers:

```markdown
### [FEATURE-ID]: Feature Name

**Requirement**: [REQ-IDENTIFIER] → See `requirements.yaml` § REQ-IDENTIFIER
**Architecture**: [ARCH-IDENTIFIER] → See `architecture-decisions.yaml` § ARCH-IDENTIFIER
**Implementation**: [IMPL-IDENTIFIER] → See `implementation-decisions.yaml` § IMPL-IDENTIFIER
**Tests**: `TestFeatureName_REQ_IDENTIFIER` → See `*_test.*` files
**Code**: `// [REQ-IDENTIFIER] Implementation comment` → See source code files

**Description**: Brief description of what this feature accomplishes.
```

#### Bi-Directional Linking

Each document should contain:
- **Forward Links**: "This requirement is implemented by [ARCH-DESIGN] (see `architecture-decisions.yaml`)"
- **Backward Links**: "This component implements [REQ-REQUIREMENT] (see `requirements.yaml`)"
- **Sibling Links**: "Related to [IMPL-RELATED_FEATURE] (see `implementation-decisions.yaml`)"

This ensures traceability in both directions and helps AI assistants understand relationships.

## 🐛 Bugs vs Requirements: Proper TIED Handling

### Critical Distinction

**Requirements describe desired behavior. Bugs describe implementation failures.**

This distinction is fundamental to TIED:

- **Requirements (`[REQ-*]`)**: Describe WHAT the system should do and WHY
- **Bugs**: Describe WHERE the implementation fails to meet a requirement

### Rules for Requirements

1. **Requirements MUST NOT describe bugs**
   - ❌ Bad: "Fix configuration merge strategy for exclude_patterns"
   - ✅ Good: "Array configuration fields default to merge (accumulate) strategy"

2. **Requirements describe desired behavior**
   - Focus on WHAT the system should do
   - Focus on WHY the behavior is needed
   - Avoid implementation details
   - Avoid references to "fix", "bug", "issue", "problem"

3. **Requirements are user-facing**
   - Describe behavior users expect
   - Describe capabilities the system provides
   - Use positive language (what should happen, not what shouldn't)

### Rules for Bug Tracking

1. **Bugs are tracked in Architecture/Implementation Decisions**
   - Document bugs in `architecture-decisions.yaml` or `implementation-decisions.yaml`
   - Use `[ARCH-*]` or `[IMPL-*]` tokens
   - Cross-reference to the requirement that should be satisfied: `[REQ-*]`

2. **Bug documentation format**
   ```markdown
   ## N. Bug Description [ARCH-BUG_IDENTIFIER] [REQ-RELATED_REQUIREMENT]
   
   ### Issue: Brief description of the bug
   **Rationale:**
   - Describes the implementation failure
   - References the requirement that should be satisfied
   - Explains why the current implementation is incorrect
   
   ### Fix Approach
   - How the bug will be fixed
   - What changes are needed
   - Cross-reference to requirement being satisfied
   ```

3. **When a bug reveals a missing requirement**
   - If fixing a bug reveals that behavior wasn't properly specified, ADD a requirement
   - The requirement describes the desired behavior
   - The bug fix implements that requirement
   - Example: Bug "exclude_patterns not merging" → Requirement "Array fields default to merge strategy"

### Decision Tree: Bug or Requirement?

```
Is this describing WHAT the system should do?
├─ YES → It's a REQUIREMENT
│   └─ Document in requirements.md with [REQ-*] token
│   └─ Describe desired behavior, not the problem
│
└─ NO → Is this describing WHERE implementation fails?
    ├─ YES → It's a BUG
    │   └─ Document in architecture-decisions.yaml or implementation-decisions.yaml
    │   └─ Use [ARCH-*] or [IMPL-*] token
    │   └─ Cross-reference to [REQ-*] that should be satisfied
    │   └─ Describe the fix approach
    │
    └─ NO → Is this describing HOW to implement something?
        └─ YES → It's an ARCHITECTURE or IMPLEMENTATION decision
            └─ Document in appropriate decisions file
            └─ Use [ARCH-*] or [IMPL-*] token
            └─ Cross-reference to [REQ-*]
```

### Examples

#### ❌ Bad: Bug as Requirement
```markdown
### [REQ-EXCLUDE_MERGE_FIX] Exclude Patterns Merge Strategy Fix Requirements

- **Description**: Fix configuration merge strategy for `exclude_patterns` to ensure patterns are accumulated...
```
**Problem**: Describes a fix, not desired behavior

#### ✅ Good: Requirement Describing Behavior
```markdown
### [REQ-CFG_005] Layered Configuration Inheritance Requirements

- **Description**: Array configuration fields default to merge (accumulate) strategy to preserve values...
```
**Correct**: Describes desired behavior

#### ✅ Good: Bug Documented in Architecture Decision
```markdown
## 23. Array Field Default Merge Strategy Implementation [ARCH-EXCLUDE_MERGE_FIX] [REQ-CFG_005]

### Decision: Array fields default to "merge" strategy to satisfy CFG-005 requirement
**Rationale:**
- Implements CFG-005 requirement that array fields default to merge (accumulate) strategy
- Fixes implementation bug where array fields were using "override" instead of "merge" by default
```
**Correct**: Bug fix documented in architecture decision, references requirement

### Tasks and Bugs

1. **Tasks can reference bugs**
   - Task descriptions can mention bug fixes
   - Tasks should reference the requirement being satisfied: `[REQ-*]`
   - Example: "Implement CFG-005 requirement. Fixes bug where..."

2. **Task priority rationale**
   - Can mention bug impact on user experience
   - Should emphasize requirement implementation
   - Example: "P1 - Implements CFG-005 requirement. Critical for user experience..."

### Change Impact Tracking

When making changes, use this matrix to identify what needs updating:

| Change Type | Documents to Update | Validation Required |
|-------------|-------------------|-------------------|
| New Feature | requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml, semantic-tokens.yaml | Full validation |
| Requirement Change | requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml, tests | Implementation validation |
| Architecture Change | architecture-decisions.yaml, implementation-decisions.yaml, tests | Test validation |
| Implementation Detail | implementation-decisions.yaml, tests | Test validation |
| Bug Fix | architecture-decisions.yaml or implementation-decisions.yaml, tests, requirements.yaml (if requirement was missing/wrong) | Regression validation |

#### Pre-Change Validation Checklist

**BEFORE making any changes**, verify:

- [ ] Feature is not listed in immutable requirements (unless major version change planned)
- [ ] All documents that need updating are identified using Change Impact Matrix
- [ ] Cross-references will remain valid after changes
- [ ] Test coverage exists or will be created for changes
- [ ] Behavioral contracts and invariants are understood
- [ ] Dependencies and dependent features are identified

#### Post-Change Validation Checklist

**AFTER making changes**, verify:

- [ ] All identified documents updated simultaneously
- [ ] Cross-references validated and working
- [ ] Tests updated and passing
- [ ] Code comments include semantic tokens
- [ ] Behavioral contracts maintained
- [ ] No breaking changes to immutable requirements
- [ ] Documentation examples match implementation

#### Behavioral Contracts and Invariants

For critical features, document behavioral contracts that cannot change without a version bump:

```markdown
### [FEATURE-ID] Behavioral Contracts

**Immutable Invariants** (Cannot change without version bump):
- [Invariant 1]: Description of what must always be true
- [Invariant 2]: Description of guaranteed behavior

**Configurable Behaviors** (Can change):
- [Configurable 1]: Description of what can be customized
- [Configurable 2]: Description of extensible aspects
```

#### Dependency Mapping

Document feature dependencies to understand change impact:

```markdown
### [FEATURE-ID] Dependencies

**Depends On**: [FEATURE-X], [FEATURE-Y]
**Used By**: [FEATURE-A], [FEATURE-B]
**Affects**: [List of areas impacted by changes]
**Testing**: [List of tests that must pass]
```

### Token Registry Location

Create and maintain `semantic-tokens.yaml` with:
- All tokens used in the project
- Definitions
- Cross-reference mappings
- Status (Active/Deprecated/Template/Planned)
- Links to source indexes and detail files

---

## 🔄 Development Process

### Phase 1: Requirements → Pseudo-Code

**MANDATORY**: Before any code changes, expand requirements into pseudo-code and decisions.

1. **Identify Requirement**
   - Extract requirement from documentation
   - Note semantic token: `[REQ-IDENTIFIER]`

2. **Architectural Decisions** (MANDATORY - Record IMMEDIATELY)
   - **IMMEDIATELY** document high-level approach in `architecture-decisions.yaml`
   - **IMMEDIATELY** create `[ARCH-IDENTIFIER]` tokens
   - **IMMEDIATELY** cross-reference: `[ARCH-IDENTIFIER] [REQ-IDENTIFIER]`
   - Each architecture decision MUST be recorded in `architecture-decisions.yaml` with semantic token links
   - Architecture decisions are dependent on requirements and must reference `[REQ-*]` tokens
   - **DO NOT** defer - record decisions as they are made, not at the end

3. **Implementation Decisions** (MANDATORY - Record IMMEDIATELY)
   - **IMMEDIATELY** document low-level approach in `implementation-decisions.md`
   - **IMMEDIATELY** create `[IMPL-IDENTIFIER]` tokens
   - **IMMEDIATELY** cross-reference: `[IMPL-IDENTIFIER] [ARCH-IDENTIFIER] [REQ-IDENTIFIER]`
   - Each implementation decision MUST be recorded in `implementation-decisions.md` with semantic token links
   - Implementation decisions are dependent on both architecture decisions and requirements
   - **DO NOT** defer - record decisions as they are made, not at the end

4. **Module Identification** (MANDATORY - Required for [REQ-MODULE_VALIDATION])
   - **IMMEDIATELY** identify logical modules that will be developed
   - **IMMEDIATELY** document module boundaries and responsibilities
   - **IMMEDIATELY** define module interfaces and contracts
   - **IMMEDIATELY** specify module validation criteria (what "validated" means for each module)
   - Each module MUST have clear, testable boundaries
   - Modules should be independently testable and validatable
   - Document module dependencies and integration points
   - **Rationale**: Independent module validation reduces complexity-related bugs by ensuring each module works correctly before integration

5. **Pseudo-Code**
   - Write pseudo-code with semantic token comments
   - Include module boundaries in pseudo-code
   - Example:
     ```text
     // [REQ-DUPLICATE_PREVENTION]
     // Module: DuplicateDetection
     // Interface: isDuplicate(text, lastText) -> bool
     if text == lastText:
       skip()
     ```

6. **Update Documentation** (MANDATORY - Do IMMEDIATELY)
   - **IMMEDIATELY** add architecture decisions to `architecture-decisions.yaml` with `[ARCH-*]` tokens and `[REQ-*]` cross-references
   - **IMMEDIATELY** add implementation decisions to `implementation-decisions.yaml` with `[IMPL-*]` tokens and `[ARCH-*]` and `[REQ-*]` cross-references
   - **IMMEDIATELY** document module boundaries and validation criteria
   - **IMMEDIATELY** update `semantic-tokens.yaml` with any new tokens created
   - Cross-reference all tokens consistently
   - **DO NOT** defer documentation updates - they are part of the planning phase

### Phase 2: Planning Implementation (MANDATORY - Plan BEFORE Implementation)

Before starting implementation, ensure you have a clear plan for how to execute the work:

1. **Break Down Work into Steps**
   - Identify discrete implementation steps
   - Each step should reference semantic tokens
   - Include separate steps for module development and module validation
   - Example steps:
     - Implement duplicate prevention logic `[REQ-DUPLICATE_PREVENTION]`
     - Validate DuplicateDetection module independently `[REQ-MODULE_VALIDATION]` `[REQ-DUPLICATE_PREVENTION]`
   - **DO NOT** start implementation without a clear plan

2. **Identify Implementation Sequence**
   - Break work into implementable units
   - Each unit is a single, complete piece of work
   - Include module validation for each module
   - Example sequence:
     - Add field to data structure
     - Implement `isDuplicate()` function
     - **Validate DuplicateDetection module independently** (unit tests, integration tests with mocks)
     - Call `isDuplicate()` in polling loop (integration)
     - Write test `test('duplicate prevention REQ_DUPLICATE_PREVENTION', () => {})`

3. **Prioritize Work**
   - P0: Critical (blocks core functionality)
   - P1: Important (enhances functionality)
   - P2: Nice-to-have (improves UX/developer experience)
   - P3: Future (deferred)
   - Work on higher priority items first
   - **Module validation is typically P0 or P1** - must be completed before integration

**Note**: Agents may maintain planning state in-session (e.g., using conversation-based todo lists) or in `implementation-decisions` documentation. Projects may optionally use a `tasks.md` file for shared visibility, but the methodology does not require it.

### Phase 3: Implementation

1. **Work on Higher Priority Items First**
   - P0 (critical) before P1 (important), P1 before P2 (nice-to-have), etc.

2. **Module Development and Validation** (MANDATORY - Required for [REQ-MODULE_VALIDATION])
   - **BEFORE integration**: Develop each logical module independently
   - **BEFORE integration**: Validate each module independently using:
     - Unit tests with mocked dependencies
     - Integration tests with test doubles (mocks, stubs, fakes)
     - Contract validation (input/output validation)
     - Edge case testing
     - Error handling validation
   - **BEFORE integration**: Ensure module meets its defined validation criteria
   - **BEFORE integration**: Document module validation results
   - **ONLY AFTER validation**: Integrate validated modules into the larger system
   - **Rationale**: Independent validation catches bugs early, reduces integration complexity, and ensures each module works correctly in isolation before combining with other modules

3. **Use Extensive Debug Output During Implementation**
   - Add diagnostic output (logging functions) liberally when implementing complex logic
   - Include debug output in test functions to trace execution flow and state changes
   - Use descriptive prefixes: `DIAGNOSTIC:`, `DEBUG:`, `TRACE:`
   - Show key variables, function parameters, return values, and state transitions
   - Debug output helps AI agents understand what's happening when code doesn't work as expected
   - **Example**: When implementing configuration merging, output `exclude_patterns` state before/after each merge operation
   - **CRITICAL - Debug Code Retention**: 
     - Debug statements that identify architecture or implementation decisions MUST be kept in code
     - Debug statements documenting format string selection, placeholder replacement steps, data transformations, or other key decision points serve as inline documentation
     - These debug statements provide ongoing value for understanding code behavior and debugging issues
     - Debug output should remain in code unless explicitly requested to be removed - it is not intrusive and is optional during production use
     - Debug output controlled by `debug` flags or build tags can be conditionally enabled/disabled without removal
   - **Examples of debug statements to keep**:
     - Format string selection logic (e.g., "using FormatListArchive", "using TemplateListArchive", "using default format")
     - Placeholder replacement steps (e.g., "Replacing #{path} with value", "after ReplacePlaceholders: result")
     - Data map contents showing available placeholders
     - Architecture decision points (e.g., "falling back to emergency replacement", "gathering file statistics")

4. **Apply Separation of Concerns**
   - When logic is difficult to implement or test within a large application context, extract it into a pure function or isolated module
   - Give extracted components a single, clear responsibility
   - Remove dependencies on application-specific context to enable independent testing
   - **Example**: Extract placeholder replacement logic into a pure function that takes format string and data map, returns formatted string - no side effects, no application dependencies
   - **Benefits**: Improved testability, reusability, maintainability, and clarity

5. **Update Documentation** (MANDATORY - Update AS YOU WORK)
   - **BEFORE making changes**: Consult the Change Impact Tracking matrix (see Cross-Reference Format section) to identify all documents that need updating
   - **DURING implementation**: Update `architecture-decisions.yaml` if decisions are refined
   - **DURING implementation**: Update `implementation-decisions.yaml` if decisions are refined
   - **DURING implementation**: Document module validation results
   - **DURING implementation**: Maintain bi-directional links when updating documentation
   - **AFTER completion**: Mark requirements as ✅ Implemented
   - **AFTER completion**: Update code with semantic token comments
   - **AFTER completion**: Update tests with semantic token references
   - **AFTER completion**: Verify all documentation is current and accurate
   - **AFTER completion**: Use Feature Documentation Format for comprehensive feature documentation

6. **Enforce Token Coverage** `[PROC-TOKEN_AUDIT]` / `[PROC-TOKEN_VALIDATION]`
   - Run `./scripts/validate_tokens.sh` (or project equivalent) before requesting review; treat failures as blockers.
   - Confirm every touched code file includes the relevant `[IMPL-*] [ARCH-*] [REQ-*]` comment and that every test references its `[REQ-*]` token in the name and body.
   - Log the audit result in `implementation-decisions` so future agents see when token coverage was proved.

---

## 📝 Work Planning (Optional)

**Note**: The TIED methodology does not require a dedicated task tracking file. Agents may maintain planning state in-session (e.g., using conversation-based todo lists) or document work breakdown in `implementation-decisions`. 

Projects may optionally maintain a `tasks.md` file or use external task tracking tools for shared visibility, but this is not mandatory. The core value of TIED is in the **traceability chain** (requirements → architecture → implementation → tests → code) maintained through semantic tokens and decision documentation, not in task tracking artifacts.

### Priority Levels (Reference)

Use these priority levels when planning work:

- **P0 (Critical)**: Core functionality, tests that validate requirements, basic working features, blocks other work
- **P1 (Important)**: Enhanced functionality, better error handling, performance improvements, developer experience
- **P2 (Nice-to-Have)**: UI/UX improvements, documentation enhancements, convenience features, non-critical optimizations
- **P3 (Future)**: Deferred features, experimental ideas, future enhancements, infrastructure improvements

**Priority order**: Tests > Code > Basic Functions > Developer Experience > Infrastructure > Security

---

## 📖 How to Present This to AI Agents

### Method 1: Include in System Prompt

When starting a new AI agent session, include:

```
MANDATORY: At the start of EVERY response, you MUST preface with:
"Observing AI principles!"

Then proceed to:
1. Read and follow the AI-First Principles document (ai-principles.md) 
2. Use semantic tokens [REQ-*], [ARCH-*], [IMPL-*] throughout
3. Expand requirements into pseudo-code before coding
4. Plan implementation steps with clear priorities
5. Cross-reference everything using semantic tokens
6. Prioritize: Tests > Code > Basic Functions > Infrastructure
```

### Method 2: Include in .cursorrules (Already Configured)

The `.cursorrules` file in the project root is automatically loaded by Cursor IDE and contains these instructions. The acknowledgment requirement is already embedded.

### Method 3: Reference in User Query

Start requests with:

```
Following ai-principles.md, please:
[your request here]
```

The AI agent should acknowledge with "Observing AI principles!" and then proceed.

### Method 4: .cursorrules File (Already Configured)

The `.cursorrules` file in the project root is automatically loaded by Cursor IDE. It includes:
- Mandatory acknowledgment requirement
- Complete rules and principles
- Workflow examples

**Already configured in this project!**

### Method 5: Include in README.md

Add section to README.md:

```markdown
## For AI Agents

This project follows AI-First Principles. Before making changes:

1. Read `ai-principles.md`
2. Use semantic tokens for cross-referencing
3. Expand requirements into pseudo-code before implementation
4. Create tasks with priorities
5. Follow priority order: Tests > Code > Functions > Infrastructure
```

---

## ✅ Checklist for AI Agents

**AT THE START OF EVERY RESPONSE:**

- [ ] **MANDATORY**: Preface response with "Observing AI principles!"
- [ ] Read `ai-principles.md` (if not already read in this session)
- [ ] Check `semantic-tokens.yaml` for existing tokens
- [ ] Understand semantic token system
- [ ] Know the development process
- [ ] Understand priority levels

**BEFORE STARTING ANY WORK:**

- [ ] Verify all prerequisites above
- [ ] Have access to semantic token registry
- [ ] Understand current priorities
- [ ] **MANDATORY**: Review `architecture-decisions.yaml` for existing architecture decisions
- [ ] **MANDATORY**: Review `implementation-decisions.yaml` for existing implementation decisions
- [ ] **MANDATORY**: Plan work (via implementation decisions or in-session) BEFORE writing any code

**DURING WORK:**

- [ ] Use semantic tokens in all code comments
- [ ] Use semantic tokens in test names/comments
- [ ] Cross-reference requirements → architecture → implementation
- [ ] **MANDATORY**: Identify logical modules and document module boundaries before development [REQ-MODULE_VALIDATION]
- [ ] **MANDATORY**: Develop each logical module independently [REQ-MODULE_VALIDATION]
- [ ] **MANDATORY**: Validate each module independently (unit tests with mocks, contract tests, edge cases, error handling) BEFORE integration [REQ-MODULE_VALIDATION]
- [ ] **MANDATORY**: Only integrate modules after validation passes [REQ-MODULE_VALIDATION]
- [ ] **MANDATORY**: Document module validation results [REQ-MODULE_VALIDATION]
- [ ] **MANDATORY**: Record architecture decisions in `architecture-decisions.yaml` IMMEDIATELY when made (with `[ARCH-*]` tokens and `[REQ-*]` cross-references)
- [ ] **MANDATORY**: Record implementation decisions in `implementation-decisions.yaml` IMMEDIATELY when made (with `[IMPL-*]` tokens and `[ARCH-*]` and `[REQ-*]` cross-references)
- [ ] Add extensive debug output during implementation to trace execution flow and state changes
- [ ] Use descriptive debug prefixes (`DIAGNOSTIC:`, `DEBUG:`, `TRACE:`) to identify debug output
- [ ] **CRITICAL**: Keep debug statements that identify architecture or implementation decisions - they document key decision points
- [ ] Keep debug output in code unless explicitly requested to be removed - it is not intrusive and provides ongoing value
- [ ] **MANDATORY**: Update `semantic-tokens.yaml` when creating new tokens
- [ ] **MANDATORY**: Update documentation AS YOU WORK - do not defer until the end
- [ ] **MANDATORY**: Perform the `[PROC-TOKEN_AUDIT]` checklist to confirm every code/test change carries the correct tokens
- [ ] **MANDATORY**: Run `./scripts/validate_tokens.sh` (or repo-specific equivalent) whenever tokens are added or moved

**AFTER COMPLETING WORK:**

- [ ] **MANDATORY**: All semantic tokens documented in `semantic-tokens.yaml`
- [ ] **MANDATORY**: Record the latest `[PROC-TOKEN_AUDIT]` and `[PROC-TOKEN_VALIDATION]` results in `implementation-decisions`
- [ ] **MANDATORY**: Documentation updated with implementation status:
  - `architecture-decisions.yaml` reflects all architectural decisions made
  - `implementation-decisions.yaml` reflects all implementation decisions made
  - Both cross-reference `[REQ-*]` tokens correctly
- [ ] **MANDATORY**: Tests reference semantic tokens
- [ ] **MANDATORY**: All documentation is current and accurate (no stale information)
- [ ] **MANDATORY**: Verify documentation completeness before marking work complete
- [ ] **MANDATORY**: Post-change validation checklist completed (see Change Impact Tracking section)
- [ ] **MANDATORY**: Behavioral contracts documented for critical features
- [ ] **MANDATORY**: Dependencies mapped and documented
- [ ] **MANDATORY**: Verify all code and tests are consistently linked to requirements and decisions; update code and documentation where necessary
- [ ] **MANDATORY**: Do not create a stand-alone summary document for the session (e.g. no SESSION_SUMMARY.md or similar)

---

## 📚 Related Documents

- `tied/requirements.md` - Requirements guide document (copy from `requirements.template.md` in TIED repository)
  - `tied/requirements.yaml` - Requirements YAML index/database with all `[REQ-*]` records (copy from `requirements.template.yaml`)
  - `tied/requirements/` - Individual requirement detail files (YAML, e.g., `REQ-TIED_SETUP.yaml`, `REQ-MODULE_VALIDATION.yaml`); schema: `detail-files-schema.md`
- `tied/architecture-decisions.md` - Architecture decisions guide document (copy from `architecture-decisions.template.md`)
  - `tied/architecture-decisions.yaml` - Architecture decisions YAML index/database with all `[ARCH-*]` records dependent on requirements (copy from `architecture-decisions.template.yaml`)
  - All `[ARCH-*]` tokens must be documented in the YAML index
  - Must cross-reference `[REQ-*]` tokens from requirements
  - `tied/architecture-decisions/` - Individual architecture decision detail files (YAML, e.g., `ARCH-TIED_STRUCTURE.yaml`)
- `tied/implementation-decisions.md` - Implementation decisions guide document (copy from `implementation-decisions.template.md`)
  - `tied/implementation-decisions.yaml` - Implementation decisions YAML index/database with all `[IMPL-*]` records dependent on architecture and requirements (copy from `implementation-decisions.template.yaml`)
  - All `[IMPL-*]` tokens must be documented in the YAML index
  - Must cross-reference both `[ARCH-*]` and `[REQ-*]` tokens
  - `tied/implementation-decisions/` - Individual implementation decision detail files (YAML, e.g., `IMPL-MODULE_VALIDATION.yaml`)
- `tied/semantic-tokens.yaml` - YAML index/database of all semantic tokens (canonical token registry)
- `tied/semantic-tokens.md` - Semantic tokens guide with format, naming conventions, and usage examples (copy from `semantic-tokens.template.md`)
- `detail-files-schema.md` - Schema for REQ/ARCH/IMPL detail YAML files (in TIED repo or tied/); see also `tied/requirements/*.yaml`, `tied/architecture-decisions/*.yaml`, `tied/implementation-decisions/*.yaml`
- `tied/processes.md` - Active process tracking document (copy from `processes.template.md`)
- `README.md` - Project overview and getting started guide

---

## 🔄 Maintenance

This document should be:
- Reviewed when adding new requirements
- Updated when adding new semantic token types
- Referenced at the start of every AI agent session
- Used as a checklist for all development work

## ⚠️ CRITICAL REMINDERS

### Documentation is MANDATORY, Not Optional

1. **Architecture Decisions**: Record IMMEDIATELY in `architecture-decisions.yaml` when made
2. **Implementation Decisions**: Record IMMEDIATELY in `implementation-decisions.yaml` when made
3. **Semantic Tokens**: Update `semantic-tokens.yaml` when creating new tokens
4. **DO NOT DEFER**: Documentation updates are part of the work, not something to do "later"

### Documentation Update Timing

- **Planning Phase**: Document architecture and implementation decisions
- **Implementation Phase**: Update documentation as decisions are refined
- **Completion Phase**: Verify all documentation is current and complete

**Last Updated**: 2026-02-09
**TIED Methodology Version**: 2.2.0

