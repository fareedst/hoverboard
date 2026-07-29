# Vocab directory routing index (primary entry)

**Purpose:** Primary entry for `tied/vocab/`. Lightweight bootstrap file for AI agent sessions. Read this (~70 lines) instead of the full [`domain-references.md`](domain-references.md) at session start. Identifies which glossary file(s) to PRELOAD for a given task.

**Procedure:**
1. Read this file (once per session).
2. Match your task keywords to the routing table below.
3. PRELOAD only the matched glossary file(s) under `tied/vocab/`.
4. If your task spans multiple glossaries, search `domain-references.md` for cross-topic notes (or the relevant glossary names).

---

## Glossary routing table

| Pri | File | Keywords / When to read |
|-----|------|------------------------|
| 1 | [tied-methodology.md](tied-methodology.md) | TIED layout, semantic tokens, module validation, bootstrap, methodology vs project YAML, PROC-* process names, `copy_files.sh`, detail files, `yaml_tool`, `yaml_list_sorter`, sort map keys, `yaml_semantic_compare`, `compare_yaml_dirs` |
| 2 | [tied-yaml-mcp.md](tied-yaml-mcp.md) | TIED YAML MCP, `tied-cli`, bundled skill, `TIED_BASE_PATH`, validation, verify, cycles, backlog, scoped analysis, token rename, usage metrics, `args_signature`, `TIED_MCP_COLLECT_METRICS` |
| 2b | [feedback-to-tied.md](feedback-to-tied.md) | `feedback.yaml`, `tied_feedback_add`, `tied_feedback_export`, feature_request, bug_report, methodology_improvement |
| 3 | [leap-proposal-queue.md](leap-proposal-queue.md) | LEAP proposals, non-canonical proposal, pending/approved/rejected/applied, `tied_leap_proposal_*`, leap-proposals audit |
| 4 | [agentstream.md](agentstream.md) | Go `agentstream`, pipeline, turns, checklist render, executor, HTML format, MCP preflight, feature-spec batch |
| 4b | [agent-stream-ruby.md](agent-stream-ruby.md) | Ruby ATDD runner, `agent-stream`, TddLoopPrompts, export_tdd_prompts, stream-json, Open3 |
| 5 | [pseudocode-and-citdp.md](pseudocode-and-citdp.md) | Domain vocab vs IMPL grammar, three-way alignment, UPPER_SNAKE blocks, CITDP record naming, essence_pseudocode, sub-vocabulary-sync |
| — | [config-discovery.md](config-discovery.md) | Layered YAML config, project-local layer, exclude_patterns, `(proposed)` terms |

---

## Cross-topic lookup (on-demand only)

The full [`domain-references.md`](domain-references.md) contains **Cross-topic notes** that map concepts spanning multiple glossaries (e.g. agentstream vs agent-stream naming, domain vocab vs IMPL grammar, TIED base path / project vs methodology YAML).

**Do not read the full file at bootstrap.** When your task touches a cross-cutting concern, open the full index and search for the note, or PRELOAD the two glossaries named in the routing table.

Examples of cross-topic notes:
- agentstream (Go) vs agent-stream (Ruby) vs run-feature-batch drivers
- Domain vocabulary vs IMPL grammar vocabulary (INPUT/OUTPUT/DATA)
- TIED base path / project YAML vs methodology YAML
- Non-canonical LEAP proposals never mutate project TIED YAML

---

## Authoring guides (not glossaries)

- [Vocabulary index analysis and standards](../docs/vocabulary-index-analysis-and-standards.md)
- [Vocabulary layer, TIED, LEAP, and CITDP (outreach)](../docs/vocabulary-layer-tied-leap-citdp.md)
- [TIED domain vocabulary research prompt](../docs/tied-domain-vocabulary-research-prompt.md)
- [Client development index](../docs/client-development-index.md)

---

## Authoring new glossaries

See [tied-domain-vocabulary-research-prompt.md](../docs/tied-domain-vocabulary-research-prompt.md) and [vocabulary-index-analysis-and-standards.md](../docs/vocabulary-index-analysis-and-standards.md).

---

## Full reference

For the complete index (authoring guides table, cross-topic notes, and all links): [`domain-references.md`](domain-references.md).
