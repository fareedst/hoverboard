/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Deterministic non-secret package serialization, validation, planning, and restore compensation.
 */
/**
 * ## NORMALIZE_PACKAGE_PATH
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: accept only safe relative artifact paths and reject traversal or machine-specific absolute paths.
 * - Contract:
 *   - INPUT: candidate artifact path
 *   - PRE: path is supplied as package metadata
 *   - OUTPUT: normalized relative path | { error: UnsafePath }
 *   - POST:
 *     - success => path is relative, normalized, and contains no traversal segment
 *     - error => artifact is not addressable for export or restore
 *   - FAILURE_MODES: UnsafePath
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_PACKAGE_PATH
 *   - IF path is empty, absolute, or contains a traversal segment: RETURN UnsafePath
 *   - normalized = normalizeRelativePath(path)
 *   - IF normalized escapes package root: RETURN UnsafePath
 *   - RETURN normalized
 *
 * ## FILTER_NON_SECRET_CONFIGURATION
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: apply an allowlist to configuration and explicitly report excluded secrets rather than exporting them.
 * - Contract:
 *   - INPUT: configuration object, allowlisted keys
 *   - PRE: configuration may contain credentials, API keys, or machine-specific paths
 *   - OUTPUT: { safeConfiguration, excludedKeys }
 *   - POST:
 *     - success => safeConfiguration contains no secret key; excludedKeys identifies each excluded secret
 *     - error => no configuration is exported
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_NON_SECRET_CONFIGURATION
 *   - safeConfiguration = {}
 *   - excludedKeys = []
 *   - FOR each key IN allowlisted keys: IF configuration has key: copy key to safeConfiguration
 *   - FOR each key IN configuration: IF key is secret or not allowlisted: append key to excludedKeys
 *   - RETURN { safeConfiguration, excludedKeys }
 *
 * ## BUILD_PACKAGE_MANIFEST
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: build deterministic schema-versioned manifest entries with safe paths, sizes, and checksums.
 * - Contract:
 *   - INPUT: package metadata records, binary artifact records, safe configuration, checksum function
 *   - PRE: every artifact has a safe relative path and checksum function is available
 *   - OUTPUT: { manifest, artifacts }
 *   - POST:
 *     - success => manifest entries are sorted by kind then path; each entry has size and checksum
 *     - error => package is not emitted
 *   - FAILURE_MODES: UnsafePath, ChecksumFailed, PackageTooLarge
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_PACKAGE_MANIFEST
 *   - entries = serialize metadata records as deterministic entries
 *   - FOR artifact IN binary artifacts: path = NORMALIZE_PACKAGE_PATH(artifact.path); IF path is error: RETURN path; append artifact entry with checksum
 *   - FOR entry IN entries: entry.sha256 = AWAIT checksum(entry.bytes); IF checksum fails: RETURN ChecksumFailed
 *   - SORT entries BY kind ASCENDING, path ASCENDING
 *   - IF total entry bytes exceed package limit: RETURN PackageTooLarge
 *   - RETURN { manifest: { schemaVersion: 1, packageVersion: 1, entries, excludedKeys }, artifacts }
 *
 * ## COLLECT_LIBRARY_PACKAGE
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: collect bookmark, tag, storage index, safe configuration, archive, and screenshot state without mutating any source.
 * - Contract:
 *   - INPUT: BookmarkRouter/Index readers, archive and screenshot readers, ConfigManager, checksum function
 *   - PRE: all readers are read-only; File storage target is readable when configured
 *   - OUTPUT: portable package | { error: SourceUnavailable | StorageFailed | ChecksumFailed | UnsafePath | PackageTooLarge }
 *   - POST:
 *     - success => package contains non-secret library state and durable Local/File artifacts with complete manifest
 *     - error => source state is unchanged
 *   - FAILURE_MODES: SourceUnavailable, StorageFailed, ChecksumFailed, UnsafePath, PackageTooLarge
 *   - DATA: source snapshots and package entries
 *   - DATA_TRANSITION: no source mutation; package exists only as a new export value
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: COLLECT_LIBRARY_PACKAGE
 *   - bookmarks = AWAIT router.getAllBookmarksForIndex()
 *   - storageIndex = AWAIT storageIndexReader.getIndex()
 *   - configuration = FILTER_NON_SECRET_CONFIGURATION(AWAIT configReader.exportConfig(), allowlistedKeys)
 *   - archives = AWAIT archiveReader.listArchives(local and file)
 *   - screenshots = AWAIT screenshotReader.listScreenshots(local and file)
 *   - artifacts = encode archives and screenshots as separate entries with backend-scoped identity
 *   - manifest = AWAIT BUILD_PACKAGE_MANIFEST({ bookmarks, storageIndex, configuration.safeConfiguration }, artifacts, configuration.excludedKeys, checksum)
 *   - RETURN package
 *
 * ## VALIDATE_LIBRARY_PACKAGE
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: fail closed on malformed versions, duplicate identities, unsafe paths, bad checksums, unsupported backends, secrets, and size limits before restore planning.
 * - Contract:
 *   - INPUT: package, checksum function, supported schema versions, supported backends, size limits
 *   - PRE: package is untrusted input
 *   - OUTPUT: validated package | { error: MalformedManifest | UnsupportedVersion | DuplicateIdentity | UnsafePath | ChecksumMismatch | SecretPresent | UnsupportedBackend | PackageTooLarge }
 *   - POST:
 *     - success => every manifest entry is safe, unique, bounded, and checksum verified; no secret is present
 *     - error => no target source is mutated
 *   - FAILURE_MODES: MalformedManifest, UnsupportedVersion, DuplicateIdentity, UnsafePath, ChecksumMismatch, SecretPresent, UnsupportedBackend, PackageTooLarge
 *   - EFFECTS: pure, IO, Async
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_LIBRARY_PACKAGE
 *   - IF manifest is absent or schemaVersion unsupported: RETURN MalformedManifest or UnsupportedVersion
 *   - IF package size exceeds limit: RETURN PackageTooLarge
 *   - FOR entry IN manifest.entries:
 *     - safePath = NORMALIZE_PACKAGE_PATH(entry.path); IF safePath is error: RETURN safePath
 *     - IF identity already seen: RETURN DuplicateIdentity
 *     - IF entry.backend is unsupported: RETURN UnsupportedBackend
 *     - actualChecksum = AWAIT checksum(package.artifacts[entry.path]); IF actualChecksum differs: RETURN ChecksumMismatch
 *   - IF package contains secret keys: RETURN SecretPresent
 *   - RETURN package
 *
 * ## PLAN_LIBRARY_RESTORE
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: produce a no-write report for migration, conflicts, artifacts, target paths, quotas, and derived-index rebuild.
 * - Contract:
 *   - INPUT: validated package, current library snapshot, conflict policy, target backend/path map, quota state
 *   - PRE: package passed VALIDATE_LIBRARY_PACKAGE; target File path is explicit when File artifacts are restored
 *   - OUTPUT: restore plan | { error: MissingTargetPath | ConflictPolicyRequired | QuotaExceeded | UnsupportedBackend }
 *   - POST:
 *     - success => plan lists every action, conflict, migration, artifact verification, and rollback boundary; no source is changed
 *     - error => no source is changed
 *   - FAILURE_MODES: MissingTargetPath, ConflictPolicyRequired, QuotaExceeded, UnsupportedBackend
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: PLAN_LIBRARY_RESTORE
 *   - IF File artifacts exist and target path map lacks File target: RETURN MissingTargetPath
 *   - conflicts = compare package identities with current snapshot
 *   - IF conflicts exist and policy is absent: RETURN ConflictPolicyRequired
 *   - quota = estimateRestoreSize(package, target paths); IF quota exceeds available: RETURN QuotaExceeded
 *   - actions = plan migrations, metadata writes, artifact writes, and derived archive-search rebuild
 *   - RETURN { actions, conflicts, migrations, warnings: excludedKeys, quota, rollback: backupBeforeRewrite }
 *
 * ## EXECUTE_LIBRARY_RESTORE
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: apply a validated plan with backup-before-rewrite, per-entry verification, atomic boundaries, and explicit partial outcomes.
 * - Contract:
 *   - INPUT: validated package, restore plan, adapters, backup store, conflict policy
 *   - PRE: plan came from PLAN_LIBRARY_RESTORE and all required targets are confirmed
 *   - OUTPUT: { success: true, restored, skipped, warnings } | { success: false, restored, failed, rollback }
 *   - POST:
 *     - success => restored records and artifacts verify against package checksums; derived archive search is rebuilt
 *     - failure => prior state is restored when possible or rollback outcome explicitly reports retained partial state
 *   - FAILURE_MODES: BackupFailed, WriteFailed, VerificationFailed, RebuildFailed, PartialRestore
 *   - DATA: target library state, backup state, restore report
 *   - DATA_TRANSITION: target changes only after backup; each successful write is verified; failure enters compensation
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: EXECUTE_LIBRARY_RESTORE
 *   - backup = AWAIT backupStore.create(current target state); IF backup fails: RETURN BackupFailed
 *   - FOR action IN plan.actions IN dependency order:
 *     - result = AWAIT applyRestoreAction(action, conflictPolicy, adapters)
 *     - IF result fails: RETURN COMPENSATE_LIBRARY_RESTORE(backup, restored actions, result)
 *     - verification = AWAIT verifyRestoreAction(action, package manifest)
 *     - IF verification fails: RETURN COMPENSATE_LIBRARY_RESTORE(backup, restored actions, VerificationFailed)
 *   - rebuild = AWAIT rebuildArchiveContentSearchFromDurableArtifacts()
 *   - IF rebuild fails: RETURN COMPENSATE_LIBRARY_RESTORE(backup, restored actions, RebuildFailed)
 *   - RETURN { success: true, restored, skipped, warnings: package.manifest.excludedKeys }
 *
 * ## COMPENSATE_LIBRARY_RESTORE
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: restore the pre-import backup after an interrupted or failed package write and report whether compensation completed.
 * - Contract:
 *   - INPUT: backup, restored actions, failure
 *   - PRE: backup was created before the first mutation
 *   - OUTPUT: { success: false, rollback: restored | failed, failed }
 *   - POST:
 *     - rollback restored => target matches the backup snapshot
 *     - rollback failed => retained partial state is explicit and no success is claimed
 *   - FAILURE_MODES: RollbackFailed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: COMPENSATE_LIBRARY_RESTORE
 *   - rollback = AWAIT restoreBackup(backup)
 *   - IF rollback fails: RETURN { success: false, rollback: failed, failed: [failure, RollbackFailed] }
 *   - RETURN { success: false, rollback: restored, failed: [failure] }
 *
 * ## LIBRARY_PORTABILITY_MESSAGE
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: expose export, dry-run planning, and restore operations through thin message/UI bindings without changing existing CSV, HTML, or config controls.
 * - Contract:
 *   - INPUT: package operation message and operation-specific data
 *   - PRE: message handler has the portability service and response channel
 *   - OUTPUT: package, dry-run plan, or restore report
 *   - POST: one response is returned and UI status distinguishes pending, success, warning, and failure
 *   - FAILURE_MODES: InvalidPackage, PlanFailed, RestoreFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LIBRARY_PORTABILITY_MESSAGE
 *   - IF operation = export: RETURN AWAIT COLLECT_LIBRARY_PACKAGE()
 *   - IF operation = plan: validated = VALIDATE_LIBRARY_PACKAGE(input.package); RETURN PLAN_LIBRARY_RESTORE(validated, input.current, input.policy, input.targets)
 *   - IF operation = restore: validated = VALIDATE_LIBRARY_PACKAGE(input.package); plan = PLAN_LIBRARY_RESTORE(validated, input.current, input.policy, input.targets); RETURN EXECUTE_LIBRARY_RESTORE(validated, plan, input.adapters, input.backupStore, input.policy)
 */

