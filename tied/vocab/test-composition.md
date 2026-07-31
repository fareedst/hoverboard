# Test composition patterns (canonical)

**Scope:** Recognizable **composition patterns** (bindings between validated units) that are testable in Hoverboard without invoking the full UI. Covers pattern IDs, trigger → effect shape, required test level, and representative suites. **Vocabulary only** — algorithms stay in IMPL pseudo-code; process rules stay in `[PROC-TEST_STRATEGY]` / `[PROC-TIED_DEV_CYCLE]`.

**Excludes:** Unit-algorithm detail (pure PROCEDURE steps); Playwright E2E fixture setup (see `[IMPL-PLAYWRIGHT_E2E_EXTENSION]`); IMPL grammar keywords (INPUT/OUTPUT/PRE/POST — see [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md)).

**Traceability:** [REQ-COMPOSITION_TEST_RECOGNITION](../requirements/REQ-COMPOSITION_TEST_RECOGNITION.yaml) · [ARCH-COMPOSITION_TEST_PATTERNS](../architecture-decisions/ARCH-COMPOSITION_TEST_PATTERNS.yaml) · [IMPL-COMPOSITION_TEST_PATTERNS](../implementation-decisions/IMPL-COMPOSITION_TEST_PATTERNS.yaml) · [REQ-MODULE_VALIDATION](../requirements/REQ-MODULE_VALIDATION.yaml) · [ARCH-UI_TESTABILITY](../architecture-decisions/ARCH-UI_TESTABILITY.yaml) · [PROC-TEST_STRATEGY](../docs/processes.md)

