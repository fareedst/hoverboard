/**
 * Configuration Manager - Modern settings and authentication management
 * Replaces legacy config.js constants and AuthSettings class
 *
 * [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] exportConfig/importConfig for backup and portability.
 * [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] Auth token in sync storage; getAuthToken, setAuthToken, hasAuth, getAuthParam.
 * [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] getDefaultConfiguration, ensureDefaults, getConfigForUI, updateConfig, getSettings/setSettings, resetToDefaults.
 * [IMPL-FEATURE_FLAGS] User settings persistence and synchronization
 * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] getInhibitUrls, addInhibitUrl, setInhibitUrls, isUrlAllowed (substring match).
 * [IMPL-RUNTIME_VALIDATION] Zod schema validates merged config in getConfig(); invalid stored data falls back to defaults.
 * @ts-check
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
 * === IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
 * [IMPL-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [REQ-ICON_CLICK_BEHAVIOR] — Icon click opens side panel (default) or popup; when side panel, click toggles (close if already open).
 *
 * ## _SEED_ICON_CLICK_PREFERENCE_CACHE
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Manifest: no default_popup so onClicked fires. Config: iconClickOpensSidePanel default true; schema optional boolean. Options: toggle bound to iconClickOpensSidePanel; load and save with other settings. SW: cache preference so handler stays synchronous (user gesture required for sidePanel.open).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: _SEED_ICON_CLICK_PREFERENCE_CACHE
 *   - getConfig().then(c => this._iconClickOpensSidePanel = c.iconClickOpensSidePanel)
 *   - storage.onChanged.addListener(changes, areaName => IF areaName === 'local' AND changes.hoverboard_settings THEN getConfig().then(...))
 *
 * ## HANDLE_ACTION_CLICK
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: SW: listener passes tab from Chrome into handleActionClick(tab). SW handleActionClick(tab): prefer clicked window; Chrome requires sidePanel.open() in same synchronous user-gesture stack.
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ACTION_CLICK
 *   - openSidePanel = (this._iconClickOpensSidePanel !== false)
 *   - IF NOT openSidePanel: action.openPopup(); RETURN
 *   - IF NOT sidePanel.open available: action.openPopup(); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Prefer clicked window: use tab from onClicked when provided, else cache.
 *   - clickedWindowId = tab?.windowId != null ? tab.windowId : null
 *   - cachedWindowId = this._sidePanelWindowId
 *   - useWindowId = clickedWindowId != null ? clickedWindowId : cachedWindowId
 *   - IF useWindowId != null:
 *   - IF clickedWindowId != null AND NOT _isRestrictedForSidePanel(tab?.url): this._sidePanelWindowId = clickedWindowId
 *   - sidePanel.open({ windowId: useWindowId }); windows.update(useWindowId, { focused: true }); sendMessage(REQUEST_SIDE_PANEL_CLOSE); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no tab and no cache; do NOT call sidePanel.open in async callback (gesture would be lost). Seed cache for next click; open popup as fallback.
 *   - tabs.query({ active: true, currentWindow: true }, (tabs) =>
 *   - tabFromQuery = tabs?.[0]
 *   - IF tabFromQuery?.windowId != null AND NOT _isRestrictedForSidePanel(tabFromQuery.url): this._sidePanelWindowId = tabFromQuery.windowId
 *   - )
 *   - action.openPopup()
 *
 * ## BIND_TOGGLE_CLOSE_REQUEST
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Side panel: on REQUEST_SIDE_PANEL_CLOSE close if visible and open long enough (toggle).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BIND_TOGGLE_CLOSE_REQUEST
 *   - runtime.onMessage.addListener(message =>
 *   - IF message?.type !== REQUEST_SIDE_PANEL_CLOSE RETURN
 *   - IF document.visibilityState !== 'visible' RETURN
 *   - IF (Date.now() - _sidePanelLoadTime) < 300 RETURN
 *   - window.close())
 *
 * === END IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
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
 * === IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 * [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] — How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.
 *
 * ## VALIDATE_INCOMING_MESSAGE
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY] How: validate envelope then per-type data schema before handler body runs.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_INCOMING_MESSAGE
 *   - envelope = validateMessageEnvelope(message)
 *   - IF envelope fails: RETURN error
 *   - data = validateMessageData(message.type, message.data)
 *   - IF data fails: RETURN error
 *   - RETURN { type, data }
 *   - How (sub-block): How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.
 *
 * ## VALIDATE_MERGED_CONFIG
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] How: Implements VALIDATE_MERGED_CONFIG(merged) behavior for IMPL-RUNTIME_VALIDATION.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_MERGED_CONFIG
 *   - parsed = configSchema.safeParse(merged)
 *   - IF NOT parsed.success: LOG; RETURN fallback OR error
 *   - RETURN parsed.data
 *
 * === END IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 * [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] — How: incremental type-check without full TS rewrite — tsconfig noEmit, // @ts-check on key JS, shared .d.ts. Status: Active tooling; not a Deferred Safari path. Expand when more files adopt @ts-check.
 *
 * ## TYPECHECK_GATE
 *
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: validate gate runs typecheck before build/push.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: TYPECHECK_GATE
 *   - RUN tsc --noEmit with allowJs
 *   - ON errors: FAIL validate
 *   - RETURN pass
 *   - How (sub-block): How: checked modules document contracts via JSDoc/.d.ts; Zod remains runtime source for messages.
 *
 * ## MAINTAIN_CHECKED_SURFACE
 *
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: Implements MAINTAIN_CHECKED_SURFACE behavior for IMPL-TYPESCRIPT_MIGRATION.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MAINTAIN_CHECKED_SURFACE
 *   - KEEP // @ts-check on boundary modules
 *   - UPDATE .d.ts when message/config shapes change
 *   - RETURN
 *
 * === END IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-THEME ===
 * [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] — How: default dark theme with user toggle; persist preference and apply to popup/overlay CSS.
 *
 * ## APPLY_THEME
 *
 * - [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] How: on UI bootstrap load preference (default dark); apply; on toggle persist and re-apply.
 * - Contract:
 *   - INPUT: theme preference from ConfigManager; UI theme toggle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: data-theme / CSS class applied on popup and overlay; persisted preference
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager theme keys; popup.css; overlay-styles.css; dark-theme-default tests
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_THEME
 *   - pref = AWAIT configManager.getTheme() OR "dark"
 *   - SET root dataset/class to pref
 *   - RETURN pref
 *
 * ## TOGGLE_THEME
 *
 * - [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] How: Implements TOGGLE_THEME(root) behavior for IMPL-THEME.
 * - Contract:
 *   - INPUT: theme preference from ConfigManager; UI theme toggle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: data-theme / CSS class applied on popup and overlay; persisted preference
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager theme keys; popup.css; overlay-styles.css; dark-theme-default tests
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: TOGGLE_THEME
 *   - next = opposite of APPLY_THEME(root)
 *   - AWAIT configManager.setTheme(next)
 *   - APPLY_THEME(root)
 *   - RETURN next
 *
 * === END IMPL-FULL-BLOCK: IMPL-THEME ===
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
import { z } from 'zod'

/** @typedef {import('../shared/config-types').MergedConfig} MergedConfig */

