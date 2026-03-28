# AI Agent Operating Guide

**Scope**: Entire repository (root unless overridden by nested `AGENTS.md` files)

**TIED Methodology Version**: 2.2.0

This document centralizes every instruction AI coding assistants must follow while working in TIED repositories. It supersedes reminders in `.ai-agent-instructions`, `.cursorrules`, and README snippets. Treat it as the canonical reference when configuring prompts, IDE rules, or agent workflows. For methodology background (what TIED is, costs and benefits, LEAP rationale), see the human-facing docs in the TIED repo (e.g. TIED.md, tied/docs/LEAP.md).

---

## 1. Mandatory Acknowledgment & Session Bootstrap

1. Preface **every** assistant response with:
   > `Observing AI principles!`
2. At session start (or when instructions may have changed), immediately:
   - Read `ai-principles.md` completely
   - Review `semantic-tokens.yaml` (token registry YAML index) and `semantic-tokens.md` (token guide)
   - Review `architecture-decisions.yaml` and `implementation-decisions.yaml` (YAML indexes)
   - Review `implementation-decisions.md` (implementation guide) for IMPL pseudo-code and block token rules ([PROC-IMPL_PSEUDOCODE_TOKENS])
   - Understand priority order: Tests > Code > Basic Functions > Infrastructure
   - Note: same filename everywhere—at repo root these files are templates; in `tied/` they are the project indexes.
3. Confirm access to the documents above before continuing.

---

## 2. Core TIED Obligations

- **Semantic Token Discipline**
  - Use `[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`, and other TIED tokens everywhere (requirements, docs, code, tests).
  - Maintain traceability: Requirements → Architecture → Implementation → Tests → Code.
  - Update `semantic-tokens.yaml` immediately when introducing new tokens.
- **IMPL pseudo-code token comments (most critical)** `[PROC-IMPL_PSEUDOCODE_TOKENS]`
  - IMPL `essence_pseudocode` is the **most critical artifact** for implementation traceability. Without token comments in pseudo-code, traceability from REQ→ARCH→IMPL breaks at the pseudo-code layer and tests/code cannot be reliably aligned to requirements.
  - **Every block** in `essence_pseudocode` must have a comment that (1) names all REQ, ARCH, and IMPL reflected in that block and (2) states how that block implements those requirements. Top-level: one comment naming IMPL, ARCH, and REQ plus a one-line summary; sub-blocks with the same set → comment only the "how"; sub-blocks with a different set → comment listing that set and how the sub-block implements it.
- **Documentation-First Flow**
  - Expand requirements into pseudo-code and decisions before any code changes.
  - Address all implementation issues (logical and flow) in IMPL pseudo-code before tests or code; IMPL `essence_pseudocode` is the **source of consistent logic** for implementation.
  - Record architecture decisions (`architecture-decisions.md`) with `[ARCH-*]` tokens cross-referencing requirements.
  - Record implementation decisions (`implementation-decisions.md`) with `[IMPL-*]` tokens cross-referencing `[ARCH-*]` and `[REQ-*]` tokens.
  - Never defer documentation; update as you think, design, and implement.
- **LEAP: Logic Elevation And Propagation** (see `tied/processes.md` § LEAP / [PROC-LEAP])
  - When code or tests written during TDD/E2E differ from IMPL, update the stack in **reverse order**: **IMPL → ARCH → REQ** in the same work item so tokens stay consistent and testable.
  - Work may start at any layer (REQ, ARCH, IMPL, or code/tests); for work to be **complete**, apply changes **up and down** the stack as needed. Code is valid only when **all tests pass** and **all requirements are met**.
