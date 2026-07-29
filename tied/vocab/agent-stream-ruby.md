# agent-stream Ruby (canonical)

**Scope:** Legacy Ruby ATDD runner under `tools/agent-stream/`: argv composition, TDD loop prompt expansion, export-to-markdown, and E2E subprocess stream-json harness. **Vocabulary only** — behavior in Ruby sources and `IMPL-ATDD-*` pseudo-code. For new work, prefer Go **`agentstream`** ([`agentstream.md`](agentstream.md)).

**Traceability:** [REQ-ATDD-COMPOS-AGENT_STREAM_TDD_YAML](../requirements/REQ-ATDD-COMPOS-AGENT_STREAM_TDD_YAML.yaml) · [REQ-ATDD-COMPOS-EXPORT_TDD_PROMPTS_STEPS](../requirements/REQ-ATDD-COMPOS-EXPORT_TDD_PROMPTS_STEPS.yaml) · [REQ-ATDD-E2E-AGENT_STREAM](../requirements/REQ-ATDD-E2E-AGENT_STREAM.yaml) · [ARCH-ATDD-COMPOS-DELEGATE_TO_TDD_LOOP_PROMPTS](../architecture-decisions/ARCH-ATDD-COMPOS-DELEGATE_TO_TDD_LOOP_PROMPTS.yaml) · [ARCH-ATDD-E2E_SUBPROCESS_STREAM_JSON](../architecture-decisions/ARCH-ATDD-E2E_SUBPROCESS_STREAM_JSON.yaml)

**See also:** [`domain-references.md`](domain-references.md) · [`agentstream.md`](agentstream.md) · [`../../tools/agent-stream/`](../../tools/agent-stream/) · [`../../scripts/run-feature-batch.sh`](../../scripts/run-feature-batch.sh)

---

## Preferred terms vs synonyms

| Preferred (Ruby) | Avoid | Go preferred term |
|------------------|-------|-------------------|
| **agent-stream** | agentstream (for Ruby dir) | **agentstream** |
| **run_agent_stream.rb** | ruby runner | `cmd/agentstream` |
| **TddLoopPrompts** | tdd loop class (generic) | `tddloop` package |
| **export_tdd_prompts** | export script (alone) | no direct Go equivalent |
| **Open3.popen3** | subprocess spawn (vague) | `executor.Run` / `os/exec` |
| **stream-json** | json lines (alone) | same protocol in Go executor |
| **run-feature-batch.sh** | batch script (generic) | `run-feature-batch-agentstream.sh` |

---

## Naming bridge: Ruby ↔ Go

| Concept | Ruby artifact | Go artifact | Shared flag |
|---------|---------------|-------------|-------------|
| Main runner | `tools/agent-stream/run_agent_stream.rb` | `tools/agentstream/cmd/agentstream` | `--tdd-yaml`, `-b`, `-c` |
| Argv TDD wiring | `lib/agent_stream_argv.rb` | `pipeline.Build` + `tddloop` | `--tdd-yaml` |
| TDD YAML parser | `lib/tdd_loop_prompts.rb` | `tddloop.LoadTurns` | `--tdd-yaml PATH` |
| Export steps to files | `export_tdd_prompts.rb` | — | CLI export mode |
| E2E harness | `run_agent_stream_subprocess` | `executor.Run` | stream-json stdout |
| Batch driver | `scripts/run-feature-batch.sh` | `scripts/run-feature-batch-agentstream.sh` | feature-spec + checklist |

---

## Key files (storage)

| Path | Role |
|------|------|
| `tools/agent-stream/run_agent_stream.rb` | CLI entry |
| `tools/agent-stream/lib/agent_stream_argv.rb` | Argv → ordered turns |
| `tools/agent-stream/lib/tdd_loop_prompts.rb` | Single TDD YAML parser (ARCH: delegate here only) |
| `tools/agent-stream/export_tdd_prompts.rb` | Materialize step markdown files |
| `scripts/run-feature-batch.sh` | Ruby batch driver |

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE block | Owning IMPL |
|----------------|-------------------|-------------|
| Wire TDD YAML turns from argv | `wire_tdd_yaml_turns_from_argv` | [IMPL-ATDD-COMPOS-AGENT_STREAM_ARGV](../implementation-decisions/IMPL-ATDD-COMPOS-AGENT_STREAM_ARGV.yaml) |
| Export step entries to markdown | `export_step_entries_to_markdown` | [IMPL-ATDD-COMPOS-EXPORT_TDD_PROMPTS](../implementation-decisions/IMPL-ATDD-COMPOS-EXPORT_TDD_PROMPTS.yaml) |
| Run agent subprocess | `run_agent_stream_subprocess` | [IMPL-ATDD-E2E-AGENT_STREAM](../implementation-decisions/IMPL-ATDD-E2E-AGENT_STREAM.yaml) |

---

## Stream-json protocol terms (shared with Go)

| Term | Meaning |
|------|---------|
| **session_id** | Captured from JSON stdout lines; printed on stderr as `session_id=...` for next `--resume` |
| **thinking delta** | Forwarded text fragment from parsed JSON |
| **assistant text** | Forwarded text fragment from parsed JSON |
| **exit status** | Non-zero agent exit fails the harness |

---

## Alphabetical index

| Term | Section |
|------|---------|
| agent-stream | Preferred terms |
| export_step_entries_to_markdown | Pseudo-code blocks |
| export_tdd_prompts | Naming bridge |
| Open3.popen3 | Preferred terms |
| run_agent_stream.rb | Preferred terms |
| run_agent_stream_subprocess | Pseudo-code blocks |
| run-feature-batch.sh | Naming bridge |
| stream-json | Protocol terms |
| TddLoopPrompts | Preferred terms |
| wire_tdd_yaml_turns_from_argv | Pseudo-code blocks |
