# [IMPL-OVERLAY_TEST_HARNESS] [ARCH-OVERLAY_TESTABILITY] [REQ-OVERLAY_SYSTEM] [REQ-OVERLAY_CONTROL_LAYOUT]
# Mock DOM with auto-registration by className/id and classList tracking for overlay tests.
# Contract: test setup and overlay create calls; mock registry and classList log.
INPUT: test setup (no real DOM); overlay manager create calls
OUTPUT: mock DOM with auto-registered className/id; classList/attribute operations trackable
DATA: mock element registry (by className, id); classList add/remove log

# Register element when className or id is assigned.
ON element creation / property assign (className, id):
  REGISTER element in registry by className and id

# Record classList operations for assertions.
classList.add/remove: RECORD operation for assertions

# Create mock document/body; inject overlay; run show; assert registry and classList.
Test setup: CREATE mock document/body; INJECT overlay into mock; RUN show(); ASSERT registry and classList state
