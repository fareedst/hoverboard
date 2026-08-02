# [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# Summary: Validate conditional external-input security abuse-case evidence.

# [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Define the canonical abuse-case set and apply it only when the security profile is selected.
# [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
Contract:
  INPUT: selected profiles and abuse-case evidence rows
  PRE: profile names and abuse-case identifiers are canonical
  OUTPUT: security profile validation report
  POST: every required case has executable evidence or an owned, expiring waiver
  FAILURE_MODES: MissingCase, MissingEvidence, InvalidWaiver
  EFFECTS: pure
  TERMINATION: total
  DATA: EXTERNAL_INPUT_SECURITY_CASES = malformed-oversized-input, authentication-authorization, injection-unsafe-content, path-traversal-file-access, replay-duplicate, secret-sensitive-data, resource-exhaustion-timeout-rate-limit, dependency-vulnerability-review

# [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Require the complete abuse-case set only when external-input-security is selected.
procedure VALIDATE_SECURITY_PROFILE(input):
  # [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  Contract:
    INPUT: selected profiles and security evidence rows
    OUTPUT: security profile validation report
    PRE: input arrays are provided and abuse-case identifiers are canonical
    POST: each required case has passed evidence or a complete waiver when applicable
    FAILURE_MODES: MissingCase, MissingEvidence, InvalidWaiver
    EFFECTS: pure
    TERMINATION: total
  # [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Skip security obligations when the external-input-security profile is not selected.
  IF external-input-security is not selected: RETURN applicable false with no required-case diagnostics
  # [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Evaluate every canonical abuse case for executable evidence or an owned waiver.
  FOR each abuse case in EXTERNAL_INPUT_SECURITY_CASES:
    # [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Report a missing evidence row for every required abuse case without a declaration.
    IF no row exists: REPORT MissingCase
    # [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Accept a passed executable command or test as evidence for the abuse case.
    ELSE IF row has executable command/test and passed result: CONTINUE
    # [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Accept only complete, owned, expiring waivers as an alternative to evidence.
    ELSE IF row has waiver with rationale, owner, and expiry: CONTINUE
    # [IMPL-QUALITY_SECURITY_PROFILE_VALIDATION] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Distinguish incomplete waivers from absent evidence.
    ELSE IF waiver is incomplete: REPORT InvalidWaiver
    ELSE: REPORT MissingEvidence
  RETURN report with proof boundary plan-completeness-only