# [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS]
# How: honor private/shared bookmark flags and site inhibition so sensitive URLs and private pins stay under user control.
INPUT: bookmark shared/toread/private flags; inhibit URL lists from ConfigManager; site management rules
OUTPUT: Pinboard/local payloads with correct shared flag; overlay/popup suppressed on inhibited URLs
DATA: ConfigManager hoverboard_settings; IMPL-URL_INHIBITION; Pinboard API shared field

# [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS]
# How: before injecting page UI, check inhibit rules; before save, map private UI to API shared=no.
APPLY_PRIVACY_CONTROLS(url, bookmarkDraft):
  IF isUrlInhibited(url): SUPPRESS overlay/hover; RETURN blocked
  draft.shared = NOT draft.private
  RETURN draft ready for SAVE_BOOKMARK
