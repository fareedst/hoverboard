# TIED Processes

**TIED Methodology Version**: 1.4.0

Process documentation is the missing link that keeps tooling, rituals, and expectations traceable back to requirements. This guide defines how to record repeatable processes with semantic tokens so that every operational step you take is measurable, auditable, and associated with the intent that drove it.

## Process Tokens

Introduce `[PROC-*]` tokens whenever you describe how work happens.
Each token declares the process, its scope, and the requirements it serves. Because processes often span multiple artifacts, each entry should refer to:

- **Requirements** (`[REQ-*]`) to show whose intent the process satisfies
- **Architecture** (`[ARCH-*]`) or **Implementation** (`[IMPL-*]`) decisions that depend on the process outcome
- **Tests** (`[TEST-*]`) or other validation steps triggered by the process

Process entries become first-class trace nodes that explain **how** to survey, build, test, deploy, and otherwise steward the requirements themselves.

## Process Entry Template

Use the structure below for every process you document. Each entry should be kept current, reference the controlling requirements, and mention the deliverables or artifacts it produces.

### `[PROC-PROCESS_NAME]`
- **Purpose** — Describe the problem or requirement this process satisfies, ideally referencing a `[REQ-*]` token.
- **Scope** — Describe the boundaries of the process (teams, code areas, environments, or lifecycle phases).
- **Token references** — List `[REQ-*]`, `[ARCH-*]`, `[IMPL-*]`, or `[TEST-*]` tokens that the process continuously touches.
- **Status** — Active, deprecated, or scheduled for automation.

#### Core Activities
1. **Survey the Project**
   - Identify the existing intent (documentation, tokens, diagrams) tied to the requirement.
   - Capture discovery artifacts (notes, system maps, dependency lists) labeled with `[PROC-PROJECT_SURVEY]` or a more specific process token.
2. **Build Work**
   - Describe how to prepare the build environment, dependencies, and packages.
   - Reference architecture or implementation tokens that the process must observe before running the build.
3. **Test Work**
   - List the mandatory validation suites, acceptance tests, or checkpoints.
   - Include examples of test names that reference the requirement token (e.g., `TestFoo_REQ_BAR`).
4. **Deploy Work**
   - Outline the deployment targets, release artifacts, and approvals required.
   - Mention any CI/CD pipelines or configuration tokens that guarantee traceability.
5. **Requirements Stewardship**
   - State how the process collects feedback, updates requirements, and revalidates tokens.
   - Explain how this process keeps the `[REQ-*]` token fresh (review cadence, stakeholders, reporting).

#### Artifacts & Metrics
- **Artifacts** — Document the files, checklists, or dashboards produced during the process.
- **Success Metrics** — Name how you know the process satisfied the requirement (e.g., updated token table, green builds, automated audits).

### Example: `[PROC-PROJECT_SURVEY_AND_SETUP]`
- **Purpose** — Capture the context for `[REQ-TIED_SETUP]` before any new feature work.
- **Scope** — Applied to every new module or team onboarding cycle.
- **Token references** — `[REQ-TIED_SETUP]`, `[ARCH-TIED_STRUCTURE]`, `[IMPL-TIED_FILES]`.
- **Status** — Active.

#### Core Activities
1. **Survey**
   - Read `TIED.md`, `semantic-tokens.yaml`, `semantic-tokens.md`, and recent requirements to understand intent.
   - Tag findings with `[PROC-PROJECT_SURVEY_AND_SETUP]` and record them in the project knowledge base.
2. **Build**
   - Confirm required toolchains (language runtime, TIED tooling) are installed and share the list on the onboarding checklist.
   - Validate any `[ARCH-*]` constraints (folder layout, manifests) before manipulating files.
3. **Test**
   - Run smoke tests that include `[REQ-MODULE_VALIDATION]` to prove tracing works for a new module.
   - Check that tokens surfaced during survey show up in test names and code comments.
4. **Deploy**
   - Ensure deployment documentation references the same requirement tokens and that automated jobs run at least once to prove the configuration.
