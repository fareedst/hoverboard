# Bundled `tied-yaml` skill (canonical for `copy_files.sh`)

This tree is the **git-tracked** source for the tied-yaml Cursor skill and `tied-cli.sh`. [`copy_files.sh`](../../copy_files.sh) installs it into client projects at **`.cursor/skills/tied-yaml/`** on every run (overwritten).

**Precedence when copying:** `tools/bundled-tied-yaml-skill/` is always used when `scripts/tied-cli.sh` is present. The TIED repo’s gitignored **`.cursor/skills/tied-yaml/`** is used only when this bundle is missing or incomplete (non-canonical; `copy_files.sh` warns).

**Maintenance:** Edit files here (or sync local dev copies **into** this directory). After changing **`.cursor/skills/tied-yaml/`** locally, copy the same files into this bundle so bootstraps and CI stay consistent:

```bash
cp -R .cursor/skills/tied-yaml/* tools/bundled-tied-yaml-skill/
# or update individual files (SKILL.md, reference.md, scripts/tied-cli.sh, scripts/tied-mcp-stdio-client.cjs)
```

Do not rely on the gitignored `.cursor/` tree as the bootstrap source.

**`TIED_REPO_ROOT` in client `tied-cli.sh`:** On install, `copy_files.sh` replaces the placeholder in `scripts/tied-cli.sh` with the absolute TIED source path so the client CLI uses that repo’s built `mcp-server/dist/index.js`. If you move the TIED clone, re-run `copy_files.sh` on each client project to refresh the baked path.
