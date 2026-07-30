# [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT] — How: manage per-site allow/inhibit rules so overlay and automation respect site list configuration.

## EVALUATE_SITE_POLICY

- [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT] How: match URL against inhibit/allow lists; content bootstrap consults decision before show.
- Contract:
  - INPUT: site list entries; current page URL; ConfigManager site-management keys
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: allow or inhibit decision for content UI; persisted site list updates from options/UI
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ConfigManager; IMPL-URL_INHIBITION; options/site management UI
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: EVALUATE_SITE_POLICY
  - rules = AWAIT configManager.getSiteRules()
  - IF matchesInhibit(url, rules): RETURN inhibited
  - RETURN allowed
  - How (sub-block): How: persist site list edits from settings UI.

## UPDATE_SITE_LIST

- [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT] How: Implements UPDATE_SITE_LIST(entries) behavior for IMPL-SITE_MGMT.
- Contract:
  - INPUT: site list entries; current page URL; ConfigManager site-management keys
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: allow or inhibit decision for content UI; persisted site list updates from options/UI
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: ConfigManager; IMPL-URL_INHIBITION; options/site management UI
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: UPDATE_SITE_LIST
  - AWAIT configManager.setSiteRules(entries)
  - RETURN ok
