# YAML updates via TIED MCP (agent runbook)

**Audience**: AI agents. **Companion**: [ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md), [AGENTS.md](../AGENTS.md) § TIED data access, [detail-files-schema.md](../detail-files-schema.md) (in a bootstrapped client: `tied/detail-files-schema.md` after `copy_files.sh`).

**Purpose**: Stop invalid YAML and index/detail drift by **routing mutations through the tied-yaml MCP server** and by **not abandoning MCP** after the first error.

---

## 1. Mandatory routing (project TIED YAML)

**Applies to**: Create, update, or delete of **project-owned** YAML under the TIED base path (see `tied_config_get_base_path`): index files at the base (`requirements.yaml`, `architecture-decisions.yaml`, `implementation-decisions.yaml`, `semantic-tokens.yaml`, `feedback.yaml`, etc.) and detail files under `requirements/`, `architecture-decisions/`, `implementation-decisions/`.

| Rule | Action |
|------|--------|
| **DO** | Use the MCP tools in § 3 for every mutation of those files. |
| **DO NOT** | Use `apply_patch`, `Write`, or bulk search-replace on those paths when an MCP tool can perform the same operation. |
| **NEVER** | Create or edit `methodology/**` under the TIED base path; that tree is read-only in client projects (`[PROC-TIED_METHODOLOGY_READONLY]`). MCP rejects writes to methodology-owned tokens—**do not “fix” that by direct file edit**. |
| **Exception** | If **no** MCP tool can perform the operation, document a one-line exception (what is missing), then direct-edit the minimal file, run `lint_yaml <file>` per [PROC-YAML_EDIT_LOOP] (`processes.md`), and run `tied_validate_consistency`. Treat the gap as a candidate for a new tool ([ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md) § 3). |

**Why**: The server emits **safe YAML** (e.g. quoting values that contain `:`). Model-authored patches often break syntax, indentation, or duplicate keys.

**Not TIED project YAML**: Cursor hook exports (e.g. `~/.cursor/logs/conv_*.yaml`) and YAML embedded in messages (preload samples, copied checklists) are **not** the TIED database under `tied_config_get_base_path`. Confirm the active base path; do not use `apply_patch`/`Write` on log exports to “fix TIED.” See [ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md) § 1.2.

---

## 2. Preferred granularity

1. **One token at a time** for detail bodies: `yaml_detail_read` → merge your change mentally → `yaml_detail_update` with a small `updates` payload (JSON string). Avoid pasting entire index files from the model.
2. **Batch reads only**: Use `yaml_detail_read_many` to load context; still apply **sequential** `yaml_detail_update` / `yaml_detail_create` per token unless a dedicated batch-write tool exists.
3. **Keep index and detail aligned**: Creating a new REQ/ARCH/IMPL usually means index row **and** detail file—prefer `tied_token_create_with_detail` when appropriate, or `yaml_detail_create` with `sync_index: true` plus `yaml_index_insert` as documented in [mcp-server/README.md](../mcp-server/README.md).

---

## 3. Cheat sheet: goal → tool

| Goal | MCP tool | Parameters (see server README for full schema) |
|------|-----------|--------------------------------------------------|
| Resolve effective base path | `tied_config_get_base_path` | — |
| Read a whole index | `yaml_index_read` | `index`: `requirements` \| `architecture` \| `implementation` \| `semantic-tokens`; optional `token` |
| List tokens in an index | `yaml_index_list_tokens` | `index`; optional `type` (semantic-tokens) |
| Filter index rows | `yaml_index_filter` | `index`, `field`, `value` |
| Insert new index row | `yaml_index_insert` | `index`, `token`, `record` (JSON string; YAML string also accepted where the server supports it) |
| Merge index row fields | `yaml_index_update` | `index`, `token`, `updates` (JSON string) |
| Create token + index + detail in one step | `tied_token_create_with_detail` | `token`, `index_record`, `detail_record` (JSON strings); optional `upsert_index` |
| Read one detail file | `yaml_detail_read` | `token` |
| Read many details | `yaml_detail_read_many` | `tokens` array and/or `type` |
| List tokens with detail files | `yaml_detail_list` | `type` |
| Create detail file | `yaml_detail_create` | `token`, `record` (JSON string); optional `sync_index` (default true) |
| Merge detail fields | `yaml_detail_update` | `token`, `updates` (JSON string) |
| Delete detail file | `yaml_detail_delete` | `token`; optional `sync_index` |
| REQ ↔ ARCH/IMPL traceability | `get_decisions_for_requirement`, `get_requirements_for_decision` | requirement or decision token |
| Rename token everywhere | `tied_token_rename` | `old_token`, `new_token`; optional `dry_run` |
| Validate index YAML syntax | `yaml_index_validate` | — |
| Full consistency (traceability, detail files, pseudo-code token comments) | `tied_validate_consistency` | optional flags per README |

**Minimal payload shape** (examples are illustrative; escape quotes for your MCP client):

```json
{
  "status": "draft",
  "satisfaction_criteria": "Measurable outcome described without bare colons breaking YAML."
}
```

Pass that object as a **string** in `updates` or `record` per the tool descriptor.

---

## 4. Failure playbook (do not abandon MCP)

| Symptom | Do this | Do not |
|---------|---------|--------|
| “Methodology”, “read-only”, or token not writable | Target **project** index/detail only; create project detail if the token should be client-specific | Patch files under `methodology/` or bypass with `Write` |
| Wrong or missing `TIED_BASE_PATH` | Fix MCP env to point at the project’s `tied/` directory; confirm with `tied_config_get_base_path` | Write YAML into the wrong tree |
| Invalid JSON in `record` / `updates` | Fix quoting; retry with smaller `updates` chunk | Switch to full-file `Write` on the same path |
| Tool timeout / transient error | Retry; narrow the operation (single token) | Immediately fall back to direct file edit |
| `tied_validate_consistency` fails | Fix the reported token/path via MCP or LEAP stack; re-run validation | Mark work complete while consistency is failing |

---

## 5. After writes: validation loop

Align with `[PROC-YAML_EDIT_LOOP]` and **SUB-YAML** in [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md):

1. Prefer **MCP** for the mutation (§ 1).
2. On any path you **direct-edited** (exception only), run `lint_yaml` until it passes; never use raw multi-argument `yq` pretty-print on multiple paths in one process (see `processes.md` `[PROC-YAML_EDIT_LOOP]`).
3. Run **`tied_validate_consistency`** before marking TIED work complete (and when the checklist calls for it).

---

## 6. References

- Tool and resource catalog: [mcp-server/README.md](../mcp-server/README.md)
- Agent directive (MCP-first): [ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md)
- REQ checklist (S01 bootstrap, SUB-YAML): [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md)
