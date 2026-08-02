# [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
# Summary: Bootstrap TIED layout from templates via copy_files.sh — indexes, guides, detail dirs, AGENTS.md family, vocabulary seed/merge, implementation pseudo-code sidecars, and tied-yaml skill.

# [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
# How: Contract — INPUT/OUTPUT/DATA for BOOTSTRAP_TIED below; these fields define the bootstrap boundary.
# [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
# How: INPUT — project root; template source directory (TIED repo templates/ or equivalent); TIED source root (SCRIPT_DIR).
# [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
# How: OUTPUT — created or updated files under tied/ and selected root files; process exit status.
# [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
# How: DATA — requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml, semantic-tokens.yaml; methodology tree under tied/methodology/ when copied; tied/vocab/*.md when seeded or merged; IMPL-*-pseudocode.md sidecars under methodology/implementation-decisions/.

procedure BOOTSTRAP_TIED(projectRoot):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Bootstrap or refresh the client layout while preserving client-owned project YAML and existing vocabulary.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Ensure tied/ exists; copy template indexes, detail YAML, and implementation pseudo-code sidecars; copy guide/schema docs from tied/docs/ in the TIED source per copy_files.sh; create detail subdirs; copy AGENTS.md, .cursorrules to project root.
  Contract:
    INPUT: projectRoot; template source; TIED source root; optional merge-vocab flag
    OUTPUT: bootstrapped or refreshed client layout; process exit status
    DATA: project YAML; inherited methodology files; client vocabulary files
    CONTROL: preserve client project YAML and existing vocabulary; overwrite inherited methodology content
    PRE: projectRoot is a writable client directory; template source and required TIED source paths are readable
    POST: required TIED indexes, docs, detail directories, skill, and vocabulary policy outputs exist; failure returns non-zero
    EFFECTS: File I/O — creates or updates selected client files; Process — invokes helper copy and patch operations
    FAILURE_MODES: MISSING_TEMPLATE_SOURCE; UNWRITABLE_DESTINATION; SKILL_INSTALL_FAILED; COPY_FAILED; VOCABULARY_SOURCE_MISSING
    DATA_TRANSITION: client layout absent|stale→bootstrapped|refreshed; inherited methodology old→current; client project YAML unchanged
    TERMINATION: total — finite target list and finite vocabulary/file loops
  ON missing template source or unwritable destination: exit non-zero with actionable message
  FOR each copy_files.sh target: apply copy or merge policy; never overwrite client project-only YAML with empty templates where script forbids
  CALL INSTALL_TIED_YAML_SKILL(projectRoot)
  CALL SEED_DOMAIN_VOCAB(projectRoot)
  CALL MERGE_DOMAIN_VOCAB(projectRoot) WHEN --merge-vocab is supplied
  RETURN success

procedure INSTALL_TIED_YAML_SKILL(projectRoot):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Install the canonical or explicitly permitted fallback skill, then patch its TIED repository root.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Copy tied-yaml skill from tools/bundled-tied-yaml-skill/ (canonical); dev fallback .cursor/skills/tied-yaml only if bundle incomplete; overwrite each run; chmod tied-cli.sh executable.
  Contract:
    INPUT: projectRoot; canonical bundled skill; development fallback skill
    OUTPUT: installed projectRoot/.cursor/skills/tied-yaml/ with executable tied-cli.sh
    DATA: skill files; TIED_REPO_ROOT marker
    CONTROL: canonical bundle preferred; fallback allowed only when bundle is incomplete; overwrite inherited skill files
    PRE: projectRoot is writable; at least one complete skill source is readable
    POST: installed skill is complete, tied-cli.sh is executable, and its repository-root marker is patched
    EFFECTS: File I/O — copies and modifies skill files; Process — invokes chmod and CLI-root patching
    FAILURE_MODES: BUNDLED_SKILL_INCOMPLETE; FALLBACK_SKILL_INCOMPLETE; SKILL_COPY_FAILED; CLI_PATCH_FAILED
    DATA_TRANSITION: skill absent|stale→installed current skill; marker unresolved→resolved
    TERMINATION: total — evaluate finite source candidates and one patch operation
  IF bundled skill at TIED_SOURCE/tools/bundled-tied-yaml-skill/scripts/tied-cli.sh is complete:
    copy bundled skill to projectRoot/.cursor/skills/tied-yaml/
  ELSE IF dev fallback at TIED_SOURCE/.cursor/skills/tied-yaml/scripts/tied-cli.sh is complete:
    warn non-canonical fallback; copy dev skill to projectRoot/.cursor/skills/tied-yaml/
  ELSE:
    exit non-zero with recovery instructions
  CALL PATCH_TIED_CLI_REPO_ROOT(projectRoot)
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Do not create projectRoot/scripts/tied-cli.sh; canonical stdio client is projectRoot/.cursor/skills/tied-yaml/scripts/tied-cli.sh only.

