# [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]
# How: keep store-compatible Manifest V3: service worker replaces background page; preserve messaging and APIs.
INPUT: extension lifecycle events; chrome.runtime / chrome.storage / chrome.action calls
OUTPUT: service-worker-backed background behavior equivalent to prior MV2 background page contracts
DATA: manifest_version 3; src/core/service-worker.js; ARCH-SERVICE_WORKER lifecycle patterns

# [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]
# How: service worker owns listeners; async message replies use return true / Promise patterns.
MV3_BACKGROUND_RUNTIME:
  ON install/activate: init shared managers (config, tags memory, badge)
  ON message: DELEGATE to MessageHandler; KEEP channel alive until AWAIT completes
  ON alarm/idle as needed: wake worker for deferred work
  RETURN