5. **Requirements Stewardship**
   - Record missing `[REQ-*]` tokens discovered during the survey and assign owners to author them.
   - Tag conclusions in the knowledge base with the `[PROC-PROJECT_SURVEY_AND_SETUP]` token so future reviews can trace the reasoning.

#### Artifacts & Metrics
- **Artifacts** — Onboarding checklist, environment matrix, token discovery log.
- **Success Metrics** — Every new module has `[REQ-*]` tokens defined, token registry updated, and build/test/deploy pipelines run at least once.

---

## `[PROC-TEST_STRATEGY]` Test strategy and coverage (minimize untested code)

### Purpose
Minimize the amount of code not covered by tests so that IMPL/ARCH/REQ logic is validated by unit and integration tests; E2E remains expensive and is reserved for critical user journeys.

### Scope
Chrome extension `src/` only (Safari-only code excluded). Applies to unit tests (`tests/unit/**/*.test.js`), integration tests (`**/*.integration.test.js`), and Playwright E2E (`tests/playwright/`).

### Token references
- `[IMPL-TESTING]` — testing implementation decisions
- `[REQ-MODULE_VALIDATION]` — module validation before integration; testability and minimize E2E-only (satisfaction/validation criteria)
- `[ARCH-UI_TESTABILITY]` — thin entry points; logic in testable modules
- All `[REQ-*]` / `[ARCH-*]` / `[IMPL-*]` reflected in code under test

### Status
Active

### Principles
1. **E2E is expensive** — Reserve E2E for critical user journeys. Do not rely on E2E as the primary way to find untested pathways.
2. **Unit + integration tests cover logic** — Unit and integration tests should cover IMPL/ARCH/REQ logic so that untested pathways are found and fixed before or alongside E2E.
3. **IMPL–test alignment** — Every Active IMPL should have at least one test reference in `traceability.tests`, or be explicitly documented as "tested only via E2E" / "no unit tests" with a reason.
4. **Coverage gates** — Jest `coverageThreshold` and the coverage gap report (`scripts/coverage-gap-report.js`) help prevent regressions and surface files/IMPLs with no tests.
5. **Minimize E2E-only code** — Treat E2E and manual verification as the exception. Every IMPL should have unit or integration tests for its logic, or an explicit E2E-only reason in the IMPL detail.

### Activities
- Run `npm run test:coverage` before merging; fix or document any new code that lowers coverage below threshold.
- Run `node scripts/coverage-gap-report.js [threshold]` to list src files below threshold and IMPLs with empty `traceability.tests`; use the report in MRs or docs.
- For IMPLs that are intentionally not unit-tested (e.g. platform-specific glue or debug tooling), record in the IMPL detail that coverage is via E2E or manual testing so the "no tests" is explicit and reviewable.
- When adding or changing IMPLs, classify code as unit-testable, integration-testable, or E2E-only. If E2E-only, set `traceability.tests` to [] and document in the IMPL (e.g. `test_coverage_note` or `e2e_only_reason`) why unit/integration are not used. Use the coverage gap report to catch IMPLs with empty tests and no justification.

### Artifacts & Metrics
- **Artifacts** — Coverage report (`coverage/`), coverage gap report output, TIED `traceability.tests` in IMPL detail files.
- **Success Metrics** — Coverage at or above threshold; IMPL traceability.tests populated or explicitly documented; E2E used for critical flows only.

---

## `[PROC-YAML_DB_OPERATIONS]` YAML Database Operations

### Purpose
Provides succinct guidance for reading, writing, querying, and validating the YAML index files (`requirements.yaml`, `architecture-decisions.yaml`, `implementation-decisions.yaml`, `semantic-tokens.yaml`).

### Scope
Applies to all TIED YAML index files in the `tied/` directory. Implementation decision **detail** YAMLs (e.g. in `implementation-decisions/*.yaml`) may include `essence_pseudocode` and `related_decisions.composed_with` for composition analysis, combined workflow description, and test design; see `implementation-decisions.md` § Optional fields for composition and workflow.

### Token references
- `[REQ-TIED_SETUP]` — YAML indexes are part of TIED methodology setup
- `[ARCH-TIED_STRUCTURE]` — YAML indexes are part of project structure

### Status
Active

### Core Activities

#### 1. Appending a New Record

