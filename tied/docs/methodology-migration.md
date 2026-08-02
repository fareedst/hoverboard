# TIED client methodology migration

**Audience:** Engineers and AI agents upgrading an existing TIED client to methodology **2.2.0**.

**Process spine:** Start with the [client development index](client-development-index.md), copy a per-request **Tracker** from [agent-req-implementation-checklist.yaml](agent-req-implementation-checklist.yaml), and follow the [Checklist](agent-req-implementation-checklist.md) for any client behavior change.

This guide is an operational migration procedure. It preserves client-owned records and makes quality-assurance adoption incremental. It does not replace the authoritative schemas or validator documentation linked below.

## Scope and invariants

The migration refreshes inherited methodology content without deleting or overwriting client-owned data.

- `tied/methodology/` is inherited **methodology YAML** and is refreshed by `copy_files.sh`.
- `tied/requirements.yaml`, `tied/architecture-decisions.yaml`, `tied/implementation-decisions.yaml`, `tied/semantic-tokens.yaml`, their detail directories, `tied/citdp/`, and `tied/vocab/` are client-owned **project YAML** or domain vocabulary.
- Existing `tied/docs/` files are preserved. The bootstrap doc list is copy-when-missing, so customized documentation must be compared and merged deliberately.
- `.cursor/mcp.json` and the installed `.cursor/skills/tied-yaml/` are tooling configuration and installation artifacts; inspect their changes after refresh.
- Local evidence and artifacts outside the inherited methodology tree remain client-owned.

Do not manually edit `tied/methodology/`. Do not use a refresh to rewrite client REQ/ARCH/IMPL records. Strict quality gates are not enabled merely because the validators are installed.

## Phase 0 — inventory and snapshot

Create a working folder and copy the canonical Tracker to a unique per-request file. Use the primary requirement token that governs the migration; for this methodology-repository change the example is:

```bash
mkdir -p working/methodology-migration
cp tied/docs/agent-req-implementation-checklist.yaml \
  working/methodology-migration/REQ-TIED_SETUP_YYYYMMDDHHMMSS.yaml
```

Before refreshing a client, record:

- client project root and its absolute `TIED_BASE_PATH` (`<client>/tied`);
- current methodology version from `AGENTS.md` and `tied/docs/client-development-index.md`;
- whether the client has split or legacy TIED indexes;
- inline `essence_pseudocode` versus `IMPL-*-pseudocode.md` pseudo-code sidecars;
- project YAML indexes, detail files, `tied/citdp/`, and local vocabulary;
- `.cursor/mcp.json`, installed `tied-yaml` skill, and `tied-cli.sh`;
- `.tiedanalysis.yaml`, including test suffixes, non-production path markers, and quoted scalar values;
- baseline `tied_validate_consistency`, language-specific test/build/lint commands, and any existing evidence manifest.

Create a rollback snapshot before changing the client. A git tag or branch is preferred; otherwise archive the client tree and record the commit, Node version, and TIED MCP build identifier.

## Phase 1 — tooling refresh

Use placeholders and quote paths:

```bash
export TIED_SOURCE="/path/to/stdd"
export CLIENT="/path/to/client"
export TIED_BASE="${CLIENT}/tied"

(cd "${TIED_SOURCE}/mcp-server" && npm run build)
"${TIED_SOURCE}/copy_files.sh" "${CLIENT}"
# For an existing non-empty vocabulary directory:
"${TIED_SOURCE}/copy_files.sh" --merge-vocab "${CLIENT}"
```

The second command is additive. It does not replace the normal refresh; run it when missing canonical vocabulary files should be installed into a client that already has vocabulary files.

Verify after refresh:

1. `tied_config_get_base_path` reports exactly `${TIED_BASE}`.
2. `tied-cli.sh` reads the intended client project YAML.
3. The refreshed `tied/methodology/` matches the source templates.
4. Project indexes and detail files are unchanged unless the client explicitly adopted a project-record change.
5. The `tied-yaml` MCP entry points to the intended built server and preserves unrelated MCP servers.

### Bootstrap preservation matrix

