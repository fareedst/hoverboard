# Client development index — minimal CITDP + LEAP + TIED

**Audience**: Engineers and AI agents in a **TIED client project** (after `copy_files.sh`).

**Purpose**: One page that names the **smallest document set** needed to apply **TIED** (traceable REQ → ARCH → IMPL → tests → code), **CITDP** (structured change analysis), and **LEAP** (keep docs and code aligned) on every development task.

**Process spine**: `[PROC-AGENT_REQ_CHECKLIST]` in [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md).

---

## The three pieces (30 seconds)

| Piece | Client nickname | What it does |
| --- | --- | --- |
| **TIED** | **Traceability stack** | Records intent in YAML tokens and IMPL pseudo-code; links requirements, design, tests, and code. |
| **CITDP** | **Change analysis** | Before code: define the change, blast radius, risks, test plan; after: persist `tied/citdp/CITDP-*.yaml`. |
| **LEAP** | **Stack sync** | When tests or code disagree with IMPL, update **IMPL first**, then ARCH/REQ if scope changed—not silent drift. |

**Mandatory build order**: complete IMPL pseudo-code (with block token comments) → failing tests → minimal code → composition → E2E only when required → validate and sync the stack.

---

## Core six — read these for every project

Use these **nicknames** in tickets, PRs, and agent prompts.

| # | Nickname | File | Read when |
| --- | --- | --- | --- |
| 1 | **Rules** | [`../../AGENTS.md`](../../AGENTS.md) | Session start; defines obligations, MCP base path, vocab touchpoints. |
| 2 | **Checklist** | [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md) | **Every** new feature, change, or bug fix — the executable procedure. |
| 3 | **Tracker** | [agent-req-implementation-checklist.yaml](agent-req-implementation-checklist.yaml) | Copy to a working folder per task; record step completion (see YAML header). |
| 4 | **Processes** | [processes.md](processes.md) | Need the **definition** behind a checklist step. Read these sections only: `[PROC-CITDP]`, `[PROC-LEAP]`, `[PROC-TIED_DEV_CYCLE]`, `[PROC-IMPL_CODE_TEST_SYNC]`, `[PROC-TEST_STRATEGY]`, `[PROC-QUALITY_ASSURANCE]`, `[PROC-QUALITY_EVIDENCE_PROVENANCE]`, `[PROC-TEST_ADEQUACY]`, `[PROC-VOCABULARY_INDEX]`. |
| 5 | **Pseudo-code** | [pseudocode-writing-and-validation.md](pseudocode-writing-and-validation.md) | Authoring or repairing IMPL `essence_pseudocode`; three-way alignment; LEAP micro-cycle. Tracks: **new feature** (A), **post-fix** (B), **code without spec** (C). |
| 6 | **Change records** | [citdp-policy.md](citdp-policy.md) + [citdp-record-template.yaml](citdp-record-template.yaml) | When to write a CITDP file; shape for `tied/citdp/CITDP-*.yaml`, quality evidence matrix, and residual-risk decisions. |

Quality assurance references: [quality-assurance-commands.md](quality-assurance-commands.md), [quality-evidence-manifest.md](quality-evidence-manifest.md), [quality-assurance-pilot.md](quality-assurance-pilot.md), and [composition-coverage.md](composition-coverage.md).

**Session pairing**: read **Rules** and [ai-principles.md](ai-principles.md) (**Principles**) together at bootstrap — Principles expands the same mandates in checklist form.

---

## Quick reads (optional, ~15 minutes)

| Nickname | File | Why |
| --- | --- | --- |
| **LEAP overview** | [LEAP.md](LEAP.md) | Short rationale for why IMPL beats hunting source files. |
| **Diagrams** | [methodology-diagrams.md](methodology-diagrams.md) | Visual stack, LEAP loop, TDD inner loop, CITDP flow. |
| **Build order** | [implementation-order.md](implementation-order.md) | One-page mandatory sequence (also inside **Processes** § `[PROC-TIED_DEV_CYCLE]`). |

---

## Scenario → start here