**Manual Append:**
1. Open the YAML file (e.g., `tied/requirements.yaml`)
2. Scroll to the bottom and find the commented template block
3. Copy the template block
4. Paste it at the end with a blank line before it
5. Replace the token identifier (e.g., `REQ-IDENTIFIER` → `REQ-NEW_FEATURE`)
6. Fill in all fields (name, category, priority, status, rationale, etc.)
7. Update the `detail_file` path
8. Save the file

**Scripted Append:**
```bash
# Append a new requirement (v1.5.0 schema)
cat >> tied/requirements.yaml << 'EOF'

REQ-NEW_FEATURE:
  name: New Feature Name
  category: Functional
  priority: P1
  status: "Planned"
  rationale:
    why: "Primary reason for this requirement"
    problems_solved:
      - "Problem 1"
    benefits:
      - "Benefit 1"
  satisfaction_criteria:
    - criterion: "Criterion description"
      metric: "Measurable target"
  validation_criteria:
    - method: "Unit tests"
      coverage: "All core functions"
  traceability:
    architecture:
      - ARCH-NEW_FEATURE
    implementation:
      - IMPL-NEW_FEATURE
    tests:
      - testNewFeature_REQ_NEW_FEATURE
    code_annotations:
      - REQ-NEW_FEATURE
  related_requirements:
    depends_on: []
    related_to: []
    supersedes: []
  detail_file: requirements/REQ-NEW_FEATURE.yaml
  metadata:
    created:
      date: 2026-02-06
      author: "Your Name"
    last_updated:
      date: 2026-02-06
      author: "Your Name"
      reason: "Initial creation"
    last_validated:
      date: 2026-02-06
      validator: "Your Name"
      result: "pass"
EOF
```

#### 2. Reading and Querying Records

**Read Entire File:**
```bash
cat tied/requirements.yaml
```

**Read Specific Record (with yq):**
```bash
# Install yq if not already: https://github.com/mikefarah/yq
yq '.REQ-TIED_SETUP' tied/requirements.yaml
yq '.["ARCH-TIED_STRUCTURE"]' tied/architecture-decisions.yaml
```

**Read Specific Record (with grep):**
```bash
# Quick lookup for humans
grep -A 30 '^REQ-TIED_SETUP:' tied/requirements.yaml
grep -A 30 '^ARCH-TIED_STRUCTURE:' tied/architecture-decisions.yaml
```

**Filter by Status:**
```bash
# List all active architecture decisions
yq 'to_entries | map(select(.value.status == "Active")) | from_entries' tied/architecture-decisions.yaml

# List all implemented requirements
yq 'to_entries | map(select(.value.status == "Implemented")) | from_entries' tied/requirements.yaml
```

**Query with Python:**
```python
import yaml

# Read YAML file
with open('tied/requirements.yaml', 'r') as f:
    requirements = yaml.safe_load(f)

# Access specific requirement
req = requirements['REQ-TIED_SETUP']
print(f"Name: {req['name']}")
print(f"Status: {req['status']}")
print(f"Priority: {req['priority']}")

# Filter by status
implemented = {k: v for k, v in requirements.items() 
               if v.get('status') == 'Implemented'}
```

**Query with jq (alternative to yq):**
```bash
# Convert YAML to JSON first, then use jq
yq -o=json '.' tied/requirements.yaml | jq '.["REQ-TIED_SETUP"]'
```

#### 3. Updating an Existing Record

**Best Practice:** Edit the YAML file directly in your editor. YAML preserves formatting and comments better than programmatic edits.

**Programmatic Update (Python):**
```python
import yaml

# Read
with open('tied/requirements.yaml', 'r') as f:
    data = yaml.safe_load(f)

# Update
data['REQ-TIED_SETUP']['last_updated'] = '2026-02-06'
data['REQ-TIED_SETUP']['last_validator'] = 'New Validator'

# Write back
with open('tied/requirements.yaml', 'w') as f:
    yaml.dump(data, f, default_flow_style=False, sort_keys=False)
```

**Note:** Programmatic updates may lose formatting and comments. Manual editing is recommended for YAML files.

#### 4. Validating YAML Syntax