| Asset | Refresh behavior |
|---|---|
| `tied/methodology/**` | Always overwritten from inherited templates |
| Project indexes and detail directories | Never overwritten |
| Files listed in `DOCS_TO_COPY` | Copied only when missing |
| `tied/vocab/*.md` without `--merge-vocab` | Seeded only when the client vocabulary directory has no Markdown files |
| `tied/vocab/*.md` with `--merge-vocab` | Copies absent filenames only; never overwrites existing files |
| `.cursor/skills/tied-yaml/` | Refreshed from the bundled skill |
| `.cursor/mcp.json` `tied-yaml` entry | Rewritten for the selected TIED source and client base path; unrelated servers preserved |

## Phase 2 — controlled documentation and vocabulary merge

The lean inherited documentation pack includes the migration guide, quality-assurance command and pilot guides, the evidence-manifest guide, and composition coverage. Files already present in a client remain authoritative until a human compares and merges them.

For every customized `tied/docs/` file:

1. compare the client file with the source file;
2. preserve client-specific policy and links;
3. merge new process requirements and validator names;
4. validate links from the client path, not only from the source repository.

For vocabulary:

- run `copy_files.sh --merge-vocab` to add absent glossary files;
- if `routing.md` already exists, manually merge the quality-assurance route and any new cross-topic note;
- reconcile terminology with [vocabulary-index-analysis-and-standards.md](vocabulary-index-analysis-and-standards.md);
- record new concepts in the matched glossary, not only in this guide.

`--merge-vocab` intentionally does not merge the contents of existing files. An automatic document or routing merge belongs in a future [LEAP](LEAP.md) proposal or a separately reviewed change.

### Quality-token packaging status

The quality-assurance records are promoted into the inherited templates by this methodology release:

- `[REQ-QUALITY_ASSURANCE_EVIDENCE]`
- `[ARCH-QUALITY_ASSURANCE_PROFILES]`
- `[IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK]`
- `[IMPL-QUALITY_BINDING_INVENTORY]`
- `[IMPL-QUALITY_EVIDENCE_COLLECTION]`
- `[IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER]`
- `[IMPL-QUALITY_EVIDENCE_MANIFEST]`
- `[IMPL-QUALITY_PSEUDOCODE_VALIDATOR]`
- `[IMPL-QUALITY_SECURITY_PROFILE_VALIDATION]`
- `[IMPL-QUALITY_TEST_ADEQUACY]`

Clients that were refreshed before this promotion should treat the quality records as explicit adoption records and compare their project YAML with the inherited methodology view. Do not duplicate a token into project YAML solely because it is now inherited.

## Phase 3 — TIED data and pseudo-code compatibility

Preserve the client token graph while adopting the new validation surface:

- use the TIED YAML MCP or `tied-cli` for project YAML mutations;
- use a pseudo-code sidecar for growing IMPL behavior;
- validate merged indexes and details with `tied_validate_consistency`;
- apply the `pre-contract-grammar` grace only to untouched legacy Active blocks;
- require `PRE`, `POST`, and `EFFECTS` on every new or changed Active procedure block, plus `FAILURE_MODES`, `DATA_TRANSITION`, and `TERMINATION` when applicable;
- convert legacy composition prose into binding-inventory rows with `trigger`, `callee`, `arguments`, `effect`, `ordering`, and `failure_behavior`;
- classify IMPL testability before composition gates and justify any `e2e_only` path with a named platform constraint.

The [pseudo-code writing and validation guide](pseudocode-writing-and-validation.md) is the source for block lead comments, literal test/code linkage, and the Layer B validation sequence.

## Phase 4 — staged quality-assurance adoption

Quality assurance is risk-triggered, not a universal list of unrelated checks. Use the canonical vocabulary in [quality-assurance.md](../vocab/quality-assurance.md) and the process definitions in [processes.md](processes.md):

1. Consider `baseline-functional` for every behavior-changing change.
2. Select specialized profiles only when their triggers are present.
3. Record applicability, N/A rationale, bounded scenarios and abuse cases, evidence method, threshold, limitation, owner, and any expiry-bound waiver.
4. Preserve the implementation order: **IMPL → RED → GREEN → composition evidence → justified E2E**.
5. Keep residual-risk and waiver decisions separate from machine-generated evidence.

