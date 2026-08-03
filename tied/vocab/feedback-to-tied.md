# Feedback to TIED (canonical)

**Scope:** Upstream feedback captured in `tied/feedback.yaml`, entry types, MCP add/export tools, and naming for client→methodology feedback. **Vocabulary only** — append/export algorithms live in [`../../mcp-server/src/feedback.ts`](../../mcp-server/src/feedback.ts) and [IMPL-MCP_FEEDBACK_TOOLS-pseudocode.md](../implementation-decisions/IMPL-MCP_FEEDBACK_TOOLS-pseudocode.md).

**Traceability:** [REQ-FEEDBACK_TO_TIED](../requirements/REQ-FEEDBACK_TO_TIED.yaml) · [ARCH-FEEDBACK_STORAGE](../architecture-decisions/ARCH-FEEDBACK_STORAGE.yaml) · [IMPL-MCP_FEEDBACK_TOOLS](../implementation-decisions/IMPL-MCP_FEEDBACK_TOOLS.yaml)

**See also:** [`domain-references.md`](domain-references.md) · [`tied-yaml-mcp.md`](tied-yaml-mcp.md) · [`leap-proposal-queue.md`](leap-proposal-queue.md) · [`../docs/vocabulary-index-analysis-and-standards.md`](../docs/vocabulary-index-analysis-and-standards.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid | Notes |
|-----------|-------|-------|
| **feedback entry** | ticket, issue (alone) | One row in `entries[]` |
| **feedback.yaml** | feedback json | YAML under `{TIED_BASE}/feedback.yaml` |
| **feature_request** | feature, enhancement (as type value) | Exact enum value |
| **bug_report** | bug | Exact enum value |
| **methodology_improvement** | process fix | Exact enum value |
| **tied_feedback_add** | feedback add | MCP tool name |
| **tied_feedback_export** | feedback dump | MCP tool name |
| **canonical-source anchor** | local feedback implementation | Upstream feedback implementation retained as authoritative without local client coverage |
| **local project coverage** | canonical coverage | Client-owned implementation and tests; upstream `code_locations` do not establish local coverage |

---

## Naming bridge

| Concept | UI/doc label | Storage | MCP tool | Code symbol |
|---------|--------------|---------|----------|-------------|
| Feedback store | feedback file | `tied/feedback.yaml` | — | `getFeedbackPath()` |
| Add feedback | add entry | `entries[]` append | `tied_feedback_add` | `appendEntry()` |
| Export feedback | export report | markdown or json string | `tied_feedback_export` | export helpers in `feedback.ts` |
| Entry identifier | feedback id | `entries[].id` | returned by add | `fb-{timestamp}-{random}` pattern |
| Entry type | type | `entries[].type` | add param `type` | `FeedbackType` |
| Optional context | context | `entries[].context` | add param `context` | `Record<string, unknown>` |

---

## Feedback entry schema (catalog)

Top-level shape:

```yaml
entries:
  - id: fb-...
    type: feature_request | bug_report | methodology_improvement
    title: string (non-empty)
    description: string (non-empty)
    context: optional object
    created_at: ISO8601 string
```

---

## MCP tools

| Tool | Purpose |
|------|---------|
| `tied_feedback_add` | Validate and append one entry; returns `ok`, `id`, `created_at` |
| `tied_feedback_export` | Format all entries as markdown or json |

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning IMPL |
|----------------|-------------------|-------------|
| Load feedback file | `loadFeedback` | [IMPL-MCP_FEEDBACK_TOOLS](../implementation-decisions/IMPL-MCP_FEEDBACK_TOOLS.yaml) |
| Append entry | `appendEntry` | [IMPL-MCP_FEEDBACK_TOOLS](../implementation-decisions/IMPL-MCP_FEEDBACK_TOOLS.yaml) |
| MCP handler envelope | `MCP_HANDLER` | [IMPL-MCP_FEEDBACK_TOOLS](../implementation-decisions/IMPL-MCP_FEEDBACK_TOOLS.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| appendEntry | Pseudo-code blocks |
| bug_report | Preferred terms |
| canonical-source anchor | Preferred terms |
| entries | Schema catalog |
| feature_request | Preferred terms |
| feedback entry | Preferred terms |
| feedback.yaml | Preferred terms |
| loadFeedback | Pseudo-code blocks |
| local project coverage | Preferred terms |
| methodology_improvement | Preferred terms |
| tied_feedback_add | MCP tools |
| tied_feedback_export | MCP tools |
