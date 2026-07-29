# CITDP record policy: when to create vs skip

**Audience**: Teams using `[PROC-AGENT_REQ_CHECKLIST]` and the `persist-citdp-record` step. Process anchor: `tied/docs/processes.md` § `[PROC-CITDP]`.

This file is **project-owned**. After `copy_files.sh`, it lives at `tied/docs/citdp-policy.md` in client workspaces. Adjust the bullets below for your team; the checklist references this path for “create vs skip” decisions.

## Default: persist

**Create** a CITDP YAML record under `tied/citdp/` (see checklist for naming) when the work is **behavior-changing** on an existing codebase: new or altered runtime paths, APIs, security, data, configuration, or anything that would change what you test or how you roll back.

## Reasonable skips

You may **skip** a full CITDP file when all of the following hold:

- The change does **not** alter behavior under test (e.g. typo in comments, pure formatting, non-executable docs with no TIED token or traceability impact).
- Risk is negligible and the commit message (or PR description) is enough audit trail for your process.
- The team explicitly treats the session as a **throwaway spike** and accepts that history will be thinner.

If you skip when the default would be “persist,” record that decision briefly (commit body, ticket, or team norm) so reviewers know it was intentional.

## Middle ground

For small but real behavior changes, some teams still want a **short** CITDP record (minimal fields) rather than skipping entirely. That is valid if your validators and reviewers agree.

After `copy_files.sh`, use the layout in **`./tied/docs/citdp-record-template.yaml`** when creating `tied/citdp/CITDP-{change_request_id}.yaml` (see **persist-citdp-record** in `agent-req-implementation-checklist.yaml`).

## References

- `tied/docs/processes.md` § `[PROC-CITDP]` (especially step 8 — persistence).
- `tied/docs/agent-req-implementation-checklist.md` — `persist-citdp-record` and earlier CITDP-style steps.
- At repository root, `docs/leap-tied-citdp-costs-and-benefits.md` expands on tradeoffs (not always mirrored under `tied/docs/`).
