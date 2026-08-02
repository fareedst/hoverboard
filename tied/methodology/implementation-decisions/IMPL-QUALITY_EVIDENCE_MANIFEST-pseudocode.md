# [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# Summary: Build a deterministic machine-derived verification evidence manifest while keeping human risk decisions separate.

# [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Define the manifest schema and preserve human decision references outside machine-derived results.
# [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
Contract:
  INPUT: run metadata, command results, quality evidence rows, covered tokens, proof-boundary labels
  PRE: each command result has command, cwd, integer exit code, and passed/failed result; each quality row has identity and applicability
  OUTPUT: verification evidence manifest
  POST: manifest contains normalized evidence in stable order; machine results do not claim human risk acceptance
  FAILURE_MODES: InvalidCommandResult, InvalidQualityRow
  EFFECTS: pure
  TERMINATION: total

# [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Reject invalid results, normalize nested records, and sort evidence deterministically.
procedure BUILD_VERIFICATION_EVIDENCE_MANIFEST(input):
  # [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  Contract:
    INPUT: run metadata, command results, quality rows, covered tokens, proof boundaries
    OUTPUT: verification evidence manifest
    PRE: command and quality arrays are provided
    POST: normalized command and quality rows are sorted by stable identifiers
    FAILURE_MODES: InvalidCommandResult, InvalidQualityRow
    EFFECTS: pure
    TERMINATION: total
  # [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Reject invalid command and quality evidence rows before normalization.
  VALIDATE command identity, exit/result agreement, and quality-row required fields
  # [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Normalize nested evidence records into the manifest shape.
  NORMALIZE command results and quality rows
  # [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Sort machine-derived rows by stable identifiers for deterministic output.
  SORT normalized commands and quality rows by stable identifiers
  # [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Preserve human decision references as opaque, separately sorted inputs.
  ATTACH decision references as sorted opaque references under human_decisions
  EMIT schema version verification-evidence-manifest.v1
  RETURN manifest containing run metadata, normalized rows, covered tokens, proof-boundary labels, and separate decision references