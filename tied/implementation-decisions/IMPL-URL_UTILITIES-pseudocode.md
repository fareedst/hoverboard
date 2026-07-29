# [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
# processUrl (strip hash), isValidUrl, getDomain for bookmark management.
# Contract: url string in; normalized url or boolean or domain out.
INPUT: url (string)
OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
DATA: pure functions in same file as arrayUtils, objectUtils, textUtils

# Normalize for storage: strip hash, trailing slash, scheme.
processUrl(url):
  IF url empty or invalid: RETURN url or default
  OPTIONALLY strip hash, trailing slash, normalize scheme
  RETURN normalized url string

# Parse with URL constructor or regex; return true if valid.
isValidUrl(url):
  TRY parse url with URL constructor (or regex)
  RETURN true if valid else false

# Parse and return hostname or host.
getDomain(url):
  parsed = parse url
  RETURN parsed.hostname or parsed.host or ""
