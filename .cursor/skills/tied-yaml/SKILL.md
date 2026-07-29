---
name: tied-yaml
description: >-
  Read and write TIED REQ/ARCH/IMPL YAML records via the tied-yaml CLI.
  Use when working with requirements.yaml, architecture-decisions.yaml,
  implementation-decisions.yaml, semantic-tokens.yaml, detail files under
  tied/, or any task involving REQ-*, ARCH-*, IMPL-* tokens, traceability,
  or TIED validation. This is the exclusive interface for TIED YAML mutations.
---
# TIED YAML Skill

In TIED-**client** checkouts, this skill is installed to **`.cursor/skills/tied-yaml/`** (via `copy_files.sh`). The path **`tools/bundled-tied-yaml-skill/`** exists only in the TIED **source** tree; do not look for it at the project root in client projects. **AGENTS.md** §1 describes the same `tied-cli` / `TIED_MCP_BIN` discovery path.

All reads and writes to REQ, ARCH, and IMPL **YAML** records (indexes, `IMPL-*.yaml` detail files, and other structured TIED YAML) **must** go through the `tied-yaml` tooling. Direct file edits (`Write`, `StrReplace`, `sed`, etc.) on those paths produce invalid output (unquoted colons, broken indentation, duplicate keys). The tied-yaml server emits safe, schema-conformant YAML every time. **Exception:** the plain-text **pseudo-code sidecar** `tied/implementation-decisions/IMPL-*-pseudocode.md` may be edited **directly** in the editor when that is most efficient, then run **`tied_validate_consistency`**; or use **`impl_detail_set_essence_pseudocode`** with an inline string, `essence_pseudocode_path`, or **`tied-cli.sh`** with `TIED_CLI_IMPL_ESSENCE_FILE` / `TIED_CLI_IMPL_ESSENCE_STDIN` (see the `tied-cli.sh` header). Do not re-encode the sidecar as JSON when a direct edit or file path is simpler. **Preference:** for non-trivial or growing IMPLs, the **sidecar** is the primary artifact (diffable, avoids YAML body pitfalls); a **canonical** hand-authored body template lives at `templates/impl-essence-pseudocode-template.md` (methodology repo) — see `tied/docs/pseudocode-writing-and-validation.md` and `tied/docs/pseudocode-format-and-practices.md`.

## Prerequisites

- **Node >= 18** on `PATH`.
- **Built MCP server**: a **`dist/index.js`** from the TIED `mcp-server` package (build in your TIED repository clone: `npm install && npm run build --prefix mcp-server`).

### Cursor MCP vs `tied-cli.sh`

- **Registering `tied-yaml` in Cursor** (`.cursor/mcp.json` / **Settings → MCP**) is for **in-editor** tool calls. It is **optional** for shell use.
- **`tied-cli.sh`** talks to the **same** server over **stdio** (`node …/dist/index.js`). An empty MCP server list in the IDE does **not** mean `tied-cli.sh` cannot run — it means only that the editor has not loaded that MCP entry (common in CI, sandboxes, or before `agent enable tied-yaml`).
- **Default MCP binary**: After **`copy_files.sh`**, `tied-cli.sh` bakes **`TIED_REPO_ROOT`** (and thus default **`TIED_MCP_BIN`**) to the TIED repository that ran bootstrap (`…/mcp-server/dist/index.js`). Client projects usually **do not** vendor `mcp-server/` at the project root; rely on the baked path or set **`TIED_MCP_BIN`** / **`TIED_REPO_ROOT`** to override.
- **Shell alone is not enough:** `tied-cli.sh` in `.cursor/skills/tied-yaml/scripts/` plus Node; setting only **`TIED_MCP_BIN`** in the environment without the script does not provide the JSON-RPC client.

### Environment overrides

```bash
TIED_BASE_PATH=/absolute/path/to/tied \
TIED_MCP_BIN=/absolute/path/to/tied-repository/mcp-server/dist/index.js \
  .cursor/skills/tied-yaml/scripts/tied-cli.sh yaml_index_list_tokens '{"index":"requirements"}'
```