const DEFAULT_LIMITS = Object.freeze({
  maxBytes: 50 * 1024 * 1024,
  maxEntries: 10000
})

const SECRET_KEY = /(secret|token|password|credential|api.?key|private.?key)/i
const SUPPORTED_BACKENDS = new Set(['local', 'file'])

function encodeText (value) {
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(value)
  const encoded = encodeURIComponent(value)
  const bytes = []
  for (let index = 0; index < encoded.length;) {
    if (encoded[index] === '%') {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16))
      index += 3
    } else {
      bytes.push(encoded.charCodeAt(index++))
    }
  }
  return new Uint8Array(bytes)
}

function decodeText (bytes) {
  if (typeof TextDecoder === 'function') return new TextDecoder().decode(bytes)
  return decodeURIComponent([...bytes].map(byte => `%${byte.toString(16).padStart(2, '0')}`).join(''))
}

function toBytes (value) {
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (Array.isArray(value)) return new Uint8Array(value)
  return encodeText(String(value ?? ''))
}

function stableValue (value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
  }
  return value
}

function serialize (value) {
  return JSON.stringify(stableValue(value))
}

async function defaultChecksum (bytes) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 unavailable')
  const digest = await globalThis.crypto.subtle.digest('SHA-256', toBytes(bytes))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Accept only safe relative paths so package artifacts cannot escape the package root.
 */
