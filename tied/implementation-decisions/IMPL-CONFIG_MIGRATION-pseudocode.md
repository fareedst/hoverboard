# [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] — Auth token in sync storage; getAuthToken, setAuthToken, hasAuth, getAuthParam; options save writes token.

## GET_AUTH_TOKEN

- [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getAuthToken() behavior for IMPL-CONFIG_MIGRATION.
- Contract:
  - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: auth stored in sync storage; default config (retry settings)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: GET_AUTH_TOKEN
  - TRY LOAD auth from sync storage
  - RETURN token or null

## SET_AUTH_TOKEN

- [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements setAuthToken(token) behavior for IMPL-CONFIG_MIGRATION.
- Contract:
  - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: auth stored in sync storage; default config (retry settings)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: SET_AUTH_TOKEN
  - WRITE token to sync storage (auth key)

## HAS_AUTH

- [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements hasAuth() behavior for IMPL-CONFIG_MIGRATION.
- Contract:
  - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: auth stored in sync storage; default config (retry settings)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: HAS_AUTH
  - RETURN getAuthToken() !== null

## GET_AUTH_PARAM

- [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getAuthParam(name) behavior for IMPL-CONFIG_MIGRATION.
- Contract:
  - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: auth stored in sync storage; default config (retry settings)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: GET_AUTH_PARAM
  - LOAD default config or stored config
  - RETURN value for name (e.g. retry count)
  - How (sub-block): Read token from UI; setAuthToken(token).
  - 1. on save settings (options UI):
  - READ token from UI
  - setAuthToken(token)
