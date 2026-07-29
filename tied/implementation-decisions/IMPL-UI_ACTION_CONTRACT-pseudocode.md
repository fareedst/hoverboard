# [IMPL-UI_ACTION_CONTRACT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
# Single module exporting message types and popup/overlay action IDs for tests and inspector.
# Contract: static exports; no input; tests/E2E import same IDs.
INPUT: none (static contract)
OUTPUT: exported constants MESSAGE_TYPES, POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS
DATA: single module src/shared/ui-action-contract.js

# Re-export MESSAGE_TYPES; export POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS.
LOAD contract:
  RE-EXPORT MESSAGE_TYPES from message layer
  EXPORT POPUP_ACTION_IDS (e.g. save, toggle-overlay)
  EXPORT POPUP_ACTION_TO_MESSAGE (actionId -> message type)
  EXPORT CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS
Tests and E2E IMPORT from this module; same IDs for send/assert