**Validate with yq:**
```bash
yq '.' tied/requirements.yaml > /dev/null && echo "✅ Valid YAML" || echo "❌ Invalid YAML"
yq '.' tied/architecture-decisions.yaml > /dev/null && echo "✅ Valid YAML" || echo "❌ Invalid YAML"
yq '.' tied/implementation-decisions.yaml > /dev/null && echo "✅ Valid YAML" || echo "❌ Invalid YAML"
```

**Validate with Python:**
```bash
python3 -c "import yaml, sys; yaml.safe_load(open('tied/requirements.yaml'))" && echo "✅ Valid" || echo "❌ Invalid"
```

**Validate with yamllint (if installed):**
```bash
yamllint tied/requirements.yaml
yamllint tied/architecture-decisions.yaml
yamllint tied/implementation-decisions.yaml
```

#### 5. Listing All Tokens

**List all requirement tokens:**
```bash
yq 'keys' tied/requirements.yaml
# or with grep:
grep '^[A-Z].*:$' tied/requirements.yaml | sed 's/:$//'
```

**List all architecture decision tokens:**
```bash
yq 'keys' tied/architecture-decisions.yaml
```

**List all implementation decision tokens:**
```bash
yq 'keys' tied/implementation-decisions.yaml
```

**List all semantic tokens:**
```bash
yq 'keys' tied/semantic-tokens.yaml
```

**Filter semantic tokens by type:**
```bash
# List all REQ tokens
yq 'to_entries | map(select(.value.type == "REQ")) | from_entries' tied/semantic-tokens.yaml

# List all ARCH tokens
yq 'to_entries | map(select(.value.type == "ARCH")) | from_entries' tied/semantic-tokens.yaml

# List all PROC tokens
yq 'to_entries | map(select(.value.type == "PROC")) | from_entries' tied/semantic-tokens.yaml
```

**Check if a token exists:**
```bash
yq '.["REQ-TIED_SETUP"]' tied/semantic-tokens.yaml
```

**Get token metadata:**
```bash
# Get token type and status
yq '.REQ-TIED_SETUP | {type: .type, status: .status}' tied/semantic-tokens.yaml

# Get source index for full details
yq '.REQ-TIED_SETUP.source_index' tied/semantic-tokens.yaml
```

#### 6. Checking Cross-References (v1.5.0 Schema)

**Find all requirements referenced by an architecture decision:**
```bash
yq '.ARCH-TIED_STRUCTURE.cross_references[]' tied/architecture-decisions.yaml
```

**Find all architecture/requirement tokens referenced by an implementation:**
```bash
yq '.IMPL-MODULE_VALIDATION.cross_references[]' tied/implementation-decisions.yaml
```

**Query structured traceability (v1.5.0):**
```bash
# Get architecture dependencies for a requirement
yq '.REQ-TIED_SETUP.traceability.architecture[]' tied/requirements.yaml

# Get tests for a requirement
yq '.REQ-TIED_SETUP.traceability.tests[]' tied/requirements.yaml

# Get implementation dependencies for an architecture decision
yq '.ARCH-TIED_STRUCTURE.traceability.implementation[]' tied/architecture-decisions.yaml

# Get code locations for an implementation
yq '.IMPL-TIED_FILES.code_locations.files[].path' tied/implementation-decisions.yaml
```

**Query structured content (v1.5.0):**
```bash
# Get satisfaction criteria for a requirement
yq '.REQ-TIED_SETUP.satisfaction_criteria[].criterion' tied/requirements.yaml

# Get alternatives considered for an architecture decision
yq '.ARCH-TIED_STRUCTURE.alternatives_considered[].name' tied/architecture-decisions.yaml

# Get implementation approach summary
yq '.IMPL-MODULE_VALIDATION.implementation_approach.summary' tied/implementation-decisions.yaml

# Get metadata
yq '.REQ-TIED_SETUP.metadata.last_validated.result' tied/requirements.yaml
```

### Artifacts & Metrics
- **Artifacts**: YAML index files (requirements.yaml, architecture-decisions.yaml, implementation-decisions.yaml, semantic-tokens.yaml)
- **Success Metrics**: YAML files are valid, all records have required fields, cross-references are consistent

