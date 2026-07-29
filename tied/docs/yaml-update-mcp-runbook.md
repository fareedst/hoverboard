# YAML updates via TIED MCP (agent runbook)

**Audience**: AI agents. **Start here (all links in one place):** [tied-yaml-agent-index.md](./tied-yaml-agent-index.md) (canonical in the TIED repo). **Companion**: [ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md), [AGENTS.md](../AGENTS.md) § TIED data access, [detail-files-schema.md](detail-files-schema.md) (in a bootstrapped client: `tied/docs/detail-files-schema.md` after `copy_files.sh`).

**Purpose**: Stop invalid YAML and index/detail drift by **routing mutations through the tied-yaml MCP server** and by **not abandoning MCP** after the first error.

---

## 1. Mandatory routing (project TIED YAML)

**Applies to**: Create, update, or delete of **project-owned** YAML under the TIED base path (see `tied_config_get_base_path`): index files at the base (`requirements.yaml`, `architecture-decisions.yaml`, `implementation-decisions.yaml`, `semantic-tokens.yaml`, `feedback.yaml`, etc.) and detail files under `requirements/`, `architecture-decisions/`, `implementation-decisions/`.

| Rule | Action |
|------|--------|
| **DO** | Use the MCP tools in § 3 for every mutation of those files. |
| **DO NOT** | Use `apply_patch`, `Write`, or bulk search-replace on those paths when an MCP tool can perform the same operation. |
| **NEVER** | Create or edit `methodology/**` under the TIED base path; that tree is read-only in client projects (`[PROC-TIED_METHODOLOGY_READONLY]`). MCP rejects writes to methodology-owned tokens—**do not “fix” that by direct file edit**. |
| **Exception** | If **no** MCP tool can perform the operation, document a one-line exception (what is missing), then direct-edit the minimal file, run `scripts/yaml_tool.sh <file> [file ...]` or `scripts/lint_yaml.sh <file> [file ...]` (or `lint_yaml` if installed) per [PROC-YAML_EDIT_LOOP] (`tied/docs/processes.md`), and run `tied_validate_consistency`. Treat the gap as a candidate for a new tool ([ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md) § 3). **IMPL pseudo-code sidecar:** the body file `tied/implementation-decisions/IMPL-*-pseudocode.md` is **plain text**; editing it **directly** (or using `impl_detail_set_essence_pseudocode` with `essence_pseudocode_path`, or `tied-cli` with `TIED_CLI_IMPL_ESSENCE_FILE` / `TIED_CLI_IMPL_ESSENCE_STDIN`) is **first-class** and not a “YAML escape hatch”—see [pseudocode-writing-and-validation.md § Mechanics](pseudocode-writing-and-validation.md#mechanics-editing-the-sidecar-mcp-and-cli). |

**Why**: The server emits **safe YAML** (e.g. quoting values that contain `:`). Model-authored patches often break syntax, indentation, or duplicate keys.

**Not TIED project YAML**: Cursor hook exports (e.g. `~/.cursor/logs/conv_*.yaml`) and YAML embedded in messages (preload samples, copied checklists) are **not** the TIED database under `tied_config_get_base_path`. Confirm the active base path; do not use `apply_patch`/`Write` on log exports to “fix TIED.” See [ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md) § 1.2.

---

## 2. Preferred granularity

1. **One token at a time** for detail bodies: `yaml_detail_read` → merge your change mentally → `yaml_detail_update` with a small `updates` payload (JSON string). Avoid pasting entire index files from the model.
2. **Batch reads** use `yaml_detail_read_many`. For **multiple writes** in one process (same merge rules, optional end-of-batch `tied_validate_consistency`), use **`yaml_updates_apply`** with an ordered `steps` array; use `dry_run: true` first to inspect `merged_preview` per step without writing.
3. **Keep index and detail aligned**: Creating a new REQ/ARCH/IMPL usually means index row **and** detail file—prefer `tied_token_create_with_detail` when appropriate, or `yaml_detail_create` with `sync_index: true` plus `yaml_index_insert` as documented in [mcp-server/README.md](../../mcp-server/README.md).

### 2.1 Nested maps (`metadata`, `traceability`, …): merge semantics

**Server (mcp-server):** `yaml_detail_update` and `yaml_index_update` shallow-merge top-level keys, but **one level deeper** for object-shaped **`metadata`**, **`traceability`**, **`related_requirements`**, **`related_decisions`**, **`rationale`**, and **`implementation_approach`**: `{ metadata: { last_updated: "x" } }` is merged into the existing `metadata` map so **`metadata.created` is preserved** unless you intentionally overwrite a sibling key in the same object. When **`metadata.last_updated`** (or **`metadata.last_validated`**) is a **plain object on both** the existing record and the update, those objects are merged **one level** so partial `{ reason: "…" }` updates preserve existing `date` / `author` fields.

**Defense in depth (agents):**

1. **Read before large edits** — For non-whitelisted nested shapes or when replacing **arrays** (still replaced wholesale), capture the current record.
2. **Re-read after write** on critical checklist steps — Confirm audit fields on **both** detail and index when both changed; if anything vanished (bug or older server), one corrective `yaml_*_update` restores them.
3. **IMPL pseudo-code churn** — Prefer **`impl_detail_set_essence_pseudocode`** (inline string, or **`essence_pseudocode_path`**, or **`tied-cli`** with **`TIED_CLI_IMPL_ESSENCE_FILE`** / **`TIED_CLI_IMPL_ESSENCE_STDIN`**) when only the pseudo-code body (and optional `metadata.last_updated`) changes; or edit **`IMPL-*-pseudocode.md` directly**; IMPL-only guard, no giant `yaml_detail_update` blob.
4. **Large narrative fields** — Still prefer focused `updates` blobs; avoid unrelated top-level keys in the same call unless intentional.

### 2.2 `tied-cli.sh`, payload size, timeouts

Each [`tied-cli.sh`](../../.cursor/skills/tied-yaml/scripts/tied-cli.sh) invocation starts **one** MCP stdio client and performs **one** `tools/call`. Long “sync-tied-stack” sequences therefore spawn many short-lived Node processes—keep each `args` JSON **small** (especially avoid pasting huge `essence_pseudocode` into `yaml_detail_update`; use **`impl_detail_set_essence_pseudocode`**, a **`essence_pseudocode_path`**, or **`TIED_CLI_IMPL_ESSENCE_FILE`** / **`TIED_CLI_IMPL_ESSENCE_STDIN`**, or **direct** sidecar `.md` edit). **Timeouts** are enforced by the host client; if a call is killed mid-flight, re-run **`yaml_index_validate`** and **`tied_validate_consistency`** before assuming the tree is consistent. Prefer **one** `tied_validate_consistency` at the **end** of a multi-step sync rather than after every RPC unless you are debugging. The companion **`tied-mcp-stdio-client.cjs`** reassembles JSON-RPC over newlines—do not hand-roll stdio framing.

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
| Ordered batch merge (index/detail) | `yaml_updates_apply` | `steps` (array of `{ kind, token, updates }` or `{ kind, index, token, updates }`); optional `dry_run`, `run_validate_consistency` |
| Create token + index + detail in one step | `tied_token_create_with_detail` | `token`, `index_record`, `detail_record` (JSON strings); optional `upsert_index` |
| Read one detail file | `yaml_detail_read` | `token` |
| Read many details | `yaml_detail_read_many` | `tokens` array and/or `type` |
| List tokens with detail files | `yaml_detail_list` | `type` |
| Create detail file | `yaml_detail_create` | `token`, `record` (JSON string); optional `sync_index` (default true) |
| Merge detail fields | `yaml_detail_update` | `token`, `updates` (JSON string) |
| IMPL: set `essence_pseudocode` only | `impl_detail_set_essence_pseudocode` | `token`, and **exactly one of** `essence_pseudocode` **or** `essence_pseudocode_path` (file under TIED base); optional `metadata_last_updated`. `tied-cli:` `TIED_CLI_IMPL_ESSENCE_FILE` or `TIED_CLI_IMPL_ESSENCE_STDIN=1` to supply the body without a huge JSON string. |
| Delete detail file | `yaml_detail_delete` | `token`; optional `sync_index` |
| REQ ↔ ARCH/IMPL traceability | `get_decisions_for_requirement`, `get_requirements_for_decision` | requirement or decision token |
| Rename token everywhere | `tied_token_rename` | `old_token`, `new_token`; optional `dry_run`, `include_markdown`, `extra_globs`, `extra_extensions` |
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
| Wrong or missing `TIED_BASE_PATH` | **STOP**. Ensure the MCP server targets **this workspace’s** `tied/` directory (must be **under the workspace root**). **`copy_files.sh` does not modify `.cursor/mcp.json`** — edit it so `mcpServers.tied-yaml.env.TIED_BASE_PATH` is **`<workspace>/tied`** (e.g. **`${workspaceFolder}/tied`**) and **`command`** is **`tied-yaml`** (preferred) with **`args: []`**, *or* **`node`** + path to **`dist/index.js`** if the CLI is not on `PATH`; re-check with `tied_config_get_base_path`. For terminal-only automation, set **`TIED_BASE_PATH`** and use **`TIED_MCP_CMD` / `TIED_MCP_BIN`** for **`tied-cli.sh`** (see `.cursor/skills/tied-yaml/SKILL.md`). | “Quick fix” by pointing at another repo’s `tied/` (risk: silent writes to the wrong project) |
| Invalid JSON in `record` / `updates` | Fix quoting; retry with smaller `updates` chunk | Switch to full-file `Write` on the same path |
| Tool timeout / transient error | Retry; narrow the operation (single token) | Immediately fall back to direct file edit |
| `tied_validate_consistency` fails | Fix the reported token/path via MCP or LEAP stack; re-run validation | Mark work complete while consistency is failing |
| **`metadata.created` / `registered` missing after an update** | First upgrade mcp-server (deep-merge fix). Then: `yaml_detail_read` / `yaml_index_read`, restore dropped keys in one follow-up `yaml_*_update`, then §5 | Assume the field was never authored—silent loss breaks audit trails |

---

## 5. After writes: validation loop

Align with `[PROC-YAML_EDIT_LOOP]` and **sub-yaml-edit-loop** in [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md):

1. Prefer **MCP** for the mutation (§ 1).
2. On any path you **direct-edited** (exception only), run `scripts/yaml_tool.sh <file> [file ...]` or `scripts/lint_yaml.sh <file> [file ...]` (or `lint_yaml` if installed) until it passes.
   - Never run raw multi-argument `yq -i -P file1 file2 ...`; it can merge documents and corrupt files.
   - If you can only use `yq` directly, run `yq -i -P <file>` in a per-file loop.
3. Run **`tied_validate_consistency`** before marking TIED work complete (and when the checklist calls for it).

---

## 6. References

- Tool and resource catalog: [mcp-server/README.md](../../mcp-server/README.md)
- Agent directive (MCP-first): [ai-agent-tied-mcp-usage.md](ai-agent-tied-mcp-usage.md)
- REQ checklist (session-bootstrap bootstrap, sub-yaml-edit-loop): [agent-req-implementation-checklist.md](agent-req-implementation-checklist.md)
