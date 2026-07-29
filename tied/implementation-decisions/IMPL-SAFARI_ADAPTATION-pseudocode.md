# [IMPL-SAFARI_ADAPTATION] [ARCH-SAFARI_ADAPTATION] [REQ-SAFARI_ADAPTATION]
# Deferred Safari App Extension adaptations. Not active delivery; Chrome is the browser target now.
# Contract: when Safari target is reintroduced, detect platform and apply Safari config/recovery.
# Active Chrome browser API shim is owned by [IMPL-CROSS_BROWSER] (src/shared/safari-shim.js).
INPUT: platform detection result; optional Safari config (timeouts, retries, opacity)
OUTPUT: Safari-specific config and degraded-mode behavior only when Safari target is built again
DATA: getSafariConfig(); ErrorHandler recovery (future Safari package)

# Deferred: no Safari package in tree; do not run Safari adaptations in Chrome build.
ON product init (Chrome-first):
  DO NOT apply Safari-only animation or ErrorHandler paths
  USE [IMPL-CROSS_BROWSER] browser API shim for Chrome runtime

# Future reactivation: when Safari App Extension package exists again.
WHEN Safari browser target is reintroduced:
  IF platform is Safari:
    config = getSafariConfig()
    APPLY timeouts/retries/opacity from config
    optimizeSafariAnimations(): REDUCE or REPLACE heavy animations; BOUND memory
    ON error: ErrorHandler; TRY recovery; IF unrecoverable: ENTER degraded mode
