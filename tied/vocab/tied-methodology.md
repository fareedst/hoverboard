# TIED methodology (canonical)

**Scope:** Core TIED layout, semantic tokens, module validation, bootstrap (`copy_files.sh`), methodology vs project YAML, agent operating guides, and `[PROC-*]` process token names used across this repository. **Vocabulary only** — file-copy mechanics and validation algorithms live in IMPL pseudo-code and [`../docs/processes.md`](../docs/processes.md).

**Traceability:** [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml) · [REQ-MODULE_VALIDATION](../requirements/REQ-MODULE_VALIDATION.yaml) · [ARCH-TIED_STRUCTURE](../architecture-decisions/ARCH-TIED_STRUCTURE.yaml) · [ARCH-MODULE_VALIDATION](../architecture-decisions/ARCH-MODULE_VALIDATION.yaml) · [IMPL-TIED_FILES](../implementation-decisions/IMPL-TIED_FILES.yaml) · [IMPL-MODULE_VALIDATION](../implementation-decisions/IMPL-MODULE_VALIDATION.yaml)

**See also:** [`domain-references.md`](domain-references.md) · [`tied-yaml-mcp.md`](tied-yaml-mcp.md) · [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md) · [`../docs/vocabulary-index-analysis-and-standards.md`](../docs/vocabulary-index-analysis-and-standards.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid in docs/code | Notes |
|-----------|-------------------|-------|
| **semantic token** | token string alone | Always `[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`, or `[PROC-*]` in prose when naming the registry entry |
| **project YAML** | client YAML, root yaml | Writable REQ/ARCH/IMPL under `tied/` root (not `tied/methodology/`) |
| **methodology YAML** | template yaml, inherited yaml | Read-only under `tied/methodology/`; refreshed by `copy_files.sh` |
| **detail file** | sidecar yaml (for REQ/ARCH/IMPL index rows) | YAML under `tied/requirements/`, `tied/architecture-decisions/`, `tied/implementation-decisions/` |
| **pseudo-code sidecar** | essence in index body | Plain Markdown `IMPL-*-pseudocode.md`; not YAML |
| **module validation** | unit testing (alone) | Independent validation before integration per [REQ-MODULE_VALIDATION](../requirements/REQ-MODULE_VALIDATION.yaml) |
| **Observing AI principles!** | (omit) | Mandatory session acknowledgment per [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml) |
| **yaml_tool** | yaml lint script, yq wrapper (alone) | Primary YAML utility: `scripts/yaml_tool.sh`; default lint/pretty-print per [PROC-YAML_EDIT_LOOP](../docs/processes.md) |
| **lint_yaml** | lint yaml (generic) | Backward-compatible wrapper; delegates to **yaml_tool** |
| **qualifying list group** | yaml list, bullet group | 2+ consecutive lines with same indent, each starting with `- `; sortable by **yaml_list_sorter** |
| **sort map keys** | hash key sort, key normalization | Optional **`--sort-keys`** on **yaml_list_sorter** / **yaml_tool --sort-lists**; alphabetizes sibling map keys at every indent level; **block-scalar** (`\|`, `>`) bodies stay opaque |
| **yaml_semantic_compare** | YAML equality check, deep YAML diff (alone) | Library: `scripts/yaml_semantic_compare.rb`; compares loaded YAML values (key order ignored; optional unordered arrays); used by **yaml_list_sorter** post-sort validation |
| **compare_yaml_dirs** | directory YAML diff, recursive yaml compare | CLI: `scripts/compare_yaml_dirs.rb LEFT_DIR RIGHT_DIR`; relative-path pairing; reports missing files and semantic differences |

---

## Naming bridge: TIED layout

| Canonical concept | Doc label | Storage path | CLI/env | TIED token |
|-------------------|-----------|--------------|---------|------------|
| TIED project root | TIED base | `tied/` | `TIED_BASE_PATH` (absolute) | [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml) |
| Requirements index | requirements index | `tied/requirements.yaml` | `yaml_index_*` index=`requirements` | [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml) |
| Architecture index | architecture index | `tied/architecture-decisions.yaml` | index=`architecture` | [ARCH-TIED_STRUCTURE](../architecture-decisions/ARCH-TIED_STRUCTURE.yaml) |
| Implementation index | implementation index | `tied/implementation-decisions.yaml` | index=`implementation` | [IMPL-TIED_FILES](../implementation-decisions/IMPL-TIED_FILES.yaml) |
| Token registry | semantic tokens | `tied/semantic-tokens.yaml` | index=`semantic-tokens` | [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml) |
| Methodology merge view | merged TIED view | read via MCP resources | `tied://requirements` etc. | [PROC-TIED_METHODOLOGY_READONLY](../docs/processes.md) |
| Agent operating guide | AGENTS | `AGENTS.md` | — | [REQ-TIED_SETUP](../requirements/REQ-TIED_SETUP.yaml) |
| Client development index | core six | `tied/docs/client-development-index.md` | minimal CITDP+LEAP+TIED doc set | [PROC-AGENT_REQ_CHECKLIST](../docs/processes.md) |
| Bootstrap script | copy_files | `copy_files.sh` | `./copy_files.sh /path/to/client` | [IMPL-TIED_FILES](../implementation-decisions/IMPL-TIED_FILES.yaml) |
| Domain vocabulary index | vocab index | `tied/vocab/*.md` | checklist `VOCAB_INDEX` | [PROC-VOCABULARY_INDEX](../docs/processes.md) |
| Per-request checklist copy | working folder checklist | `<working_folder>/REQ-*_<timestamp>.yaml` | — | [PROC-AGENT_REQ_CHECKLIST](../docs/processes.md) |
| YAML validate/sort | yaml_tool | `scripts/yaml_tool.sh` | `--sort-lists` → Ruby sorter; optional `--sort-keys` | [PROC-YAML_EDIT_LOOP](../docs/processes.md) |
| YAML lint wrapper | lint_yaml | `scripts/lint_yaml.sh` | delegates to yaml_tool | [PROC-YAML_EDIT_LOOP](../docs/processes.md) |
| List group sorter | yaml_list_sorter | `scripts/yaml_list_sorter.rb` | `--sort-keys` optional; invoked by yaml_tool `--sort-lists`; post-sort **yaml_semantic_compare** | [PROC-YAML_EDIT_LOOP](../docs/processes.md) |
| Semantic YAML compare | yaml_semantic_compare | `scripts/yaml_semantic_compare.rb` | library + `YamlSemanticCompare.compare` | [PROC-YAML_EDIT_LOOP](../docs/processes.md) |
| YAML directory compare | compare_yaml_dirs | `scripts/compare_yaml_dirs.rb` | `LEFT_DIR RIGHT_DIR`; `--unordered-arrays`; `--[no-]missing` | [PROC-YAML_EDIT_LOOP](../docs/processes.md) |

---

## Core `[PROC-*]` process names (catalog)

Exact spellings for checklist and docs cross-reference:

| Token | Purpose |
|-------|---------|
| `[PROC-AGENT_REQ_CHECKLIST]` | Primary implementation checklist |
| `[PROC-CITDP]` | Change impact and test design |
| `[PROC-TIED_DEV_CYCLE]` | Session workflow: tests → TDD → glue → E2E |
| `[PROC-IMPL_CODE_TEST_SYNC]` | Three-way alignment IMPL ↔ tests ↔ code |
| `[PROC-LEAP]` | Logic elevation and propagation |
| `[PROC-YAML_EDIT_LOOP]` | Safe YAML edit + **yaml_tool** (lint_yaml wrapper) |
| `[PROC-IMPL_PSEUDOCODE_TOKENS]` | Block comment rules in essence_pseudocode |
| `[PROC-PSEUDOCODE_VALIDATION]` | Pseudo-code validation gates |
| `[PROC-TOKEN_AUDIT]` | Token audit in code/tests |
| `[PROC-TOKEN_VALIDATION]` | Registry + consistency validation |
| `[PROC-TEST_STRATEGY]` | Coverage and E2E justification |
| `[PROC-COMMIT_MESSAGES]` | Traceable commit format |
| `[PROC-VOCABULARY_INDEX]` | Domain vocabulary discipline (`tied/vocab/`) |
| `[PROC-TIED_METHODOLOGY_READONLY]` | Do not write `tied/methodology/` |
| `[PROC-YAML_DB_OPERATIONS]` | MCP YAML CRUD patterns |
| `[PROC-TIED_VERIFICATION_GATED]` | Status derived from `tied_verify` |

---

## Semantic token prefixes (this project)

| Prefix | Domain glossary |
|--------|-----------------|
| `REQ-TIED_*`, `REQ-MODULE_*` | This file |
| `REQ-GOAGENT-*` | [`agentstream.md`](agentstream.md) |
| `REQ-ATDD-*` | [`agent-stream-ruby.md`](agent-stream-ruby.md) |
| `REQ-FEEDBACK_*` | [`feedback-to-tied.md`](feedback-to-tied.md) |
| `REQ-LEAP_*` | [`leap-proposal-queue.md`](leap-proposal-queue.md) |
| `REQ-CONFIG_*` | [`config-discovery.md`](config-discovery.md) |

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning IMPL |
|----------------|-------------------|-------------|
| (methodology tokens are PROC-level; no dedicated UPPER_SNAKE blocks in methodology IMPLs) | — | — |

---

## Alphabetical index

| Term | Section |
|------|---------|
| AGENTS.md | Naming bridge |
| copy_files.sh | Naming bridge |
| detail file | Preferred terms |
| methodology YAML | Preferred terms |
| module validation | Preferred terms |
| Observing AI principles! | Preferred terms |
| PROC-AGENT_REQ_CHECKLIST | PROC catalog |
| PROC-VOCABULARY_INDEX | PROC catalog |
| project YAML | Preferred terms |
| semantic token | Preferred terms |
| TIED base path | Naming bridge |
| tied/vocab | Naming bridge |
| compare_yaml_dirs | Preferred terms |
| lint_yaml | Preferred terms |
| qualifying list group | Preferred terms |
| sort map keys | Preferred terms |
| VOCAB_INDEX | Naming bridge |
| yaml_list_sorter | Naming bridge |
| yaml_semantic_compare | Preferred terms |
| yaml_tool | Preferred terms |
