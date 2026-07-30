# [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] — How: MV3 service worker owns messaging, badge, recent-tags memory, and lifecycle wake/sleep.

## SERVICE_WORKER_MAIN

- [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: wire listeners once; delegate business logic to validated modules.
- Contract:
  - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: SERVICE_WORKER_MAIN
  - ON install/activate: AWAIT initManagers()
  - ON message (msg, sender, sendResponse):
  - result = AWAIT handleMessage(msg, sender)
  - sendResponse(result); RETURN true
  - ON alarm: AWAIT runDeferredTasks()
  - RETURN
  - How (sub-block): How: after processMessage success for bookmark/tag mutations, refresh badge.

## HANDLE_MESSAGE

- [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: Implements handleMessage(msg, sender) behavior for IMPL-SERVICE_WORKER.
- Contract:
  - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: HANDLE_MESSAGE
  - result = AWAIT messageHandler.processMessage(msg, sender)
  - IF result.ok AND isMutation(msg.type): AWAIT updateBadgeForTab(resolveTab(sender, msg))
  - RETURN result
