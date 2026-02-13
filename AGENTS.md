# AI Agent Operating Guide

**Scope**: Entire repository (root unless overridden by nested `AGENTS.md` files)

**TIED Methodology Version**: 2.1.0

This document centralizes every instruction AI coding assistants must follow while working in TIED repositories. It supersedes reminders in `.ai-agent-instructions`, `.cursorrules`, and README snippets. Treat it as the canonical reference when configuring prompts, IDE rules, or agent workflows.

---

## 1. Mandatory Acknowledgment & Session Bootstrap

1. Preface **every** assistant response with:
   > `Observing AI principles!`
2. At session start (or when instructions may have changed), immediately:
   - Read `ai-principles.md` completely
   - Review `semantic-tokens.yaml` (token registry YAML index) and `semantic-tokens.md` (token guide)
   - Review `architecture-decisions.yaml` and `implementation-decisions.yaml` (YAML indexes)
   - Understand priority order: Tests > Code > Basic Functions > Infrastructure
3. Confirm access to the documents above before continuing.

---

## 2. Core TIED Obligations

- **Semantic Token Discipline**
  - Use `[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`, and other TIED tokens everywhere (requirements, docs, code, tests).
  - Maintain traceability: Requirements → Architecture → Implementation → Tests → Code.
  - Update `semantic-tokens.yaml` immediately when introducing new tokens.
- **Documentation-First Flow**
  - Expand requirements into pseudo-code and decisions before any code changes.
  - Record architecture decisions (`architecture-decisions.md`) with `[ARCH-*]` tokens cross-referencing requirements.
  - Record implementation decisions (`implementation-decisions.md`) with `[IMPL-*]` tokens cross-referencing `[ARCH-*]` and `[REQ-*]` tokens.
  - Never defer documentation; update as you think, design, and implement.
- **Module Validation Mandate `[REQ-MODULE_VALIDATION]`**
  - Identify logical modules and their boundaries before implementation.
  - Develop and validate each module independently (unit tests with mocks, contract tests, edge cases, error handling) before integration.
  - Only integrate modules after validation passes. Document validation results.
- **Priority Order**
  - Always prioritize: Tests, Code, Basic Functions ➜ Developer experience ➜ Infrastructure ➜ Security.

---

## 3. Operational Checklists

### 3.1 Start-of-Response Checklist (repeat every turn)
- `"Observing AI principles!"` acknowledgment
- Confirm `ai-principles.md` has been read this session
- Reference current semantic tokens, architecture, and implementation decisions

### 3.2 Before Starting Work
- [ ] Verify all documents in Section 1 have been reviewed
- [ ] Understand current priorities and dependencies
- [ ] Review existing semantic tokens, architecture decisions, and implementation decisions related to the work

### 3.3 During Work
- [ ] Use semantic tokens in code comments and test names
- [ ] Keep documentation synced as decisions change
- [ ] Maintain module boundaries and validate independently before integration
- [ ] Keep descriptive debug output (e.g., `DEBUG:`, `TRACE:`, `DIAGNOSTIC:`) to document decision points and execution flow; retain unless explicitly asked to remove
- [ ] Record new `[ARCH-*]` and `[IMPL-*]` entries immediately with cross-references

### 3.4 After Completing Work
- [ ] `semantic-tokens.yaml` reflects every token referenced in code/tests/docs
- [ ] Architecture and implementation decision logs are current and cross-referenced
- [ ] Tests reference their corresponding semantic tokens
- [ ] Module validation status is documented
- [ ] All documentation matches the implemented state (no drift)
- [ ] Verify all code and tests are consistently linked to requirements and decisions; update code and documentation where necessary
- [ ] Do not create a stand-alone summary document for the session (e.g. no SESSION_SUMMARY.md or similar)

---

## 4. Debug & Logging Expectations

- Provide rich debug output during implementation to trace execution flow, state transitions, and decision points.
- Prefix diagnostic logs with clear labels (`DEBUG:`, `TRACE:`, `DIAGNOSTIC:`) to aid future analysis.
- Preserve debug statements unless stakeholders explicitly request removal; they serve as inline documentation of architecture/implementation rationale.

---

## 5. Key Files & Responsibilities

| File | Purpose |
| --- | --- |
| `ai-principles.md` | Master principles and process guide (read fully every session) |
| `semantic-tokens.yaml` | YAML index/database of all semantic tokens (canonical registry) |
| `semantic-tokens.md` | Semantic tokens guide with format, naming conventions, and usage examples |
| `requirements.md` | Requirements guide with documentation (copy from template per project) |
| `requirements.yaml` | Requirements YAML index/database with all requirement records |
| `requirements/` | Individual requirement detail files (e.g., `REQ-TIED_SETUP.md`) |
| `architecture-decisions.md` | Architecture decisions guide with documentation (copy from template per project) |
| `architecture-decisions.yaml` | Architecture decisions YAML index/database with `[ARCH-*]` records tied to requirements |
| `architecture-decisions/` | Individual architecture decision detail files |
| `implementation-decisions.md` | Implementation decisions guide with documentation (copy from template per project) |
| `implementation-decisions.yaml` | Implementation decisions YAML index/database with `[IMPL-*]` records tied to requirements + architecture |
| `implementation-decisions/` | Individual implementation decision detail files |
| `processes.md` | Process tracking including `[PROC-YAML_DB_OPERATIONS]` for YAML operations |
| `.cursorrules` | IDE loader that points back to this document |
| `.ai-agent-instructions` | Quick reminder pointing to this document |

---

## 6. Presenting These Instructions to Agents

You can apply these rules in several ways:

1. **System Prompt Snippet**
   ```
   MANDATORY: Preface every response with "Observing AI principles!"
   Then follow the AGENTS.md checklists (read ai-principles.md, review semantic tokens, architecture, implementation decisions, maintain semantic traceability, module validation, documentation, and priority order).
   ```
2. **IDE Integration (`.cursorrules`)** – keep a lightweight loader that links directly to `AGENTS.md` so Cursor automatically enforces the rules.
3. **README / Onboarding** – reference `AGENTS.md` in project READMEs or onboarding docs to remind contributors where the canonical rules live.

---

## 7. Maintenance

- Update `AGENTS.md` whenever AI-facing processes change.
- Mirror changes into `ai-principles.md` and related docs as needed.
- Nested directories may introduce their own `AGENTS.md` to extend or override these rules within their subtree; the most specific file wins.

**Last Updated**: 2025-12-18
