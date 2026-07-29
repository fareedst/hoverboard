# [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY]
# Auth token in sync storage; getAuthToken, setAuthToken, hasAuth, getAuthParam; options save writes token.

# Contract: setAuthToken takes token; getAuthToken/hasAuth/getAuthParam return token, boolean, or param value.
INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
DATA: auth stored in sync storage; default config (retry settings)

# Load from sync storage; return token or null; write token; hasAuth = getAuthToken() !== null; getAuthParam from config.
getAuthToken():
  TRY LOAD auth from sync storage
  RETURN token or null

setAuthToken(token):
  WRITE token to sync storage (auth key)

hasAuth():
  RETURN getAuthToken() !== null

getAuthParam(name):
  LOAD default config or stored config
  RETURN value for name (e.g. retry count)

# Read token from UI; setAuthToken(token).
on save settings (options UI):
  READ token from UI
  setAuthToken(token)
