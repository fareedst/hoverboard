# [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] — How: honor private/shared bookmark flags and site inhibition so sensitive URLs and private pins stay under user control.

## APPLY_PRIVACY_CONTROLS

- [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] How: before injecting page UI, check inhibit rules; before save, map private UI to API shared=no.
- Contract:
  - INPUT: bookmark shared/toread/private flags; inhibit URL lists from ConfigManager; site management rules
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Pinboard/local payloads with correct shared flag; overlay/popup suppressed on inhibited URLs
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ConfigManager hoverboard_settings; IMPL-URL_INHIBITION; Pinboard API shared field
  - EFFECTS: Http, IO
  - TERMINATION: total
- PROCEDURE: APPLY_PRIVACY_CONTROLS
  - IF isUrlInhibited(url): SUPPRESS overlay/hover; RETURN blocked
  - draft.shared = NOT draft.private
  - RETURN draft ready for SAVE_BOOKMARK