procedure PATCH_TIED_CLI_REPO_ROOT(projectRoot):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Resolve the installed CLI's repository marker once and leave already customized clients unchanged.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Replace TIED_REPO_ROOT placeholder in installed tied-cli.sh with realpath of TIED source so TIED_MCP_BIN resolves to TIED_SOURCE/mcp-server/dist/index.js on client projects.
  Contract:
    INPUT: projectRoot; TIED source real path
    OUTPUT: patched tied-cli.sh or an explicit non-fatal skip
    DATA: CLI text; TIED_REPO_ROOT marker
    CONTROL: replace the unsubstituted marker once; do not rewrite an already customized CLI
    PRE: projectRoot/.cursor/skills/tied-yaml/scripts/tied-cli.sh may exist and is readable if patching is required
    POST: an existing marker is replaced with the canonical TIED source path; missing CLI returns without mutation
    EFFECTS: File I/O — reads and conditionally rewrites one shell script; Process — runs inline Python replacement
    FAILURE_MODES: CLI_MISSING; CLI_UNREADABLE; MARKER_REPLACEMENT_FAILED; NON_FATAL_MARKER_ABSENT
    DATA_TRANSITION: marker placeholder→absolute TIED source path; absent CLI→unchanged
    TERMINATION: total — one file inspection and at most one replacement
  cliPath := projectRoot/.cursor/skills/tied-yaml/scripts/tied-cli.sh
  IF cliPath missing: RETURN
  IF cliPath contains unsubstituted marker /ABSOLUTE/PATH/TO/TIED/SOURCE/DIR:
    replace marker with realpath(TIED_SOURCE) once via python3 inline script
  ELSE IF marker line absent: warn and skip (non-fatal)

procedure SEED_DOMAIN_VOCAB(projectRoot):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-VOCABULARY_INDEX]
  # How: Seed canonical glossaries only for a client with no existing Markdown vocabulary.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-VOCABULARY_INDEX]
  # How: When client tied/vocab/ is missing or has no *.md files, copy all *.md from TIED_SOURCE/tied/vocab/ preserving basename (seed set includes routing.md as primary PRELOAD entry and domain-references.md as full on-demand catalog); never overwrite existing client vocab files.
  Contract:
    INPUT: projectRoot; canonical vocabulary source
    OUTPUT: seeded client tied/vocab/ or preserved existing vocabulary
    DATA: canonical glossary files; client glossary files
    CONTROL: seed only when the client has no Markdown glossary; preserve every existing client glossary
    PRE: vocabulary source and destination may be absent; destination can be created when writable
    POST: when source is non-empty and destination is empty, every canonical glossary is copied; otherwise client files remain unchanged
    EFFECTS: File I/O — creates a directory and copies glossary files; Diagnostics — reports skipped or empty-source cases
    FAILURE_MODES: VOCABULARY_SOURCE_MISSING; VOCABULARY_DESTINATION_UNWRITABLE; VOCABULARY_COPY_FAILED
    DATA_TRANSITION: vocabulary absent→seeded; existing client vocabulary→preserved
    TERMINATION: total — finite canonical glossary files
  dest := projectRoot/tied/vocab/
  IF dest has one or more *.md files: RETURN (client extensions preserved)
  IF TIED_SOURCE/tied/vocab/ missing or empty: warn; RETURN
  FOR each *.md in TIED_SOURCE/tied/vocab/: copy to dest preserving basename

procedure MERGE_DOMAIN_VOCAB(projectRoot):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-VOCABULARY_INDEX]
  # How: Add absent canonical glossary basenames under --merge-vocab without overwriting client glossaries.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-VOCABULARY_INDEX]
  # How: When --merge-vocab is supplied, add only canonical glossary filenames absent from projectRoot/tied/vocab/; preserve every existing client glossary and report added/preserved counts.
  Contract:
    INPUT: projectRoot; canonical vocabulary source; merge-vocab control
    OUTPUT: additive vocabulary changes; added and preserved counts
    DATA: canonical glossary files; client glossary files; merge counters
    CONTROL: add only absent basenames; never overwrite client-owned glossary content
    PRE: merge-vocab was explicitly supplied; source and destination paths are inspectable or creatable
    POST: each canonical basename is present; pre-existing client files retain their original content; counts describe observed actions
    EFFECTS: File I/O — creates destination and copies absent glossary files; Diagnostics — reports added and preserved counts
    FAILURE_MODES: VOCABULARY_SOURCE_MISSING; VOCABULARY_DESTINATION_UNWRITABLE; VOCABULARY_COPY_FAILED
    DATA_TRANSITION: client vocabulary set→union(client set, canonical set); existing file content unchanged
    TERMINATION: total — finite canonical glossary files
  dest := projectRoot/tied/vocab/
  IF TIED_SOURCE/tied/vocab/ missing or empty: warn; RETURN
  FOR each *.md in TIED_SOURCE/tied/vocab/:
    IF dest/basename(file) is absent: copy file preserving basename
    ELSE: preserve existing client file