// [IMPL-RUNTIME_VALIDATION] Schema for merged config (defaults + stored). Passthrough allows future keys.
const mergedConfigSchema = z.object({
  storageMode: z.enum(['local', 'pinboard', 'file', 'sync', 'browser']).optional(),
  hoverShowRecentTags: z.boolean().optional(),
  hoverShowTooltips: z.boolean().optional(),
  showHoverOnPageLoad: z.boolean().optional(),
  showHoverOPLOnlyIfNoTags: z.boolean().optional(),
  showHoverOPLOnlyIfSomeTags: z.boolean().optional(),
  inhibitSitesOnPageLoad: z.boolean().optional(),
  setIconOnLoad: z.boolean().optional(),
  recentTagsCountMax: z.number().int().min(0).optional(),
  initRecentPostsCount: z.number().int().min(0).optional(),
  uxAutoCloseTimeout: z.number().min(0).optional(),
  uxRecentRowWithBlock: z.boolean().optional(),
  uxRecentRowWithBookmarkButton: z.boolean().optional(),
  uxRecentRowWithCloseButton: z.boolean().optional(),
  uxRecentRowWithPrivateButton: z.boolean().optional(),
  uxRecentRowWithDeletePin: z.boolean().optional(),
  uxRecentRowWithInput: z.boolean().optional(),
  uxUrlStripHash: z.boolean().optional(),
  uxShowSectionLabels: z.boolean().optional(),
  recentTagsMaxListSize: z.number().int().min(0).optional(),
  recentTagsMaxDisplayCount: z.number().int().min(0).optional(),
  recentTagsSharedMemoryKey: z.string().optional(),
  recentTagsEnableUserDriven: z.boolean().optional(),
  recentTagsClearOnReload: z.boolean().optional(),
  /** N minutes: rolling window for recent-tag use + Hoverboard inactivity expiry ([REQ-RECENT_TAGS_SYSTEM]) */
  recentTagsActivityWindowMinutes: z.number().int().min(1).max(24 * 60).optional(),
  badgeTextIfNotBookmarked: z.string().optional(),
  badgeTextIfPrivate: z.string().optional(),
  badgeTextIfQueued: z.string().optional(),
  badgeTextIfBookmarkedNoTags: z.string().optional(),
  pinRetryCountMax: z.number().int().min(0).optional(),
  pinRetryDelay: z.number().min(0).optional(),
  defaultVisibilityTheme: z.string().optional(),
  defaultTransparencyEnabled: z.boolean().optional(),
  defaultBackgroundOpacity: z.number().min(0).max(100).optional(),
  overlayPositionMode: z.string().optional(),
  fontSizeSuggestedTags: z.number().int().min(1).optional(),
  fontSizeLabels: z.number().int().min(1).optional(),
  fontSizeTags: z.number().int().min(1).optional(),
  fontSizeBase: z.number().int().min(1).optional(),
  fontSizeInputs: z.number().int().min(1).optional(),
  aiApiKey: z.string().optional(),
  aiProvider: z.string().optional(),
  aiTagLimit: z.number().int().min(0).optional(),
  // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Single click on extension icon: side panel (true) or popup (false)
  iconClickOpensSidePanel: z.boolean().optional(),
  // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Outbound Index link health checks; absent setting defaults effectively enabled and explicit false remains an opt-out.
  linkHealthChecksEnabled: z.boolean().optional()
}).passthrough()

