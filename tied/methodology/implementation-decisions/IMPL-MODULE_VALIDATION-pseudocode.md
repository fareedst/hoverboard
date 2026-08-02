# [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
# Summary: Six-phase lifecycle — identify module boundaries, build with DI, validate in isolation, document, prove every binding with UI-free composition tests, integrate only when green; E2E only for named platform constraints.

## MODULE_VALIDATION_LIFECYCLE
# [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
# How: Contract-precise lifecycle gate — independent module validation before any binding composition; composition evidence required before integration; E2E excluded by default.

# [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
Contract:
  INPUT: module_boundary_spec; interface_contracts; dependency_mocks_and_doubles; binding_inventory_rows
  OUTPUT: validation_evidence; composition_evidence; go_no_go_for_integration
  DATA: documented_boundaries; validation_results; binding_inventory
  CONTROL: integration_blocked_until_independent_and_composition_gates_pass
  PRE: module_boundary_spec identifies logical modules with clear interfaces; binding_inventory lists every trigger→callee seam in scope
  POST: every module has passing independent validation; every binding_inventory row has a composition test locus; go_no_go is allow only when both gates pass
  EFFECTS: State — validation_results and composition_evidence recorded; Control — integration allowed or blocked
  FAILURE_MODES: MISSING_BOUNDARIES; INDEPENDENT_VALIDATION_FAILED; MISSING_BINDING_INVENTORY; MISSING_COMPOSITION_EVIDENCE; COMPOSITION_BINDING_FAILED; UNJUSTIFIED_E2E_ONLY
  DATA_TRANSITION: documented_boundaries empty→populated (phase 1); validation_results pending→pass|fail (phase 3–4); binding_inventory draft→proven (phase 5); go_no_go blocked→allow when all gates green
  TERMINATION: total — finite phases; no open wait

# [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
# How: Execute the six-phase module-validation lifecycle and block integration until independent validation and composition evidence pass.
procedure MODULE_VALIDATION_LIFECYCLE:
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Execute the six-phase lifecycle and block integration until independent validation and composition evidence pass.
  Contract:
    INPUT: module_boundary_spec; interface_contracts; dependency_mocks_and_doubles; binding_inventory_rows
    OUTPUT: validation_evidence; composition_evidence; go_no_go_for_integration
    PRE: module_boundary_spec identifies logical modules; binding_inventory lists every trigger→callee seam
    POST: independent validation and composition evidence pass before go_no_go becomes allow
    EFFECTS: State — validation_results and composition_evidence recorded; Control — integration allowed or blocked
    FAILURE_MODES: MISSING_BOUNDARIES; INDEPENDENT_VALIDATION_FAILED; MISSING_BINDING_INVENTORY; MISSING_COMPOSITION_EVIDENCE; COMPOSITION_BINDING_FAILED; UNJUSTIFIED_E2E_ONLY
    DATA_TRANSITION: validation_results pending→pass|fail; binding_inventory draft→proven; go_no_go blocked→allow
    TERMINATION: total — finite phases; no open wait
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Phase 1 — document boundaries, interfaces, contracts, dependencies, validation criteria, and initial binding inventory.
  DOCUMENT module boundaries, interfaces, contracts, dependencies, validation criteria
  BUILD binding_inventory with columns: Binding_ID, Trigger, Callee, Arguments, Effect, Ordering_PRE, Failure_mode, Composition_test, E2E_flag
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Phase 2 — develop module independently with dependency injection.
  DEVELOP module with injectable collaborators (no hard-wired untested peers)
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Phase 3 — unit + contract + edge-case + error-path validation with mocks/doubles.
  RUN independent unit and contract tests with mocked dependencies
  RUN edge_case and error_handling validation
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Phase 4 — record validation results, limitations, assumptions.
  DOCUMENT validation_results including passed tests, limitations, assumptions
  IF independent validation fails:
    RETURN FAILURE_MODE INDEPENDENT_VALIDATION_FAILED without integration
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Phase 5 — COMPOSITION_BINDING_VALIDATION: one failing composition test per binding, then minimal wiring; UI-free.
  CALL COMPOSITION_BINDING_VALIDATION(binding_inventory)
  IF composition gate fails:
    RETURN without integration; fix binding or revise inventory
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Phase 6 — integrate only after independent + composition gates pass; combined behavior must honor contracts.
  INTEGRATE validated modules
  RUN integration assertions on combined behavior against documented contracts
  IF phase 6 fails:
    RETURN; treat as integration defect against documented contracts
  SET go_no_go = allow

