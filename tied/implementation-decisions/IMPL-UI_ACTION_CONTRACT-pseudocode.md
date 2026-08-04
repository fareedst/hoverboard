# [IMPL-UI_ACTION_CONTRACT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — Single module exporting message types and popup/overlay action IDs for tests and inspector. Contract: static exports; no input; tests/E2E import same IDs.

## MAIN

- [IMPL-UI_ACTION_CONTRACT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-UI_ACTION_CONTRACT.
- Contract:
  - INPUT: none (static contract)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: exported constants MESSAGE_TYPES, POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: single module src/shared/ui-action-contract.js
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Re-export MESSAGE_TYPES; export POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS.
  - 1. LOAD contract:
  - 2.   RE-EXPORT MESSAGE_TYPES from message layer
  - 3.   EXPORT POPUP_ACTION_IDS (e.g. save, toggle-overlay)
  - 4.   EXPORT POPUP_ACTION_TO_MESSAGE (actionId -> message type)
  - 5.   EXPORT CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS
  - 6. Tests and E2E IMPORT from this module; same IDs for send/assert

## MESSAGE_DISPATCH_TESTABILITY

- [IMPL-UI_ACTION_CONTRACT] [IMPL-UI_TESTABILITY_HOOKS] [IMPL-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Provides the shared message/action identifiers used by dispatch and testability-hook composition assertions.
- Contract:
  - INPUT: exported message and action identifiers
  - PRE: the contract module is loaded by sender, handler, and test seam
  - OUTPUT: identical identifiers at every participating boundary
  - POST:
    - success => dispatch tests can trigger and assert the same action/message values
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: MESSAGE_DISPATCH_TESTABILITY
  - LOAD shared contract
  - PROVIDE identifiers to dispatch and callback seams
  - ASSERT sender and receiver use the same identifiers
