# [IMPL-OVERLAY_TEST_HARNESS] [ARCH-OVERLAY_TESTABILITY] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_CONTROL_LAYOUT] — Mock DOM with auto-registration by className/id and classList tracking for overlay tests. Contract: test setup and overlay create calls; mock registry and classList log.

## MAIN

- [IMPL-OVERLAY_TEST_HARNESS] [ARCH-OVERLAY_TESTABILITY] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_CONTROL_LAYOUT] How: Logical block for IMPL-OVERLAY_TEST_HARNESS.
- Contract:
  - INPUT: test setup (no real DOM); overlay manager create calls
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: mock DOM with auto-registered className/id; classList/attribute operations trackable
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: mock element registry (by className, id); classList add/remove log
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Register element when className or id is assigned.
  - 1. ON element creation / property assign (className, id):
  - 2.   REGISTER element in registry by className and id
  - How (sub-block): Record classList operations for assertions.
  - 3. classList.add/remove: RECORD operation for assertions
  - How (sub-block): Create mock document/body; inject overlay; run show; assert registry and classList.
  - 4. Test setup: CREATE mock document/body; INJECT overlay into mock; RUN show(); ASSERT registry and classList state
