# Migration: Methodology vs project YAML split

**Context**: [PROC-TIED_METHODOLOGY_READONLY]. TIED-sourced YAML is read-only in client projects and lives under `tied/methodology/`; client-specific data lives only in project YAML at the root of `tied/`. This allows methodology to be refreshed by re-running `copy_files.sh` without losing project data.

## Who needs to migrate

Projects that already have a single set of TIED YAML files under `tied/` (index YAMLs and detail files in `tied/requirements/`, etc.) with **both** inherited methodology tokens (e.g. REQ-TIED_SETUP, IMPL-MODULE_VALIDATION) **and** project-specific tokens in the same files.

New projects that run `copy_files.sh` from a TIED repo that uses this layout get the split automatically: `tied/methodology/` is populated and overwritten on each copy; project files are created empty if missing.

## One-time migration steps

1. **Identify methodology tokens**  
   From the TIED repo’s `templates/` (or current `copy_files.sh` source), note which tokens exist in:
   - `templates/requirements.yaml`, `templates/architecture-decisions.yaml`, `templates/implementation-decisions.yaml`, `templates/semantic-tokens.yaml`
   - `templates/requirements/*.yaml`, `templates/architecture-decisions/*.yaml`, `templates/implementation-decisions/*.yaml`

2. **Refresh methodology in the client**  
   Run `copy_files.sh` from the TIED repo targeting your project. This creates (or overwrites) `tied/methodology/` with the current methodology index and detail files. Do **not** edit `tied/methodology/` afterward.

3. **Move project-only content to project YAML**  
   - If your project’s `tied/requirements.yaml` (and other index files) currently contain **only** methodology tokens: you can replace them with empty/minimal project indexes so that from now on you add only project tokens there. The merged view (methodology + project) is provided by the MCP server and validation.
   - If your project’s `tied/requirements.yaml` (and other index files) contain **both** methodology and project tokens: copy **only** the project tokens (and their `detail_file` paths) into new project index files. Move the corresponding detail files from `tied/requirements/` (etc.) so that project-only tokens point to detail files under `tied/requirements/`, `tied/architecture-decisions/`, `tied/implementation-decisions/` at the root of `tied/`. Leave methodology tokens out of the project index; they are supplied from `tied/methodology/` when reading.

4. **Ensure project index and detail dirs exist**  
   After migration, at the root of `tied/` you should have:
   - `requirements.yaml`, `architecture-decisions.yaml`, `implementation-decisions.yaml`, `semantic-tokens.yaml` (project-only tokens, or empty `{}`).
   - `requirements/`, `architecture-decisions/`, `implementation-decisions/` containing only project detail `.yaml` files.

5. **Validate**  
   Run `tied_validate_consistency` (MCP) to confirm indexes, detail files, and traceability are consistent. Fix any reported issues.

## Optional: scripted migration

If you have many project tokens, you can script step 3: for each index, load the current file, subtract the set of methodology token keys (from TIED `templates/`), and write the remaining keys (and their records) to the project index file; then move or copy only the detail files for those project tokens into the project detail dirs. Methodology detail files need not be copied into the client’s `tied/`; they are read from `tied/methodology/` after `copy_files.sh` runs.

## Backward compatibility

If `tied/methodology/` does not exist (e.g. an old client that has not run the new `copy_files.sh`), the MCP server and loader behave as before: a single set of files under `tied/` is used for both read and write. To adopt the split, run `copy_files.sh` and then perform the migration above so that project-only data lives in project YAML.