- **`TIED_BASE_PATH`** — absolute path to the project’s **`tied/`** directory (defaults to `<client_repo_root>/tied` when unset).
- **`TIED_REPO_ROOT`** — TIED methodology repository used for **`mcp-server`** (baked by **`copy_files.sh`**; override if the TIED clone moved).
- **`TIED_MCP_BIN`** — absolute path to **`mcp-server/dist/index.js`** (defaults to `$TIED_REPO_ROOT/mcp-server/dist/index.js`).
- **`TIED_MCP_COLLECT_METRICS`** — set to `1` or `true` to append local usage metrics JSONL (default **off**). Works for **`tied-cli.sh`** and IDE MCP when the server inherits the same env.
- **`TIED_MCP_METRICS_PATH`** — optional override; default `~/.cursor/logs/tied-mcp-metrics.jsonl`.
- Analyze with **`scripts/analyze_tied_mcp_metrics.rb`** in the TIED repo (see `docs/conversation-analysis-tools.md`). Traceability: [REQ-MCP_USAGE_METRICS], [IMPL-MCP_USAGE_METRICS].

### Do not substitute Python for TIED validation

Do **not** replace `tied-cli.sh` tools (especially **`tied_validate_consistency`**) with ad-hoc **`python3` + PyYAML** parsing when the goal is TIED consistency — that skips schema and graph checks. If neither Node nor a built server is available, follow **`tied/docs/using-tied-without-mcp.md`** for the documented manual project-YAML workflow instead of inventing a parser script.

## The CLI wrapper

All operations use the wrapper script at `.cursor/skills/tied-yaml/scripts/tied-cli.sh`. It speaks MCP JSON-RPC over stdio to the same binary Cursor uses when the **`tied-yaml`** MCP server is enabled.

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh <tool_name> '<args_json>'
```

**Args from file (no nested shell escaping):** if the second argument starts with `@`, the rest is a path to a UTF-8 JSON file used as the tool arguments object (e.g. `tied-cli.sh tied_token_create_with_detail @/tmp/payload.json`).

**Large payloads:** any arguments other than exactly `{}` are written to a **temp file** and passed to the MCP stdio client as **`TIED_CLI_ARGS_FILE`** (not `TIED_CLI_ARGS_JSON`), so **`tied_token_create_with_detail`** and other tools are not limited by **`execve` environment size** (often ~128KB–2MB per process). The client builds the JSON-RPC `tools/call` line with **`JSON.stringify`**. Prefer **`@file`** for rich REQ/ARCH/IMPL creates.

## Routing mandate

| Rule | Action |
|------|--------|
| **DO** | Use `tied-cli.sh` for every read and write of TIED **YAML** and structured TIED data (the paths the MCP server manages). |
| **DO** | For IMPL pseudo-code **body** only, you may edit `tied/implementation-decisions/IMPL-*-pseudocode.md` directly, or set it via `impl_detail_set_essence_pseudocode` / `tied-cli` file or stdin; then `tied_validate_consistency`. |
| **DO NOT** | Use `Write`, `StrReplace`, `apply_patch`, or shell `sed`/`awk` on TIED **YAML** or index files under `tied/` (see **CITDP** and **exception** below). The pseudo-code sidecar `.md` is plain UTF-8, not YAML—MCP/CLI is still available but not mandatory for the body. |
| **DO NOT** | Use ad-hoc Python YAML parsing instead of **`tied-cli.sh`** / **`tied_validate_consistency`** for TIED consistency checks. |
| **NEVER** | Edit files under `tied/methodology/` -- that tree is read-only. |
| **Exception** | If no tool supports the operation, document the gap (one line), direct-edit the minimal file, then validate. |
| **CITDP** | For `tied/citdp/CITDP-*.yaml` records, use MCP tool **`citdp_record_write`** when available; otherwise document the one-line gap, write the minimal CITDP file, then run **`lint_yaml`** per the checklist. |

## Quick start

**List all requirement tokens:**

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh yaml_index_list_tokens '{"index":"requirements"}'
```

**Read a single index record:**

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh yaml_index_read '{"index":"requirements","token":"REQ-TIED_SETUP"}'
```

**Read a detail file:**

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh yaml_detail_read '{"token":"REQ-TIED_SETUP"}'
```

