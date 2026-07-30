# [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] — getInhibitUrls, addInhibitUrl, setInhibitUrls, isUrlInhibited (substring match). Contract: url or newEntry/fullList; list or success or boolean.

## GET_INHIBIT_URLS

- [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements getInhibitUrls() behavior for IMPL-URL_INHIBITION.
- Contract:
  - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: inhibit list stored as newline-separated string in config
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: GET_INHIBIT_URLS
  - READ config inhibit list
  - RETURN split by newline (trimmed, non-empty)
  - How (sub-block): Append if not present and persist.

## ADD_INHIBIT_URL

- [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements addInhibitUrl(newEntry) behavior for IMPL-URL_INHIBITION.
- Contract:
  - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: inhibit list stored as newline-separated string in config
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: ADD_INHIBIT_URL
  - list = getInhibitUrls()
  - IF newEntry not in list: APPEND newEntry; setInhibitUrls(list)
  - PERSIST
  - How (sub-block): Write list as newline-separated and persist.

## SET_INHIBIT_URLS

- [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements setInhibitUrls(fullList) behavior for IMPL-URL_INHIBITION.
- Contract:
  - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: inhibit list stored as newline-separated string in config
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: SET_INHIBIT_URLS
  - WRITE list as newline-separated string to config
  - PERSIST
  - How (sub-block): True if url contains any entry as substring.

## IS_URL_INHIBITED

- [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements isUrlInhibited(url) behavior for IMPL-URL_INHIBITION.
- Contract:
  - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: inhibit list stored as newline-separated string in config
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: IS_URL_INHIBITED
  - list = getInhibitUrls()
  - FOR each entry IN list: IF url contains entry (substring) RETURN true
  - RETURN false