export class ConfigManager {
  constructor () {
    // IMPL-CONFIG_BACKUP_RESTORE: Standardized storage key naming convention
    // SPECIFICATION: Use prefixed keys to avoid conflicts with other extensions
    this.storageKeys = {
      AUTH_TOKEN: 'hoverboard_auth_token',
      SETTINGS: 'hoverboard_settings',
      STORAGE_MODE: 'hoverboard_storage_mode', // [ARCH-LOCAL_STORAGE_PROVIDER] - Bookmark storage mode (pinboard | local)
      INHIBIT_URLS: 'hoverboard_inhibit_urls',
      RECENT_TAGS: 'hoverboard_recent_tags', // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Tag storage key
      TAG_FREQUENCY: 'hoverboard_tag_frequency' // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Tag frequency storage key
    }

    // IMPL-FEATURE_FLAGS: Default configuration provides baseline behavior
    // IMPLEMENTATION DECISION: All settings have sensible defaults to ensure functionality without user configuration
    this.defaultConfig = this.getDefaultConfiguration()
  }

  /**
   * Get default configuration values
   * Migrated from src/shared/config.js
   * @returns {MergedConfig}
   * IMPL-FEATURE_FLAGS: Feature flags and UI behavior control defaults
   * SPECIFICATION: Each setting controls specific extension behavior
   * IMPLEMENTATION DECISION: Conservative defaults favor user privacy and minimal intrusion
   */
  getDefaultConfiguration () {
    return {
      // [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] - Default local: preferable for most users (no account/API required)
      storageMode: 'local',

      // IMPL-FEATURE_FLAGS: Feature flags - Core functionality toggles
      // IMPLEMENTATION DECISION: Enable helpful features by default, disable potentially intrusive ones
      hoverShowRecentTags: true, // Show recent tags in hover overlay
      hoverShowTooltips: false, // Tooltips disabled by default to avoid visual clutter
      showHoverOnPageLoad: false, // No automatic hover to respect user intent
      showHoverOPLOnlyIfNoTags: true, // Smart overlay display logic
      showHoverOPLOnlyIfSomeTags: false, // Complementary to above setting
      inhibitSitesOnPageLoad: true, // Respect site-specific inhibition settings
      setIconOnLoad: true, // Update extension icon to reflect bookmark status

      // IMPL-FEATURE_FLAGS: UI behavior settings - User experience configuration
      // IMPLEMENTATION DECISION: Reasonable limits that balance functionality with performance
      recentTagsCountMax: 32, // Maximum recent tags to track
      initRecentPostsCount: 15, // Initial recent posts to load
      uxAutoCloseTimeout: 0, // in ms, 0 to disable auto-close (user control)
      uxRecentRowWithBlock: true, // Show block button in recent rows
      uxRecentRowWithBookmarkButton: true, // Show bookmark button
      uxRecentRowWithCloseButton: true, // Show close button for user control
      uxRecentRowWithPrivateButton: true, // Privacy control in interface
      uxRecentRowWithDeletePin: true, // Allow pin deletion from interface
      uxRecentRowWithInput: true, // Enable input controls
      uxUrlStripHash: false, // Preserve URL hash by default (maintain full URL context)
      uxShowSectionLabels: false, // Show section labels in popup (Quick Actions, Search Tabs)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Recent tags configuration
      // IMPLEMENTATION DECISION: Conservative defaults for shared memory management
      recentTagsMaxListSize: 50, // Maximum recent tags in shared memory
      recentTagsMaxDisplayCount: 10, // Maximum tags to display in UI
      recentTagsSharedMemoryKey: 'hoverboard_recent_tags_shared', // Shared memory key
      recentTagsEnableUserDriven: true, // Enable user-driven recent tags
      recentTagsClearOnReload: true, // Clear shared memory on extension reload
      recentTagsActivityWindowMinutes: 15, // [REQ-RECENT_TAGS_SYSTEM] Same N for tag-age window and idle expiry (spec side-panel order 4)

      // IMPL-FEATURE_FLAGS: Badge configuration - Extension icon indicator settings
      // IMPLEMENTATION DECISION: Clear visual indicators for different bookmark states
      badgeTextIfNotBookmarked: '-', // Clear indication of non-bookmarked state
      badgeTextIfPrivate: '*', // Privacy indicator
      badgeTextIfQueued: '!', // Pending action indicator
      badgeTextIfBookmarkedNoTags: '0', // Zero tags indicator

      // IMPL-CONFIG_MIGRATION: API retry configuration - Network resilience settings
      // IMPLEMENTATION DECISION: Conservative retry strategy to avoid API rate limiting
      pinRetryCountMax: 2, // Maximum retry attempts
      pinRetryDelay: 1000, // in ms - delay between retries

      // ⭐ [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Visibility Controls - 🎨 Per-window overlay appearance defaults
      // IMPLEMENTATION DECISION: Conservative defaults for broad compatibility and readability
      defaultVisibilityTheme: 'light-on-dark', // 'light-on-dark' | 'dark-on-light' - Dark theme default
      defaultTransparencyEnabled: false, // Conservative default - solid background for readability
      defaultBackgroundOpacity: 90, // 10-100% - High opacity default for good contrast
      overlayPositionMode: 'default', // 'default' | 'bottom-fixed' - Keep existing position setting

      // Font size configuration - User-customizable text sizes across UI
      // IMPLEMENTATION DECISION: Reasonable defaults with customization for accessibility
      fontSizeSuggestedTags: 10, // Suggested tags font size in pixels (smaller for less intrusion)
      fontSizeLabels: 12, // Label text (Current, Recent, Suggested) in pixels
      fontSizeTags: 12, // Current and recent tag elements in pixels
      fontSizeBase: 14, // Base UI text size in pixels
      fontSizeInputs: 14, // Input fields and buttons font size in pixels

      // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] AI tagging defaults for options and storage; empty key disables feature.
      aiApiKey: '',
      aiProvider: 'openai',
      aiTagLimit: 64,

      // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Default: single click on extension icon opens side panel; user can set to open popup in options.
      iconClickOpensSidePanel: true,

      // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Enabled by default for new/absent settings; users can explicitly opt out in Options.
      linkHealthChecksEnabled: true
    }
  }

