# Platform targets: Chromium-first, browser API shim, deferred cross-browser (canonical)

**Scope:** **Browser target** policy for Hoverboard — **Chromium-first** delivery, shared **browser API shim**, and **cross-browser (deferred)** expansion including **Safari App Extension (deferred)**. Vocabulary only — messaging and storage algorithms stay in IMPL.

**Excludes:** Side-panel UI terms (see [`side-panel.md`](side-panel.md)); overlay/popup surfaces (see [`ui-surfaces.md`](ui-surfaces.md)); storage backend names (see [`storage-backends.md`](storage-backends.md)).

**Traceability:** [REQ-CROSS_BROWSER](../requirements/REQ-CROSS_BROWSER.yaml) · [REQ-EXTENSION_IDENTITY](../requirements/REQ-EXTENSION_IDENTITY.yaml) · [REQ-SAFARI_ADAPTATION](../requirements.yaml) (Deferred) · [ARCH-EXT_IDENTITY](../architecture-decisions.yaml) · [ARCH-CROSS_BROWSER](../architecture-decisions.yaml) · [ARCH-SAFARI_ADAPTATION](../architecture-decisions.yaml) (Deferred) · [IMPL-CROSS_BROWSER](../implementation-decisions/IMPL-CROSS_BROWSER.yaml) · [IMPL-SAFARI_ADAPTATION](../implementation-decisions/IMPL-SAFARI_ADAPTATION.yaml) (Deferred)

**See also:** [`ui-surfaces.md`](ui-surfaces.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`domain-references.md`](domain-references.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **browser target** | platform (alone) | Which browser product the extension builds for |
| **Chromium-first** | Chrome-only forever | Active delivery is Chrome/Chromium; abstraction kept for future browsers |
| **browser API shim** | safari-shim (as product name) | Shared `browser` export; file may still be named `safari-shim.js` historically |
| **cross-browser (deferred)** | Safari support (as current) | Future multi-browser expansion via the shim; not active delivery |
| **Safari App Extension (deferred)** | safari/ package (as live) | TIED `REQ/ARCH/IMPL-SAFARI_ADAPTATION` Deferred; package removed from tree |
| **Chrome / Chromium** | WebKit (as target) | Active browser target per REQ-EXTENSION_IDENTITY |
| **API availability check** | Safari support (for missing APIs) | Guard UI/features when an API is absent (e.g. `chrome.sessions`); not product support |

---

## Naming bridge

| Canonical concept | Code / path | TIED |
|-------------------|-------------|------|
| Browser API shim | `src/shared/safari-shim.js` (`browser` export); re-export `src/shared/utils.js` | [REQ-CROSS_BROWSER] · [IMPL-CROSS_BROWSER] |
| Chrome identity | Root `manifest.json` MV3 | [REQ-EXTENSION_IDENTITY] |
| Deferred Safari product | (no `safari/` tree) | [REQ-SAFARI_ADAPTATION] Deferred |

---

## Notes

- Capability guards (e.g. hide UI when `chrome.sessions` is unavailable) are **API availability checks**, not Safari product support.
- CSS `-webkit-*` prefixes are Chromium-compatible vendor prefixes, not Safari App Extension code.
- Numbered legacy `SAFARI-*` tokens in source comments are out of scope; see `tied/docs/numbered-token-mapping.md`.