export function normalizePackagePath (candidate) {
  if (typeof candidate !== 'string' || !candidate.trim()) return { error: 'UnsafePath' }
  const path = candidate.replaceAll('\\', '/')
  if (path.startsWith('/') || /^[A-Za-z]:\//.test(path)) return { error: 'UnsafePath' }
  const segments = path.split('/')
  if (segments.some(segment => segment === '..' || segment === '')) return { error: 'UnsafePath' }
  const normalized = segments.filter(segment => segment !== '.').join('/')
  return normalized || { error: 'UnsafePath' }
}

/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Apply an allowlist and report excluded configuration without copying secrets.
 */
export function filterNonSecretConfiguration (configuration = {}, allowlistedKeys = []) {
  const safeConfiguration = {}
  const excludedKeys = []
  const allowed = new Set(allowlistedKeys)
  for (const key of Object.keys(configuration || {})) {
    if (allowed.has(key) && !SECRET_KEY.test(key)) safeConfiguration[key] = configuration[key]
    else excludedKeys.push(key)
  }
  excludedKeys.sort()
  return { safeConfiguration, excludedKeys }
}

function metadataEntries (metadata, safeConfiguration) {
  return [
    { path: 'metadata/bookmarks.json', identity: 'metadata:bookmarks', bytes: serialize(metadata.bookmarks || []) },
    { path: 'metadata/configuration.json', identity: 'metadata:configuration', bytes: serialize(safeConfiguration || {}) },
    { path: 'metadata/storage-index.json', identity: 'metadata:storage-index', bytes: serialize(metadata.storageIndex || {}) }
  ]
}

/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Build sorted manifest entries and checksums without mutating source state.
 */
export async function buildPackageManifest ({
  metadata = {},
  artifacts = [],
  safeConfiguration = metadata.configuration || {},
  excludedKeys = []
} = {}, {
  checksum = defaultChecksum,
  limits = DEFAULT_LIMITS
} = {}) {
  const entries = metadataEntries(metadata, safeConfiguration)
  const packageArtifacts = {}
  for (const artifact of artifacts) {
    const path = normalizePackagePath(artifact.path)
    if (path.error) return path
    const bytes = toBytes(artifact.bytes)
    packageArtifacts[path] = bytes
    entries.push({
      path,
      kind: 'artifact',
      backend: artifact.backend,
      identity: artifact.identity || `${artifact.backend || 'unknown'}:${path}`,
      bytes
    })
  }

  const totalBytes = entries.reduce((total, entry) => total + toBytes(entry.bytes).byteLength, 0)
  if (entries.length > limits.maxEntries || totalBytes > limits.maxBytes) {
    return { error: 'PackageTooLarge' }
  }

  const manifestEntries = []
  for (const entry of entries) {
    const bytes = toBytes(entry.bytes)
    try {
      manifestEntries.push({
        path: entry.path,
        kind: entry.kind || 'metadata',
        ...(entry.backend ? { backend: entry.backend } : {}),
        identity: entry.identity || entry.path,
        size: bytes.byteLength,
        sha256: await checksum(bytes)
      })
    } catch {
      return { error: 'ChecksumFailed' }
    }
  }
  manifestEntries.sort((left, right) => (
    left.kind.localeCompare(right.kind) || left.path.localeCompare(right.path)
  ))
  return {
    manifest: {
      schemaVersion: 1,
      packageVersion: 1,
      entries: manifestEntries,
      excludedKeys: [...excludedKeys].sort()
    },
    artifacts: {
      ...Object.fromEntries(
        metadataEntries(metadata, safeConfiguration).map(entry => [entry.path, [...toBytes(entry.bytes)]])
      ),
      ...Object.fromEntries(Object.entries(packageArtifacts).map(([path, bytes]) => [path, [...bytes]]))
    }
  }
}

function walkKeys (value, prefix = '') {
  const keys = []
  if (!value || typeof value !== 'object') return keys
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    keys.push(fullKey)
    keys.push(...walkKeys(child, fullKey))
  }
  return keys
}

