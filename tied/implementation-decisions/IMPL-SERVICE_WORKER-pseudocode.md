# [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION]
# How: MV3 service worker owns messaging, badge, recent-tags memory, and lifecycle wake/sleep.
INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab

# [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION]
# How: wire listeners once; delegate business logic to validated modules.
SERVICE_WORKER_MAIN:
  ON install/activate: AWAIT initManagers()
  ON message (msg, sender, sendResponse):
    result = AWAIT handleMessage(msg, sender)
    sendResponse(result); RETURN true
  ON alarm: AWAIT runDeferredTasks()
  RETURN

# How: after processMessage success for bookmark/tag mutations, refresh badge.
handleMessage(msg, sender):
  result = AWAIT messageHandler.processMessage(msg, sender)
  IF result.ok AND isMutation(msg.type): AWAIT updateBadgeForTab(resolveTab(sender, msg))
  RETURN result