| Situation | Start at | Also open |
| --- | --- | --- |
| New requirement | **Checklist** → `session-bootstrap` | **Pseudo-code** Track A; project YAML indexes below |
| Change existing behavior | **Checklist** → `change-definition` | **Processes** § `[PROC-CITDP]`; **Change records** |
| Upgrade TIED methodology | **methodology-migration.md** → Phase 0 | **Rules**, refreshed TIED YAML MCP, and the per-request Tracker |
| TIED already updated; code/tests lag | [tied-first-implementation-procedure.md](tied-first-implementation-procedure.md) (**TIED-first**) | **Checklist** with verify-only REQ/ARCH/IMPL steps |
| Bug fix | **Checklist** → `session-bootstrap` | Add REQ at `author-requirement` if missing |
| Tests/code diverged from IMPL | **Pseudo-code** § LEAP micro-cycle | **Processes** § `[PROC-LEAP]`; checklist `sub-leap-micro-cycle` |
| Repair without full new REQ | **Checklist** + **Pseudo-code** Track B or C | Same LEAP order |

---

## Data you edit (not prose docs)

| Nickname | Path | Role |
| --- | --- | --- |
| **Requirements** | `tied/requirements.yaml`, `tied/requirements/` | What and why (`[REQ-*]`). |
| **Architecture** | `tied/architecture-decisions.yaml`, `tied/architecture-decisions/` | Design choices (`[ARCH-*]`). |
| **Implementation** | `tied/implementation-decisions.yaml`, `tied/implementation-decisions/`, `IMPL-*-pseudocode.md` | Behavior spec (`[IMPL-*]`). |
| **Token registry** | `tied/semantic-tokens.yaml` | Every `[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`, `[PROC-*]`. |
| **CITDP records** | `tied/citdp/CITDP-*.yaml` | Change-analysis audit trail. |
| **Methodology** (read-only) | `tied/methodology/` | Inherited tokens; refreshed by `copy_files.sh`; do not edit. |
| **Domain names** | `tied/vocab/routing.md` → matched glossaries | PRELOAD via routing index before reading YAML or source; full `domain-references.md` on demand for cross-topic. |

Guides for YAML shapes: [requirements.md](requirements.md), [architecture-decisions.md](architecture-decisions.md), [implementation-decisions.md](implementation-decisions.md), [semantic-tokens.md](semantic-tokens.md), [detail-files-schema.md](detail-files-schema.md).

---

## Tooling (when mutating YAML)

| Nickname | Location | Role |
| --- | --- | --- |
| **YAML tools index** | [tied-yaml-agent-index.md](tied-yaml-agent-index.md) | Maps skill, runbook, validation loop. |
| **tied-cli** | `.cursor/skills/tied-yaml/scripts/tied-cli.sh` | Primary write path for project YAML. |
| **Without MCP** | [using-tied-without-mcp.md](using-tied-without-mcp.md) | Documented manual workflow. |

After writes: `lint_yaml` on changed YAML + `tied_validate_consistency` (checklist `sub-yaml-edit-loop`).

---

## Supporting docs (installed by bootstrap; not in core six)

`copy_files.sh` also copies these when missing. Use when the **Checklist** or **YAML tools index** points you there — not required on every task.

| Area | Files |
| --- | --- |
| Commit / release | `commit-guidelines.md` |
| MCP setup | `adding-tied-mcp-and-invoking-passes.md`, `ai-agent-tied-mcp-usage.md`, `yaml-update-mcp-runbook.md` |
| Automation | `req-impl-state-guide-agent-workflow.md`, `requirement-list-state-guide-agent-workflow.md` |
| Preload contract | `agent-preload-contract-template.yaml` → client `tied/agent-preload-contract.yaml` |
| Pseudo-code extras | `pseudocode-format-and-practices.md`, `pseudocode-validation-checklist.yaml`, `templates/impl-essence-pseudocode-template.md` |
| Vocab meta | `vocabulary-index-analysis-and-standards.md` |

---

## One-line agent prompt

> Follow **Rules**, execute **Checklist** steps from a per-task **Tracker** copy, author/repair behavior in **Pseudo-code** before RED tests, apply **LEAP** on divergence, persist **Change records** when behavior changes, mutate project YAML via **tied-cli**, validate with `tied_validate_consistency`.

---

**TIED Methodology Version**: 2.2.0 · **Last updated**: 2026-06-14