- **Implementation order** (see `tied/processes.md` § PROC-TIED_DEV_CYCLE): (1) **Unit tests first** — tests conform to IMPL pseudo-code, written before production code (strict TDD). (2) **Unit code via TDD** — code is written to satisfy the tests; entire IMPL pseudo-code is implemented via TDD. (3) **Composition tests first** — for every binding between units (event listeners, IPC, entry-point wiring), write failing component/integration/contract tests before composition code; each test verifies the connection without invoking the UI. (4) **Composition code via TDD** — binding/wiring/entry-point code written to satisfy composition tests; no composition code without a failing test. (5) **E2E** — only for behavior that requires UI invocation; each E2E test must justify why it cannot be tested at composition level. (6) **Closing the loop** — update TIED data; run `tied_validate_consistency` (or equivalent).
- **Primary implementation checklist** — For the unified, step-by-step procedure that sequences CITDP analysis, LEAP, TDD, composition, E2E, and validation into a single executable checklist, follow `tied/docs/agent-req-implementation-checklist.md` (`[PROC-AGENT_REQ_CHECKLIST]`). Use it as the primary resource for every new REQ or change to the tested system. A trackable YAML with completion and loop-back fields is at `tied/docs/agent-req-implementation-checklist.yaml` (copy to a unique per-request file in a working folder per the YAML header).
- **Module Validation Mandate `[REQ-MODULE_VALIDATION]`**
  - Identify logical modules and their boundaries before implementation.
  - Develop and validate each module independently (unit tests with mocks, contract tests, edge cases, error handling) before integration.
  - Only integrate modules after validation passes. Document validation results.
- **Priority Order**
  - Always prioritize: Tests, Code, Basic Functions ➜ Developer experience ➜ Infrastructure ➜ Security.
- **TIED data access (MCP-first)**
  - Use the **TIED MCP server** (tools and resources) as the **primary** way to read and write TIED data. In Cursor, that server may appear under a project-specific label (e.g. `project-0-stdd-tied-yaml`); treat it as the **TIED YAML MCP** regardless of display name. TIED is the db that controls/directs the build; significant code is created in TIED first, then implemented with TDD. Writing TIED YAML via MCP ensures valid output (e.g. values containing `:` are quoted); direct file edits often produce invalid YAML. **Direct file access** to TIED content (under `tied/` or `TIED_BASE_PATH`) is permitted **only when** no MCP tool supports the operation; document such cases so they can be considered for new MCP tooling.
  - **When using MCP:** Prefer tools for index read/list/filter, detail read/write, traceability (`get_decisions_for_requirement`, `get_requirements_for_decision`), validation (`yaml_index_validate`, `tied_validate_consistency`), and token creation (`tied_token_create_with_detail`). Prefer resources (e.g. `tied://requirements`, `tied://requirement/{token}/detail`) for loading context. Before changing TIED content, read via MCP; after changing, use the appropriate write/update tool. Validate all changed TIED YAML with `lint_yaml` per [PROC-YAML_EDIT_LOOP] (see `processes.md` § `[PROC-YAML_EDIT_LOOP]`); do not use raw multi-argument `yq` for pretty-print. YAML that does not validate is invalid for use. Run **`tied_validate_consistency`** before marking work complete.
- **Client inheritance of LEAP R+A+I**
  - **All TIED projects inherit the LEAP R+A+I** via `copy_files.sh`: the client's `tied/` contains the methodology-enforcing REQ/ARCH/IMPL and PROC tokens (e.g. REQ-TIED_SETUP, REQ-MODULE_VALIDATION, ARCH-TIED_STRUCTURE, ARCH-MODULE_VALIDATION, IMPL-TIED_FILES, IMPL-MODULE_VALIDATION, [PROC-LEAP], and related process tokens) and their detail files so that TIED and LEAP behaviors exist in every project. These tokens are **mandatory for TIED success** and must not be removed.
  - **TIED-sourced YAML is read-only in the client** ([PROC-TIED_METHODOLOGY_READONLY]): methodology content lives under `tied/methodology/` (index YAMLs and inherited detail files from TIED `templates/`). It is used but **not modified** in the client; it does not hold client-specific data. Re-run `copy_files.sh` to refresh methodology; it overwrites only `tied/methodology/`.
  - **Client-specific data** lives only in **project** YAML: `tied/requirements.yaml`, `tied/architecture-decisions.yaml`, `tied/implementation-decisions.yaml`, `tied/semantic-tokens.yaml`, and the corresponding `tied/requirements/`, `tied/architecture-decisions/`, `tied/implementation-decisions/` detail dirs at the root of `tied/`. MCP and agents must **only write to project YAML**; validate/read may use a merged view (methodology + project). Project files are never overwritten by `copy_files.sh`.
  - For structure and sample records, agents refer to **`templates/`** in the TIED repository—the same content that `copy_files.sh` copies into the client's `tied/methodology/`. The client's full TIED view is methodology (read-only) plus project-specific entries in project YAML.

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
- [ ] **IMPL `essence_pseudocode`**: Every block has a comment naming REQ/ARCH/IMPL and how the block implements them ([PROC-IMPL_PSEUDOCODE_TOKENS])

