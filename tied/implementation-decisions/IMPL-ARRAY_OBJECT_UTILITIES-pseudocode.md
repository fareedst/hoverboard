# [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — Array and object helpers: unique, chunk, compact; deepClone, isEmpty, pick; pure, no mutation.

## UNIQUE

- [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements unique(arr) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
- Contract:
  - INPUT: array or object; optional keys (for pick), size (for chunk)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: transformed array or object; no mutation of inputs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions; same file as urlUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: UNIQUE
  - RETURN array of distinct elements (order preserved or by first occurrence)

## CHUNK

- [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements chunk(arr, size) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
- Contract:
  - INPUT: array or object; optional keys (for pick), size (for chunk)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: transformed array or object; no mutation of inputs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions; same file as urlUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: CHUNK
  - SPLIT arr into subarrays of length size; last chunk may be shorter
  - RETURN array of chunks

## COMPACT

- [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements compact(arr) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
- Contract:
  - INPUT: array or object; optional keys (for pick), size (for chunk)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: transformed array or object; no mutation of inputs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions; same file as urlUtils, textUtils
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: COMPACT
  - RETURN array with falsy elements removed (false, null, undefined, 0, "", NaN)

## DEEP_CLONE

- [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements deepClone(obj) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
- Contract:
  - INPUT: array or object; optional keys (for pick), size (for chunk)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: transformed array or object; no mutation of inputs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions; same file as urlUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: DEEP_CLONE
  - RETURN deep copy of obj (nested objects/arrays copied recursively)

## IS_EMPTY

- [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements isEmpty(obj) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
- Contract:
  - INPUT: array or object; optional keys (for pick), size (for chunk)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: transformed array or object; no mutation of inputs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions; same file as urlUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: IS_EMPTY
  - IF obj is null or undefined: RETURN true
  - FOR each enumerable key: IF any exists RETURN false
  - RETURN true

## PICK

- [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements pick(obj, keys) behavior for IMPL-ARRAY_OBJECT_UTILITIES.
- Contract:
  - INPUT: array or object; optional keys (for pick), size (for chunk)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: transformed array or object; no mutation of inputs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions; same file as urlUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: PICK
  - result = {}
  - FOR each key IN keys: IF obj[key] present THEN result[key] = obj[key]
  - RETURN result