The quality profiles include external-input security, data-integrity migration, stateful reliability, performance/scale/cost, user-facing accessibility, regulated privacy, and AI-enabled boundaries. A profile is not proof by itself; it selects the evidence that must be collected.

## Phase 5 — executable gates and evidence

Run only the gates adopted by the client and triggered by its risk profile:

| Layer | Tool | Proof boundary |
|---|---|---|
| Layer A | `tied_validate_consistency` | TIED index, detail, token, and traceability integrity |
| Layer B | `pseudocode_validate` | pseudo-code shape, contracts, symbols, and block comments |
| Layer B | `binding_inventory_validate` | composition-seam completeness and E2E justification |
| Profile | `quality_security_profile_validate` | selected external-input security abuse cases or owned waivers |
| Profile | `test_adequacy_validate` | risk-relative test adequacy |
| Evidence | `quality_evidence_collect` / `quality_evidence_collect_manifest` | declared command execution and command-to-manifest collection |
| Evidence | `quality_evidence_manifest_build` | deterministic verification evidence manifest construction |

Retain exact command argv, working directory, commit, tool versions, exit code, thresholds, output artifacts, covered tokens, validator diagnostics, and manifest references. `tied_validate_consistency` does not prove runtime security, performance, usability, compliance, resilience, privacy, or product correctness.

See [quality-assurance-commands.md](quality-assurance-commands.md) for repository and client command declaration rules and [quality-evidence-manifest.md](quality-evidence-manifest.md) for manifest shape.

## Phase 6 — staged rollout

Use a controlled rollout:

1. Start in report-only or non-strict mode.
2. Remediate client-specific pseudo-code, binding-inventory, testability, and token gaps.
3. Run a representative pilot and measure false blocks, actionable diagnostics, reproducibility, ceremony cost, and privacy handling.
4. Enable stricter gates only after evidence retention and waiver ownership are ready.
5. Define stop criteria before the pilot; use [quality-assurance-pilot.md](quality-assurance-pilot.md) as the model.

For `.tiedanalysis.yaml`, review expanded test suffixes such as `.test.mjs`, non-production path markers such as `templates/`, `examples/`, and `testdata/`, methodology path markers, and quoted scalar compatibility. Treat traceability-gap output as structural analysis, not runtime quality proof.

## Phase 7 — completion and rollback

Completion checklist:

- [ ] language-specific build, test, and lint pass;
- [ ] `lint_yaml` runs once for every changed TIED YAML file;
- [ ] semantic-token audit passes;
- [ ] `tied_validate_consistency` passes with detail and pseudo-code checks;
- [ ] adopted Layer B and profile validators pass or have owned, expiring waivers;
- [ ] evidence manifest retains command provenance and proof boundaries;
- [ ] vocabulary is reconciled and VALIDATE has been completed;
- [ ] the Tracker records deferred steps and limitations.

Rollback procedure:

1. stop candidate strict gates and return to the prior report-only configuration;
2. restore the pre-refresh snapshot or git tag;
3. restore the previous tooling build and MCP configuration;
4. verify the restored TIED base path;
5. rerun the prior consistency and project test commands;
6. retain any project TIED records created during the migration for review; do not delete them as a rollback shortcut.

## Authoritative references

- [client development index](client-development-index.md)
- [agent requirement implementation Checklist](agent-req-implementation-checklist.md)
- [TIED YAML agent index](tied-yaml-agent-index.md)
- [CITDP policy](citdp-policy.md)
- [pseudo-code writing and validation](pseudocode-writing-and-validation.md)
- [composition coverage](composition-coverage.md)
- [quality-assurance commands](quality-assurance-commands.md)
- [quality-assurance pilot](quality-assurance-pilot.md)
- [quality evidence manifest](quality-evidence-manifest.md)
- [TIED methodology glossary](../vocab/tied-methodology.md)
- [TIED YAML MCP glossary](../vocab/tied-yaml-mcp.md)
- [pseudo-code and CITDP glossary](../vocab/pseudocode-and-citdp.md)
- [quality-assurance glossary](../vocab/quality-assurance.md)