---

## `[PROC-TIED_DEV_CYCLE]` TIED development cycle (session workflow)

### Purpose
Run a single development session so that REQ/ARCH/IMPL and pseudo-code stay primary: test-driven development produces testable code and infrastructure; TIED docs are updated to reflect the final code and tests. Supports traceability and `[PROC-TOKEN_AUDIT]` / `[PROC-TOKEN_VALIDATION]`.

### Scope
Applies to any feature or change that touches managed code, tests, or TIED documentation (requirements, architecture decisions, implementation decisions). Use per session or per feature slice.

### Token references
- `[REQ-TIED_SETUP]` — TIED methodology and doc-first flow
- `[REQ-MODULE_VALIDATION]` — validate modules before integration
- `[PROC-TOKEN_AUDIT]` — code/test token parity
- `[PROC-TOKEN_VALIDATION]` — token registry and traceability checks
- All REQ/ARCH/IMPL tokens touched by the session

### Status
Active

### Core Activities

1. **Plan from TIED**
   - Read existing REQ, ARCH, and IMPL for the scope of work.
   - Use each IMPL’s `essence_pseudocode` as the full prescription for what to implement; it is the **source of consistent logic**. Resolve all logical and flow issues in IMPL pseudo-code before adding tests or code.
   - Identify required updates (new or changed requirements and decisions) before writing code or tests.

2. **Author TIED docs (pseudo-code + tokens)**
   - Update REQ, ARCH, and IMPL (new and existing) as needed.
   - Resolve all logical and flow issues in IMPL pseudo-code so that it is complete and authoritative before proceeding to “Add and align tests.”
   - In every IMPL, ensure `essence_pseudocode` is complete. Every **block** in `essence_pseudocode` must have a comment that (1) names all REQ, ARCH, and IMPL reflected in that block and (2) states how that block implements those requirements.
   - Use the project block definition: a block is a contiguous logical unit implementing the same set of REQ/ARCH/IMPL; nested blocks implementing a different set get their own token comment.

3. **Add and align tests**
   - Add or update tests so they match the IMPL.
   - Every test **block** must carry the same REQ/ARCH/IMPL comments as the corresponding IMPL block (in the appropriate place in the test).
   - If a comment would help tests but is not yet in the IMPL, add it to the IMPL for permanence; treat test code as transient.
   - Ensure testable logic is not implemented in entry points; plan extraction to a module so unit/integration tests can run.

4. **Implement to tests (TDD)**
   - Implement logic in testable modules (with dependency injection or pure functions). Entry points should only call into these modules.
   - Implement managed code to satisfy the tests.
   - Every **block** in managed sources must carry the same REQ/ARCH/IMPL comments as in the IMPL. For nested blocks with the **same** set, do not repeat token names; comment only how that sub-block implements the requirements. For a nested block with a **different** set, add a comment at the start naming that set and how the block implements it.
   - Iterate until all tests pass.

5. **Implement minimal glue**
   - Implement **minimal** glue (entry points, manifest wiring, platform hooks). Any non-trivial logic that remains in glue must be justified in the IMPL (`e2e_only_reason` or `test_coverage_note`). Prefer extracting logic to a testable module and keeping glue thin.
   - Annotate with the same token/block rules where the code is still “managed” and traceable.

6. **Validate and close test gaps**
   - Run the full test suite and add any missing tests.
   - Run `[PROC-TOKEN_VALIDATION]` (e.g. `./scripts/validate_tokens.sh`) and fix gaps so coverage and token traceability are complete.

7. **Sync TIED to code and tests**
   - Update REQ/ARCH/IMPL so they match the final code and tests. Ensure IMPLs modified this session reflect the implemented code and tests, including block-level comments with semantic tokens.
   - Sync `semantic-tokens.yaml`, `requirements.yaml`, `architecture-decisions.yaml`, and `implementation-decisions.yaml` (and detail files) so TIED docs remain the single source of truth for intent.

8. **Update README and CHANGELOG**
   - Update README.md and CHANGELOG.md for user- and release-facing changes made in this session.