## COMPOSITION_BINDING_VALIDATION
# [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
# How: UI-free composition gate for every binding — failing composition test before wiring; E2E only with named platform constraint.

# [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
Contract:
  INPUT: binding_inventory; independently_validated_modules
  OUTPUT: composition_evidence_per_binding; remaining_e2e_only_rows_with_named_constraint
  DATA: binding_inventory
  CONTROL: no_composition_code_without_failing_composition_test
  PRE: every module in binding_inventory collaborators has passed independent validation; each row names Trigger, Callee, Arguments, Effect
  POST: each composition-testable row has a RED-then-GREEN composition test verifying trigger→callee→arguments→effect without UI; each e2e_only row names a specific platform constraint
  EFFECTS: State — binding_inventory rows marked proven or e2e_only; Tests — composition tests exist and pass for non-E2E rows
  FAILURE_MODES: MISSING_BINDING_INVENTORY; MISSING_COMPOSITION_EVIDENCE; COMPOSITION_BINDING_FAILED; UNJUSTIFIED_E2E_ONLY
  DATA_TRANSITION: binding_inventory row status draft→proven|e2e_only_justified
  TERMINATION: total — iterate finite inventory rows

# [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
# How: Prove each composition-testable binding with a UI-free RED-then-GREEN test or require a named platform constraint for E2E-only rows.
procedure COMPOSITION_BINDING_VALIDATION(binding_inventory):
  # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
  # How: Prove each composition-testable binding with a UI-free RED-then-GREEN test or require a named platform constraint for E2E-only rows.
  Contract:
    INPUT: binding_inventory; independently_validated_modules
    OUTPUT: composition_evidence_per_binding; remaining_e2e_only_rows_with_named_constraint
    PRE: independently_validated_modules pass; each row names Trigger, Callee, Arguments, Effect
    POST: each composition-testable row is proven or each e2e_only row has a named platform constraint
    EFFECTS: State — binding_inventory rows marked proven or e2e_only; Tests — composition tests exist and pass
    FAILURE_MODES: MISSING_BINDING_INVENTORY; MISSING_COMPOSITION_EVIDENCE; COMPOSITION_BINDING_FAILED; UNJUSTIFIED_E2E_ONLY
    DATA_TRANSITION: binding_inventory row status draft→proven|e2e_only_justified
    TERMINATION: total — iterate finite inventory rows
  IF binding_inventory is empty AND change introduces collaborators:
    RETURN FAILURE_MODE MISSING_BINDING_INVENTORY
  FOR each row IN binding_inventory:
    IF row claims e2e_only:
      IF row.e2e_only_reason does not name a platform constraint:
        RETURN FAILURE_MODE UNJUSTIFIED_E2E_ONLY
      CONTINUE
    # [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION]
    # How: Decision gate — programmatic trigger and observable effect without browser/UI → composition test required.
    WRITE failing composition test asserting Trigger fires, Callee invoked, Arguments match PRE/INPUT, Effect matches POST/EFFECTS or FAILURE_MODES
    IMPLEMENT minimal wiring or binding code only to satisfy that test
    IF composition test fails after wiring:
      RETURN FAILURE_MODE COMPOSITION_BINDING_FAILED
    MARK row proven with composition_test locus
  IF any composition-testable row lacks composition_test locus:
    RETURN FAILURE_MODE MISSING_COMPOSITION_EVIDENCE
  RETURN composition_evidence_per_binding
