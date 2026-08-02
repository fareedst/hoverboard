# [IMPL-QUALITY_EVIDENCE_COLLECTION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# Summary: Compose declared command execution with verification manifest generation.

# [IMPL-QUALITY_EVIDENCE_COLLECTION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Establish a complete collection context before composing bounded execution and manifest generation.
# [IMPL-QUALITY_EVIDENCE_COLLECTION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
Contract:
  INPUT: quality command declarations, collection context, execution limits, artifact policy
  PRE: declarations are validated and runner and manifest builder are available
  OUTPUT: verification evidence manifest with command results, environment, artifacts, and proof boundaries
  POST: every declaration has a normalized result; provenance identifies command, environment, commit, exit code, artifact, and proof boundary
  FAILURE_MODES: InvalidCollectionInput, CommandCollectionFailure, ManifestBuildFailure
  DATA_TRANSITION: declarations -> normalized command results -> verification evidence manifest
  EFFECTS: invokes bounded command runner and writes retained evidence artifacts
  TERMINATION: total subject to declared command timeout

# [IMPL-QUALITY_EVIDENCE_COLLECTION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Validate collection context, run declarations upstream, and pass observed results to manifest generation.
procedure COLLECT_VERIFICATION_EVIDENCE(input):
  # [IMPL-QUALITY_EVIDENCE_COLLECTION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  Contract:
    INPUT: command declarations, run metadata, quality rows, proof boundaries
    OUTPUT: verification evidence manifest
    PRE: collection input is complete and runner/manifest modules are available
    POST: manifest contains one normalized result per declaration
    FAILURE_MODES: InvalidCollectionInput, CommandCollectionFailure, ManifestBuildFailure
    DATA_TRANSITION: declarations -> command results -> manifest
    EFFECTS: bounded process IO and artifact writes
    TERMINATION: total subject to command timeout
  # [IMPL-QUALITY_EVIDENCE_COLLECTION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Reject incomplete collection context before invoking either composed module.
  VALIDATE non-empty declarations, run metadata, quality rows, proof boundaries, limits, and artifact policy
  # [IMPL-QUALITY_EVIDENCE_COLLECTION] [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Delegate each validated declaration to the bounded command runner.
  # [IMPL-QUALITY_EVIDENCE_COLLECTION] [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Delegate validated command declarations and execution limits to the bounded command runner.
  RUN IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER for each declaration
  # [IMPL-QUALITY_EVIDENCE_COLLECTION] [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Pass normalized command results to deterministic manifest generation.
  # [IMPL-QUALITY_EVIDENCE_COLLECTION] [IMPL-QUALITY_EVIDENCE_MANIFEST] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Delegate normalized command results and collection metadata to deterministic manifest generation.
  BUILD manifest with IMPL-QUALITY_EVIDENCE_MANIFEST from normalized results
  RETURN manifest preserving failures, artifact references, and proof boundaries