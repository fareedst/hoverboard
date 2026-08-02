/**
 * Unit Tests for ConfigManager
 * Tests configuration management, authentication, and storage functionality
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-STORAGE ===
 * [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE] [REQ-CONFIG_PORTABILITY] — How: use chrome.storage.sync for settings and local for temp/cache; support export/import of portable config.
 * 
 * ## STORAGE_GET_SET
 * 
 * - [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE] How: read/write settings through ConfigManager backed by chrome.storage areas.
 * - Contract:
 *   - INPUT: get/set keys for settings and caches; export/import payloads
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted settings across devices via sync; local caches; portable backup files
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: chrome.storage.sync / local; ConfigManager; IMPL-CONFIG_BACKUP_RESTORE
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: STORAGE_GET_SET
 *   - IF value provided: AWAIT chrome.storage[area].set({ key: value }); RETURN
 *   - data = AWAIT chrome.storage[area].get(key)
 *   - RETURN data[key]
 *   - How (sub-block): How: export/import settings for portability (delegates detail to IMPL-CONFIG_BACKUP_RESTORE).
 * 
 * ## EXPORT_IMPORT_SETTINGS
 * 
 * - [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE] [REQ-CONFIG_PORTABILITY] How: Implements EXPORT_IMPORT_SETTINGS(mode, payload?) behavior for IMPL-STORAGE.
 * - Contract:
 *   - INPUT: get/set keys for settings and caches; export/import payloads
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted settings across devices via sync; local caches; portable backup files
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: chrome.storage.sync / local; ConfigManager; IMPL-CONFIG_BACKUP_RESTORE
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: EXPORT_IMPORT_SETTINGS
 *   - IF mode = export: RETURN serialize(config)
 *   - IF mode = import: AWAIT mergeAndPersist(payload); RETURN ok
 * 
 * === END IMPL-FULL-BLOCK: IMPL-STORAGE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-CONFIG_MIGRATION ===
 * [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] — Auth token in sync storage; getAuthToken, setAuthToken, hasAuth, getAuthParam; options save writes token.
 * 
 * ## GET_AUTH_TOKEN
 * 
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getAuthToken() behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_AUTH_TOKEN
 *   - TRY LOAD auth from sync storage
 *   - RETURN token or null
 * 
 * ## SET_AUTH_TOKEN
 * 
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements setAuthToken(token) behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: SET_AUTH_TOKEN
 *   - WRITE token to sync storage (auth key)
 * 
 * ## HAS_AUTH
 * 
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements hasAuth() behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: HAS_AUTH
 *   - RETURN getAuthToken() !== null
 * 
 * ## GET_AUTH_PARAM
 * 
 * - [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getAuthParam(name) behavior for IMPL-CONFIG_MIGRATION.
 * - Contract:
 *   - INPUT: token string (setAuthToken); none (getAuthToken, hasAuth, getAuthParam)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: token or null (getAuthToken); boolean (hasAuth); param value (getAuthParam)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: auth stored in sync storage; default config (retry settings)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_AUTH_PARAM
 *   - LOAD default config or stored config
 *   - RETURN value for name (e.g. retry count)
 *   - How (sub-block): Read token from UI; setAuthToken(token).
 *   - 1. on save settings (options UI):
 *   - READ token from UI
 *   - setAuthToken(token)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-CONFIG_MIGRATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SITE_MGMT ===
 * [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT] — How: manage per-site allow/inhibit rules so overlay and automation respect site list configuration.
 * 
 * ## EVALUATE_SITE_POLICY
 * 
 * - [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT] How: match URL against inhibit/allow lists; content bootstrap consults decision before show.
 * - Contract:
 *   - INPUT: site list entries; current page URL; ConfigManager site-management keys
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: allow or inhibit decision for content UI; persisted site list updates from options/UI
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager; IMPL-URL_INHIBITION; options/site management UI
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: EVALUATE_SITE_POLICY
 *   - rules = AWAIT configManager.getSiteRules()
 *   - IF matchesInhibit(url, rules): RETURN inhibited
 *   - RETURN allowed
 *   - How (sub-block): How: persist site list edits from settings UI.
 * 
 * ## UPDATE_SITE_LIST
 * 
 * - [IMPL-SITE_MGMT] [ARCH-SITE_MGMT] [REQ-SITE_MANAGEMENT] How: Implements UPDATE_SITE_LIST(entries) behavior for IMPL-SITE_MGMT.
 * - Contract:
 *   - INPUT: site list entries; current page URL; ConfigManager site-management keys
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: allow or inhibit decision for content UI; persisted site list updates from options/UI
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager; IMPL-URL_INHIBITION; options/site management UI
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_SITE_LIST
 *   - AWAIT configManager.setSiteRules(entries)
 *   - RETURN ok
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SITE_MGMT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PRIVACY ===
 * [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] — How: honor private/shared bookmark flags and site inhibition so sensitive URLs and private pins stay under user control.
 * 
 * ## APPLY_PRIVACY_CONTROLS
 * 
 * - [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] How: before injecting page UI, check inhibit rules; before save, map private UI to API shared=no.
 * - Contract:
 *   - INPUT: bookmark shared/toread/private flags; inhibit URL lists from ConfigManager; site management rules
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Pinboard/local payloads with correct shared flag; overlay/popup suppressed on inhibited URLs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager hoverboard_settings; IMPL-URL_INHIBITION; Pinboard API shared field
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_PRIVACY_CONTROLS
 *   - IF isUrlInhibited(url): SUPPRESS overlay/hover; RETURN blocked
 *   - draft.shared = NOT draft.private
 *   - RETURN draft ready for SAVE_BOOKMARK
 * 
 * === END IMPL-FULL-BLOCK: IMPL-PRIVACY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_CONFIG_OPTIONS ===
 * [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] — Options page exposes and persists AI API key, provider, and tag limit; load/save from config; no key = feature disabled elsewhere.
 * 
 * ## LOAD_SETTINGS
 * 
 * - [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements loadSettings() behavior for IMPL-AI_CONFIG_OPTIONS.
 * - Contract:
 *   - INPUT: user edits in options (apiKey, provider, optional limit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_SETTINGS
 *   - settings = getStoredSettings()
 *   - SET aiApiKey input = settings.aiApiKey ?? ''
 *   - SET provider select = settings.aiProvider ?? 'openai'
 *   - SET limit input = settings.aiTagLimit ?? 64
 *   - How (sub-block): How: collect trim/number from form and persist via updateConfig.
 * 
 * ## SAVE_SETTINGS
 * 
 * - [IMPL-AI_CONFIG_OPTIONS] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements saveSettings() behavior for IMPL-AI_CONFIG_OPTIONS.
 * - Contract:
 *   - INPUT: user edits in options (apiKey, provider, optional limit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_SETTINGS
 *   - settings = { aiApiKey: trim(aiApiKey input), aiProvider: provider select value, aiTagLimit: number(limit input) }
 *   - updateConfig(settings)
 * 
 * ## BLOCK_3
 * 
 * - [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Nested block: options-page "Test API key" button; require key, call testAiApiKey(apiKey, provider), show "API key OK" or error.
 * - Contract:
 *   - INPUT: user edits in options (apiKey, provider, optional limit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted config; Test result (ok or error message) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_3
 *   - 1. on Test click:
 *   - 2.   apiKey = trim(aiApiKey input)
 *   - 3.   provider = provider select value
 *   - 4.   IF !apiKey THEN show error; RETURN
 *   - 5.   result = testAiApiKey(apiKey, provider)  // or send message to SW
 *   - 6.   IF result.ok THEN show success ELSE show result.error
 * 
 * === END IMPL-FULL-BLOCK: IMPL-AI_CONFIG_OPTIONS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-CONFIG_BACKUP_RESTORE ===
 * [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] — exportConfig/importConfig: gather settings, auth, inhibit URLs for backup and portability.
 * 
 * ## EXPORT_CONFIG
 * 
 * - [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements exportConfig() behavior for IMPL-CONFIG_BACKUP_RESTORE.
 * - Contract:
 *   - INPUT: none (export); serialized config blob (import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: config object (export); void or error (import) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: settings, auth, inhibit URLs (from storage / to storage)
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: EXPORT_CONFIG
 *   - PARALLEL_GET settings, auth, inhibitUrlList from storage (or config manager)
 *   - BUILD config object = { settings, auth, inhibitUrls: inhibitUrlList }
 *   - RETURN config object (serializable)
 *   - How (sub-block): Parse and validate blob; write settings, auth, inhibit URLs to storage; handle conflicts per product rule.
 * 
 * ## IMPORT_CONFIG
 * 
 * - [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements importConfig(configBlob) behavior for IMPL-CONFIG_BACKUP_RESTORE.
 * - Contract:
 *   - INPUT: none (export); serialized config blob (import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: config object (export); void or error (import) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: settings, auth, inhibit URLs (from storage / to storage)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: IMPORT_CONFIG
 *   - PARSE configBlob
 *   - VALIDATE structure
 *   - WRITE settings to storage
 *   - WRITE auth to storage
 *   - WRITE inhibit URLs to storage (if present)
 *   - HANDLE conflicts or overwrite per product rule
 * 
 * === END IMPL-FULL-BLOCK: IMPL-CONFIG_BACKUP_RESTORE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-FEATURE_FLAGS ===
 * [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] — Default config, ensureDefaults, getConfigForUI, updateConfig, getSettings/setSettings, resetToDefaults. Contract: config patch and getter/setter inputs and outputs.
 * 
 * ## GET_DEFAULT_CONFIGURATION
 * 
 * - [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getDefaultConfiguration() behavior for IMPL-FEATURE_FLAGS.
 * - Contract:
 *   - INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_DEFAULT_CONFIGURATION
 *   - RETURN static default config object (all feature flags and defaults)
 *   - How (sub-block): Load from storage and merge defaults if missing; persist.
 * 
 * ## ENSURE_DEFAULTS
 * 
 * - [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements ensureDefaults() behavior for IMPL-FEATURE_FLAGS.
 * - Contract:
 *   - INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ENSURE_DEFAULTS
 *   - current = LOAD from storage
 *   - IF current missing or keys missing THEN MERGE getDefaultConfiguration() into current, PERSIST
 *   - How (sub-block): Return UI-safe subset of full config (e.g. strip secrets).
 * 
 * ## GET_CONFIG_FOR_UI
 * 
 * - [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getConfigForUI() behavior for IMPL-FEATURE_FLAGS.
 * - Contract:
 *   - INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_CONFIG_FOR_UI
 *   - config = get full config (ensureDefaults applied)
 *   - RETURN subset or shape safe for UI (e.g. strip secrets)
 *   - How (sub-block): Load config, merge patch, persist.
 * 
 * ## UPDATE_CONFIG
 * 
 * - [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements updateConfig(patch) behavior for IMPL-FEATURE_FLAGS.
 * - Contract:
 *   - INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_CONFIG
 *   - current = LOAD config
 *   - MERGE patch into current
 *   - PERSIST current
 *   - How (sub-block): Load settings from storage; on error return defaults or empty.
 * 
 * ## GET_SETTINGS
 * 
 * - [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements getSettings() behavior for IMPL-FEATURE_FLAGS.
 * - Contract:
 *   - INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_SETTINGS
 *   - TRY LOAD settings from storage
 *   - ON error RETURN defaults or empty
 *   - RETURN settings object
 *   - How (sub-block): Validate/sanitize and persist; on error handle (log/throw).
 * 
 * ## SET_SETTINGS
 * 
 * - [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements setSettings(settings) behavior for IMPL-FEATURE_FLAGS.
 * - Contract:
 *   - INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SET_SETTINGS
 *   - VALIDATE or sanitize
 *   - PERSIST settings
 *   - ON error handle (e.g. log, throw)
 *   - How (sub-block): Overwrite storage with default configuration.
 * 
 * ## RESET_TO_DEFAULTS
 * 
 * - [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements resetToDefaults() behavior for IMPL-FEATURE_FLAGS.
 * - Contract:
 *   - INPUT: config patch (updateConfig); key/value (setSettings); none (getters, reset)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: full config or UI-safe config (getConfigForUI); settings object (getSettings); void (setters, reset)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: default configuration (feature flags, UI behavior, badge settings); persisted settings
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RESET_TO_DEFAULTS
 *   - defaults = getDefaultConfiguration()
 *   - PERSIST defaults (overwrite)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-FEATURE_FLAGS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOG_LEVEL_CONFIG ===
 * [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — getLogLevel from environment; production => warn, else debug; used by shouldLog. Contract: no input; returns current log level; env and defaults.
 * 
 * ## GET_LOG_LEVEL
 * 
 * - [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements getLogLevel() behavior for IMPL-LOG_LEVEL_CONFIG.
 * - Contract:
 *   - INPUT: none (reads environment)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: current log level (e.g. "debug" | "info" | "warn" | "error") | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: NODE_ENV or browser equivalent; production => warn, else => debug
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: GET_LOG_LEVEL
 *   - env = read NODE_ENV or process.env (browser fallback)
 *   - IF env = "production": RETURN "warn"
 *   - RETURN "debug" (or override from config)
 *   - How (sub-block): Logger.shouldLog(level): emit only if level >= getLogLevel().
 *   - 1. Used by Logger.shouldLog(level): IF level >= getLogLevel() then emit else skip.
 * 
 * === END IMPL-FULL-BLOCK: IMPL-LOG_LEVEL_CONFIG ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOGGER_CONTEXT_LEVELS ===
 * [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — Logger with context, shouldLog, formatMessage, debug/info/warn/error; default logger and createLogger. Contract: context and level/args in; formatted line out; uses getLogLevel.
 * 
 * ## LOGGER
 * 
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements Logger(context) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: LOGGER
 *   - this.context = context
 *   - How (sub-block): Compare level to getLogLevel(); return true if should emit.
 * 
 * ## SHOULD_LOG
 * 
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements shouldLog(level) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHOULD_LOG
 *   - minLevel = getLogLevel()
 *   - RETURN level >= minLevel (by severity order)
 *   - How (sub-block): Prefix with context and level; format args.
 * 
 * ## FORMAT_MESSAGE
 * 
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements formatMessage(level, ...args) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FORMAT_MESSAGE
 *   - RETURN "[context] level: args..." or structured format
 *   - How (sub-block): Emit only when shouldLog(level); output formatMessage.
 * 
 * ## DEBUG
 * 
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements debug(...), info(...), warn(...), error(...) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: DEBUG
 *   - IF shouldLog(level): OUTPUT formatMessage(level, ...args)
 *   - 1. logger = default Logger; createLogger(context) = new Logger(context).
 * 
 * === END IMPL-FULL-BLOCK: IMPL-LOGGER_CONTEXT_LEVELS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOGGER_LEGACY ===
 * [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — log() and noisy() for legacy compatibility; log maps to debug; noisy always emits. Contract: context and args in; log line out.
 * 
 * ## LOG
 * 
 * - [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements log(context, ...args) behavior for IMPL-LOGGER_LEGACY.
 * - Contract:
 *   - INPUT: context (string), ...args (message or interpolated values)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: log line to console
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: log and noisy in same logger module
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: LOG
 *   - CALL default logger.debug or createLogger(context).debug(...args)
 *   - (Same as Logger.debug so level filtering applies)
 *   - How (sub-block): Emit regardless of level; for migration/debug; remove when call sites use Logger.
 * 
 * ## NOISY
 * 
 * - [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements noisy(context, ...args) behavior for IMPL-LOGGER_LEGACY.
 * - Contract:
 *   - INPUT: context (string), ...args (message or interpolated values)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: log line to console
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: log and noisy in same logger module
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: NOISY
 *   - EMIT log line regardless of level (or at debug)
 *   - Used for temporary migration/debug; can be removed when call sites use Logger directly.
 * 
 * === END IMPL-FULL-BLOCK: IMPL-LOGGER_LEGACY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-URL_INHIBITION ===
 * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] — getInhibitUrls, addInhibitUrl, setInhibitUrls, isUrlInhibited (substring match). Contract: url or newEntry/fullList; list or success or boolean.
 * 
 * ## GET_INHIBIT_URLS
 * 
 * - [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements getInhibitUrls() behavior for IMPL-URL_INHIBITION.
 * - Contract:
 *   - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: inhibit list stored as newline-separated string in config
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_INHIBIT_URLS
 *   - READ config inhibit list
 *   - RETURN split by newline (trimmed, non-empty)
 *   - How (sub-block): Append if not present and persist.
 * 
 * ## ADD_INHIBIT_URL
 * 
 * - [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements addInhibitUrl(newEntry) behavior for IMPL-URL_INHIBITION.
 * - Contract:
 *   - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: inhibit list stored as newline-separated string in config
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ADD_INHIBIT_URL
 *   - list = getInhibitUrls()
 *   - IF newEntry not in list: APPEND newEntry; setInhibitUrls(list)
 *   - PERSIST
 *   - How (sub-block): Write list as newline-separated and persist.
 * 
 * ## SET_INHIBIT_URLS
 * 
 * - [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements setInhibitUrls(fullList) behavior for IMPL-URL_INHIBITION.
 * - Contract:
 *   - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: inhibit list stored as newline-separated string in config
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SET_INHIBIT_URLS
 *   - WRITE list as newline-separated string to config
 *   - PERSIST
 *   - How (sub-block): True if url contains any entry as substring.
 * 
 * ## IS_URL_INHIBITED
 * 
 * - [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] How: Implements isUrlInhibited(url) behavior for IMPL-URL_INHIBITION.
 * - Contract:
 *   - INPUT: url (string), optional newEntry (for add), optional fullList (for set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: list of inhibit URLs (get); success (add/set); boolean (isUrlInhibited)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: inhibit list stored as newline-separated string in config
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_URL_INHIBITED
 *   - list = getInhibitUrls()
 *   - FOR each entry IN list: IF url contains entry (substring) RETURN true
 *   - RETURN false
 * 
 * === END IMPL-FULL-BLOCK: IMPL-URL_INHIBITION ===
 */
