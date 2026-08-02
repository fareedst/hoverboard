/**
 * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
 * Unit tests for non-secret, lossless library package export and restore.
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
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: apply an allowlist and report excluded secrets without copying them.
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
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: build deterministic schema-versioned entries with sizes and checksums.
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
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: collect non-secret metadata and durable archive/screenshot artifacts without mutating sources.
 * - Contract:
 *   - INPUT: BookmarkRouter/Index readers, archive and screenshot readers, ConfigManager, checksum function
 *   - PRE: all readers are read-only; File storage target is readable when configured
 *   - OUTPUT: portable package | { error: SourceUnavailable | StorageFailed | ChecksumFailed | UnsafePath | PackageTooLarge }
 *   - POST:
 *     - success => package contains non-secret library state and durable Local/File artifacts with complete manifest
 *     - error => source state is unchanged
 *   - FAILURE_MODES: SourceUnavailable, StorageFailed, ChecksumFailed, UnsafePath, PackageTooLarge
 *   - DATA: source snapshots and package entries
 *   - DATA_TRANSITION: no source mutation
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
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: fail closed on malformed versions, duplicate identities, unsafe paths, bad checksums, unsupported backends, secrets, and size limits.
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
 * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: produce a no-write report for conflicts, target paths, quotas, actions, and rebuild.
 * - Contract:
 *   - INPUT: validated package, current library snapshot, conflict policy, target backend/path map, quota state
 *   - PRE: package passed validation; File target is explicit
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
 *   - DATA_TRANSITION: target changes only after backup
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
import {
  normalizePackagePath,
  filterNonSecretConfiguration,
  buildPackageManifest,
  validateLibraryPackage,
  planLibraryRestore,
  executeLibraryRestore
} from '../../src/features/portability/library-package.js'

const toBytes = value => new Uint8Array([...String(value)].map(character => character.charCodeAt(0)))
const checksum = async bytes => `sum:${String.fromCharCode(...bytes)}`

describe('[REQ-LIBRARY_PORTABILITY] portable library package', () => {
  test('rejects absolute and traversal artifact paths', () => {
    expect(normalizePackagePath('../secret.txt')).toEqual({ error: 'UnsafePath' })
    expect(normalizePackagePath('/tmp/archive.html')).toEqual({ error: 'UnsafePath' })
    expect(normalizePackagePath('C:\\tmp\\archive.html')).toEqual({ error: 'UnsafePath' })
    expect(normalizePackagePath('archives//archive.html')).toEqual({ error: 'UnsafePath' })
    expect(normalizePackagePath('archives/page.html')).toBe('archives/page.html')
  })

  test('exports only allowlisted configuration and reports excluded keys', () => {
    expect(filterNonSecretConfiguration(
      {
        theme: 'dark',
        storageMode: 'local',
        hoverboard_auth_token: 'secret',
        apiKey: 'secret'
      },
      ['theme', 'storageMode']
    )).toEqual({
      safeConfiguration: { theme: 'dark', storageMode: 'local' },
      excludedKeys: ['apiKey', 'hoverboard_auth_token']
    })
  })

  test('builds deterministic checksummed entries for metadata and artifacts', async () => {
    const result = await buildPackageManifest({
      metadata: {
        bookmarks: [{ url: 'https://example.test', title: 'Example' }],
        configuration: { theme: 'dark' }
      },
      artifacts: [{
        path: 'archives/example.html',
        backend: 'local',
        identity: 'archive-1',
        bytes: '<article>saved</article>'
      }],
      excludedKeys: ['hoverboard_auth_token']
    }, { checksum })

    expect(result.manifest).toMatchObject({
      schemaVersion: 1,
      packageVersion: 1,
      excludedKeys: ['hoverboard_auth_token']
    })
    expect(result.manifest.entries.map(entry => entry.path)).toEqual([
      'archives/example.html',
      'metadata/bookmarks.json',
      'metadata/configuration.json',
      'metadata/storage-index.json'
    ])
    expect(result.manifest.entries[0]).toMatchObject({
      backend: 'local',
      identity: 'archive-1',
      sha256: 'sum:<article>saved</article>'
    })
  })

  test('fails export when checksumming fails or package limits are exceeded', async () => {
    await expect(buildPackageManifest({
      metadata: { bookmarks: [] }
    }, {
      checksum: jest.fn().mockRejectedValue(new Error('crypto unavailable'))
    })).resolves.toEqual({ error: 'ChecksumFailed' })

    await expect(buildPackageManifest({
      metadata: { bookmarks: [] },
      artifacts: [{ path: 'archives/large', bytes: 'saved' }]
    }, {
      checksum,
      limits: { maxBytes: 1, maxEntries: 100 }
    })).resolves.toEqual({ error: 'PackageTooLarge' })
  })

  test('fails closed when a package checksum or path is unsafe', async () => {
    const built = await buildPackageManifest({
      metadata: { bookmarks: [] },
      artifacts: [{
        path: 'archives/example.html',
        bytes: 'saved'
      }]
    }, { checksum })

    built.artifacts['archives/example.html'] = toBytes('tampered')
    expect(await validateLibraryPackage(built, { checksum })).toEqual({
      error: 'ChecksumMismatch'
    })

    built.artifacts['archives/example.html'] = toBytes('saved')
    built.manifest.entries[0].path = '../escape'
    expect(await validateLibraryPackage(built, { checksum })).toEqual({
      error: 'UnsafePath'
    })
  })

  test('rejects malformed, unsupported, duplicate, backend, and secret packages', async () => {
    expect(await validateLibraryPackage({}, { checksum })).toEqual({ error: 'MalformedManifest' })
    expect(await validateLibraryPackage({
      manifest: { schemaVersion: 2, packageVersion: 1, entries: [] }
    }, { checksum })).toEqual({ error: 'UnsupportedVersion' })

    const duplicate = await buildPackageManifest({
      metadata: { bookmarks: [] },
      artifacts: [
        { path: 'archives/a', backend: 'local', identity: 'duplicate', bytes: 'a' },
        { path: 'archives/b', backend: 'local', identity: 'duplicate', bytes: 'b' }
      ]
    }, { checksum })
    expect(await validateLibraryPackage(duplicate, { checksum })).toEqual({ error: 'DuplicateIdentity' })

    const unsupportedBackend = await buildPackageManifest({
      metadata: { bookmarks: [] },
      artifacts: [{ path: 'archives/remote', backend: 'remote', bytes: 'a' }]
    }, { checksum })
    expect(await validateLibraryPackage(unsupportedBackend, { checksum })).toEqual({ error: 'UnsupportedBackend' })

    const secretPackage = await buildPackageManifest({
      metadata: { bookmarks: [] },
      safeConfiguration: { nested: { apiKey: 'must reject' } }
    }, { checksum })
    expect(await validateLibraryPackage(secretPackage, { checksum })).toEqual({ error: 'SecretPresent' })
  })

  test('plans restore without writes and requires an explicit File target', async () => {
    const built = await buildPackageManifest({
      metadata: { bookmarks: [] },
      artifacts: [{
        path: 'archives/file-copy.html',
        backend: 'file',
        bytes: 'saved'
      }]
    }, { checksum })
    const validated = await validateLibraryPackage(built, { checksum })

    expect(planLibraryRestore(validated, {
      current: { bookmarks: [] },
      targets: {}
    })).toEqual({ error: 'MissingTargetPath' })

    const plan = planLibraryRestore(validated, {
      current: { bookmarks: [] },
      targets: { file: '/safe/target' },
      conflictPolicy: 'replace'
    })
    expect(plan).toMatchObject({ actions: expect.any(Array) })
    expect(plan.writesPerformed).toBeUndefined()
  })

  test('plans conflicts and quota failures before any restore write', async () => {
    const built = await buildPackageManifest({
      metadata: { bookmarks: [] }
    }, { checksum })
    const validated = await validateLibraryPackage(built, { checksum })

    expect(planLibraryRestore(validated, {
      current: { identities: ['metadata:bookmarks'] },
      conflictPolicy: null
    })).toEqual({ error: 'ConflictPolicyRequired' })
    expect(planLibraryRestore(validated, {
      current: { identities: [] },
      conflictPolicy: 'replace',
      availableBytes: 0
    })).toEqual({ error: 'QuotaExceeded' })
  })

  test('backs up before restore and compensates a failed write', async () => {
    const events = []
    const result = await executeLibraryRestore({
      package: { manifest: { excludedKeys: [] } },
      plan: { actions: [{ type: 'writeArtifact', path: 'archives/a', bytes: 'a' }] },
      currentState: { bookmarks: ['before'] },
      backupStore: {
        async create () {
          events.push('backup')
          return { snapshot: { bookmarks: ['before'] } }
        },
        async restore () {
          events.push('rollback')
        }
      },
      async applyRestoreAction () {
        events.push('write')
        throw new Error('disk full')
      }
    })

    expect(result).toMatchObject({
      success: false,
      rollback: 'restored',
      failed: expect.arrayContaining(['WriteFailed'])
    })
    expect(events).toEqual(['backup', 'write', 'rollback'])
  })

  test('compensates verification and rebuild failures, including rollback failure', async () => {
    const events = []
    const packageValue = { manifest: { excludedKeys: [] } }
    const plan = { actions: [{ type: 'writeMetadata', path: 'metadata/bookmarks.json' }] }
    const backupStore = {
      async create () {
        events.push('backup')
        return { snapshot: true }
      },
      async restore () {
        events.push('rollback')
      }
    }
    const verificationFailure = await executeLibraryRestore({
      package: packageValue,
      plan,
      backupStore,
      applyRestoreAction: async () => events.push('write'),
      verifyRestoreAction: async () => false
    })
    expect(verificationFailure).toMatchObject({
      success: false,
      rollback: 'restored',
      failed: expect.arrayContaining(['VerificationFailed'])
    })

    const rebuildFailure = await executeLibraryRestore({
      package: packageValue,
      plan,
      backupStore,
      applyRestoreAction: async () => {},
      rebuildArchiveContentSearch: async () => false
    })
    expect(rebuildFailure).toMatchObject({
      success: false,
      rollback: 'restored',
      failed: expect.arrayContaining(['RebuildFailed'])
    })

    const rollbackFailure = await executeLibraryRestore({
      package: packageValue,
      plan,
      backupStore: {
        async create () {
          return {}
        },
        async restore () {
          throw new Error('rollback unavailable')
        }
      },
      applyRestoreAction: async () => {
        throw new Error('write unavailable')
      }
    })
    expect(rollbackFailure).toMatchObject({
      success: false,
      rollback: 'failed',
      failed: expect.arrayContaining(['WriteFailed', 'RollbackFailed'])
    })
  })

  test('reports a backup failure before any mutation', async () => {
    const applyRestoreAction = jest.fn()
    const result = await executeLibraryRestore({
      package: { manifest: { excludedKeys: [] } },
      plan: { actions: [] },
      backupStore: {
        async create () {
          throw new Error('backup unavailable')
        },
        async restore () {}
      },
      applyRestoreAction
    })

    expect(result).toEqual({ success: false, failed: ['BackupFailed'] })
    expect(applyRestoreAction).not.toHaveBeenCalled()
  })
})
