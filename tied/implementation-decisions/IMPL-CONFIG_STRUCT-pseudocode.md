# [IMPL-CONFIG_STRUCT] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIGURATION] [REQ-RECENT_TAGS_SYSTEM]
# Project extension (partial): recent-tags-related keys merged in getConfig and read by RecentTagsMemoryManager / TagService. Full config surface remains Template for other domains.
# Contract: getConfig() returns merged object; missing keys use defaults; invalid stored config falls back per ConfigManager rules.
INPUT: storage read on getConfig; optional partial patch on save
OUTPUT: merged config object (plain); recent-tags fields typed by Zod in config-manager
DATA: chrome.storage.local user settings + in-code defaults; keys include recentTagsActivityWindowMinutes (N for REQ-RECENT_TAGS_SYSTEM), recentTagsMaxListSize, recentTagsMaxDisplayCount, recentTagsSharedMemoryKey, recentTagsEnableUserDriven, recentTagsClearOnReload, recentTagsCountMax

# [IMPL-CONFIG_STRUCT] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIGURATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM]
# How: merged getConfig supplies recentTagsActivityWindowMinutes (default 15; schema 1..24*60) and sibling keys to SW policy; [IMPL-TAG_SYSTEM] reads via callback passed into recentTagsMemory.getRecentTagsForUi.
getConfig():
  READ storage; MERGE with defaults; VALIDATE with Zod schema
  RETURN merged config (recentTags* fields available to SW recent tags module)

# --- Cross-IMPL ---
# Recent-tags keys consumed by [IMPL-TAG_SYSTEM] / RecentTagsMemoryManager (not duplicated here). Wider config surface remains Template beyond this slice.