import { ConfigManager } from '../../src/config/config-manager.js';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    
    // Mock chrome.storage responses
    global.chrome.storage.sync.get.mockImplementation((keys) => {
      const mockData = {
        hoverboard_auth_token: 'test-token',
        hoverboard_settings: {
          hoverShowRecentTags: false,
          recentTagsCountMax: 20,
        },
        hoverboard_inhibit_urls: 'example.com\ntest.com',
      };
      
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockData[keys] });
      } else if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          result[key] = mockData[key];
        });
        return Promise.resolve(result);
      } else if (keys && typeof keys === 'object') {
        const result = {};
        Object.keys(keys).forEach(key => {
          result[key] = mockData[key] || keys[key];
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(mockData);
    });

    global.chrome.storage.sync.set.mockResolvedValue();
  });

  describe('Construction and Defaults', () => {
    test('should initialize with correct storage keys', () => {
      expect(configManager.storageKeys).toEqual({
        AUTH_TOKEN: 'hoverboard_auth_token',
        SETTINGS: 'hoverboard_settings',
        STORAGE_MODE: 'hoverboard_storage_mode',
        INHIBIT_URLS: 'hoverboard_inhibit_urls',
        RECENT_TAGS: 'hoverboard_recent_tags',
        TAG_FREQUENCY: 'hoverboard_tag_frequency'
      });
    });

    test('should have default configuration', () => {
      const defaults = configManager.getDefaultConfiguration();

      expect(defaults).toHaveProperty('hoverShowRecentTags', true);
      expect(defaults).toHaveProperty('recentTagsCountMax', 32);
      expect(defaults).toHaveProperty('badgeTextIfNotBookmarked', '-');
      expect(defaults).toHaveProperty('pinRetryCountMax', 2);
      expect(defaults).toHaveProperty('storageMode', 'local'); // [REQ-STORAGE_MODE_DEFAULT]
    });

    test('should initialize defaults on first run', async () => {
      // Mock empty storage
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      await configManager.initializeDefaults();
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: configManager.defaultConfig
      });
    });

    test('should not override existing settings on initialize', async () => {
      // Mock existing settings
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { existing: 'data' }
      });
      
      await configManager.initializeDefaults();
      
      expect(global.chrome.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('[IMPL-RUNTIME_VALIDATION] Config validation in getConfig', () => {
    test('returns defaults when stored storageMode is invalid', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { storageMode: 'invalid' }
      })
      const config = await configManager.getConfig()
      expect(config.storageMode).toBe('local')
      expect(config.hoverShowRecentTags).toBe(true)
    })

    test('returns defaults when stored has wrong type for number (e.g. recentTagsCountMax string)', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { recentTagsCountMax: 'not-a-number' }
      })
      const config = await configManager.getConfig()
      expect(config.recentTagsCountMax).toBe(32)
    })
  })

  describe('Configuration Management', () => {
    test('should get complete config with defaults and overrides', async () => {
      const config = await configManager.getConfig();
      
      expect(config).toHaveProperty('hoverShowRecentTags', false); // overridden
      expect(config).toHaveProperty('recentTagsCountMax', 20); // overridden
      expect(config).toHaveProperty('badgeTextIfNotBookmarked', '-'); // default
    });

    test('should get user options subset', async () => {
      const options = await configManager.getOptions();
      
      expect(options).toHaveProperty('badgeTextIfNotBookmarked');
      expect(options).toHaveProperty('showHoverOnPageLoad');
      expect(options).not.toHaveProperty('pinRetryCountMax'); // internal config
    });

    test('should update configuration', async () => {
      const updates = {
        hoverShowRecentTags: true,
        newProperty: 'test-value'
      };
      
      await configManager.updateConfig(updates);
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining(updates)
      });
    });

    test('should reset to defaults', async () => {
      await configManager.resetToDefaults();
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: configManager.defaultConfig
      });
    });

    test('should handle uxShowSectionLabels option correctly', async () => {
      // Test that the default value is false
      const defaultConfig = await configManager.getConfig();
      expect(defaultConfig).toHaveProperty('uxShowSectionLabels', false);
      
      // Test updating the value
      const updates = {
        uxShowSectionLabels: true
      };
      await configManager.updateConfig(updates);
      
      // Mock the updated storage response
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { uxShowSectionLabels: true }
      });
      
      const updatedConfig = await configManager.getConfig();
      expect(updatedConfig).toHaveProperty('uxShowSectionLabels', true);
    });
  });

  describe('Storage Mode [REQ-STORAGE_MODE_DEFAULT]', () => {
    test('getStorageMode returns local when no stored override', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({ hoverboard_settings: {} });
      const mode = await configManager.getStorageMode();
      expect(mode).toBe('local');
    });

    test('getStorageMode returns pinboard when stored has storageMode pinboard', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { storageMode: 'pinboard' }
      });
      const mode = await configManager.getStorageMode();
      expect(mode).toBe('pinboard');
    });

    test('getStorageMode returns local when stored value is invalid (fallback) [ARCH-STORAGE_INDEX_AND_ROUTER]', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { storageMode: 'invalid' }
      });
      const mode = await configManager.getStorageMode();
      expect(mode).toBe('local');
    });

    test('setStorageMode accepts local and calls updateConfig', async () => {
      await configManager.setStorageMode('local');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({ storageMode: 'local' })
      });
    });

    test('setStorageMode accepts pinboard and calls updateConfig', async () => {
      await configManager.setStorageMode('pinboard');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({ storageMode: 'pinboard' })
      });
    });

    test('setStorageMode accepts file and calls updateConfig [ARCH-STORAGE_INDEX_AND_ROUTER]', async () => {
      await configManager.setStorageMode('file');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({ storageMode: 'file' })
      });
    });

    test('getStorageMode returns sync when stored has storageMode sync [ARCH-SYNC_STORAGE_PROVIDER]', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { storageMode: 'sync' }
      });
      const mode = await configManager.getStorageMode();
      expect(mode).toBe('sync');
    });

    test('setStorageMode accepts sync and calls updateConfig [ARCH-SYNC_STORAGE_PROVIDER]', async () => {
      await configManager.setStorageMode('sync');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({ storageMode: 'sync' })
      });
    });

    test('getStorageMode returns browser when stored [REQ-BROWSER_BOOKMARK_STORAGE]', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { storageMode: 'browser' }
      });
      const mode = await configManager.getStorageMode();
      expect(mode).toBe('browser');
    });

    test('setStorageMode accepts browser [REQ-BROWSER_BOOKMARK_STORAGE]', async () => {
      await configManager.setStorageMode('browser');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({ storageMode: 'browser' })
      });
    });

    test('setStorageMode throws on invalid mode', async () => {
      await expect(configManager.setStorageMode('invalid')).rejects.toThrow('Invalid storage mode');
    });
  });

  // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] Validates default AI fields, getConfig merge of stored AI fields, and updateConfig persistence of AI fields.
  describe('AI Tagging Config', () => {
    test('default config includes aiApiKey, aiProvider, aiTagLimit', () => {
      // How: defaults from getDefaultConfiguration.
      const defaults = configManager.getDefaultConfiguration();
      expect(defaults).toHaveProperty('aiApiKey', '');
      expect(defaults).toHaveProperty('aiProvider', 'openai');
      expect(defaults).toHaveProperty('aiTagLimit', 64);
    });

    test('getConfig returns AI fields from stored settings', async () => {
      // How: getConfig merge of stored AI fields.
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { aiApiKey: 'sk-test', aiProvider: 'gemini', aiTagLimit: 32 }
      });
      const config = await configManager.getConfig();
      expect(config).toHaveProperty('aiApiKey', 'sk-test');
      expect(config).toHaveProperty('aiProvider', 'gemini');
      expect(config).toHaveProperty('aiTagLimit', 32);
    });

    test('updateConfig persists AI fields', async () => {
      // How: updateConfig persistence of AI fields.
      await configManager.updateConfig({
        aiApiKey: 'key',
        aiProvider: 'openai',
        aiTagLimit: 64
      });
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({
          aiApiKey: 'key',
          aiProvider: 'openai',
          aiTagLimit: 64
        })
      });
    });
  });

  describe('Authentication Management', () => {
    test('should get auth token', async () => {
      const token = await configManager.getAuthToken();
      
      expect(token).toBe('test-token');
      expect(global.chrome.storage.sync.get).toHaveBeenCalledWith('hoverboard_auth_token');
    });

    test('should return empty string for missing auth token', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      const token = await configManager.getAuthToken();
      
      expect(token).toBe('');
    });

    test('should set auth token', async () => {
      await configManager.setAuthToken('new-token');
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_auth_token: 'new-token'
      });
    });

    test('should allow clearing auth token with empty string (disable Pinboard) [IMPL-CONFIG_MIGRATION]', async () => {
      await configManager.setAuthToken('');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_auth_token: ''
      });
    });

    test('should check if auth token exists', async () => {
      let hasToken = await configManager.hasAuthToken();
      expect(hasToken).toBe(true);
      
      // Test with no token
      global.chrome.storage.sync.get.mockResolvedValue({});
      hasToken = await configManager.hasAuthToken();
      expect(hasToken).toBe(false);
    });

    test('should format auth token for API requests', async () => {
      const tokenParam = await configManager.getAuthTokenParam();
      
      expect(tokenParam).toBe('auth_token=test-token');
    });

    test('should handle auth token storage errors', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const token = await configManager.getAuthToken();
      
      expect(token).toBe('');
    });

    test('should throw on auth token set errors', async () => {
      global.chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));
      
      await expect(configManager.setAuthToken('token')).rejects.toThrow('Storage error');
    });
  });

  describe('URL Inhibition Management', () => {
    test('should get inhibited URLs as array', async () => {
      const urls = await configManager.getInhibitUrls();
      
      expect(urls).toEqual(['example.com', 'test.com']);
    });

    test('should handle empty inhibit URLs', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      const urls = await configManager.getInhibitUrls();
      
      expect(urls).toEqual([]);
    });

    test('should add URL to inhibit list', async () => {
      const result = await configManager.addInhibitUrl('newsite.com');
      
      expect(result).toHaveProperty('inhibit', 'example.com\ntest.com\nnewsite.com');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_inhibit_urls: 'example.com\ntest.com\nnewsite.com'
      });
    });

    test('should not add duplicate URLs to inhibit list', async () => {
      await configManager.addInhibitUrl('example.com');
      
      expect(global.chrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('should check if URL is allowed', async () => {
      let isAllowed = await configManager.isUrlAllowed('https://allowed-site.com');
      expect(isAllowed).toBe(true);
      
      isAllowed = await configManager.isUrlAllowed('https://example.com/path');
      expect(isAllowed).toBe(false);
    });

    test('should default to allowing URLs on check error', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const isAllowed = await configManager.isUrlAllowed('https://any-site.com');
      
      expect(isAllowed).toBe(true);
    });

    test('setInhibitUrls replaces full list [IMPL-URL_INHIBITION]', async () => {
      await configManager.setInhibitUrls(['alpha.com', 'beta.com']);
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_inhibit_urls: 'alpha.com\nbeta.com'
      });
    });

    test('isUrlAllowed bidirectional substring match [IMPL-URL_INHIBITION]', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_inhibit_urls: 'example.com/path'
      });
      // entry contains normalized URL fragment (bidirectional)
      const blocked = await configManager.isUrlAllowed('https://example.com');
      expect(blocked).toBe(false);
    });

    test('isUrlAllowed strips protocol from candidate URL before match [IMPL-URL_INHIBITION]', async () => {
      // PROCEDURE: normalize candidate by stripping https?://; inhibit entries match as substrings
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_inhibit_urls: 'example.com'
      });
      const blocked = await configManager.isUrlAllowed('https://example.com/page');
      expect(blocked).toBe(false);
      const allowed = await configManager.isUrlAllowed('https://other.com/page');
      expect(allowed).toBe(true);
    });
  });

  describe('Configuration Import/Export', () => {
    test('should export configuration', async () => {
      const exported = await configManager.exportConfig();
      
      expect(exported).toHaveProperty('version', '1.0.0');
      expect(exported).toHaveProperty('exportDate');
      expect(exported).toHaveProperty('settings');
      expect(exported).toHaveProperty('authToken', 'test-token');
      expect(exported).toHaveProperty('inhibitUrls', ['example.com', 'test.com']);
    });

    test('should import configuration', async () => {
      const importData = {
        version: '1.0.0',
        settings: { hoverShowRecentTags: true },
        authToken: 'imported-token',
        inhibitUrls: ['imported.com']
      };
      
      await configManager.importConfig(importData);
      
      // importConfig makes separate calls to saveSettings() and setAuthToken()
      // Each calls chrome.storage.sync.set() individually
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: importData.settings
      });
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_auth_token: importData.authToken
      });
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_inhibit_urls: 'imported.com'
      });
    });

    test('should handle partial import data', async () => {
      const importData = {
        settings: { hoverShowRecentTags: true }
        // Missing authToken and inhibitUrls
      };
      
      await configManager.importConfig(importData);
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: importData.settings
      });
    });

    test('export/import round-trip includes inhibitUrls [IMPL-CONFIG_BACKUP_RESTORE]', async () => {
      const exported = await configManager.exportConfig();
      expect(exported.inhibitUrls).toEqual(['example.com', 'test.com']);
      await configManager.importConfig({
        settings: exported.settings,
        authToken: 'round-trip-token',
        inhibitUrls: exported.inhibitUrls
      });
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_inhibit_urls: 'example.com\ntest.com'
      });
    });
  });

  describe('[IMPL-FEATURE_FLAGS] defaults and settings accessors', () => {
    test('getDefaultConfiguration includes feature-flag keys [IMPL-FEATURE_FLAGS]', () => {
      const defaults = configManager.getDefaultConfiguration();
      expect(defaults).toHaveProperty('hoverShowRecentTags');
      expect(defaults).toHaveProperty('inhibitSitesOnPageLoad');
      expect(defaults.linkHealthChecksEnabled).toBe(true);
    });

    test('getOptions returns UI-safe subset [IMPL-FEATURE_FLAGS]', async () => {
      const options = await configManager.getOptions();
      expect(options).toBeDefined();
      expect(typeof options).toBe('object');
      // secrets must not be exposed as auth token field in UI options shape
      expect(options).not.toHaveProperty('authToken');
    });

    test('getStoredSettings parses corrupted string JSON [IMPL-FEATURE_FLAGS]', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: JSON.stringify({ hoverShowRecentTags: false })
      });
      const settings = await configManager.getStoredSettings();
      expect(settings.hoverShowRecentTags).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const config = await configManager.getConfig();
      
      expect(config).toEqual(configManager.defaultConfig);
    });

    test('should handle inhibit URL errors gracefully', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const urls = await configManager.getInhibitUrls();
      
      expect(urls).toEqual([]);
    });

    test('should throw on critical update errors', async () => {
      global.chrome.storage.sync.set.mockRejectedValue(new Error('Critical storage error'));
      
      await expect(configManager.updateConfig({ test: 'value' })).rejects.toThrow();
    });
  });
}); 