9. **Write commit message**
   - Write the commit message **per [PROC-COMMIT_MESSAGES]**; where useful, reference the main REQ/ARCH/IMPL tokens touched in the body or footer.

### Artifacts & Metrics
- **Artifacts**: Updated REQ/ARCH/IMPL (including `essence_pseudocode` and block comments), tests, managed source code, README.md, CHANGELOG.md, commit.
- **Success Metrics**: All tests pass; `[PROC-TOKEN_VALIDATION]` passes; TIED docs match final code and tests; `[PROC-TOKEN_AUDIT]` can succeed.

---

## `[PROC-COMMIT_MESSAGES]` Commit message format and guidelines

### Purpose
Use a consistent format for git commit messages so that history is readable and, if needed, changelogs can be generated from commits. Supports traceability when TIED tokens are referenced in the body or footer.

### Scope
All commits in the repository.

### Token references
- `[PROC-TIED_DEV_CYCLE]` — step 9 invokes this process

### Status
Active

### Commit message format

Each commit message has a **header**, an optional **body**, and an optional **footer**. The header uses a **type**, an optional **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Keep the **subject** (header line) to 50 characters or fewer so it stays readable in logs and UIs. Keep body and footer lines to 100 characters or fewer.

The footer may contain a closing reference to an issue (e.g. `Closes #123`).

**Examples:**

```
docs(changelog): update changelog to v1.5.0
```

```
fix(ui): correct popup theme when system preference changes

Popup now re-reads prefers-color-scheme on visibility change.
Fixes #42
```

### Revert

To revert a previous commit, start the header with `revert: ` followed by the original commit header. In the body write: `This reverts commit <hash>.` (replace `<hash>` with the SHA of the reverted commit.)

### Type

Use exactly one of:

| Type | Use for |
|------|--------|
| **build** | Build system or external dependencies (e.g. scripts, manifest, tooling) |
| **ci** | CI configuration and scripts (e.g. `.github/workflows/`) |
| **chore** | Repo maintenance, no code/docs change |
| **docs** | Documentation only |
| **feat** | A new feature |
| **fix** | A bug fix |
| **perf** | A change that improves performance |
| **refactor** | A change that neither fixes a bug nor adds a feature |
| **style** | Formatting, whitespace, semicolons; no meaning change |
| **test** | Adding or correcting tests |

### Scope

The scope is the name of the area affected (as someone reading history or a changelog would understand it). It is optional but recommended.

**Supported scopes:**

| Scope | Area |
|-------|------|
| **core** | Service worker, message handling, badge manager (`src/core/`) |
| **ui** | Popup, options, side-panel, bookmarks-table, components, styles (`src/ui/`) |
| **features** | Content scripts, overlay, storage, AI, pinboard, search, tagging (`src/features/`) |
| **shared** | Shared utilities, logger, ErrorHandler, message-schemas (`src/shared/`) |
| **config** | Config manager and config service (`src/config/`) |
| **offscreen** | Offscreen file-bookmark I/O (`src/offscreen/`) |
| **safari** | Safari App Extension (`safari/`) |
| **tied** | TIED methodology: requirements, architecture, implementation, semantic tokens (`tied/`, `semantic-tokens.yaml`) |
| **docs** | Documentation outside `tied/` (`docs/`) |
| **tests** | Test files, harnesses, Playwright E2E |
| **build** | Build scripts, manifest, tooling (`scripts/`, `manifest.json`) |
| **ci** | CI configuration (e.g. `.github/workflows/`) |
| **changelog** | Release notes in `CHANGELOG.md` |

**Exceptions:**

- **packaging**: Use only when a change affects package/output layout across the repo (e.g. manifest or build layout for all outputs). Otherwise use **build**.
- **Empty scope**: Allowed for `style`, `test`, `refactor`, or `docs` when the change spans many areas (e.g. `style: normalize line endings`).

**Recommended for future use** (add as the codebase grows):

- **popup**, **side-panel**, **options** — when UI work is often scoped to a single surface.
- **storage**, **content**, **ai** — when features are split more finely than a single `features` scope.

Projects may subset or extend this list to match their structure.

### Subject

