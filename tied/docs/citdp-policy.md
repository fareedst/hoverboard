# CITDP record policy: when to create vs skip

**Audience**: Teams using `[PROC-AGENT_REQ_CHECKLIST]` and the `persist-citdp-record` step. Process anchor: `tied/docs/processes.md` § `[PROC-CITDP]`.

This file is **project-owned**. After `copy_files.sh`, it lives at `tied/docs/citdp-policy.md` in client workspaces. Adjust the bullets below for your team; the checklist references this path for “create vs skip” decisions.

## Default: persist

**Create** a CITDP YAML record under `tied/citdp/` (see checklist for naming) when the work is **behavior-changing** on an existing codebase: new or altered runtime paths, APIs, security, data, configuration, or anything that would change what you test or how you roll back. For every persisted behavior-changing record, select the applicable assurance profiles before REQ/ARCH/IMPL design and include a quality evidence matrix.

## Reasonable skips

You may **skip** a full CITDP file when all of the following hold:

- The change does **not** alter behavior under test (e.g. typo in comments, pure formatting, non-executable docs with no TIED token or traceability impact).
- Risk is negligible and the commit message (or PR description) is enough audit trail for your process.
- The team explicitly treats the session as a **throwaway spike** and accepts that history will be thinner.

If you skip when the default would be “persist,” record that decision briefly (commit body, ticket, or team norm) so reviewers know it was intentional.

## Quality evidence matrix

The matrix is risk-triggered rather than universal. Each quality attribute or selected profile records:

- `applicability` (`applicable`, `not_applicable`, or `accepted_risk`) and a rationale;
- risk, bounded scenarios, and abuse cases when a relevant boundary exists;
- evidence method, exact command or test, threshold, result, owner, limitation, and evidence provenance;
- waiver, owner, and expiry for an unmet obligation or accepted residual risk.

At minimum consider `baseline-functional`; select external-input/security, data-integrity/migration, stateful-reliability, performance/scale/cost, user-facing/accessibility, regulated/privacy, and AI-enabled profiles only when their triggers are present. `tied_validate_consistency` is evidence of TIED artifact and traceability integrity only; it is not proof of runtime security, performance, usability, compliance, resilience, privacy, or product correctness.

## Middle ground

For small but real behavior changes, some teams still want a **short** CITDP record (minimal fields) rather than skipping entirely. That is valid if your validators and reviewers agree.

After `copy_files.sh`, use the layout in **`./tied/docs/citdp-record-template.yaml`** when creating `tied/citdp/CITDP-{change_request_id}.yaml` (see **persist-citdp-record** in `agent-req-implementation-checklist.yaml`).

## References

- `tied/docs/processes.md` § `[PROC-CITDP]` (especially step 8 — persistence).
- `tied/docs/agent-req-implementation-checklist.md` — `persist-citdp-record` and earlier CITDP-style steps.
- At repository root, `docs/leap-tied-citdp-costs-and-benefits.md` expands on tradeoffs (not always mirrored under `tied/docs/`).
