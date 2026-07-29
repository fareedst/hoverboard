# agentstream (canonical)

**Scope:** Go **`agentstream`** CLI and library (`stdd/agentstream`): configuration, pipeline turn assembly, text sources, feature-spec batch, TDD/checklist YAML rendering, session chaining, executor, non-compact HTML, checklist control trailer, and optional TIED MCP preflight. **Vocabulary only** — behavior in [`../../tools/agentstream/`](../../tools/agentstream/) and `IMPL-GOAGENT-*` pseudo-code sidecars.

**Traceability:** [REQ-GOAGENT-LIB-MODULE](../requirements/REQ-GOAGENT-LIB-MODULE.yaml) · [REQ-GOAGENT-CLI-CONFIG](../requirements/REQ-GOAGENT-CLI-CONFIG.yaml) · [REQ-GOAGENT-TEXT-SOURCES](../requirements/REQ-GOAGENT-TEXT-SOURCES.yaml) · [REQ-GOAGENT-FEATURESPEC-BATCH](../requirements/REQ-GOAGENT-FEATURESPEC-BATCH.yaml) · [REQ-GOAGENT-YAML-STEP-RENDER](../requirements/REQ-GOAGENT-YAML-STEP-RENDER.yaml) · [REQ-GOAGENT-PIPELINE-CHAIN](../requirements/REQ-GOAGENT-PIPELINE-CHAIN.yaml) · [REQ-GOAGENT-AGENT-EXECUTOR](../requirements/REQ-GOAGENT-AGENT-EXECUTOR.yaml) · [REQ-GOAGENT-NON-COMPACT-HTML-FORMAT](../requirements/REQ-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) · [REQ-GOAGENT-CHECKLIST-CONTROL](../requirements/REQ-GOAGENT-CHECKLIST-CONTROL.yaml)

