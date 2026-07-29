# [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
# Array and object helpers: unique, chunk, compact; deepClone, isEmpty, pick; pure, no mutation.

# Contract: inputs = array or object plus optional keys/size; output = transformed array or object.
INPUT: array or object; optional keys (for pick), size (for chunk)
OUTPUT: transformed array or object; no mutation of inputs
DATA: pure functions; same file as urlUtils, textUtils

# Dedupe, partition, remove falsy; deep copy, empty check, key subset.
unique(arr):
  RETURN array of distinct elements (order preserved or by first occurrence)

chunk(arr, size):
  SPLIT arr into subarrays of length size; last chunk may be shorter
  RETURN array of chunks

compact(arr):
  RETURN array with falsy elements removed (false, null, undefined, 0, "", NaN)

deepClone(obj):
  RETURN deep copy of obj (nested objects/arrays copied recursively)

isEmpty(obj):
  IF obj is null or undefined: RETURN true
  FOR each enumerable key: IF any exists RETURN false
  RETURN true

pick(obj, keys):
  result = {}
  FOR each key IN keys: IF obj[key] present THEN result[key] = obj[key]
  RETURN result
