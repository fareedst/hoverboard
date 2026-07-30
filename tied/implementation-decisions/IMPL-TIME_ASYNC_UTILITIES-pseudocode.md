# [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — delay (Promise), formatTimestamp, getRelativeTime for API/UI. Contract: ms or timestamp in; Promise or formatted/relative string out.

## DELAY

- [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements delay(ms) behavior for IMPL-TIME_ASYNC_UTILITIES.
- Contract:
  - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: current time for relative calculation
  - EFFECTS: Async
  - TERMINATION: total
- PROCEDURE: DELAY
  - RETURN new Promise such that resolve() is called after ms (e.g. setTimeout(resolve, ms))
  - How (sub-block): Convert to locale date/time string.

## FORMAT_TIMESTAMP

- [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements formatTimestamp(ts) behavior for IMPL-TIME_ASYNC_UTILITIES.
- Contract:
  - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: current time for relative calculation
  - EFFECTS: Async
  - TERMINATION: total
- PROCEDURE: FORMAT_TIMESTAMP
  - CONVERT timestamp to display format (e.g. locale date/time string)
  - RETURN formatted string
  - How (sub-block): Return "X s/m/h/d ago" from delta.

## GET_RELATIVE_TIME

- [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements getRelativeTime(ts) behavior for IMPL-TIME_ASYNC_UTILITIES.
- Contract:
  - INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: current time for relative calculation
  - EFFECTS: Async
  - TERMINATION: total
- PROCEDURE: GET_RELATIVE_TIME
  - delta = now - ts
  - IF delta in seconds/minutes/hours/days THEN RETURN "X s/m/h/d ago" (or similar)
  - RETURN human-readable relative string