**See also:** [`domain-references.md`](domain-references.md) · [`agent-stream-ruby.md`](agent-stream-ruby.md) · [`tied-methodology.md`](tied-methodology.md) · [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md) · [`../../tools/agentstream/README.md`](../../tools/agentstream/README.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid | Notes |
|-----------|-------|-------|
| **agentstream** | go agent, go runner | Product/CLI name; module `stdd/agentstream` |
| **Turn** | prompt, message (alone) | Struct: `Parts []string`, `ChainFromPrevious bool` |
| **ChainFromPrevious** | resume flag on turn | `true` → effective `--resume`; `false` → new session |
| **lead checklist** | agent checklist, REQ checklist | YAML from `--lead-checklist-yaml`; default `tied/docs/agent-req-implementation-checklist.yaml` |
| **feature-spec batch** | batch yaml, -b file | `--feature-spec-batch-yaml`; breaks session chain per record |
| **pipeline Build** | build turns | `pipeline.Build` — fixed source order |
| **ParseAndResolve** | parse argv | Entry config resolution in `config` package |
| **dry-run** | preview run | `-d` / `--dry-run`; prints argv per turn, no subprocess |
| **agentstream_control** | control json | Explicit fenced JSON schema for checklist routing ([REQ-GOAGENT-CHECKLIST-CONTROL](../requirements/REQ-GOAGENT-CHECKLIST-CONTROL.yaml)) |
| **run-feature-batch-agentstream** | tasd (alone) | Shell driver: `scripts/run-feature-batch-agentstream.sh` |

---

## Naming bridge: Go vs Ruby vs scripts

| Concept | Preferred (Go) | Ruby / legacy | Driver script |
|---------|----------------|---------------|---------------|
| Unified CLI | **agentstream** | `run_agent_stream.rb` | `run-feature-batch-agentstream.sh` |
| Module path | `tools/agentstream/` | `tools/agent-stream/` | — |
| TDD YAML expansion | `tddloop.LoadTurns` | `TddLoopPrompts` | both via `--tdd-yaml` |
| Feature batch | `featurespec.LoadTurns` | FeatureSpecBatchPrompts | `-b` / positional batch |
| Lead checklist | `checklist.LoadTurns` | (Go-first for full checklist) | `-c` |
| Stream JSON executor | `executor.Run` | `run_agent_stream_subprocess` | spawns `cursor agent` |

Full Ruby parity table: [`agent-stream-ruby.md`](agent-stream-ruby.md).

---

## Go packages (catalog)

| Package | Role | IMPL |
|---------|------|------|
| `cmd/agentstream` | CLI `main` | [IMPL-GOAGENT-CLI-CMD](../implementation-decisions/IMPL-GOAGENT-CLI-CMD.yaml) |
| `config` | `ParseAndResolve`, defaults | [IMPL-GOAGENT-CLI-CMD](../implementation-decisions/IMPL-GOAGENT-CLI-CMD.yaml) |
| `pipeline` | `Build`, preload, chain slice | [IMPL-GOAGENT-PIPELINE](../implementation-decisions/IMPL-GOAGENT-PIPELINE.yaml) |
| `text` | Argv and prompt files | [IMPL-GOAGENT-TEXT-SOURCES](../implementation-decisions/IMPL-GOAGENT-TEXT-SOURCES.yaml) |
| `featurespec` | Batch YAML → turns | [IMPL-GOAGENT-FEATURESPEC](../implementation-decisions/IMPL-GOAGENT-FEATURESPEC.yaml) |
| `tddloop` | TDD loop YAML → turns | [IMPL-GOAGENT-TDDLOOP](../implementation-decisions/IMPL-GOAGENT-TDDLOOP.yaml) |
| `checklist` | Lead checklist → turns | [IMPL-GOAGENT-CHECKLIST](../implementation-decisions/IMPL-GOAGENT-CHECKLIST.yaml) |
| `executor` | Subprocess + stream-json | [IMPL-GOAGENT-EXECUTOR](../implementation-decisions/IMPL-GOAGENT-EXECUTOR.yaml) |
| `htmlformat` | Non-compact HTML | [IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT](../implementation-decisions/IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) |
| `control` | Checklist control trailer | [IMPL-GOAGENT-CHECKLIST-CONTROL](../implementation-decisions/IMPL-GOAGENT-CHECKLIST-CONTROL.yaml) |
| `tiedpreflight` | Static MCP layout check | [REQ-GOAGENT-CLI-CONFIG](../requirements/REQ-GOAGENT-CLI-CONFIG.yaml) |
| (root) `agentstream` | `Turn`, `SessionID` types | [IMPL-GOAGENT-LIB-TYPES](../implementation-decisions/IMPL-GOAGENT-LIB-TYPES.yaml) |

---

## Pipeline turn order

Default **`pipeline.Build`** concatenation (see [IMPL-GOAGENT-PIPELINE-pseudocode.md](../implementation-decisions/IMPL-GOAGENT-PIPELINE-pseudocode.md)):

1. argv words (after `--`)
2. `--prompts-file` (not `--prompt-file` — preload handled separately)
3. `--tdd-yaml` paths
4. **`--feature-spec-batch-yaml`** then **`--lead-checklist-yaml`** (default)
5. `--verify-session` sentinel turn

**`--lead-checklist-before-feature`:** when both `-b` and `-c` set, steps 4–5 swap (checklist first, then feature-spec).

**`--prompt-file`:** not a pipeline turn; `ReadPromptFilePreload` + `ApplyPromptFilePreload` prepends one argv part per file on turns that start a **new** session.

---

## CLI flags (catalog)

| Flag | Config field | Notes |
|------|--------------|-------|
| `-d`, `--dry-run` | `DryRun` | No subprocess |
| `-s`, `--session-id` | `SessionID` | Required when `-f` > 1 |
| `-f`, `--first-turn` | `FirstTurn` | 1-based slice after Build |
| `-w`, `--workspace` | `Workspace` | Default cwd |
| `-c`, `--lead-checklist-yaml` | `LeadChecklistYAML` | Lead checklist path |
| `--lead-checklist-from-step` | `LeadChecklistStepFromID` | Inclusive lower bound (slug or id) |
| `--lead-checklist-to-step` | `LeadChecklistStepToID` | Inclusive upper bound |
| `--lead-checklist-skip-sub` | `LeadChecklistSkipSub` | Omit `sub_procedures` |
| `--lead-checklist-before-feature` | `LeadChecklistBeforeFeatureSpec` | Checklist before batch |
| `--checklist-var`, `--lead-checklist-var` | `ChecklistVars` | `KEY=VALUE`; expands `{{KEY}}` |
| `--checklist-var-strict` | `ChecklistVarStrict` | Or `AGENTSTREAM_CHECKLIST_VAR_STRICT=1` |
| `-p`, `--prompt-file` | `PromptFiles` | Preload on new-session turns |
| `--prompts-file` | `PromptsFiles` | One turn per file |
| `--tdd-yaml` | `TddYAMLs` | Repeatable |
| `-b`, `--feature-spec-batch-yaml` | `FeatureSpecBatchYAMLs` | Repeatable |
| `--preview-feature-spec-batch-yaml` | `PreviewFeatureSpecBatchYAML` | Early exit preview |
| `-o`, `--select-order` | `OrderFilterRaw` | Feature-spec order filter |
| `--verify-session` | `VerifySession` | Sentinel prompt turn |
| `--tied-mcp-preflight` | enables preflight | Or `AGENTSTREAM_TIED_MCP_PREFLIGHT=1` |
| `--skip-tied-mcp-preflight` | `SkipTiedMCPPreflight` | Default skip |
| `-y`, `--yes` | `AssumeTiedMCPYes` | Non-interactive preflight |
| `--mcp-json` | `MCPJSONPath` | Explicit `.cursor/mcp.json` |
| `--skip-workspace-preload` | `skipWorkspacePreload` | Or `AGENTSTREAM_SKIP_WORKSPACE_PRELOAD=1` |
| non-compact HTML flags | `NonCompactHTML`, indent | See [IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT](../implementation-decisions/IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) |

Workspace preload: when `tied/agent-preload-contract.yaml` exists, CLI prepends it before explicit `-p` paths unless skip preload.

---

## Core types

```go
type Turn struct {
    Parts []string
    ChainFromPrevious bool
}
type SessionID string
const VerifySessionPrompt = "what was the most recent prompt?"
```

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning IMPL |
|----------------|-------------------|-------------|
| CLI main | `main` | [IMPL-GOAGENT-CLI-CMD](../implementation-decisions/IMPL-GOAGENT-CLI-CMD.yaml) |
| Parse and resolve config | `ParseAndResolve` | [IMPL-GOAGENT-CLI-CMD](../implementation-decisions/IMPL-GOAGENT-CLI-CMD.yaml) |
| Build pipeline | `pipeline_Build` | [IMPL-GOAGENT-PIPELINE](../implementation-decisions/IMPL-GOAGENT-PIPELINE.yaml) |
| Read prompt preload | `ReadPromptFilePreload` | [IMPL-GOAGENT-PIPELINE](../implementation-decisions/IMPL-GOAGENT-PIPELINE.yaml) |
| Apply prompt preload | `ApplyPromptFilePreload` | [IMPL-GOAGENT-PIPELINE](../implementation-decisions/IMPL-GOAGENT-PIPELINE.yaml) |
| Chain between turns | `ChainBetween` | [IMPL-GOAGENT-PIPELINE](../implementation-decisions/IMPL-GOAGENT-PIPELINE.yaml) |
| Slice from first turn | `SliceFromFirstTurn` | [IMPL-GOAGENT-PIPELINE](../implementation-decisions/IMPL-GOAGENT-PIPELINE.yaml) |
| Text sources | `text_sources` | [IMPL-GOAGENT-TEXT-SOURCES](../implementation-decisions/IMPL-GOAGENT-TEXT-SOURCES.yaml) |
| Feature spec from YAML | `featurespec_from_yaml` | [IMPL-GOAGENT-FEATURESPEC](../implementation-decisions/IMPL-GOAGENT-FEATURESPEC.yaml) |
| TDD loop messages | `tddloop_messages` | [IMPL-GOAGENT-TDDLOOP](../implementation-decisions/IMPL-GOAGENT-TDDLOOP.yaml) |
| Checklist messages | `checklist_messages` | [IMPL-GOAGENT-CHECKLIST](../implementation-decisions/IMPL-GOAGENT-CHECKLIST.yaml) |
| Executor run | `executor_Run` | [IMPL-GOAGENT-EXECUTOR](../implementation-decisions/IMPL-GOAGENT-EXECUTOR.yaml) |
| Apply HTML to turns | `APPLY_TO_TURNS` | [IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT](../implementation-decisions/IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) |
| Format non-compact HTML | `FORMAT_NON_COMPACT_HTML` | [IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT](../implementation-decisions/IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) |
| Deterministic HTML | `DETERMINISTIC_NON_COMPACT_HTML_FOR_PART` | [IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT](../implementation-decisions/IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) |
| Integrate with main | `INTEGRATE_WITH_MAIN` | [IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT](../implementation-decisions/IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) |
| Map config to HTML options | `MAP_CONFIG_TO_HTMLFORMAT_OPTIONS` | [IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT](../implementation-decisions/IMPL-GOAGENT-NON-COMPACT-HTML-FORMAT.yaml) |
| Parse control JSON | `PARSE_CONTROL` | [IMPL-GOAGENT-CHECKLIST-CONTROL](../implementation-decisions/IMPL-GOAGENT-CHECKLIST-CONTROL.yaml) |
| Validate control | `VALIDATE_CONTROL` | [IMPL-GOAGENT-CHECKLIST-CONTROL](../implementation-decisions/IMPL-GOAGENT-CHECKLIST-CONTROL.yaml) |
| Apply control | `APPLY_CONTROL` | [IMPL-GOAGENT-CHECKLIST-CONTROL](../implementation-decisions/IMPL-GOAGENT-CHECKLIST-CONTROL.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| agentstream | Preferred terms |
| agentstream_control | Preferred terms |
| ApplyPromptFilePreload | Pseudo-code blocks |
| ChainFromPrevious | Preferred terms |
| checklist_messages | Pseudo-code blocks |
| dry-run | Preferred terms |
| executor_Run | Pseudo-code blocks |
| feature-spec batch | Preferred terms |
| lead checklist | Preferred terms |
| ParseAndResolve | Preferred terms |
| pipeline Build | Preferred terms |
| pipeline_Build | Pseudo-code blocks |
| ReadPromptFilePreload | Pseudo-code blocks |
| Turn | Preferred terms |
| VerifySessionPrompt | Core types |
