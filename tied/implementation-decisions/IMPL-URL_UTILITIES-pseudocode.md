# [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] — processUrl (strip hash), isValidUrl, getDomain for bookmark management. Contract: url string in; normalized url or boolean or domain out.

## PROCESS_URL

- [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements processUrl(url) behavior for IMPL-URL_UTILITIES.
- Contract:
  - INPUT: url (string)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: PROCESS_URL
  - IF url empty or invalid: RETURN url or default
  - OPTIONALLY strip hash, trailing slash, normalize scheme
  - RETURN normalized url string
  - How (sub-block): Parse with URL constructor or regex; return true if valid.

## IS_VALID_URL

- [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements isValidUrl(url) behavior for IMPL-URL_UTILITIES.
- Contract:
  - INPUT: url (string)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: IS_VALID_URL
  - TRY parse url with URL constructor (or regex)
  - RETURN true if valid else false
  - How (sub-block): Parse and return hostname or host.

## GET_DOMAIN

- [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] How: Implements getDomain(url) behavior for IMPL-URL_UTILITIES.
- Contract:
  - INPUT: url (string)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: normalized url (processUrl), boolean (isValidUrl), domain string (getDomain)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: pure functions in same file as arrayUtils, objectUtils, textUtils
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: GET_DOMAIN
  - parsed = parse url
  - RETURN parsed.hostname or parsed.host or ""
