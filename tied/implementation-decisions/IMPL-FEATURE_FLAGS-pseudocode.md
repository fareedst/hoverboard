# [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY]
# Default config, ensureDefaults, getConfigForUI, updateConfig, getSettings/setSettings, resetToDefaults.
# Contract: config patch and getter/setter inputs and outputs.
INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset)
DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings

# Return static default config object.
getDefaultConfiguration():
  RETURN static default config object (all feature flags and defaults)

# Load from storage and merge defaults if missing; persist.
ensureDefaults():
  current = LOAD from storage
  IF current missing or keys missing THEN MERGE getDefaultConfiguration() into current, PERSIST

# Return UI-safe subset of full config (e.g. strip secrets).
getConfigForUI():
  config = get full config (ensureDefaults applied)
  RETURN subset or shape safe for UI (e.g. strip secrets)

# Load config, merge patch, persist.
updateConfig(patch):
  current = LOAD config
  MERGE patch into current
  PERSIST current

# Load settings from storage; on error return defaults or empty.
getSettings():
  TRY LOAD settings from storage
  ON error RETURN defaults or empty
  RETURN settings object

# Validate/sanitize and persist; on error handle (log/throw).
setSettings(settings):
  VALIDATE or sanitize
  PERSIST settings
  ON error handle (e.g. log, throw)

# Overwrite storage with default configuration.
resetToDefaults():
  defaults = getDefaultConfiguration()
  PERSIST defaults (overwrite)
