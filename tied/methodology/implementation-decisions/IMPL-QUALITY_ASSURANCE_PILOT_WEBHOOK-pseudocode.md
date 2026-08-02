# [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# Summary: Exercise risk-triggered quality profiles on an authenticated SQLite webhook inbox.

# [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Define bounded HTTP routing, authentication, idempotency, persistence, and worker-state behavior.
# [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
Contract:
  INPUT: HTTP request, signing secret, inbox store, retry policy
  PRE: request body is bounded; store schema is initialized; secret is available without logging it
  OUTPUT: HTTP response or worker outcome
  POST: only authenticated, non-replayed events enter the inbox; duplicate idempotency keys do not create new events; failed work is retried within policy
  FAILURE_MODES: NotFound, OversizedInput, MalformedInput, PayloadObjectRequired, Unauthorized, Duplicate, PersistenceFailed, RequestFailed, HandlerFailed, ClaimConflict
  EFFECTS: HTTP, SQLite, state, async handler IO
  DATA_TRANSITION: accepted event moves absent -> pending -> processing -> processed or retry/dead; duplicate and claim conflict leave the competing state unchanged
  TERMINATION: total subject to bounded body, batch, and retry limits

# [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Authenticate timestamped raw input before JSON parsing and idempotent persistence.
procedure ACCEPT_WEBHOOK(request):
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  Contract:
    INPUT: bounded HTTP POST request with timestamp, signature, and idempotency headers
    OUTPUT: HTTP response
    PRE: request body collection and maximum size are configured
    POST: only authenticated, non-replayed JSON objects are persisted
    FAILURE_MODES: NotFound, OversizedInput, Unauthorized, MalformedInput, PayloadObjectRequired, PersistenceFailed, RequestFailed, Duplicate
    EFFECTS: HTTP and SQLite writes
    DATA_TRANSITION: raw request -> authenticated JSON object -> pending or duplicate response
    TERMINATION: total subject to body limit
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Restrict the acceptance procedure to the declared webhook route.
  REQUIRE POST /webhooks/inbox; otherwise RETURN NotFound
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Bound raw request collection before authentication or parsing.
  COLLECT raw body up to maximum size
  IF body exceeds maximum: RETURN OversizedInput
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Authenticate the timestamped raw body before interpreting its JSON.
  VALIDATE timestamp window and HMAC signature over timestamp plus raw body
  IF authentication fails, a required header is missing, or timestamp is outside the replay window: RETURN Unauthorized with HTTP 401
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Require a well-formed JSON object after authentication.
  PARSE raw body as JSON object
  IF parsing or shape fails: RETURN MalformedInput
  IF parsed payload is not an object: RETURN PayloadObjectRequired
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Derive a stable event identity and persist at most one row per idempotency key.
  DERIVE event id from payload.id when it is a string, otherwise use the idempotency key
  INSERT event by idempotency key
  IF key already exists: RETURN Duplicate
  RETURN accepted

# [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
# How: Process only successfully claimed due events, invoke handler(payload), and transition the claimed row.
procedure PROCESS_DUE_EVENTS(store, handler, policy):
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  Contract:
    INPUT: inbox store, payload handler, batch and retry policy
    OUTPUT: ordered worker outcomes
    PRE: store is initialized and policy has positive batch and bounded attempt limits
    POST: each outcome corresponds to an event claimed by this worker and reaches processed, retry, or dead
    FAILURE_MODES: ClaimConflict, HandlerFailed, PersistenceFailed
    EFFECTS: SQLite state transitions and handler IO
    DATA_TRANSITION: pending/retry -> processing -> processed/retry/dead
    TERMINATION: at most policy.batch_size claims
  # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
  # How: Process at most the bounded batch of due events.
  FOR event candidate IN listDue(policy.batch_size):
    # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Claim each event atomically and skip candidates owned by another worker.
    event = claim(candidate.id)
    IF event is null: CONTINUE because another worker owns the claim
    # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Invoke the handler only after a successful claim.
    INVOKE handler(event.payload)
    # [IMPL-QUALITY_ASSURANCE_PILOT_WEBHOOK] [ARCH-QUALITY_ASSURANCE_PROFILES] [REQ-QUALITY_ASSURANCE_EVIDENCE]
    # How: Transition successful work to processed or failed work to bounded retry/dead state.
    IF handler succeeds: markProcessed(event.id)
    ELSE IF event.attempts < policy.max_attempts: markRetry(event.id, exponential bounded retry time)
    ELSE: markDead(event.id)
  RETURN outcomes