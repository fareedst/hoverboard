# [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] — How: incremental type-check without full TS rewrite — tsconfig noEmit, // @ts-check on key JS, shared .d.ts. Status: Active tooling; not a Deferred Safari path. Expand when more files adopt @ts-check.

## TYPECHECK_GATE

- [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: validate gate runs typecheck before build/push.
- Contract:
  - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: TYPECHECK_GATE
  - RUN tsc --noEmit with allowJs
  - ON errors: FAIL validate
  - RETURN pass
  - How (sub-block): How: checked modules document contracts via JSDoc/.d.ts; Zod remains runtime source for messages.

## MAINTAIN_CHECKED_SURFACE

- [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: Implements MAINTAIN_CHECKED_SURFACE behavior for IMPL-TYPESCRIPT_MIGRATION.
- Contract:
  - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: MAINTAIN_CHECKED_SURFACE
  - KEEP // @ts-check on boundary modules
  - UPDATE .d.ts when message/config shapes change
  - RETURN