/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Fail closed on malformed manifests, unsafe paths, unsupported backends, secrets, and checksum drift.
 */
export async function validateLibraryPackage (packageValue, {
  checksum = defaultChecksum,
  limits = DEFAULT_LIMITS,
  supportedVersions = [1]
} = {}) {
  const manifest = packageValue?.manifest
  if (!manifest || !Array.isArray(manifest.entries)) return { error: 'MalformedManifest' }
  if (!supportedVersions.includes(manifest.schemaVersion) ||
      !supportedVersions.includes(manifest.packageVersion)) {
    return { error: 'UnsupportedVersion' }
  }
  if (manifest.entries.length > limits.maxEntries) return { error: 'PackageTooLarge' }
  const seenIdentities = new Set()
  let totalBytes = 0
  for (const entry of manifest.entries) {
    const safePath = normalizePackagePath(entry.path)
    if (safePath.error) return safePath
    if (safePath !== entry.path) return { error: 'UnsafePath' }
    const identity = `${entry.backend || ''}:${entry.identity || entry.path}`
    if (seenIdentities.has(identity)) return { error: 'DuplicateIdentity' }
    seenIdentities.add(identity)
    if (entry.backend && !SUPPORTED_BACKENDS.has(entry.backend)) return { error: 'UnsupportedBackend' }
    const bytes = packageValue.artifacts?.[entry.path]
    if (bytes == null) return { error: 'MalformedManifest' }
    const actualBytes = toBytes(bytes)
    totalBytes += actualBytes.byteLength
    if (actualBytes.byteLength !== entry.size) return { error: 'ChecksumMismatch' }
    try {
      if (await checksum(actualBytes) !== entry.sha256) return { error: 'ChecksumMismatch' }
    } catch {
      return { error: 'ChecksumMismatch' }
    }
  }
  if (totalBytes > limits.maxBytes) return { error: 'PackageTooLarge' }
  const configurationBytes = packageValue.artifacts?.['metadata/configuration.json']
  if (configurationBytes != null) {
    try {
      const configuration = JSON.parse(decodeText(toBytes(configurationBytes)))
      if (walkKeys(configuration).some(key => SECRET_KEY.test(key))) return { error: 'SecretPresent' }
    } catch {
      return { error: 'MalformedManifest' }
    }
  }
  return packageValue
}

