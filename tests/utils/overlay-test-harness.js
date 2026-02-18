/**
 * Overlay test harness - displayed state snapshot and action log for overlay unit tests
 * [IMPL-OVERLAY_TEST_HARNESS] [ARCH-OVERLAY_TESTABILITY] [REQ-UI_INSPECTION]
 * Used with OverlayManager.setOnStateChange and setOnOverlayAction in tests.
 */

let _displayedSnapshot = null
const _actionLog = []

export function setOverlayDisplayedSnapshot (snapshot) {
  _displayedSnapshot = snapshot == null ? null : { ...snapshot }
}

export function getOverlayDisplayedSnapshot () {
  return _displayedSnapshot == null ? null : { ..._displayedSnapshot }
}

export function pushOverlayAction (actionId) {
  _actionLog.push({ actionId, ts: Date.now() })
}

export function getOverlayActionLog () {
  return [..._actionLog]
}

export function clearOverlayActionLog () {
  _actionLog.length = 0
}

export function clearOverlayTestHarness () {
  _displayedSnapshot = null
  _actionLog.length = 0
}
