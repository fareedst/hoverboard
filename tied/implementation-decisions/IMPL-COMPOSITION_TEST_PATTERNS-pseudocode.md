# [IMPL-COMPOSITION_TEST_PATTERNS] [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION] [REQ-MODULE_VALIDATION]
# Discover Active composition edges, match pattern IDs, classify status, emit a reviewable plan for generated composition tests.
# Contract: Active IMPL metadata + sidecars + integration suites in; plan rows with pattern/status/paths out; never silent e2e_only.

## MATCH_COMPOSITION_PATTERN

- [IMPL-COMPOSITION_TEST_PATTERNS] [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION] [REQ-MODULE_VALIDATION] How: Map binding signals between independently validated units and known suite families to a stable pattern ID from tied/vocab/test-composition.md.
- Contract:
  - INPUT: edge (source_impl, target_impl?), sidecar_text?, suite_paths[]
  - PRE: pattern catalog loaded (MESSAGE_DISPATCH … SCOPED_DOM_BINDING)
  - OUTPUT: pattern_id (string) or UNKNOWN
  - POST: success => pattern_id is catalogued or UNKNOWN
  - DATA: PATTERN_RULES (trigger keywords, suite name hints, composed_with peers)
  - EFFECTS: none
  - FAILURE_MODES: unknown_binding => UNKNOWN (not e2e_only)
  - TERMINATION: total
- PROCEDURE: MATCH_COMPOSITION_PATTERN
  - 1. IF sidecar/suite mentions runtime.onMessage OR processMessage OR MESSAGE_TYPES: RETURN MESSAGE_DISPATCH
  - 2. IF UIManager.emit/on AND sendMessage: RETURN UI_EMIT_COMMAND
  - 3. IF orchestrator run* AND status DOM/onResults: RETURN ORCHESTRATOR_STATUS
  - 4. IF BookmarkRouter OR StorageIndex persistence path: RETURN ROUTER_STORAGE
  - 5. IF one-shot tab init / switchTabForTest: RETURN LAZY_INIT_GUARD
  - 6. IF tabs.onActivated OR windows.onFocusChanged guards: RETURN EVENT_REFRESH_GUARD
  - 7. IF ordered AWAIT A before B / normalize then paint: RETURN ORDERED_ASYNC_HANDOFF
  - 8. IF sendNativeMessage OR native/file adapter callback: RETURN NATIVE_ADAPTER_CALLBACK
  - 9. IF createPopup container OR data-popup-ref scoped root: RETURN SCOPED_DOM_BINDING
  - 10. RETURN UNKNOWN

## CLASSIFY_COMPOSITION_EDGE

- [IMPL-COMPOSITION_TEST_PATTERNS] [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION] [REQ-MODULE_VALIDATION] How: Join composed_with + binding signals to traceability.tests and integration suite paths; assign edge status with evidence.
- Contract:
  - INPUT: edge, matched_suites[], unit_tests[], e2e_only_reason?
  - PRE: MATCH_COMPOSITION_PATTERN already run
  - OUTPUT: { status, evidence, missing_test_path?, e2e_only_reason? }
  - POST: status ∈ { covered, partial, unit-only, candidate, e2e_only }; e2e_only only when e2e_only_reason names platform constraint
  - DATA: EDGE_STATUS
  - EFFECTS: none
  - FAILURE_MODES: silent_e2e => FORBIDDEN (require explicit reason)
  - TERMINATION: total
- PROCEDURE: CLASSIFY_COMPOSITION_EDGE
  - 1. IF detail.e2e_only_reason present AND names platform constraint: RETURN { status: e2e_only, evidence }
  -    (Do NOT infer e2e_only from test_coverage_note prose; silent e2e_only is FORBIDDEN)
  - 2. IF matched_suites assert trigger→args→effect for edge: RETURN { status: covered }
  - 3. IF matched_suites related but incomplete chain: RETURN { status: partial, missing_test_path }
  - 4. IF unit_tests only: RETURN { status: unit-only, missing_test_path }
  - 5. RETURN { status: candidate, missing_test_path }

## EMIT_COMPOSITION_TEST_PLAN

- [IMPL-COMPOSITION_TEST_PATTERNS] [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION] [REQ-MODULE_VALIDATION] How: Scan Active IMPLs, classify edges between independently validated units, print a reviewable plan for agents generating tests, and enforce unit-first then composition RED ordering in guidance.
- Contract:
  - INPUT: tied/implementation-decisions/*.yaml (+ sidecars), tests/integration/**/*.integration.test.js
  - PRE: catalog and status vocabulary available
  - OUTPUT: plan rows: pattern_id, impl tokens, source/target units, trigger, expected args, expected effect, existing_test_path, missing_test_path, e2e_justification?
  - POST: every Active composed_with edge appears once with status evidence; no silent e2e_only
  - DATA: PLAN_ROWS[]
  - EFFECTS: IO (stdout / optional file)
  - TERMINATION: total
- PROCEDURE: EMIT_COMPOSITION_TEST_PLAN
  - 1. LOAD Active IMPL details and essence_pseudocode sidecars
  - 2. COLLECT edges from related_decisions.composed_with AND binding-signal procedures (ON/WHEN/REGISTER/SEND/AWAIT)
  - 3. FOR each edge: pattern = MATCH_COMPOSITION_PATTERN; status = CLASSIFY_COMPOSITION_EDGE
  - 4. EMIT markdown table (and optional JSON) with plan fields
  - 5. EMIT guidance: IMPL pseudo-code → unit RED/GREEN → composition RED/GREEN → E2E only if justified
  - 6. SUGGEST template path tests/integration/_templates/composition-test.template.js for missing suites