### 3.3 During Work
- [ ] **Do not edit methodology YAML** in the client (`tied/methodology/`); add and edit REQ/ARCH/IMPL only in **project** YAML under `tied/` ([PROC-TIED_METHODOLOGY_READONLY]).
- [ ] Use semantic tokens in code comments and test names
- [ ] **IMPL `essence_pseudocode`**: Every block has a comment naming REQ/ARCH/IMPL and how the block implements them; add/update when authoring or editing IMPL pseudo-code
- [ ] When authoring or editing IMPL pseudo-code, run pseudo-code validation per `[PROC-PSEUDOCODE_VALIDATION]` (see `tied/docs/pseudocode-writing-and-validation.md`); required checks are gating before tests/code
- [ ] Keep documentation synced as decisions change
- [ ] Maintain module boundaries and validate independently before integration
- [ ] **Run language-specific lint after each code-generation iteration**: **Rust** → `bun run lint:rust` [PROC-RUST_LINT]; **TypeScript** → `bunx tsc -b` or `bun run lint:ts` [PROC-TS_CHECK]; **Swift** → `swift build && swift test` [PROC-SWIFT_BUILD]; **YAML** → run `lint_yaml` on changed YAML files [PROC-YAML_EDIT_LOOP] (when TIED YAML is created or updated); see `processes.md` for safe multi-file use. Fix before proceeding. Code and YAML that do not pass lint are incomplete ([PROC-TIED_DEV_CYCLE] inner loop).
- [ ] Keep descriptive debug output (e.g., `DEBUG:`, `TRACE:`, `DIAGNOSTIC:`) to document decision points and execution flow; retain unless explicitly asked to remove
- [ ] Record new `[ARCH-*]` and `[IMPL-*]` entries immediately with cross-references
- [ ] **Validate all changed TIED YAML** with `lint_yaml` per [PROC-YAML_EDIT_LOOP]; YAML that does not validate is invalid for use
- [ ] **Verification-gated mode** ([PROC-TIED_VERIFICATION_GATED]): When the project uses verification-gated mode, do not edit requirement or IMPL `status` by hand; run the verify step (e.g. `tied_verify` with update) after tests so status is derived from test results only.

### 3.4 After Completing Work
- [ ] `semantic-tokens.yaml` reflects every token referenced in code/tests/docs
- [ ] Architecture and implementation decision logs are current and cross-referenced
- [ ] If code or tests diverged from IMPL: IMPL (and ARCH/REQ if scope changed) updated in reverse order so the stack is consistent
- [ ] Tests reference their corresponding semantic tokens
- [ ] Module validation status is documented
- [ ] All documentation matches the implemented state (no drift)
- [ ] Verify all code and tests are consistently linked to requirements and decisions; update code and documentation where necessary
- [ ] **Validate all changed TIED YAML** with `lint_yaml` per [PROC-YAML_EDIT_LOOP]; YAML that does not validate is invalid for use
- [ ] Run **`tied_validate_consistency`** (TIED MCP tool) and fix any reported issues so REQ→ARCH→IMPL indexes, detail files, and token references remain consistent; align with `[PROC-TOKEN_VALIDATION]` and any project `validate_tokens.sh`.
- [ ] **Verification-gated mode**: When the project uses verification-gated mode ([PROC-TIED_VERIFICATION_GATED]), run the project's **verify step** after tests (e.g. MCP `tied_verify` with update) so requirement and optionally IMPL status are derived from test results; then run `tied_validate_consistency`.
- [ ] Do not create a stand-alone summary document for the session (e.g. no SESSION_SUMMARY.md or similar)

