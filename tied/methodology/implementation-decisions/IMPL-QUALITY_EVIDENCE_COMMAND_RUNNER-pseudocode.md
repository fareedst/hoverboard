# [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# Summary: Execute declared quality commands and capture bounded reproducible evidence.

# [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Define the bounded command, provenance, diagnostic, and artifact contract before execution.
# [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
Contract:
  INPUT: command declarations, run metadata, artifact directory
  PRE: every declaration has stable id, argv, cwd, artifact directory, and shell execution is disabled
  OUTPUT: command results with exit code, result, provenance, diagnostics, and artifact references
  POST: every declaration has exactly one result; timeout, output, and spawn failures are failed evidence
  FAILURE_MODES: InvalidDeclaration, Timeout, SpawnFailed, OutputLimit, ArtifactWriteFailed
  EFFECTS: process IO, artifact writes, no shell execution
  DATA_TRANSITION: declaration -> bounded process capture -> retained stdout/stderr artifacts -> command result
  TERMINATION: total subject to declared timeout

# [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Validate every declaration before executing the declared command set.
procedure RUN_DECLARED_QUALITY_COMMANDS(input):
  # [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  Contract:
    INPUT: command declarations and default limits
    OUTPUT: one verification command result per declaration
    PRE: command declarations are available
    POST: no process starts before the complete declaration set and limits pass validation
    FAILURE_MODES: InvalidDeclaration
    EFFECTS: pure before child process IO begins
    TERMINATION: total
  # [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Reject malformed declarations and non-positive execution limits before process IO.
  VALIDATE each id, argv, cwd, artifact directory, and positive per-command limit
  VALIDATE positive default timeout and output limits
  # [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Execute each declaration through the single-command bounded execution block.
  FOR each declaration:
    # [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Reuse RUN_ONE_COMMAND logic so every declaration has identical bounds and provenance.
    EXECUTE the RUN_ONE_COMMAND logic inline for the declaration
    STORE exactly one result
  RETURN results

# [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Execute one argv without a shell, enforce timeout/output bounds, and retain diagnostics.
procedure RUN_ONE_COMMAND(declaration):
  # [IMPL-QUALITY_EVIDENCE_COMMAND_RUNNER] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  Contract:
    INPUT: one validated command declaration
    OUTPUT: one normalized verification command result
    PRE: argv, cwd, artifact directory, and limits are valid
    POST: stdout/stderr artifacts exist and diagnostics identify timeout, output, or spawn failures
    FAILURE_MODES: Timeout, SpawnFailed, OutputLimit, ArtifactWriteFailed
    EFFECTS: process IO and artifact writes with shell disabled
    DATA_TRANSITION: process capture -> artifact files -> result
    TERMINATION: total subject to timeout
  START process with argv, cwd, merged environment, and shell disabled
  CAPTURE stdout and stderr up to configured byte limit
  IF timeout expires: terminate process and mark Timeout
  IF output limit is exceeded: terminate process and mark OutputLimit
  WRITE bounded stdout/stderr artifacts
  IF tool version argv is configured: CAPTURE the first version line or record unavailable
  RETURN command identity, cwd, exit code, duration, threshold, passed/failed result, tool versions, diagnostics, and artifact paths
  ON artifact write failure: propagate ArtifactWriteFailed