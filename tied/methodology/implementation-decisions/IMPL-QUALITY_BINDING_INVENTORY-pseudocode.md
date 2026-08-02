# [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
# Summary: Validate composition bindings and their UI-free proof references.

# [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
# How: Define the binding-row vocabulary and the diagnostics-only composition proof boundary.
# [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
Contract:
  INPUT: binding inventory rows
  PRE: each row is an object candidate
  OUTPUT: binding validation report with proof boundary and diagnostics
  POST: every accepted row has a unique id, trigger, callee, arguments, effect, ordering, failure behavior, and composition proof or justified E2E reason
  FAILURE_MODES: InvalidBindingInventoryInput
  EFFECTS: pure
  TERMINATION: total

# [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
# How: Check row shape and required composition proof fields before accepting a binding.
procedure VALIDATE_BINDING_INVENTORY(rows):
  # [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
  Contract:
    INPUT: binding inventory rows
    OUTPUT: binding validation report
    PRE: rows is an array of row candidates
    POST: duplicate, incomplete, and unjustified E2E rows have diagnostics
    FAILURE_MODES: InvalidBindingInventoryInput
    EFFECTS: pure
    TERMINATION: total
  # [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
  # How: Start a deterministic report and duplicate-detection set.
  INITIALIZE diagnostics and seen binding identifiers
  # [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
  # How: Validate each binding row against the required trigger-to-effect contract.
  FOR each row with source index:
    # [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
    # How: Report missing fields and duplicate identifiers without stopping the remaining audit.
    REPORT missing id, trigger, callee, arguments, effect, ordering, or failure behavior
    REPORT duplicate id
    # [IMPL-QUALITY_BINDING_INVENTORY] [ARCH-QUALITY_ASSURANCE_PROFILES] [ARCH-MODULE_VALIDATION] [REQ-QUALITY_ASSURANCE_EVIDENCE] [REQ-MODULE_VALIDATION]
    # How: Require a named platform constraint for E2E-only rows and UI-free evidence otherwise.
    IF row is marked e2e_only:
      REQUIRE a named platform constraint in the justification
    ELSE:
      REQUIRE a UI-free composition test reference
  RETURN report with proof boundary composition-only and UI-free