**Create a new token (index + detail in one step):**

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh tied_token_create_with_detail '{
  "token": "REQ-MY_FEATURE",
  "index_record": "{\"name\":\"My Feature\",\"category\":\"Functional\",\"priority\":\"P1\",\"status\":\"Planned\"}",
  "detail_record": "{\"name\":\"My Feature\",\"category\":\"Functional\",\"priority\":\"P1\",\"status\":\"Planned\",\"description\":\"What this feature does\",\"rationale\":{\"why\":\"Why it is needed\"},\"satisfaction_criteria\":[{\"criterion\":\"Measurable outcome\"}]}"
}'
```

**Validate consistency:**

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh tied_validate_consistency '{}'
```

## Core operations

### Reading

| Goal | Tool | Key args |
|------|------|----------|
| Read entire index or one record | `yaml_index_read` | `index` (required), `token` (optional). **Index rows do not include `essence_pseudocode`;** use `yaml_detail_read` / `yaml_detail_read_many` for IMPL bodies and pseudo-code. |
| List all tokens | `yaml_index_list_tokens` | `index`; optional `type` for semantic-tokens |
| Filter by field value | `yaml_index_filter` | `index`, `field`, `value` |
| Read one detail file | `yaml_detail_read` | `token`. For IMPL, `essence_pseudocode` is merged from `tied/implementation-decisions/IMPL-*-pseudocode.md` when that file exists. |
| Read many details at once | `yaml_detail_read_many` | `tokens` array or `type` (`requirement`, `architecture`, `implementation`) |
| List tokens that have detail files | `yaml_detail_list` | `type` |

Index names: `requirements`, `architecture`, `implementation`, `semantic-tokens`.

### Writing

| Goal | Tool | Key args |
|------|------|----------|
| Insert new index row | `yaml_index_insert` | `index`, `token`, `record` (JSON string) |
| Merge fields into index row | `yaml_index_update` | `index`, `token`, `updates` (JSON string) |
| Create detail file | `yaml_detail_create` | `token`, `record` (JSON string); `sync_index` (default true) |
| Merge fields into detail | `yaml_detail_update` | `token`, `updates` (JSON string) |
| Append bullets to `implementation_approach.details` | `yaml_detail_append_implementation_approach_details` | `token`, `details_lines` (array of strings)—appends without dropping existing lines |
| Delete detail file | `yaml_detail_delete` | `token`; `sync_index` (default true) |
| Create token + index + detail | `tied_token_create_with_detail` | `token`, `index_record`, `detail_record` (JSON strings) |
| Rename a token everywhere | `tied_token_rename` | `old_token`, `new_token`; optional `dry_run`, `include_markdown`, `extra_globs`, `extra_extensions` |

The `record`, `updates`, `index_record`, and `detail_record` parameters accept a **JSON string**. Escape inner quotes appropriately.

**Nested `updates`:** Current **mcp-server** deep-merges one level for `metadata`, `traceability`, `related_requirements`, `related_decisions`, `rationale`, and `implementation_approach` (partial `metadata` keeps `metadata.created`; when `metadata.last_updated` / `metadata.last_validated` are objects on both sides, sub-keys merge one level). Arrays such as `cross_references` still replace wholesale—send the full array when updating.

**`implementation_approach.details`:** Under `yaml_detail_update` / `yaml_index_update`, `implementation_approach` is merged one level, so the **`details` array is replaced in full** whenever your `updates` include `implementation_approach.details`. To add lines without re-sending the whole list, use **`yaml_detail_append_implementation_approach_details`**. If you use `yaml_detail_update`, send the **complete** `details` list (same rule as `cross_references`). Keep **index** and **detail** `implementation_approach` in sync when your project duplicates that block on both.

Re-read after critical writes; on older server builds, merge client-side per `docs/yaml-update-mcp-runbook.md` §2.1. For IMPL-only pseudo-code edits, prefer **`impl_detail_set_essence_pseudocode`** (writes the **`IMPL-*-pseudocode.md` sidecar**, not inline YAML) or open-edit that `.md` and validate. For several writes in one process, use **`yaml_updates_apply`** (`dry_run: true` first to preview). **`yaml_detail_read`** for IMPL-* may show `essence_pseudocode: null` only when the field is absent; use detail reads, not index reads, for pseudo-code text.

### Traceability

| Goal | Tool | Key args |
|------|------|----------|
| REQ -> ARCH/IMPL decisions | `get_decisions_for_requirement` | `requirement_token` |
| ARCH/IMPL -> REQs | `get_requirements_for_decision` | `decision_token` |