- Keep to **50 characters or fewer** (the full header line: `type(scope): subject`).
- Use imperative, present tense: "change" not "changed" nor "changes".
- Do not capitalize the first letter.
- No period at the end.

### Body

Use imperative, present tense. Include motivation for the change and how it differs from previous behavior when it helps.

### Footer

- **Breaking changes**: Start with `BREAKING CHANGE:` (with a space or two newlines). The rest of the message describes the break.
- **Issues**: Use `Closes #123` or `Fixes #123` to link and close issues.

### TIED and commit messages

When a commit implements or touches a specific requirement or decision, you may reference TIED tokens in the body or footer (e.g. `REQ-SIDE_PANEL_TAGS_TREE`, `ARCH-*`, `IMPL-*`). This is optional but encouraged for traceability. Commit format is defined here; for token discipline in code and docs see [AGENTS.md](AGENTS.md) and `ai-principles.md`.

### Artifacts & Metrics
- **Artifacts**: Commit history; optionally generated changelog.
- **Success Metrics**: Commits follow the format; history is readable; TIED tokens referenced when relevant.

---

## `[PROC-DEMO_RECORDING]` Demo recording (Playwright video → GIF)

### Purpose
Document or demo existing features (e.g. side panel Tabs) by recording a brief session with Playwright E2E (video) and converting to GIF for README or docs. Serves documentation and onboarding.

### Scope
Playwright extension E2E harness; record side panel or popup flows; produce WebM then convert to GIF (e.g. via ffmpeg). Applies when creating demo assets only.

### Token references
- `[REQ-SIDE_PANEL_BROWSER_TABS]` — Tabs tab list, filter, Copy Records/URLs
- `[REQ-SIDE_PANEL_POPUP_EQUIVALENT]` — This Page tab (popup-equivalent)
- `[REQ-SIDE_PANEL_TAGS_TREE]` — By Tag tab
- `[IMPL-SIDE_PANEL_BROWSER_TABS]` — browser-tabs-panel implementation
- `[IMPL-SIDE_PANEL_BOOKMARK]` — This Page panel implementation
- `[IMPL-SIDE_PANEL_TAGS_TREE]` — By Tag panel implementation
- `[PROC-TIED_DEV_CYCLE]` — session workflow when TIED docs or code change

### Status
Active

### Core Activities
1. Use extension E2E fixture; enable video for the run (e.g. dedicated config with `video: 'on'`).
2. **Tabs demo**: In spec or script: open side-panel.html → switch to Tabs tab → wait for list → optionally filter → Copy Records or Copy URLs.
3. **This Page demo**: Open side-panel (This Page tab is default); show Quick Actions, Storage, Add tag (or one clear action); optional Search Tabs. Script: `scripts/record-demo-bookmark.js`; output: `docs/demo-bookmark.gif`.
4. **By Tag demo**: Open side-panel → switch to By Tag tab → wait for data → select tags → show tree → optional search → click URL (open in new tab). Script: `scripts/record-demo-tags-tree.js`; output: `docs/demo-tags-tree.gif`.
5. Optionally inject a DOM overlay `<div>` into the side-panel page before each key-frame group to annotate what the user is doing (action) and what is produced (achievement); remove after the last frame. Overlay position: top of window; text size: 18–20px; text classes (intro, navigation, state, action, result) with distinct colors per [IMPL-DEMO_OVERLAY].
6. Run once; obtain WebM from test-results (or screenshot frames for standalone scripts).
7. Convert WebM/frames to GIF (e.g. `ffmpeg` two-pass palette; Tabs script uses 1 fps, scale 400). Place GIF in docs/; reference in README/CHANGELOG.

### Artifacts & Metrics
- **Artifacts**: Demo spec (or script), WebM/frames, GIF assets (`docs/demo-tabs-export.gif`, `docs/demo-bookmark.gif`, `docs/demo-tags-tree.gif`), scripts (`scripts/record-demo-tabs.js`, `scripts/record-demo-bookmark.js`, `scripts/record-demo-tags-tree.js`), README/CHANGELOG mention.
- **Success Metrics**: GIF plays; Tabs flow matches “find and export”; This Page flow shows Quick Actions/Storage/Add tag; By Tag flow shows select tags → tree → optional search/click URL.
