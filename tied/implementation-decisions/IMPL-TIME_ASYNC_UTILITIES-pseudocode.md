# [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
# delay (Promise), formatTimestamp, getRelativeTime for API/UI.
# Contract: ms or timestamp in; Promise or formatted/relative string out.
INPUT: milliseconds (delay); timestamp (formatTimestamp, getRelativeTime)
OUTPUT: Promise that resolves after ms (delay); formatted date string (formatTimestamp); relative time string (getRelativeTime)
DATA: current time for relative calculation

# Resolve after ms via setTimeout.
delay(ms):
  RETURN new Promise such that resolve() is called after ms (e.g. setTimeout(resolve, ms))

# Convert to locale date/time string.
formatTimestamp(ts):
  CONVERT timestamp to display format (e.g. locale date/time string)
  RETURN formatted string

# Return "X s/m/h/d ago" from delta.
getRelativeTime(ts):
  delta = now - ts
  IF delta in seconds/minutes/hours/days THEN RETURN "X s/m/h/d ago" (or similar)
  RETURN human-readable relative string
