# [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT]
# How: manage per-site allow/inhibit rules so overlay and automation respect site list configuration.
INPUT: site list entries; current page URL; ConfigManager site-management keys
OUTPUT: allow or inhibit decision for content UI; persisted site list updates from options/UI
DATA: ConfigManager; IMPL-URL_INHIBITION; options/site management UI

# [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT]
# How: match URL against inhibit/allow lists; content bootstrap consults decision before show.
EVALUATE_SITE_POLICY(url):
  rules = AWAIT configManager.getSiteRules()
  IF matchesInhibit(url, rules): RETURN inhibited
  RETURN allowed

# How: persist site list edits from settings UI.
UPDATE_SITE_LIST(entries):
  AWAIT configManager.setSiteRules(entries)
  RETURN ok
