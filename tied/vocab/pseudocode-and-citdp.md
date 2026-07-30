# Pseudocode and CITDP (canonical)

**Scope:** Distinction between **domain vocabulary** (`tied/vocab/`) and **IMPL grammar vocabulary** (INPUT/OUTPUT/DATA/CONTROL, PRE/POST/EFFECTS/FAILURE_MODES/DATA_TRANSITION/TERMINATION); three-way alignment; pseudo-code validation; CITDP record naming; checklist per-request copy conventions. **Vocabulary only** — validation algorithms in [`../docs/pseudocode-writing-and-validation.md`](../docs/pseudocode-writing-and-validation.md) and [`../docs/processes.md`](../docs/processes.md).

**Traceability:** [PROC-PSEUDOCODE_VALIDATION](../docs/processes.md) · [PROC-CITDP](../docs/processes.md) · [PROC-IMPL_PSEUDOCODE_TOKENS](../docs/processes.md) · [PROC-IMPL_CODE_TEST_SYNC](../docs/processes.md) · [PROC-VOCABULARY_INDEX](../docs/processes.md) · [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml)

**See also:** [`routing.md`](routing.md) (PRELOAD primary entry) · [`domain-references.md`](domain-references.md) (full catalog, on-demand) · [`tied-methodology.md`](tied-methodology.md) · [`../docs/citdp-policy.md`](../docs/citdp-policy.md) · [`../docs/pseudocode-format-and-practices.md`](../docs/pseudocode-format-and-practices.md)

---

## Domain vocabulary vs IMPL grammar (critical)

| Layer | Location | Governs |
|-------|----------|---------|
| **Domain vocabulary** | `tied/vocab/*.md` | Which **name** a concept has (REQ token suffix, file path, UPPER_SNAKE block name, UI label) |
| **IMPL grammar vocabulary** | [`../docs/implementation-decisions.md`](../docs/implementation-decisions.md) § Preferred vocabulary | How a **block** is written (INPUT, OUTPUT, DATA, CONTROL, PRE, POST, EFFECTS, FAILURE_MODES, DATA_TRANSITION, TERMINATION, ON, IF, AWAIT, …) |

Checklist **`sub-vocabulary-sync`** uses **domain** vocab. Do not conflate with INPUT/OUTPUT/DATA/PRE/POST/EFFECTS keywords.

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
| **contract precision** | precise contracts, extended contract | Active-block PRE/POST/EFFECTS (+ FAILURE_MODES/DATA_TRANSITION/TERMINATION when applicable); Layer B SHAPE-003..006 |
| **SHAPE-003** | — | Schema check: Active procedure blocks declare PRE, POST, EFFECTS |
| **SHAPE-004** | — | Schema check: FAILURE_MODES closed set when errors are possible |
| **SHAPE-005** | — | Schema check: DATA_TRANSITION when mutable DATA or State effects |
| **SHAPE-006** | — | Schema check: TERMINATION when recursion / WHILE / open-ended wait |
| **sub-vocabulary-sync RESOLVE** | lookup vocab | Before naming/writing: map fuzzy terms to one preferred term in `tied/vocab/*.md` |
| **sub-vocabulary-sync PRELOAD** | read full catalog at bootstrap | Before reading TIED/docs/code: read [`routing.md`](routing.md), match keywords, open only matched glossaries ([PROC-VOCABULARY_INDEX] Touchpoint 2) |
| **sub-vocabulary-sync RECORD** | update vocab | After artifacts change: add preferred-term rows, naming bridges, alphabetical index entries |
| **sub-vocabulary-sync VALIDATE** | skip vocab audit | Before commit: audit names in docs/tokens/code against `tied/vocab/` ([PROC-VOCABULARY_INDEX] Touchpoint 3) |

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
| Vocab routing index (PRELOAD) | `tied/vocab/routing.md` | [PROC-VOCABULARY_INDEX](../docs/processes.md) |

---

## IMPL grammar keywords (catalog)

Prefer in `essence_pseudocode` (not domain terms):

| Keyword | Use |
|---------|-----|
| `INPUT` / `OUTPUT` / `DATA` / `CONTROL` | Block I/O and optional env/ordering (`CONTROL` = flags/env/ordering — **not** the contract keyword `EFFECTS`) |
| `PRE` / `POST` | Preconditions / postconditions (required on new/changed Active procedure blocks) |
| `EFFECTS` | Contract effect row: `pure` or named (`IO`, `Http`, `State`, `Async`, `DB`, `Exn`, `Random`, `Diverge`, …). Distinct from step-level SEND/BROADCAST/RETURN and from `CONTROL`. |
| `FAILURE_MODES` | Closed set of named error variants (when errors are possible) |
| `DATA_TRANSITION` | Before→after rules for mutable DATA / State |
| `TERMINATION` | `total` or `may_diverge` (loops/recursion/open wait) |
| `ON` / `WHEN` | Event/trigger |
| `IF` / `ELSE` | Branch |
| `FOR` / `WHILE` | Iteration |
| `RETURN` / `ON error` | Step-level outcomes (names must match `FAILURE_MODES` when required) |
| `AWAIT` / `Promise` | Async boundary (also reflect `Async` in `EFFECTS` when awaiting) |
| `procedure NAME` | Named procedure (often maps to domain UPPER_SNAKE block) |

**Migration:** Untouched legacy Active blocks may omit precision keywords with Layer B N/A `pre-contract-grammar` until next edit. See [`../docs/implementation-decisions.md`](../docs/implementation-decisions.md) and [`../docs/pseudocode-validation-checklist.yaml`](../docs/pseudocode-validation-checklist.yaml).

**Hoverboard corpus (2026-07-29):** Project Active IMPL sidecars were uplifted to H2 + PRE/POST/EFFECTS (SHAPE-003) under `IMPL_CORPUS_REVIEW_20260729204500`; client template vendored at [`templates/impl-essence-pseudocode-template.md`](../../templates/impl-essence-pseudocode-template.md). New/changed Active blocks must keep contract precision; do not regress to legacy INPUT/OUTPUT-only shape.

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
| contract precision | Preferred terms |
| CONTROL | IMPL grammar keywords |
| DATA_TRANSITION | IMPL grammar keywords |
| domain vocabulary | Domain vs grammar |
| EFFECTS | IMPL grammar keywords |
| essence_pseudocode | Preferred terms |
| FAILURE_MODES | IMPL grammar keywords |
| IMPL grammar vocabulary | Domain vs grammar |
| LEAP | Preferred terms |
| per-request checklist copy | Preferred terms |
| POST | IMPL grammar keywords |
| PRE | IMPL grammar keywords |
| pre-contract-grammar | IMPL grammar keywords |
| pseudo-code sidecar | Preferred terms |
| routing.md | Naming bridge |
| SHAPE-003 | Preferred terms |
| SHAPE-004 | Preferred terms |
| SHAPE-005 | Preferred terms |
| SHAPE-006 | Preferred terms |
| sub-vocabulary-sync | Pseudo-code blocks |
| sub-vocabulary-sync PRELOAD | Preferred terms |
| sub-vocabulary-sync RECORD | Preferred terms |
| sub-vocabulary-sync RESOLVE | Preferred terms |
| sub-vocabulary-sync VALIDATE | Preferred terms |
| TERMINATION | IMPL grammar keywords |
| three-way alignment | Preferred terms |
| UPPER_SNAKE block name | Preferred terms |
| Vocab routing index | Naming bridge |
