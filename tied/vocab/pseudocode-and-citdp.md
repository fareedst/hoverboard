# Pseudocode and CITDP (canonical)

**Scope:** Distinction between **domain vocabulary** (`tied/vocab/`) and **IMPL grammar vocabulary** (INPUT/OUTPUT/DATA/CONTROL); three-way alignment; pseudo-code validation; CITDP record naming; checklist per-request copy conventions. **Vocabulary only** — validation algorithms in [`../docs/pseudocode-writing-and-validation.md`](../docs/pseudocode-writing-and-validation.md) and [`../docs/processes.md`](../docs/processes.md).

**Traceability:** [PROC-PSEUDOCODE_VALIDATION](../docs/processes.md) · [PROC-CITDP](../docs/processes.md) · [PROC-IMPL_PSEUDOCODE_TOKENS](../docs/processes.md) · [PROC-IMPL_CODE_TEST_SYNC](../docs/processes.md) · [PROC-VOCABULARY_INDEX](../docs/processes.md) · [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml)

**See also:** [`domain-references.md`](domain-references.md) · [`tied-methodology.md`](tied-methodology.md) · [`../docs/citdp-policy.md`](../docs/citdp-policy.md) · [`../docs/pseudocode-format-and-practices.md`](../docs/pseudocode-format-and-practices.md)

---

## Domain vocabulary vs IMPL grammar (critical)

| Layer | Location | Governs |
|-------|----------|---------|
| **Domain vocabulary** | `tied/vocab/*.md` | Which **name** a concept has (REQ token suffix, file path, UPPER_SNAKE block name, UI label) |
| **IMPL grammar vocabulary** | [`../docs/implementation-decisions.md`](../docs/implementation-decisions.md) § Preferred vocabulary | How a **block** is written (INPUT, OUTPUT, DATA, ON, IF, AWAIT, …) |

Checklist **`sub-vocabulary-sync`** uses **domain** vocab. Do not conflate with INPUT/OUTPUT/DATA keywords.

---

## Preferred terms vs synonyms

| Preferred | Avoid | Notes |
|-----------|-------|-------|
| **essence_pseudocode** | pseudocode body, impl code | Canonical behavior spec; sidecar preferred |
| **pseudo-code sidecar** | md detail | `tied/implementation-decisions/IMPL-*-pseudocode.md` |
| **block lead comment** | header comment | First comment on each block; literal-copy to tests/code |
| **three-way alignment** | sync | IMPL block lead ↔ test comment ↔ code comment |
| **UPPER_SNAKE block name** | procedure name (ambiguous) | Preferred **domain** term becomes block identifier |
| **CITDP record** | citdp file | `tied/citdp/CITDP-*.yaml` |
| **per-request checklist copy** | checklist yaml | Never run completion against canonical checklist in `tied/docs/` |
| **LEAP** | stack update | Reverse order IMPL → ARCH → REQ when scope changes |
| **block-lead bracket format** | token comment line | Exact pattern: `[IMPL-*] [ARCH-*] [REQ-*]` then `How: …` (IMPL, ARCH, REQ order when all three appear) |
| **sub-vocabulary-sync RESOLVE** | lookup vocab | Before naming/writing: map fuzzy terms to one preferred term in `tied/vocab/*.md` |
| **sub-vocabulary-sync RECORD** | update vocab | After artifacts change: add preferred-term rows, naming bridges, alphabetical index entries |

---

## Naming bridge: artifacts

| Concept | Storage path | Process token |
|---------|--------------|---------------|
| Canonical checklist | `tied/docs/agent-req-implementation-checklist.yaml` | [PROC-AGENT_REQ_CHECKLIST](../docs/processes.md) |
| Per-request checklist | `<working_folder>/REQ-{TOKEN}_{timestamp}.yaml` | same |
| IMPL sidecar | `tied/implementation-decisions/IMPL-{TOKEN}-pseudocode.md` | [PROC-IMPL_PSEUDOCODE_TOKENS](../docs/processes.md) |
| Pseudo-code template | `templates/impl-essence-pseudocode-template.md` | [PROC-PSEUDOCODE_VALIDATION](../docs/processes.md) |
| CITDP record | `tied/citdp/CITDP-REQ-{TOKEN}.yaml` (pattern) | [PROC-CITDP](../docs/processes.md) |
| Validation checklist | `tied/docs/pseudocode-validation-checklist.yaml` | [PROC-PSEUDOCODE_VALIDATION](../docs/processes.md) |
| Domain vocab index | `tied/vocab/*.md` | [PROC-VOCABULARY_INDEX](../docs/processes.md) |

---

## IMPL grammar keywords (catalog)

Prefer in `essence_pseudocode` (not domain terms):

| Keyword | Use |
|---------|-----|
| `INPUT` / `OUTPUT` / `DATA` / `CONTROL` | Block I/O contract |
| `ON` / `WHEN` | Event/trigger |
| `IF` / `ELSE` | Branch |
| `FOR` / `WHILE` | Iteration |
| `RETURN` / `ON error` | Outcomes |
| `AWAIT` / `Promise` | Async boundary |
| `procedure NAME` | Named procedure (often maps to domain UPPER_SNAKE block) |

---

## CITDP naming

| Element | Convention |
|---------|------------|
| File prefix | `CITDP-` |
| REQ linkage | Include primary `REQ-*` token in filename or record body |
| Write tool | `citdp_record_write` when MCP available |
| Policy | See [`../docs/citdp-policy.md`](../docs/citdp-policy.md) |

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning PROC/IMPL |
|----------------|-------------------|------------------|
| Vocabulary resolve | `sub-vocabulary-sync` (checklist sub-procedure slug) | [PROC-VOCABULARY_INDEX](../docs/processes.md) |
| (domain-specific blocks live in sibling glossaries) | — | — |

---

## Alphabetical index

| Term | Section |
|------|---------|
| block lead comment | Preferred terms |
| block-lead bracket format | Preferred terms |
| CITDP record | Preferred terms |
| domain vocabulary | Domain vs grammar |
| essence_pseudocode | Preferred terms |
| IMPL grammar vocabulary | Domain vs grammar |
| LEAP | Preferred terms |
| per-request checklist copy | Preferred terms |
| pseudo-code sidecar | Preferred terms |
| sub-vocabulary-sync | Pseudo-code blocks |
| sub-vocabulary-sync RECORD | Preferred terms |
| sub-vocabulary-sync RESOLVE | Preferred terms |
| three-way alignment | Preferred terms |
| UPPER_SNAKE block name | Preferred terms |
