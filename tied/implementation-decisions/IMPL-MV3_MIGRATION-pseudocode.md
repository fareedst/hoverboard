# [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] — How: keep store-compatible Manifest V3: service worker replaces background page; preserve messaging and APIs.

## MV3_BACKGROUND_RUNTIME

- [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: service worker owns listeners; async message replies use return true / Promise patterns.
- Contract:
  - INPUT: extension lifecycle events; chrome.runtime / chrome.storage / chrome.action calls
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: service-worker-backed background behavior equivalent to prior MV2 background page contracts
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: manifest_version 3; src/core/service-worker.js; ARCH-SERVICE_WORKER lifecycle patterns
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: MV3_BACKGROUND_RUNTIME
  - ON install/activate: init shared managers (config, tags memory, badge)
  - ON message: DELEGATE to MessageHandler; KEEP channel alive until AWAIT completes
  - ON alarm/idle as needed: wake worker for deferred work
  - RETURN

## MV3_ENTRY_POINT_BINDING

- [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: Verifies the Manifest V3 background declaration resolves to the shipped service-worker entry point without invoking a browser UI.
- Contract:
  - INPUT: manifest file and service-worker entry path
  - PRE: manifest JSON and repository entry file are readable
  - OUTPUT: validated manifest_version and existing service-worker path
  - POST:
    - success => manifest declares version 3 and points to src/core/service-worker.js
  - FAILURE_MODES: InvalidManifest, MissingServiceWorker
  - EFFECTS: pure, IO
  - TERMINATION: total
- PROCEDURE: MV3_ENTRY_POINT_BINDING
  - READ manifest
  - ASSERT manifest_version = 3
  - READ background.service_worker
  - ASSERT entry path = src/core/service-worker.js
  - ASSERT entry file exists