**See also:** [`routing.md`](routing.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`ui-surfaces.md`](ui-surfaces.md) · [`side-panel.md`](side-panel.md) · [`pseudocode-and-citdp.md`](pseudocode-and-citdp.md) · [`../docs/impl-code-test-linkage.md`](../docs/impl-code-test-linkage.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **composition test** | integration test (alone), glue test | Jest `*.integration.test.js` that verifies a **binding** without UI invocation |
| **composition pattern** | wiring style (alone) | Named pattern ID (e.g. `MESSAGE_DISPATCH`) reusable across IMPLs |
| **binding** | connection, hookup | Trigger → receiving unit → args → observable effect |
| **unit-first RED** | skip unit for composition | Algorithm PROCEDURE gets a failing unit test before composition RED |
| **composition edge** | composed_with alone | Directed pair of IMPL tokens (or units) with a named binding |
| **edge status** | coverage guess | One of: `covered`, `partial`, `unit-only`, `candidate`, `e2e_only` |
| **testability ladder** | test pyramid (alone) | function call → unit; event/message/wiring → composition; named platform constraint → E2E |
| **orchestrator** | UI helper (alone) | Pure/exported Index/popup helper that sends messages and updates status DOM |
| **test seam** | test hook (alone) | Exported `*ForTest` / emitter / mockable adapter used by composition suites |

---

## Testability ladder (decision rule)

| Question | Level | Notes |
|----------|-------|-------|
| Can I call a function and assert OUTPUT? | **unit** | Pure PROCEDURE / FAILURE_MODES |
| Can I fire an event/message/emitter and observe the next unit? | **composition** | Binding; no Playwright / no real popup.html click |
| Does it require a real `chrome-extension://` host or named platform constraint? | **E2E** | Justify with `e2e_only_reason`; never substitutes composition |

---

## Catalog: composition pattern IDs

| Pattern ID | Trigger | Participating units | Observable effect | Level | Representative suite |
|------------|---------|---------------------|-------------------|-------|----------------------|
| `MESSAGE_DISPATCH` | `runtime.onMessage` / `processMessage` | SW or MessageHandler → handler/provider | `sendResponse` / Promise result | composition | `message-handler-router-storage.integration.test.js`, `link-health.integration.test.js` |
| `UI_EMIT_COMMAND` | `UIManager.emit` / `on` | PopupController handler → `sendMessage` | Message type + payload shape | composition | `library-search-entry.integration.test.js`, `bookmark-notes-ui.integration.test.js` |
| `ORCHESTRATOR_STATUS` | Orchestrator call (e.g. `runBulkDelete`) | helper → `sendMessage` → status DOM / `onResults` | Pending then final status text | composition | `bookmarks-table-bulk-delete-composition.integration.test.js` |
| `ROUTER_STORAGE` | save/delete/move via handler | MessageHandler → BookmarkRouter → StorageIndex → provider | Persisted bookmark / index backend | composition | `message-handler-router-storage.integration.test.js` |
| `LAZY_INIT_GUARD` | tab switch / `runInitialTabInit` | side-panel.js → one-shot init → feature module | Init called once; storage key written | composition | `browser-tabs-tab-composition.integration.test.js` |
| `EVENT_REFRESH_GUARD` | `tabs.onActivated` / `windows.onFocusChanged` | bind* → sync guards → controller refresh | Refresh called or skipped; inspector outcome | composition | `window-focus-recent-tags-composition.integration.test.js`, `side-panel-tab-change-injection.integration.test.js` |
| `ORDERED_ASYNC_HANDOFF` | `loadInitialData` / sort mode click | PopupController ↔ UIManager | Ordered awaits; normalized rows painted | composition | `this-page-tag-sort-composition.integration.test.js` |
| `NATIVE_ADAPTER_CALLBACK` | SW method / native message | SW → `sendNativeMessage` / file adapter | Normalized `{ success, count\|error }` | composition | `local-query-api-snapshot-write.integration.test.js` |
| `SCOPED_DOM_BINDING` | `createPopup({ container })` | UIManager scoped root under panel | Elements resolve via `data-popup-ref` | composition | `side-panel-create-popup-scoped-composition.integration.test.js` (+ unit `ui-manager-scoped-root.test.js`) |

---

## Naming bridge: pattern → seams → suites

| Pattern ID | Common seams | Suite glob / path |
|------------|--------------|-------------------|
| `MESSAGE_DISPATCH` | `chrome.runtime.onMessage.addListener`, `MESSAGE_TYPES` | `tests/integration/*message*.integration.test.js`, `*-health.integration.test.js` |
| `UI_EMIT_COMMAND` | `uiManager.on` / `emit`, `controller.sendMessage` | `tests/integration/*entry*.integration.test.js`, `bookmark-notes-ui.integration.test.js` |
| `ORCHESTRATOR_STATUS` | `runBulkDelete`, `runCheckLinkHealth`, `runRefreshApiSnapshot` | `tests/integration/*composition.integration.test.js` |
| `ROUTER_STORAGE` | `BookmarkRouter`, `StorageIndex`, providers | `message-handler-router-storage.integration.test.js` |
| `LAZY_INIT_GUARD` | `switchTabForTest`, `resetBrowserTabsTabInitedForTest` | `browser-tabs-tab-composition.integration.test.js` |
| `EVENT_REFRESH_GUARD` | `bindTabChangeRefresh`, `bindWindowFocusRecentTagsRefresh`, `setPopupComponentsForTest` | `*-composition.integration.test.js` |
| `ORDERED_ASYNC_HANDOFF` | spies on `refreshTagFrequencyMapForSort`, `loadSuggestedTags` | `this-page-tag-sort-composition.integration.test.js` |
| `NATIVE_ADAPTER_CALLBACK` | `chrome.runtime.sendNativeMessage` | `local-query-api-snapshot-write.integration.test.js` |
| `SCOPED_DOM_BINDING` | `UIManager({ container })`, `data-popup-ref`, `createPopup` | `side-panel-create-popup-scoped-composition.integration.test.js` |

---

## Edge status values

| Status | Meaning |
|--------|---------|
| `covered` | Dedicated composition suite asserts trigger → args → effect for the edge |
| `partial` | Related composition suite exists but does not assert the full chain |
| `unit-only` | Unit tests cover algorithms; binding not composition-tested |
| `candidate` | IMPL `composed_with` / sidecar ON-WHEN implies a binding; no composition suite |
| `e2e_only` | Documented platform constraint; composition cannot exercise the surface |

---

## Named concepts

- **composition test plan report** — `scripts/composition-test-plan.js` / `npm run composition:plan`; lists edges with pattern ID and status.
- **generated composition test template** — file under `tests/integration/` that copies IMPL block lead (or full block), asserts trigger → receiving unit → args → effect.
- **Phase G** — checklist / `[PROC-IMPL_CODE_TEST_SYNC]` composition phase after unit TDD.
- **composed_with** — IMPL field listing routinely composed peer IMPLs; source for edge discovery.

---

## Pseudo-code block names

| Preferred term | UPPER_SNAKE / procedure | Owning IMPL |
|----------------|-------------------------|-------------|
| Classify composition edge | `CLASSIFY_COMPOSITION_EDGE` | [IMPL-COMPOSITION_TEST_PATTERNS](../implementation-decisions/IMPL-COMPOSITION_TEST_PATTERNS.yaml) |
| Emit composition test plan | `EMIT_COMPOSITION_TEST_PLAN` | [IMPL-COMPOSITION_TEST_PATTERNS](../implementation-decisions/IMPL-COMPOSITION_TEST_PATTERNS.yaml) |
| Match pattern ID | `MATCH_COMPOSITION_PATTERN` | [IMPL-COMPOSITION_TEST_PATTERNS](../implementation-decisions/IMPL-COMPOSITION_TEST_PATTERNS.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| binding | Preferred terms |
| composed_with | Named concepts |
| composition edge | Preferred terms |
| composition pattern | Preferred terms |
| composition test | Preferred terms |
| composition test plan report | Named concepts |
| edge status | Preferred terms / Edge status |
| EVENT_REFRESH_GUARD | Catalog |
| generated composition test template | Named concepts |
| LAZY_INIT_GUARD | Catalog |
| MESSAGE_DISPATCH | Catalog |
| NATIVE_ADAPTER_CALLBACK | Catalog |
| ORDERED_ASYNC_HANDOFF | Catalog |
| ORCHESTRATOR_STATUS | Catalog |
| Phase G | Named concepts |
| ROUTER_STORAGE | Catalog |
| SCOPED_DOM_BINDING | Catalog |
| test seam | Preferred terms |
| testability ladder | Preferred terms / Ladder |
| UI_EMIT_COMMAND | Catalog |
| unit-first RED | Preferred terms |