/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Produce a no-write restore plan with target-path, conflict, quota, and rebuild actions.
 */
export function planLibraryRestore (packageValue, {
  current = {},
  targets = {},
  conflictPolicy = null,
  availableBytes = Number.POSITIVE_INFINITY
} = {}) {
  if (packageValue?.error) return packageValue
  const entries = packageValue?.manifest?.entries
  if (!Array.isArray(entries)) return { error: 'MalformedManifest' }
  if (entries.some(entry => entry.backend === 'file') && !targets.file) {
    return { error: 'MissingTargetPath' }
  }
  const conflicts = entries
    .filter(entry => current.identities?.includes?.(entry.identity))
    .map(entry => entry.identity)
  if (conflicts.length && !conflictPolicy) return { error: 'ConflictPolicyRequired' }
  const restoreBytes = entries.reduce((total, entry) => total + Number(entry.size || 0), 0)
  if (restoreBytes > availableBytes) return { error: 'QuotaExceeded' }
  return {
    actions: entries.map(entry => ({
      type: entry.kind === 'artifact' ? 'writeArtifact' : 'writeMetadata',
      path: entry.path,
      entry
    })),
    conflicts,
    migrations: [],
    warnings: packageValue.manifest.excludedKeys || [],
    quota: { restoreBytes, availableBytes },
    rollback: 'backupBeforeRewrite'
  }
}

