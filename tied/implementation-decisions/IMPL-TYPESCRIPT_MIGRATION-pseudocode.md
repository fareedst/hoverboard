# [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY]
# How: incremental type-check without full TS rewrite — tsconfig noEmit, // @ts-check on key JS, shared .d.ts.
# Status: Active tooling; not a Deferred Safari path. Expand when more files adopt @ts-check.
INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files
DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client

# [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY]
# How: validate gate runs typecheck before build/push.
TYPECHECK_GATE:
  RUN tsc --noEmit with allowJs
  ON errors: FAIL validate
  RETURN pass

# How: checked modules document contracts via JSDoc/.d.ts; Zod remains runtime source for messages.
MAINTAIN_CHECKED_SURFACE:
  KEEP // @ts-check on boundary modules
  UPDATE .d.ts when message/config shapes change
  RETURN