  /**
   * Initialize default settings on first installation
   *
   * IMPL-FEATURE_FLAGS: First-run initialization ensures extension works immediately
   * IMPLEMENTATION DECISION: Only initialize if no settings exist to preserve user customizations
   */
  async initializeDefaults () {
    const existingSettings = await this.getStoredSettings()
    if (!existingSettings || Object.keys(existingSettings).length === 0) {
      // IMPL-FEATURE_FLAGS: Store defaults only on first run
      await this.saveSettings(this.defaultConfig)
    }
  }

  /**
   * Get complete configuration object
   * @returns {Promise<MergedConfig>} Configuration object
   *
   * IMPL-FEATURE_FLAGS: Configuration resolution with default fallback
   * IMPLEMENTATION DECISION: Merge defaults with stored settings to handle partial configurations
   */
  async getConfig () {
    const stored = await this.getStoredSettings()
    // If stored is not a plain object, treat as corrupted and use defaults
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return { ...this.defaultConfig }
    }
    // IMPL-FEATURE_FLAGS: Defaults ensure all required configuration keys are present
    const merged = { ...this.defaultConfig, ...stored }
    // [IMPL-RUNTIME_VALIDATION] Validate merged config; on failure fall back to defaults to prevent bad stored data from breaking the extension
    const parsed = mergedConfigSchema.safeParse(merged)
    if (!parsed.success) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[IMPL-RUNTIME_VALIDATION] Config validation failed, using defaults:', parsed.error?.issues)
      }
      return { ...this.defaultConfig }
    }
    return parsed.data
  }

  /**
   * Get user-configurable options (subset of config for UI)
   * @returns {Promise<Object>} Options object
   *
   * IMPL-FEATURE_FLAGS: UI-specific configuration subset
   * IMPLEMENTATION DECISION: Only expose user-relevant settings to avoid configuration complexity
   */
  async getOptions () {
    /** @type {MergedConfig} */
    const config = await this.getConfig()
    // IMPL-FEATURE_FLAGS: Filtered configuration for user interface display
    return {
      badgeTextIfBookmarkedNoTags: config.badgeTextIfBookmarkedNoTags,
      badgeTextIfNotBookmarked: config.badgeTextIfNotBookmarked,
      badgeTextIfPrivate: config.badgeTextIfPrivate,
      badgeTextIfQueued: config.badgeTextIfQueued,
      recentPostsCount: config.initRecentPostsCount,
      showHoverOnPageLoad: config.showHoverOnPageLoad,
      hoverShowTooltips: config.hoverShowTooltips,
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Visibility defaults for configuration UI
      defaultVisibilityTheme: config.defaultVisibilityTheme,
      defaultTransparencyEnabled: config.defaultTransparencyEnabled,
      defaultBackgroundOpacity: config.defaultBackgroundOpacity,
      // Popup UI settings
      uxShowSectionLabels: config.uxShowSectionLabels,
      // Font size configuration
      fontSizeSuggestedTags: config.fontSizeSuggestedTags,
      fontSizeLabels: config.fontSizeLabels,
      fontSizeTags: config.fontSizeTags,
      fontSizeBase: config.fontSizeBase,
      fontSizeInputs: config.fontSizeInputs
    }
  }

  /**
   * Update specific configuration values
   * @param {Partial<MergedConfig>} updates - Configuration updates
   *
   * IMPL-FEATURE_FLAGS: Partial configuration updates with persistence
   * IMPLEMENTATION DECISION: Merge updates to preserve unmodified settings
   */
  async updateConfig (updates) {
    const current = await this.getConfig()
    const updated = { ...current, ...updates }
    // IMPL-FEATURE_FLAGS: Persist merged configuration
    await this.saveSettings(updated)
  }

  /**
   * Get bookmark storage mode (default backend for new bookmarks when using router).
   * @returns {Promise<string>} 'pinboard', 'local', 'file', 'sync', or 'browser'
   *
   * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Storage mode for provider selection and default for new bookmarks
   * IMPLEMENTATION DECISION: Stored in settings blob; invalid values fall back to 'local'
   */
  async getStorageMode () {
    const config = await this.getConfig()
    const mode = config.storageMode
    return (mode === 'local' || mode === 'pinboard' || mode === 'file' || mode === 'sync' || mode === 'browser') ? mode : 'local'
  }

  /**
   * Set bookmark storage mode
   * @param {string} mode - 'pinboard', 'local', 'file', 'sync', or 'browser'
   *
   * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BROWSER_BOOKMARK_STORAGE] Persist storage mode
   */
  async setStorageMode (mode) {
    if (mode !== 'pinboard' && mode !== 'local' && mode !== 'file' && mode !== 'sync' && mode !== 'browser') {
      throw new Error(`Invalid storage mode: ${mode}. Use 'pinboard', 'local', 'file', 'sync', or 'browser'.`)
    }
    await this.updateConfig({ storageMode: mode })
  }

  /**
   * Get visibility default settings
   * @returns {Promise<Object>} Visibility defaults object
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Visibility defaults retrieval
   * IMPLEMENTATION DECISION: Dedicated method for overlay visibility configuration
   */
  async getVisibilityDefaults () {
    const config = await this.getConfig()
    return {
      textTheme: config.defaultVisibilityTheme,
      transparencyEnabled: config.defaultTransparencyEnabled,
      backgroundOpacity: config.defaultBackgroundOpacity
    }
  }

  /**
   * Update visibility default settings
   * @param {{ textTheme?: string, transparencyEnabled?: boolean, backgroundOpacity?: number }} visibilitySettings - New visibility defaults
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Visibility defaults update
   * IMPLEMENTATION DECISION: Dedicated method for clean visibility settings management
   */
  async updateVisibilityDefaults (visibilitySettings) {
    const updates = {}

    if (visibilitySettings.textTheme !== undefined) {
      updates.defaultVisibilityTheme = visibilitySettings.textTheme
    }
    if (visibilitySettings.transparencyEnabled !== undefined) {
      updates.defaultTransparencyEnabled = visibilitySettings.transparencyEnabled
    }
    if (visibilitySettings.backgroundOpacity !== undefined) {
      updates.defaultBackgroundOpacity = visibilitySettings.backgroundOpacity
    }

    await this.updateConfig(updates)
  }

  /**
   * Get authentication token
   * @returns {Promise<string>} Auth token or empty string
   *
   * IMPL-CONFIG_MIGRATION: Secure authentication token retrieval
   * IMPLEMENTATION DECISION: Return empty string on failure to ensure graceful degradation
   */
  async getAuthToken () {
    try {
      // IMPL-CONFIG_MIGRATION: Use sync storage for authentication data synchronization across devices
      const result = await chrome.storage.sync.get(this.storageKeys.AUTH_TOKEN)
      return result[this.storageKeys.AUTH_TOKEN] || ''
    } catch (error) {
      console.error('Failed to get auth token:', error)
      // IMPL-CONFIG_MIGRATION: Graceful degradation - return empty string to allow detection of no-auth state
      return ''
    }
  }

  /**
   * Set authentication token
   * @param {string} token - Pinboard API token
   *
   * IMPL-CONFIG_MIGRATION: Secure authentication token storage
   * IMPLEMENTATION DECISION: Use sync storage for cross-device authentication
   */
  async setAuthToken (token) {
    try {
      // IMPL-CONFIG_MIGRATION: Store token in sync storage for device synchronization
      await chrome.storage.sync.set({
        [this.storageKeys.AUTH_TOKEN]: token
      })
    } catch (error) {
      console.error('Failed to set auth token:', error)
      // IMPL-CONFIG_MIGRATION: Re-throw to allow caller to handle authentication failures
      throw error
    }
  }

  /**
   * Check if authentication token exists
   * @returns {Promise<boolean>} Whether token exists
   *
   * IMPL-CONFIG_MIGRATION: Authentication state validation
   * IMPLEMENTATION DECISION: Simple boolean check for authentication state
   */
  async hasAuthToken () {
    const token = await this.getAuthToken()
    // IMPL-CONFIG_MIGRATION: Token existence check - non-empty string indicates configured authentication
    return token.length > 0
  }

  /**
   * Get authentication token formatted for API requests
   * @returns {Promise<string>} Token formatted as URL parameter
   *
   * IMPL-CONFIG_MIGRATION: API-ready authentication parameter formatting
   * IMPLEMENTATION DECISION: Pre-format token for consistent API usage
   */
  async getAuthTokenParam () {
    const token = await this.getAuthToken()
    // IMPL-CONFIG_MIGRATION: Format token as URL parameter for Pinboard API compatibility
    return `auth_token=${token}`
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Get inhibited URLs list (newline-separated).
   * @returns {Promise<string[]>} Array of inhibited URLs
   */
  async getInhibitUrls () {
    try {
      // IMPL-URL_INHIBITION: Retrieve inhibition list from storage
      const result = await chrome.storage.sync.get(this.storageKeys.INHIBIT_URLS)
      const inhibitString = result[this.storageKeys.INHIBIT_URLS] || ''
      // IMPL-URL_INHIBITION: Parse newline-separated URLs and filter empty entries
      return inhibitString.split('\n').filter(url => url.trim().length > 0)
    } catch (error) {
      console.error('Failed to get inhibit URLs:', error)
      // IMPL-URL_INHIBITION: Return empty array on failure to allow normal operation
      return []
    }
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Add URL to inhibit list (no duplicate).
   * @param {string} url - URL to inhibit
   */
  async addInhibitUrl (url) {
    try {
      // Normalize: strip protocol (http/https) for matching
      const normalizedUrl = url.replace(/^https?:\/\//, '')
      const current = await this.getInhibitUrls()
      if (!current.includes(normalizedUrl)) {
        // IMPL-URL_INHIBITION: Add URL only if not already present
        current.push(normalizedUrl)
        const inhibitString = current.join('\n')
        // IMPL-URL_INHIBITION: Store updated inhibition list
        await chrome.storage.sync.set({
          [this.storageKeys.INHIBIT_URLS]: inhibitString
        })
      }
      // IMPL-URL_INHIBITION: Return formatted inhibition string for legacy compatibility
      return { inhibit: current.join('\n') }
    } catch (error) {
      console.error('Failed to add inhibit URL:', error)
      throw error
    }
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Set inhibit URLs list (replaces existing).
   * @param {string[]} urls - Array of URLs to inhibit
   */
  async setInhibitUrls (urls) {
    try {
      // IMPL-URL_INHIBITION: Replace entire inhibition list
      const inhibitString = urls.join('\n')
      await chrome.storage.sync.set({
        [this.storageKeys.INHIBIT_URLS]: inhibitString
      })
    } catch (error) {
      console.error('Failed to set inhibit URLs:', error)
      throw error
    }
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Check if URL is allowed (not in inhibit list; substring match).
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} Whether URL is allowed
   */
  async isUrlAllowed (url) {
    try {
      const inhibitUrls = await this.getInhibitUrls()
      // Normalize: strip protocol for matching
      const normalizedUrl = url.replace(/^https?:\/\//, '')
      // IMPL-URL_INHIBITION: Check both directions for substring matching (flexible pattern matching)
      return !inhibitUrls.some(inhibitUrl =>
        normalizedUrl.includes(inhibitUrl) || inhibitUrl.includes(normalizedUrl)
      )
    } catch (error) {
      console.error('Failed to check URL allowance:', error)
      // IMPL-URL_INHIBITION: Default to allowing on error to avoid breaking functionality
      return true // Default to allowing if check fails
    }
  }

  /**
   * Get stored settings from storage
   * @returns {Promise<Object>} Stored settings
   *
   * IMPL-FEATURE_FLAGS: Core settings retrieval with error handling
   * IMPLEMENTATION DECISION: Return empty object on failure to allow default merging
   */
  async getStoredSettings () {
    try {
      // IMPL-FEATURE_FLAGS: Retrieve settings from sync storage
      const result = await chrome.storage.sync.get(this.storageKeys.SETTINGS)
      const stored = result[this.storageKeys.SETTINGS]

      // IMPL-FEATURE_FLAGS: Handle corrupted data (string instead of object)
      if (typeof stored === 'string') {
        try {
          return JSON.parse(stored)
        } catch (parseError) {
          console.error('Failed to parse stored settings:', parseError)
          return {}
        }
      }

      return stored || {}
    } catch (error) {
      console.error('Failed to get stored settings:', error)
      // IMPL-FEATURE_FLAGS: Return empty object to trigger default configuration usage
      return {}
    }
  }

  /**
   * Save settings to storage
   * @param {MergedConfig|Record<string, unknown>} settings - Settings to save
   *
   * IMPL-FEATURE_FLAGS: Settings persistence with error propagation
   * IMPLEMENTATION DECISION: Let errors propagate to caller for proper error handling
   */
  async saveSettings (settings) {
    try {
      // IMPL-FEATURE_FLAGS: Store settings in sync storage for cross-device synchronization
      await chrome.storage.sync.set({
        [this.storageKeys.SETTINGS]: settings
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      // IMPL-FEATURE_FLAGS: Re-throw to allow caller to handle save failures
      throw error
    }
  }

  /**
   * Reset all settings to defaults
   *
   * IMPL-FEATURE_FLAGS: Configuration reset functionality
   * IMPLEMENTATION DECISION: Simple replacement with defaults for clean reset
   */
  async resetToDefaults () {
    // IMPL-FEATURE_FLAGS: Replace all settings with default configuration
    await this.saveSettings(this.defaultConfig)
  }

  /**
   * Export configuration for backup
   * @returns {Promise<Object>} Complete configuration export
   *
   * IMPL-CONFIG_BACKUP_RESTORE: Configuration backup and portability
   * IMPLEMENTATION DECISION: Include all configuration data with metadata for validation
   */
  async exportConfig () {
    // IMPL-CONFIG_BACKUP_RESTORE: Gather all configuration data in parallel for efficiency
    const [settings, token, inhibitUrls] = await Promise.all([
      this.getStoredSettings(),
      this.getAuthToken(),
      this.getInhibitUrls()
    ])

    // IMPL-CONFIG_BACKUP_RESTORE: Create comprehensive configuration export with metadata
    return {
      settings,
      authToken: token,
      inhibitUrls,
      exportDate: new Date().toISOString(),
      version: '1.0.0' // Version for import compatibility checking
    }
  }

  /**
   * Import configuration from backup
   * @param {{ settings?: MergedConfig|Record<string, unknown>, authToken?: string, inhibitUrls?: string[] }} configData - Configuration data to import
   *
   * IMPL-CONFIG_BACKUP_RESTORE: Configuration restoration from backup
   * IMPLEMENTATION DECISION: Selective import allows partial configuration restoration
   */
  async importConfig (configData) {
    // IMPL-CONFIG_BACKUP_RESTORE: Import settings if present in backup
    if (configData.settings) {
      await this.saveSettings(configData.settings)
    }

    // IMPL-CONFIG_MIGRATION: Import authentication token if present
    if (configData.authToken) {
      await this.setAuthToken(configData.authToken)
    }

    // IMPL-URL_INHIBITION: Import inhibition list if present
    if (configData.inhibitUrls) {
      const inhibitString = configData.inhibitUrls.join('\n')
      await chrome.storage.sync.set({
        [this.storageKeys.INHIBIT_URLS]: inhibitString
      })
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced tag storage management
   * @param {string[]} tags - Array of tags to store
   * @returns {Promise<void>}
   */
  async updateRecentTags (tags) {
    try {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate tags array
      if (!Array.isArray(tags)) {
        console.warn('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Invalid tags array provided')
        return
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enforce storage limits
      const config = await this.getConfig()
      const maxTags = config.recentTagsCountMax || 50
      const limitedTags = tags.slice(0, maxTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Store tags with timestamp
      await chrome.storage.sync.set({
        [this.storageKeys.RECENT_TAGS]: {
          tags: limitedTags,
          timestamp: Date.now(),
          count: limitedTags.length
        }
      })
    } catch (error) {
      console.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to update recent tags:', error)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Fallback to local storage
      try {
        await chrome.storage.local.set({
          [this.storageKeys.RECENT_TAGS]: {
            tags: tags.slice(0, 50),
            timestamp: Date.now(),
            count: Math.min(tags.length, 50)
          }
        })
      } catch (fallbackError) {
        console.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Fallback storage also failed:', fallbackError)
      }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Get recent tags with deduplication
   * @returns {Promise<string[]>} Array of recent tags
   */
  async getRecentTags () {
    try {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Try sync storage first
      const syncResult = await chrome.storage.sync.get(this.storageKeys.RECENT_TAGS)
      if (syncResult[this.storageKeys.RECENT_TAGS]) {
        return syncResult[this.storageKeys.RECENT_TAGS].tags || []
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Fallback to local storage
      const localResult = await chrome.storage.local.get(this.storageKeys.RECENT_TAGS)
      if (localResult[this.storageKeys.RECENT_TAGS]) {
        return localResult[this.storageKeys.RECENT_TAGS].tags || []
      }

      return []
    } catch (error) {
      console.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to get recent tags:', error)
      return []
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Get tag frequency data
   * @returns {Promise<Object>} Tag frequency map
   */
  async getTagFrequency () {
    try {
      const result = await chrome.storage.local.get(this.storageKeys.TAG_FREQUENCY)
      return result[this.storageKeys.TAG_FREQUENCY] || {}
    } catch (error) {
      console.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to get tag frequency:', error)
      return {}
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Update tag frequency
   * @param {Object} frequency - Updated frequency map
   * @returns {Promise<void>}
   */
  async updateTagFrequency (frequency) {
    try {
      await chrome.storage.local.set({
        [this.storageKeys.TAG_FREQUENCY]: frequency
      })
    } catch (error) {
      console.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to update tag frequency:', error)
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Clean up old tags to manage storage
   * @returns {Promise<void>}
   */
  async cleanupOldTags () {
    try {
      const config = await this.getConfig()
      const maxTags = config.recentTagsCountMax || 50

      const recentTags = await this.getRecentTags()
      if (recentTags.length > maxTags) {
        const trimmedTags = recentTags.slice(0, maxTags)
        await this.updateRecentTags(trimmedTags)
      }
    } catch (error) {
      console.error('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to cleanup old tags:', error)
    }
  }
}