async function compensate (backupStore, backup, failure) {
  try {
    await backupStore.restore(backup)
    return {
      success: false,
      rollback: 'restored',
      failed: [failure]
    }
  } catch {
    return {
      success: false,
      rollback: 'failed',
      failed: [failure, 'RollbackFailed']
    }
  }
}

/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Backup, apply, verify, rebuild, and compensate restore operations with explicit outcomes.
 */
export async function executeLibraryRestore ({
  package: packageValue,
  plan,
  currentState = {},
  backupStore,
  applyRestoreAction,
  verifyRestoreAction = async () => true,
  rebuildArchiveContentSearch = async () => true
} = {}) {
  if (!packageValue || !plan?.actions || !backupStore?.create || !backupStore?.restore) {
    return { success: false, failed: ['InvalidRestoreRequest'] }
  }
  let backup
  try {
    backup = await backupStore.create(currentState)
  } catch {
    return { success: false, failed: ['BackupFailed'] }
  }

  const restored = []
  for (const action of plan.actions) {
    try {
      if (typeof applyRestoreAction !== 'function') throw new Error('write unavailable')
      await applyRestoreAction(action, packageValue)
      if (!await verifyRestoreAction(action, packageValue)) throw new Error('verification failed')
      restored.push(action.path)
    } catch (error) {
      const failure = error.message === 'verification failed' ? 'VerificationFailed' : 'WriteFailed'
      return compensate(backupStore, backup, failure)
    }
  }

  try {
    if (!await rebuildArchiveContentSearch(packageValue)) throw new Error('rebuild failed')
  } catch {
    return compensate(backupStore, backup, 'RebuildFailed')
  }
  return {
    success: true,
    restored,
    skipped: [],
    warnings: packageValue.manifest.excludedKeys || []
  }
}

/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Compose existing library readers with the package primitives while keeping configuration secrets out.
 */