procedure COPY_IMPLEMENTATION_PSEUDOCODE_SIDECARS(projectRoot):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Refresh inherited IMPL sidecars from templates while leaving project-owned implementation decisions untouched.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP]
  # How: Copy template IMPL-*-pseudocode.md files into projectRoot/tied/methodology/implementation-decisions/ on every refresh so inherited Active IMPL behavior remains available to merged-view validation.
  Contract:
    INPUT: projectRoot; template implementation-decision sidecar directory
    OUTPUT: refreshed inherited pseudo-code sidecars under projectRoot/tied/methodology/implementation-decisions/
    DATA: canonical IMPL sidecars; inherited client sidecars
    CONTROL: overwrite inherited sidecars from canonical templates; do not touch project-owned implementation decisions
    PRE: template sidecar directory is readable; destination is writable or creatable
    POST: every canonical IMPL-*-pseudocode.md has a matching current inherited copy
    EFFECTS: File I/O — creates destination and overwrites inherited sidecars
    FAILURE_MODES: SIDECAR_SOURCE_MISSING; SIDECAR_DESTINATION_UNWRITABLE; SIDECAR_COPY_FAILED
    DATA_TRANSITION: inherited sidecars old|absent→canonical current set
    TERMINATION: total — finite canonical sidecar files
  FOR each IMPL-*-pseudocode.md in TIED_SOURCE/templates/implementation-decisions/:
    copy file to projectRoot/tied/methodology/implementation-decisions/ overwriting inherited copy

procedure CANONICALIZE_YAML_FILE(path):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-YAML_EDIT_LOOP]
  # How: Canonicalize one YAML file with one yq invocation and expose its exit status.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-YAML_EDIT_LOOP]
  # How: Run one yq process: yq -i 'sort_keys(.. style="double")' path — recursive key sort + double-quoted scalars (double-quoted scalar lint). Bool/int become string scalars on disk; never pass multiple paths to one yq. Same expression as mcp-server token-rename pretty-print.
  Contract:
    INPUT: one YAML file path
    OUTPUT: canonicalized YAML file; yq exit status
    DATA: YAML mapping or sequence at path
    CONTROL: one path per invocation; recursive key sort and double-quoted scalar style
    PRE: path exists and is a regular writable YAML file; yq is available
    POST: file is rewritten in canonical format when yq succeeds; non-zero status identifies failure
    EFFECTS: File I/O — rewrites one YAML file; Process — invokes yq
    FAILURE_MODES: PATH_MISSING; PATH_NOT_REGULAR; YAML_PARSE_FAILED; YQ_UNAVAILABLE; YQ_WRITE_FAILED
    DATA_TRANSITION: valid YAML non-canonical→valid canonical YAML; invalid or inaccessible→unchanged with failure
    TERMINATION: total — one yq invocation
  IF path missing or not a regular file: RETURN error
  RUN yq -i 'sort_keys(.. style="double")' path
  RETURN yq exit status

procedure LINT_YAML_PATHS(paths):
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-YAML_EDIT_LOOP]
  # How: Attempt each YAML path independently and aggregate the observed canonicalization statuses.
  # [IMPL-TIED_FILES] [ARCH-TIED_STRUCTURE] [REQ-TIED_SETUP] [PROC-YAML_EDIT_LOOP]
  # How: For each path, CALL CANONICALIZE_YAML_FILE independently (scripts/yaml_tool.sh / lint_yaml default); aggregate exit status. Optional --sort-lists / --sort-keys remain a separate Ruby path (SORT_QUALIFYING_LIST_GROUPS in processes.md).
  Contract:
    INPUT: finite list of YAML paths
    OUTPUT: aggregate lint exit status
    DATA: per-path canonicalization statuses
    CONTROL: invoke canonicalization independently for every path; retain the latest non-zero status
    PRE: paths is finite; each path is intended to be validated independently
    POST: every supplied path was attempted; zero means all paths passed, non-zero identifies at least one failure
    EFFECTS: File I/O — each successful path may be rewritten; Process — invokes yq once per path
    FAILURE_MODES: EMPTY_PATH_LIST; PATH_VALIDATION_FAILED; YAML_PARSE_FAILED; YQ_UNAVAILABLE
    DATA_TRANSITION: input paths→per-path statuses→aggregate status
    TERMINATION: total — iterate finite paths
  rc := 0
  FOR each path in paths:
    st := CALL CANONICALIZE_YAML_FILE(path)
    IF st != 0: rc := st
  RETURN rc
