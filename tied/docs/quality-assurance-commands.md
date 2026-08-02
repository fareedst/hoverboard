# Supported quality-assurance command matrix

This repository does not define one universal coverage or test runner command. A change records the commands supported by the active repository and language, plus tool versions and exit codes, in the verification evidence manifest.

## TIED methodology repository

| Surface | Supported command | Proof boundary |
|---|---|---|
| MCP server TypeScript build | `npm --prefix mcp-server run build` | TypeScript compilation only |
| MCP server TypeScript tests | `npm --prefix mcp-server test` | Registered MCP unit/composition tests and listed repository tests |
| Go agentstream | `cd tools/agentstream && go test ./...` | Go package tests for the agentstream module |
| Go agentstream build | `cd tools/agentstream && go build ./cmd/agentstream` | Go compilation/linking only |
| Ruby tooling | Run the project-declared Ruby test command; use `ruby -c path/to/file.rb` for syntax-only checks | The exact command and selected files must be recorded; no repository-wide Ruby runner is assumed |
| TIED YAML | `scripts/lint_yaml.sh path/to/changed.yaml` once per changed YAML file | YAML syntax/canonicalization policy only |
| TIED consistency | MCP `tied_validate_consistency` with detail and pseudo-code checks enabled | TIED index/detail/token/traceability integrity only |

The table is a repository baseline, not a client-project prescription. A client declares its own language-specific commands in its project-level CITDP or evidence manifest. If a command is unavailable, record the limitation and use an applicable alternative; do not substitute a guessed Jest, Chrome-extension, or coverage-gap command.

## Evidence fields

For each command record the working directory, exact argv, commit, environment/tool versions, exit code, result, threshold if any, output artifact references, and proof boundary. A passing command is evidence for its stated boundary only.