export class LibraryPortabilityService {
  constructor ({
    bookmarkReader = null,
    storageIndexReader = null,
    configReader = null,
    archiveReader = null,
    screenshotReader = null,
    allowlistedConfigurationKeys = ['settings', 'inhibitUrls'],
    checksum = defaultChecksum,
    limits = DEFAULT_LIMITS,
    currentStateReader = async () => ({}),
    backupStore = null,
    applyRestoreAction = null,
    verifyRestoreAction,
    rebuildArchiveContentSearch
  } = {}) {
    this.bookmarkReader = bookmarkReader
    this.storageIndexReader = storageIndexReader
    this.configReader = configReader
    this.archiveReader = archiveReader
    this.screenshotReader = screenshotReader
    this.allowlistedConfigurationKeys = allowlistedConfigurationKeys
    this.checksum = checksum
    this.limits = limits
    this.currentStateReader = currentStateReader
    this.backupStore = backupStore
    this.applyRestoreAction = applyRestoreAction
    this.verifyRestoreAction = verifyRestoreAction
    this.rebuildArchiveContentSearch = rebuildArchiveContentSearch
  }

  async export () {
    const bookmarks = this.bookmarkReader?.getAllBookmarksForIndex
      ? await this.bookmarkReader.getAllBookmarksForIndex()
      : await this.bookmarkReader?.getAllBookmarks?.() || []
    const storageIndex = await this.storageIndexReader?.getIndex?.() || {}
    const rawConfiguration = await this.configReader?.exportConfig?.() || {}
    const { safeConfiguration, excludedKeys } = filterNonSecretConfiguration(
      rawConfiguration,
      this.allowlistedConfigurationKeys
    )
    const archives = await this.archiveReader?.listArchives?.() || []
    const screenshots = await this.screenshotReader?.listScreenshots?.() || []
    const artifacts = [
      ...archives.map(archive => ({
        path: `archives/${archive.storage || 'local'}/${encodeURIComponent(archive.archiveId || archive.url)}.json`,
        backend: archive.storage || 'local',
        identity: archive.archiveId || archive.url,
        bytes: serialize(archive)
      })),
      ...screenshots.map(screenshot => ({
        path: `screenshots/${screenshot.storage || 'local'}/${encodeURIComponent(screenshot.artifactId || screenshot.url)}.json`,
        backend: screenshot.storage || 'local',
        identity: screenshot.artifactId || screenshot.url,
        bytes: serialize(screenshot)
      }))
    ]
    return buildPackageManifest({
      metadata: { bookmarks, storageIndex },
      safeConfiguration,
      artifacts,
      excludedKeys
    }, {
      checksum: this.checksum,
      limits: this.limits
    })
  }

  async plan (data = {}) {
    const validated = await validateLibraryPackage(data.package, {
      checksum: this.checksum,
      limits: this.limits
    })
    return planLibraryRestore(validated, {
      current: data.current || await this.currentStateReader(),
      targets: data.targets || {},
      conflictPolicy: data.conflictPolicy,
      availableBytes: data.availableBytes
    })
  }

  async restore (data = {}) {
    const validated = await validateLibraryPackage(data.package, {
      checksum: this.checksum,
      limits: this.limits
    })
    if (validated?.error) return validated
    const plan = planLibraryRestore(validated, {
      current: data.current || await this.currentStateReader(),
      targets: data.targets || {},
      conflictPolicy: data.conflictPolicy,
      availableBytes: data.availableBytes
    })
    if (plan.error) return plan
    return executeLibraryRestore({
      package: validated,
      plan,
      currentState: data.current || await this.currentStateReader(),
      backupStore: data.backupStore || this.backupStore,
      applyRestoreAction: data.applyRestoreAction || this.applyRestoreAction,
      verifyRestoreAction: data.verifyRestoreAction || this.verifyRestoreAction,
      rebuildArchiveContentSearch: data.rebuildArchiveContentSearch || this.rebuildArchiveContentSearch
    })
  }
}

export { DEFAULT_LIMITS, SECRET_KEY, SUPPORTED_BACKENDS }
