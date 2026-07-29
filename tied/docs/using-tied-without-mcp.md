# Using TIED without MCP

TIED is designed for **MCP-based generation and management**: the primary way to work with requirements, architecture, and implementation decisions is via the TIED MCP server (tools and resources). If you do not use MCP, this document describes the standalone workflow.

## Bootstrap

Run from your project root:

```bash
./bootstrap_without_mcp.sh /path/to/project
```

Or use `./copy_files.sh /path/to/project` — you get the same result. Your project will have a `tied/` directory with:

- **Methodology** (read-only): `tied/methodology/` contains index YAMLs and inherited detail files from TIED. Do not edit these; they are overwritten when you re-run `copy_files.sh` to refresh the methodology.
- **Project** (your data): `tied/requirements.yaml`, `tied/architecture-decisions.yaml`, `tied/implementation-decisions.yaml`, `tied/semantic-tokens.yaml`, and `tied/requirements/`, `tied/architecture-decisions/`, `tied/implementation-decisions/` hold only your project's tokens. These are never overwritten by `copy_files.sh`.
- **Guide and schema documents** (methodology help): `tied/docs/requirements.md`, `tied/docs/architecture-decisions.md`, `tied/docs/implementation-decisions.md`, `tied/docs/processes.md`, `tied/docs/semantic-tokens.md`, `tied/docs/detail-files-schema.md`, and related files under `tied/docs/`. `copy_files.sh` copies the canonical set from the TIED source tree’s `tied/docs/` into the client.

## Managing REQ/ARCH/IMPL

Add or edit entries **only in project YAML**, not in methodology YAML. Methodology YAML under `tied/methodology/` is read-only and is refreshed by re-running `copy_files.sh` from the TIED repo; it does not hold client-specific data.

- **Indexes**: Add or edit entries in **project** index files: `tied/requirements.yaml`, `tied/architecture-decisions.yaml`, `tied/implementation-decisions.yaml`. Each top-level key is a token (e.g. `REQ-TIED_SETUP`). Do not edit `tied/methodology/*.yaml`.
- **Detail files**: Add or edit YAML files in `tied/requirements/*.yaml`, `tied/architecture-decisions/*.yaml`, `tied/implementation-decisions/*.yaml`. One token per file; the top-level key must be the token id. Schema: [detail-files-schema.md](detail-files-schema.md).
- **Token registry**: Keep **project** `tied/semantic-tokens.yaml` updated when you add or rename tokens so the registry matches what you use in code and docs.

## Code and tests

Use `[REQ-*]`, `[ARCH-*]`, and `[IMPL-*]` in code comments and test names. Follow the traceability chain: requirements → architecture → implementation. See [ai-principles.md](./ai-principles.md) and [../../AGENTS.md](../../AGENTS.md) for the full methodology (`tied/docs/` and project root).

## Optional validation

If your project has a token validation script (e.g. `./scripts/validate_tokens.sh`), run it to check that the registry and references are in sync.

## Reference

- Guide docs in your project's `tied/` (e.g. `tied/docs/requirements.md`, `tied/docs/architecture-decisions.md`) explain structure and conventions.
- [ai-principles.md](./ai-principles.md) (under `tied/docs/`) and [AGENTS.md](../../AGENTS.md) at project root describe the methodology in full.
