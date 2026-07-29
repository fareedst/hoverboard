# LEAP proposal queue (canonical)

**Scope:** Non-canonical LEAP proposal storage under `leap-proposals/`, queue/audit schema versions, MCP lifecycle tools, diff/session import, and explicit opt-in for extract/import. **Vocabulary only** — queue algorithms live in [`../../mcp-server/src/analysis/leap-proposal-queue.ts`](../../mcp-server/src/analysis/leap-proposal-queue.ts) and [IMPL-MCP_LEAP_PROPOSAL_QUEUE-pseudocode.md](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE-pseudocode.md).

**Traceability:** [REQ-LEAP_PROPOSAL_QUEUE](../requirements/REQ-LEAP_PROPOSAL_QUEUE.yaml) · [ARCH-LEAP_PROPOSAL_QUEUE](../architecture-decisions/ARCH-LEAP_PROPOSAL_QUEUE.yaml) · [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml)

**See also:** [`domain-references.md`](domain-references.md) · [`tied-yaml-mcp.md`](tied-yaml-mcp.md) · [`feedback-to-tied.md`](feedback-to-tied.md) · [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md) · [`../../docs/leap-proposal-queue.md`](../../docs/leap-proposal-queue.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid | Notes |
|-----------|-------|-------|
| **LEAP proposal queue** | leap queue, proposal backlog | Repo-root `leap-proposals/` |
| **non-canonical proposal** | draft yaml, pending leap | `non_canonical: true`; never writes project TIED YAML from queue lifecycle |
| **pending** | open, new | Proposal status before approve/reject |
| **approved** | accepted | Gate before `mark_applied` |
| **mark applied** | merged, shipped | Status after manual canonical apply |
| **explicit opt-in** | auto extract | `explicit_opt_in: true` required for extract/import MCP tools |
| **safeLeapCall** | raw handler | MCP wrapper; sync throws → `{ ok: false, error }` |

---

## Naming bridge

| Concept | Doc label | Storage | MCP tool | Pseudo-code block |
|---------|-----------|---------|----------|-------------------|
| Queue file | queue.json | `leap-proposals/queue.json` | `tied_leap_proposal_queue_snapshot` | `LOAD_QUEUE` / `SAVE_QUEUE` |
| Audit log | audit log | `leap-proposals/audit-log.jsonl` | — | `APPEND_AUDIT` |
| List proposals | list | — | `tied_leap_proposal_list` | `LIST_PROPOSALS` |
| Add proposal | add | queue append | `tied_leap_proposal_add` | `ADD_PROPOSAL` |
| Reject | reject | status mutation | `tied_leap_proposal_reject` | `REJECT_PROPOSAL` |
| Approve | approve | status mutation | `tied_leap_proposal_approve` | `APPROVE_PROPOSAL` |
| Mark applied | applied | status mutation | `tied_leap_proposal_mark_applied` | `MARK_APPLIED` |
| Update pending | update | pending-only edit | `tied_leap_proposal_update` | `UPDATE_PENDING` |
| Diff extract | diff candidates | — | `tied_leap_proposal_extract_diff` | `EXTRACT_DIFF_PROPOSAL_CANDIDATES` |
| Session import | session segments | — | `tied_leap_proposal_import_session` | `PARSE_SESSION_EXPORT_SEGMENTS` / `PROPOSALS_FROM_SESSION_SEGMENTS` |

---

## Schema identifiers (exact)

| Artifact | `schema_version` value |
|----------|------------------------|
| `queue.json` | `leap-proposal-queue.v1` |
| `audit-log.jsonl` (per line) | `leap-proposal-audit.v1` |

Proposal shape includes `non_canonical: true`. Status values: `pending`, `approved`, `rejected`, `applied` (per implementation).

---

## MCP tool catalog

| Tool |
|------|
| `tied_leap_proposal_list` |
| `tied_leap_proposal_add` |
| `tied_leap_proposal_extract_diff` |
| `tied_leap_proposal_import_session` |
| `tied_leap_proposal_reject` |
| `tied_leap_proposal_approve` |
| `tied_leap_proposal_mark_applied` |
| `tied_leap_proposal_update` |
| `tied_leap_proposal_queue_snapshot` |

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning IMPL |
|----------------|-------------------|-------------|
| Load queue | `LOAD_QUEUE` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Save queue | `SAVE_QUEUE` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Append audit | `APPEND_AUDIT` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Add proposal | `ADD_PROPOSAL` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Reject proposal | `REJECT_PROPOSAL` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Approve proposal | `APPROVE_PROPOSAL` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Mark applied | `MARK_APPLIED` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Update pending | `UPDATE_PENDING` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| List proposals | `LIST_PROPOSALS` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Extract diff candidates | `EXTRACT_DIFF_PROPOSAL_CANDIDATES` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Parse session export | `PARSE_SESSION_EXPORT_SEGMENTS` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| Proposals from segments | `PROPOSALS_FROM_SESSION_SEGMENTS` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |
| MCP handler wrapper | `MCP_HANDLER` | [IMPL-MCP_LEAP_PROPOSAL_QUEUE](../implementation-decisions/IMPL-MCP_LEAP_PROPOSAL_QUEUE.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| ADD_PROPOSAL | Pseudo-code blocks |
| APPEND_AUDIT | Pseudo-code blocks |
| APPROVE_PROPOSAL | Pseudo-code blocks |
| explicit opt-in | Preferred terms |
| EXTRACT_DIFF_PROPOSAL_CANDIDATES | Pseudo-code blocks |
| leap-proposals | Naming bridge |
| LEAP proposal queue | Preferred terms |
| LOAD_QUEUE | Pseudo-code blocks |
| MARK_APPLIED | Pseudo-code blocks |
| non-canonical proposal | Preferred terms |
| REJECT_PROPOSAL | Pseudo-code blocks |
| safeLeapCall | Preferred terms |
| tied_leap_proposal_add | MCP catalog |
| UPDATE_PENDING | Pseudo-code blocks |
