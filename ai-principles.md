# AI Agent Principles & Operations

**Purpose**: This document defines the operational mandates, checklists, and conventions that AI agents must follow when working on this project. It should be referenced at the start of every AI agent interaction. For methodology background (what TIED is, why tokens matter, bugs vs requirements), see the human-facing docs in the TIED repo (e.g. TIED.md).

## MANDATORY ACKNOWLEDGMENT

**AI AGENTS MUST** acknowledge adherence to these principles at the start of EVERY response by prefacing with:

**"Observing AI principles!"**

This acknowledgment confirms that the AI agent has:
- Read and understood this document
- Will follow all documented processes
- Will use semantic tokens consistently
- Will prioritize tasks correctly

---

## Table of Contents

1. [Core Principles](#-core-principles)
2. [Change Impact Tracking](#change-impact-tracking)
3. [Development Process](#-development-process)
4. [Work Planning](#-work-planning-optional)
5. [Checklist for AI Agents](#-checklist-for-ai-agents)
6. [Related Documents](#-related-documents)
7. [Critical Reminders](#-critical-reminders)

---

## Core Principles

1. **Semantic Token Cross-Referencing**
   - All code, tests, requirements, architecture decisions, and implementation decisions MUST be cross-referenced using semantic tokens (e.g., `[REQ-FEATURE]`, `[IMPL-IMPLEMENTATION]`).
   - Semantic tokens provide traceability from requirements → architecture → implementation → tests.

2. **IMPL Pseudo-Code Token Comments (Most Critical)** `[PROC-IMPL_PSEUDOCODE_TOKENS]`
   - IMPL `essence_pseudocode` is the **most critical artifact** for implementation traceability. Without token comments in pseudo-code, traceability from REQ→ARCH→IMPL breaks and tests/code cannot be reliably aligned to requirements.
   - **Every block** in `essence_pseudocode` MUST have a comment that (1) names all REQ, ARCH, and IMPL reflected in that block and (2) states how that block implements those requirements. Top-level: one comment naming IMPL, ARCH, and REQ plus a one-line summary; sub-blocks (same set → comment only the "how"; different set → comment listing that set and how the sub-block implements it).

3. **Documentation-First Development**
   - Requirements MUST be expanded into pseudo-code and architectural decisions before implementation.
   - Logical and flow issues MUST be resolved in IMPL pseudo-code before any tests or code; pseudo-code is the **source of consistent logic**.
   - No code changes until requirements are fully specified with semantic tokens.

4. **Test-Driven Documentation**
   - Tests MUST reference the requirements they validate using semantic tokens.
   - Test names should include semantic tokens (e.g., `test('duplicate prevention REQ_DUPLICATE_PREVENTION')`).

5. **Code/Test Token Parity** `[PROC-TOKEN_AUDIT]`
   - Code without `[REQ-*]/[ARCH-*]/[IMPL-*]` markers or tests without `[REQ-*]/[TEST-*]` references is considered unusable intent.
   - Before submitting changes, agents MUST perform a token audit to confirm every new/modified source file and test carries the correct tokens and backlinks to documentation.
   - Missing tokens block task completion until the audit succeeds.

6. **Automated Token Validation** `[PROC-TOKEN_VALIDATION]`
   - Run `./scripts/validate_tokens.sh` (or the project-specific equivalent) to ensure semantic tokens exist in the registry and maintain traceability.
   - When using the TIED MCP server, run **`tied_validate_consistency`** to validate index and detail YAML consistency (token existence, REQ→ARCH→IMPL traceability, detail file content, IMPL pseudo-code token refs). Fix any reported issues before marking work complete.
   - Validation failures MUST be documented and resolved before proceeding.

7. **Priority-Based Implementation**
   - **Most Important**: Tests, Code, Basic Functions
   - **Least Important**: Environment Orchestration, Enhanced Security, Automated Deployment

8. **Extensive Debug Output During Development**
   - Use extensive diagnostic output (logging functions, debug flags) liberally during initial implementation and debugging
   - Use descriptive prefixes (e.g., `DIAGNOSTIC:`, `DEBUG:`, `TRACE:`)
   - **CRITICAL**: Debug statements that identify architecture or implementation decisions MUST be kept in code
   - Debug output should remain in code unless explicitly requested to be removed

9. **Separation of Concerns**
   - Each component, function, or module should have a single, well-defined responsibility
   - When logic is difficult to implement or test within a large application context: extract it into a pure function or isolated module; make it testable in isolation
   - **Minimize E2E-only code**: Minimize code that is only verifiable via E2E or manual testing; such code requires justification that no programmatic trigger can exercise the boundary. Event bindings and IPC are composition-testable, not E2E-only; document in IMPL when E2E-only is justified.

10. **Independent Module Validation Before Integration** (MANDATORY - Required for [REQ-MODULE_VALIDATION])
   - Logical modules MUST be validated independently before integration
   - Each module must have clear boundaries, interfaces, and validation criteria defined before development
   - Module validation must include: unit tests with mocks, integration tests with test doubles, contract validation, edge case testing, error handling validation
   - Modules must pass all validation criteria before integration
   - **Thin entry points**: Entry points should be thin: orchestration and calls into validated modules only.

11. **Thin Entry Points and Testability Classification** (supports [REQ-MODULE_VALIDATION], [PROC-TEST_STRATEGY])
    - Logic belongs in testable modules; entry points orchestrate only. Entry-point wiring (binding one unit to another) is composition-tested, not exempt from testing; composition tests verify the connection without invoking the UI.
    - When code is only measurable from outside (E2E/manual), document the reason in the IMPL and keep that code minimal. When authoring or reviewing IMPLs, classify code paths as unit-testable, integration-testable, or E2E-only; require justification for E2E-only (named platform constraint).

12. **TIED-Sourced YAML Read-Only in Client** `[PROC-TIED_METHODOLOGY_READONLY]`
    - TIED-sourced YAML (methodology) in the client is **read-only** and does not hold client-specific data. It lives under `tied/methodology/` and is refreshed by re-running `copy_files.sh` from the TIED repo.
    - Project-specific tokens and details live **only** in **project** YAML: `tied/requirements.yaml`, `tied/architecture-decisions.yaml`, `tied/implementation-decisions.yaml`, `tied/semantic-tokens.yaml`, and the corresponding detail dirs at the root of `tied/`. Agents and MCP must only add or edit REQ/ARCH/IMPL in project YAML; do not modify `tied/methodology/`.

**Bugs vs requirements (operational rule):** Requirements describe desired behavior (WHAT and WHY). Bugs describe implementation failures. Do NOT document bugs as requirements; document bugs in architecture/implementation decisions with cross-reference to the requirement that should be satisfied. If a bug reveals missing behavior specification, add a requirement first, then fix.

---

## Change Impact Tracking

When making changes, use this matrix to identify what needs updating:

| Change Type | Documents to Update | Validation Required |
|-------------|-------------------|-------------------|
| New Feature | requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml, semantic-tokens.yaml | Full validation |
| Requirement Change | requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml, tests | Implementation validation |
| Architecture Change | architecture-decisions.yaml, implementation-decisions.yaml, tests | Test validation |
| Implementation Detail | implementation-decisions.yaml, tests | Test validation |
| Bug Fix | architecture-decisions.yaml or implementation-decisions.yaml, tests, requirements.yaml (if requirement was missing/wrong) | Regression validation |

### Pre-Change Validation Checklist

**BEFORE making any changes**, verify:

- [ ] Feature is not listed in immutable requirements (unless major version change planned)
- [ ] All documents that need updating are identified using Change Impact Matrix
- [ ] Cross-references will remain valid after changes
- [ ] Test coverage exists or will be created for changes
- [ ] Behavioral contracts and invariants are understood
- [ ] Dependencies and dependent features are identified

### Post-Change Validation Checklist

**AFTER making changes**, verify:

- [ ] All identified documents updated simultaneously
- [ ] Cross-references validated and working
- [ ] **All changed TIED YAML validated** with `lint_yaml` per [PROC-YAML_EDIT_LOOP]; YAML that does not validate is invalid for use
- [ ] Tests updated and passing
- [ ] Code comments include semantic tokens
- [ ] Behavioral contracts maintained
- [ ] No breaking changes to immutable requirements
- [ ] Documentation examples match implementation

---

## Development Process

### LEAP: Logic Elevation And Propagation `[PROC-LEAP]`

See `tied/processes.md` § LEAP for the canonical process definition.

- **Logic elevation and propagation (bottom-up):** When code or tests written during TDD or E2E differ from the IMPL pseudo-code, update in reverse order: **IMPL → ARCH → REQ** in the same work item. Keep tokens consistent; ensure the written record (REQ/ARCH/IMPL) remains the single source of intent and logic.
- **Work can start at any layer; changes must apply up and down the stack.** For work to be **complete**, changes must be applied both up and down the stack as needed. **Code is only valid** when **all tests pass** and **all requirements are met**.
- **TIED MCP:** Use the TIED MCP server as the primary way to read and write TIED data. Collect related R/A/I index and detail records; reason from the necessary IMPL pseudo-code only; updating code to match IMPL is a separate task. Direct file access only when no MCP tool supports the operation; document the gap.

### Phase 1: Requirements → Pseudo-Code

**MANDATORY**: Before any code changes, expand requirements into pseudo-code and decisions.

1. Identify requirement; note semantic token `[REQ-IDENTIFIER]`
2. **IMMEDIATELY** document architecture in `architecture-decisions.yaml` with `[ARCH-*]` tokens and `[REQ-*]` cross-references
3. **IMMEDIATELY** document implementation in `implementation-decisions.yaml` with `[IMPL-*]` tokens and `[ARCH-*]`/`[REQ-*]` cross-references
4. **IMMEDIATELY** identify logical modules; document boundaries, interfaces, validation criteria
5. Address all implementation issues in IMPL `essence_pseudocode` **before** writing tests or code
6. In every IMPL, ensure every **block** in `essence_pseudocode` has a comment naming REQ/ARCH/IMPL and how the block implements them ([PROC-IMPL_PSEUDOCODE_TOKENS])
7. Validate pseudo-code with the application pseudo-code validation checklist before writing tests or code; see `tied/docs/pseudocode-writing-and-validation.md` ([PROC-PSEUDOCODE_VALIDATION])
8. **IMMEDIATELY** update `semantic-tokens.yaml` with any new tokens

### Phase 2: Planning Implementation (MANDATORY - Plan BEFORE Implementation)

1. Break down work into steps; each step references semantic tokens; include module development and module validation steps
2. Identify implementation sequence (implementable units, module validation before integration)
3. Prioritize: P0 > P1 > P2 > P3; module validation is typically P0 or P1

**Note**: Agents may maintain planning state in-session or in `implementation-decisions`. Optional: use `tasks.md` for shared visibility.

### Phase 3: Implementation

**Mandatory order** (see `tied/processes.md` § PROC-TIED_DEV_CYCLE): (1) **Unit tests first** — tests conform to IMPL pseudo-code; written before production code (strict TDD). (2) **Unit code via TDD** — code satisfies tests; entire IMPL implemented via TDD. (3) **Composition tests first** — for every binding between units (event listeners, IPC, entry-point wiring), write failing component/integration/contract tests before composition code; each test verifies the connection without invoking the UI. (4) **Composition code via TDD** — binding/wiring/entry-point code written to satisfy composition tests; no composition code without a failing test. (5) **E2E** — only for behavior that requires UI invocation; each E2E test must justify why it cannot be tested at composition level. (6) **Closing the loop** — update TIED data; run `tied_validate_consistency`. **Within each TDD iteration:** run tests and run language-specific lint for each language in scope: **Rust** → `bun run lint:rust` [PROC-RUST_LINT]; **TypeScript** → `bunx tsc -b` or `bun run lint:ts` [PROC-TS_CHECK]; **Swift** → `swift build && swift test` [PROC-SWIFT_BUILD]; **YAML** → run `lint_yaml` on changed YAML files [PROC-YAML_EDIT_LOOP] (when TIED YAML is created or updated); see `processes.md` `[PROC-YAML_EDIT_LOOP]` for safe multi-file use. Fix before proceeding; code and YAML that do not pass lint are incomplete. Do not return work to the caller until all mandated checks pass. The code-generation inner loop (PROC-TIED_DEV_CYCLE) mandates RED as the entry point: every iteration starts with a failing test; production code is written only in GREEN to satisfy that test. Managed code created outside this loop is non-compliant.

1. Work on higher priority items first
2. **MANDATORY**: Develop and validate each logical module independently before integration [REQ-MODULE_VALIDATION]
3. Use extensive debug output; keep debug statements that document architecture or implementation decisions
4. Apply separation of concerns; extract logic into testable modules when needed
5. **MANDATORY**: Update documentation AS YOU WORK (architecture-decisions.yaml, implementation-decisions.yaml, module validation results, semantic-tokens.yaml)
6. **MANDATORY**: Enforce token coverage; run `[PROC-TOKEN_AUDIT]` / `[PROC-TOKEN_VALIDATION]`; run `tied_validate_consistency` when using MCP before marking work complete

**Unified procedural checklist**: For the step-by-step procedure that sequences Phases 1-3 with CITDP analysis, LEAP, three-way alignment, and validation into a single executable checklist, follow `tied/docs/agent-req-implementation-checklist.md` (`[PROC-AGENT_REQ_CHECKLIST]`).

---

## Work Planning (Optional)

**Note**: The TIED methodology does not require a dedicated task tracking file. Agents may maintain planning state in-session or document work breakdown in `implementation-decisions`.

### Priority Levels (Reference)

- **P0 (Critical)**: Core functionality, tests that validate requirements, basic working features, blocks other work
- **P1 (Important)**: Enhanced functionality, better error handling, performance improvements, developer experience
- **P2 (Nice-to-Have)**: UI/UX improvements, documentation enhancements, convenience features, non-critical optimizations
- **P3 (Future)**: Deferred features, experimental ideas, future enhancements, infrastructure improvements

**Priority order**: Tests > Code > Basic Functions > Developer Experience > Infrastructure > Security

---

## Checklist for AI Agents

**AT THE START OF EVERY RESPONSE:**

- [ ] **MANDATORY**: Preface response with "Observing AI principles!"
- [ ] Read `ai-principles.md` (if not already read in this session)
- [ ] Check `semantic-tokens.yaml` for existing tokens
- [ ] Know the development process and priority levels

**BEFORE STARTING ANY WORK:**

- [ ] Have access to semantic token registry; understand current priorities
- [ ] **MANDATORY**: Review `architecture-decisions.yaml` and `implementation-decisions.yaml` for existing decisions
- [ ] **MANDATORY**: Plan work (via implementation decisions or in-session) BEFORE writing any code
- [ ] **MANDATORY** ([PROC-IMPL_PSEUDOCODE_TOKENS]): When authoring IMPL, ensure every block in `essence_pseudocode` has a comment naming REQ/ARCH/IMPL and how the block implements them

**DURING WORK:**

- [ ] Use semantic tokens in all code comments and test names/comments
- [ ] **IMPL pseudo-code**: Every block in `essence_pseudocode` has a comment naming REQ/ARCH/IMPL and how it implements them; add or update when creating or editing IMPL detail
- [ ] Cross-reference requirements → architecture → implementation
- [ ] **MANDATORY**: Run language-specific lint after each code-generation iteration: **Rust** → `bun run lint:rust` [PROC-RUST_LINT]; **TypeScript** → `bunx tsc -b` or `bun run lint:ts` [PROC-TS_CHECK]; **Swift** → `swift build && swift test` [PROC-SWIFT_BUILD]; **YAML** → run `lint_yaml` on changed YAML files [PROC-YAML_EDIT_LOOP] (when TIED YAML is created or updated); see `processes.md` for safe multi-file use. Fix before proceeding. Code and YAML that do not pass lint are incomplete ([PROC-TIED_DEV_CYCLE] inner loop). Do not return work to the caller until mandated checks pass.
- [ ] **MANDATORY**: Identify logical modules and document module boundaries before development [REQ-MODULE_VALIDATION]
- [ ] **MANDATORY**: Develop and validate each module independently before integration [REQ-MODULE_VALIDATION]
- [ ] **MANDATORY**: Record architecture/implementation decisions in YAML IMMEDIATELY when made
- [ ] **MANDATORY**: Update `semantic-tokens.yaml` when creating new tokens
- [ ] **MANDATORY**: When editing TIED YAML, validate with `lint_yaml` per [PROC-YAML_EDIT_LOOP]; YAML that does not validate is invalid for use
- [ ] **MANDATORY**: Perform `[PROC-TOKEN_AUDIT]`; run `./scripts/validate_tokens.sh` and/or `tied_validate_consistency` (when using MCP)

**AFTER COMPLETING WORK:**

- [ ] **MANDATORY**: All semantic tokens in `semantic-tokens.yaml`; record `[PROC-TOKEN_AUDIT]` and `[PROC-TOKEN_VALIDATION]` results in implementation-decisions
- [ ] **MANDATORY**: **Validate all changed TIED YAML** with `lint_yaml` per [PROC-YAML_EDIT_LOOP]; YAML that does not validate is invalid for use
- [ ] **MANDATORY**: Documentation updated (architecture-decisions.yaml, implementation-decisions.yaml reflect decisions; both cross-reference [REQ-*] correctly)
- [ ] **MANDATORY**: Tests reference semantic tokens; all documentation current and accurate
- [ ] **MANDATORY**: Post-change validation checklist completed; behavioral contracts and dependencies documented where relevant
- [ ] **MANDATORY**: Do not create a stand-alone summary document for the session (e.g. no SESSION_SUMMARY.md)

---

## Related Documents

- `tied/requirements.md`, `tied/requirements.yaml`, `tied/requirements/`
- `tied/architecture-decisions.md`, `tied/architecture-decisions.yaml`, `tied/architecture-decisions/`
- `tied/implementation-decisions.md`, `tied/implementation-decisions.yaml`, `tied/implementation-decisions/`
- `tied/semantic-tokens.yaml`, `tied/semantic-tokens.md`
- `tied/processes.md` — LEAP, PROC-TIED_DEV_CYCLE, PROC-TOKEN_AUDIT, PROC-TOKEN_VALIDATION, PROC-COMMIT_MESSAGES
- `tied/detail-files-schema.md` — Schema for REQ/ARCH/IMPL detail YAML files
- `tied/docs/agent-req-implementation-checklist.md` — Primary step-by-step checklist for implementing REQs or changes (`[PROC-AGENT_REQ_CHECKLIST]`); unifies CITDP, TIED dev cycle, IMPL_CODE_TEST_SYNC, LEAP, and validation
- **Client inheritance**: All TIED projects inherit the LEAP R+A+I via `copy_files.sh` (from `templates/`); the client's `tied/` contains the methodology-enforcing tokens and their detail files. For structure and sample records, agents refer to **`templates/`** in the TIED repository (see AGENTS.md § Client inheritance of LEAP R+A+I).

---

## Critical Reminders

### Documentation is MANDATORY, Not Optional

1. **Architecture Decisions**: Record IMMEDIATELY in `architecture-decisions.yaml` when made
2. **Implementation Decisions**: Record IMMEDIATELY in `implementation-decisions.yaml` when made
3. **IMPL pseudo-code token comments** ([PROC-IMPL_PSEUDOCODE_TOKENS]): Every block in `essence_pseudocode` MUST have a comment that names REQ/ARCH/IMPL and states how the block implements them. This is the most critical aspect of implementation traceability.
4. **Semantic Tokens**: Update `semantic-tokens.yaml` when creating new tokens
5. **DO NOT DEFER**: Documentation updates are part of the work, not something to do "later"

### Documentation Update Timing

- **Planning Phase**: Document architecture and implementation decisions
- **Implementation Phase**: Update documentation as decisions are refined
- **Completion Phase**: Verify all documentation is current and complete

**Last Updated**: 2026-03-05
**TIED Methodology Version**: 2.2.0
