# [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT]
# getInhibitUrls, addInhibitUrl, setInhibitUrls, isUrlInhibited (substring match).
# Contract: url or newEntry/fullList; list or success or boolean.
INPUT: url (string), optional newEntry (for add), optional fullList (for set)
OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
DATA: inhibit list stored as newline-separated string in config

# Read config and return split trimmed non-empty lines.
getInhibitUrls():
  READ config inhibit list
  RETURN split by newline (trimmed, non-empty)

# Append if not present and persist.
addInhibitUrl(newEntry):
  list = getInhibitUrls()
  IF newEntry not in list: APPEND newEntry; setInhibitUrls(list)
  PERSIST

# Write list as newline-separated and persist.
setInhibitUrls(fullList):
  WRITE list as newline-separated string to config
  PERSIST

# True if url contains any entry as substring.
isUrlInhibited(url):
  list = getInhibitUrls()
  FOR each entry IN list: IF url contains entry (substring) RETURN true
  RETURN false