---

## 4. Debug & Logging Expectations

- Provide rich debug output during implementation to trace execution flow, state transitions, and decision points.
- Prefix diagnostic logs with clear labels (`DEBUG:`, `TRACE:`, `DIAGNOSTIC:`) to aid future analysis.
- Preserve debug statements unless stakeholders explicitly request removal; they serve as inline documentation of architecture/implementation rationale.

---

## 5. Key Files & Responsibilities

Same filename at repo root (template) and in `tied/` (project index); location distinguishes use. **Methodology** (TIED-sourced) index YAMLs and inherited detail files are copied into **`tied/methodology/`** and are **read-only** in the client ([PROC-TIED_METHODOLOGY_READONLY]). **Project** index and detail files live at **`tied/`** root (e.g. `tied/requirements.yaml`, `tied/requirements/`) and hold only client-added tokens; agents and MCP write only there. Agents refer to `templates/` in the TIED repo for the canonical structure and sample records.

| File | Purpose |
| --- | --- |
| `ai-principles.md` | Master principles and process guide (read fully every session) |
| `semantic-tokens.yaml` | YAML index/database of all semantic tokens (canonical registry) |
| `semantic-tokens.md` | Semantic tokens guide with format, naming conventions, and usage examples |
| `requirements.md` | Requirements guide with documentation (copy from root into project's tied/) |
| `requirements.yaml` | Requirements YAML index/database with all requirement records |
| `requirements/` | Individual requirement detail files (YAML, e.g., `REQ-TIED_SETUP.yaml`); schema: `detail-files-schema.md` |
| `architecture-decisions.md` | Architecture decisions guide with documentation (copy from template per project) |
| `architecture-decisions.yaml` | Architecture decisions YAML index/database with `[ARCH-*]` records tied to requirements |
| `architecture-decisions/` | Individual architecture decision detail files (YAML, e.g., `ARCH-TIED_STRUCTURE.yaml`) |
| `implementation-decisions.md` | Implementation decisions guide with documentation (copy from template per project) |
| `implementation-decisions.yaml` | Implementation decisions YAML index/database with `[IMPL-*]` records tied to requirements + architecture |
| `implementation-decisions/` | Individual implementation decision detail files (YAML, e.g., `IMPL-MODULE_VALIDATION.yaml`) |
| `detail-files-schema.md` | Schema for REQ/ARCH/IMPL detail YAML files (in TIED repo or tied/) |
| `processes.md` | Process tracking including `[PROC-YAML_DB_OPERATIONS]`, LEAP, PROC-TIED_DEV_CYCLE; use TIED MCP as primary interface to TIED data (see §2 TIED data access). |
| `tied/docs/agent-req-implementation-checklist.md` | Primary step-by-step checklist for implementing any new REQ or change; unifies CITDP, TIED dev cycle, IMPL_CODE_TEST_SYNC, LEAP, and validation into one executable procedure (`[PROC-AGENT_REQ_CHECKLIST]`). Trackable YAML: `tied/docs/agent-req-implementation-checklist.yaml` (copy to unique per-request file per its header). |
| `tied/docs/pseudocode-writing-and-validation.md` | How to write and validate IMPL pseudo-code; when to run validation; minimum gating rules (`[PROC-PSEUDOCODE_VALIDATION]`). Checklist: `tied/docs/pseudocode-validation-checklist.yaml`. |
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

**Last Updated**: 2026-03-05