### Validation

| Goal | Tool | Key args |
|------|------|----------|
| YAML syntax check | `yaml_index_validate` | (none) |
| Full consistency check | `tied_validate_consistency` | optional: `include_detail_files`, `include_pseudocode`, `require_detail_record` |
| Detect dependency cycles | `tied_cycles` | optional `graph`: `requirements` or `implementation` |

### Planning and analysis

| Goal | Tool | Key args |
|------|------|----------|
| Backlog views | `tied_backlog` | `view`: `order`, `quick-wins`, `blockers`, or `critical` |
| Scoped analysis | `tied_scoped_analysis_run` | `mode`: `walk_summary`, `token_scan`, `gap_report`, `impact_preview`, `traceability_gap_report` |
| Git diff impact | `tied_plumb_diff_impact_preview` | optional `selection`: `staged`, `unstaged`, or `both` |

### Status from test results

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh tied_verify '{
  "passed_requirement_tokens": ["REQ-MY_FEATURE"],
  "passed_impl_tokens": ["IMPL-MY_FEATURE"]
}'
```

This sets matching REQ status to `Implemented` and IMPL status to `Active`. Use optional `set_unpassed_reqs_to_planned` / `set_unpassed_impl_to_planned` to demote others.

## Validation loop

After any write operation:

1. Run `tied_validate_consistency` and inspect the output.
2. Fix any reported issues using the appropriate write tool.
3. Repeat until validation passes.
4. Only then mark the TIED work complete.

```bash
.cursor/skills/tied-yaml/scripts/tied-cli.sh tied_validate_consistency '{}'
```

## Working with `semantic-tokens.yaml`

The token registry is an index like the others. Keep it in sync when you add or rename tokens:

```bash
# Read the registry
.cursor/skills/tied-yaml/scripts/tied-cli.sh yaml_index_read '{"index":"semantic-tokens","token":"REQ-MY_FEATURE"}'

# Insert a new token entry
.cursor/skills/tied-yaml/scripts/tied-cli.sh yaml_index_insert '{
  "index": "semantic-tokens",
  "token": "REQ-MY_FEATURE",
  "record": "{\"type\":\"REQ\",\"name\":\"My Feature\",\"status\":\"Active\",\"description\":\"Short description\",\"cross_references\":[\"ARCH-MY_FEATURE\"],\"source_index\":\"requirements.yaml\"}"
}'
```

## Error handling

| Symptom | Fix |
|---------|-----|
| "MCP server not built" | Build in the TIED repo (`npm run build --prefix mcp-server`) and/or set **`TIED_MCP_BIN`** to that **`dist/index.js`** |
| IDE shows no MCP servers | Normal for some environments; **`tied-cli.sh`** still works via **`TIED_MCP_BIN`** + Node — see Prerequisites |
| "No response from tool" | Check tool name spelling; verify `args_json` is valid JSON |
| Invalid JSON in `record`/`updates` | Fix quoting -- inner values must be a JSON string, e.g. `"{\"key\":\"val\"}"` |
| "Methodology" / "read-only" error | You are targeting `tied/methodology/` -- only project YAML is writable |
| Validation fails after write | Fix via the appropriate MCP write tool; do not direct-edit |

## TIED data layout

```
tied/
  requirements.yaml                 # REQ index
  architecture-decisions.yaml       # ARCH index
  implementation-decisions.yaml     # IMPL index
  semantic-tokens.yaml              # token registry
  requirements/REQ-*.yaml           # REQ detail files
  architecture-decisions/ARCH-*.yaml # ARCH detail files
  implementation-decisions/IMPL-*.yaml # IMPL detail files
  methodology/                      # READ-ONLY (inherited from TIED)
  docs/detail-files-schema.md       # schema for detail YAML files
```

## Additional resources

- **Central index (easiest YAML update paths):** in this repository, [tied/docs/tied-yaml-agent-index.md](../../tied/docs/tied-yaml-agent-index.md) links the skill, MCP runbook, checklist, schema, and payload guidance in one place.
- For the complete catalog of tools with full parameter schemas, see [reference.md](reference.md).
- For detail file field schemas, read `tied/docs/detail-files-schema.md`.
- For the TIED methodology and agent obligations, read `AGENTS.md` at the repo root.
