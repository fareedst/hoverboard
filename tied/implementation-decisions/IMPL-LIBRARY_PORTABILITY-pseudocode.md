# [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
# Export and restore a versioned, checksummed package for lossless non-secret library state and durable artifacts.

## NORMALIZE_PACKAGE_PATH
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: accept only safe relative artifact paths and reject traversal or machine-specific absolute paths.
- Contract:
  - INPUT: candidate artifact path
  - PRE: path is supplied as package metadata
  - OUTPUT: normalized relative path | { error: UnsafePath }
  - POST:
    - success => path is relative, normalized, and contains no traversal segment
    - error => artifact is not addressable for export or restore
  - FAILURE_MODES: UnsafePath
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: NORMALIZE_PACKAGE_PATH
  - IF path is empty, absolute, or contains a traversal segment: RETURN UnsafePath
  - normalized = normalizeRelativePath(path)
  - IF normalized escapes package root: RETURN UnsafePath
  - RETURN normalized

## FILTER_NON_SECRET_CONFIGURATION
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: apply an allowlist to configuration and explicitly report excluded secrets rather than exporting them.
- Contract:
  - INPUT: configuration object, allowlisted keys
  - PRE: configuration may contain credentials, API keys, or machine-specific paths
  - OUTPUT: { safeConfiguration, excludedKeys }
  - POST:
    - success => safeConfiguration contains no secret key; excludedKeys identifies each excluded secret
    - error => no configuration is exported
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: FILTER_NON_SECRET_CONFIGURATION
  - safeConfiguration = {}
  - excludedKeys = []
  - FOR each key IN allowlisted keys: IF configuration has key: copy key to safeConfiguration
  - FOR each key IN configuration: IF key is secret or not allowlisted: append key to excludedKeys
  - RETURN { safeConfiguration, excludedKeys }

## BUILD_PACKAGE_MANIFEST
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: build deterministic schema-versioned manifest entries with safe paths, sizes, and checksums.
- Contract:
  - INPUT: package metadata records, binary artifact records, safe configuration, checksum function
  - PRE: every artifact has a safe relative path and checksum function is available
  - OUTPUT: { manifest, artifacts }
  - POST:
    - success => manifest entries are sorted by kind then path; each entry has size and checksum
    - error => package is not emitted
  - FAILURE_MODES: UnsafePath, ChecksumFailed, PackageTooLarge
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: BUILD_PACKAGE_MANIFEST
  - entries = serialize metadata records as deterministic entries
  - FOR artifact IN binary artifacts: path = NORMALIZE_PACKAGE_PATH(artifact.path); IF path is error: RETURN path; append artifact entry with checksum
  - FOR entry IN entries: entry.sha256 = AWAIT checksum(entry.bytes); IF checksum fails: RETURN ChecksumFailed
  - SORT entries BY kind ASCENDING, path ASCENDING
  - IF total entry bytes exceed package limit: RETURN PackageTooLarge
  - RETURN { manifest: { schemaVersion: 1, packageVersion: 1, entries, excludedKeys }, artifacts }

## COLLECT_LIBRARY_PACKAGE
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: collect bookmark, tag, storage index, safe configuration, archive, and screenshot state without mutating any source.
- Contract:
  - INPUT: BookmarkRouter/Index readers, archive and screenshot readers, ConfigManager, checksum function
  - PRE: all readers are read-only; File storage target is readable when configured
  - OUTPUT: portable package | { error: SourceUnavailable | StorageFailed | ChecksumFailed | UnsafePath | PackageTooLarge }
  - POST:
    - success => package contains non-secret library state and durable Local/File artifacts with complete manifest
    - error => source state is unchanged
  - FAILURE_MODES: SourceUnavailable, StorageFailed, ChecksumFailed, UnsafePath, PackageTooLarge
  - DATA: source snapshots and package entries
  - DATA_TRANSITION: no source mutation; package exists only as a new export value
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: COLLECT_LIBRARY_PACKAGE
  - bookmarks = AWAIT router.getAllBookmarksForIndex()
  - storageIndex = AWAIT storageIndexReader.getIndex()
  - configuration = FILTER_NON_SECRET_CONFIGURATION(AWAIT configReader.exportConfig(), allowlistedKeys)
  - archives = AWAIT archiveReader.listArchives(local and file)
  - screenshots = AWAIT screenshotReader.listScreenshots(local and file)
  - artifacts = encode archives and screenshots as separate entries with backend-scoped identity
  - manifest = AWAIT BUILD_PACKAGE_MANIFEST({ bookmarks, storageIndex, configuration.safeConfiguration }, artifacts, configuration.excludedKeys, checksum)
  - RETURN package

## VALIDATE_LIBRARY_PACKAGE
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: fail closed on malformed versions, duplicate identities, unsafe paths, bad checksums, unsupported backends, secrets, and size limits before restore planning.
- Contract:
  - INPUT: package, checksum function, supported schema versions, supported backends, size limits
  - PRE: package is untrusted input
  - OUTPUT: validated package | { error: MalformedManifest | UnsupportedVersion | DuplicateIdentity | UnsafePath | ChecksumMismatch | SecretPresent | UnsupportedBackend | PackageTooLarge }
  - POST:
    - success => every manifest entry is safe, unique, bounded, and checksum verified; no secret is present
    - error => no target source is mutated
  - FAILURE_MODES: MalformedManifest, UnsupportedVersion, DuplicateIdentity, UnsafePath, ChecksumMismatch, SecretPresent, UnsupportedBackend, PackageTooLarge
  - EFFECTS: pure, IO, Async
  - TERMINATION: total
- PROCEDURE: VALIDATE_LIBRARY_PACKAGE
  - IF manifest is absent or schemaVersion unsupported: RETURN MalformedManifest or UnsupportedVersion
  - IF package size exceeds limit: RETURN PackageTooLarge
  - FOR entry IN manifest.entries:
    - safePath = NORMALIZE_PACKAGE_PATH(entry.path); IF safePath is error: RETURN safePath
    - IF identity already seen: RETURN DuplicateIdentity
    - IF entry.backend is unsupported: RETURN UnsupportedBackend
    - actualChecksum = AWAIT checksum(package.artifacts[entry.path]); IF actualChecksum differs: RETURN ChecksumMismatch
  - IF package contains secret keys: RETURN SecretPresent
  - RETURN package

## PLAN_LIBRARY_RESTORE
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: produce a no-write report for migration, conflicts, artifacts, target paths, quotas, and derived-index rebuild.
- Contract:
  - INPUT: validated package, current library snapshot, conflict policy, target backend/path map, quota state
  - PRE: package passed VALIDATE_LIBRARY_PACKAGE; target File path is explicit when File artifacts are restored
  - OUTPUT: restore plan | { error: MissingTargetPath | ConflictPolicyRequired | QuotaExceeded | UnsupportedBackend }
  - POST:
    - success => plan lists every action, conflict, migration, artifact verification, and rollback boundary; no source is changed
    - error => no source is changed
  - FAILURE_MODES: MissingTargetPath, ConflictPolicyRequired, QuotaExceeded, UnsupportedBackend
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: PLAN_LIBRARY_RESTORE
  - IF File artifacts exist and target path map lacks File target: RETURN MissingTargetPath
  - conflicts = compare package identities with current snapshot
  - IF conflicts exist and policy is absent: RETURN ConflictPolicyRequired
  - quota = estimateRestoreSize(package, target paths); IF quota exceeds available: RETURN QuotaExceeded
  - actions = plan migrations, metadata writes, artifact writes, and derived archive-search rebuild
  - RETURN { actions, conflicts, migrations, warnings: excludedKeys, quota, rollback: backupBeforeRewrite }

## EXECUTE_LIBRARY_RESTORE
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: apply a validated plan with backup-before-rewrite, per-entry verification, atomic boundaries, and explicit partial outcomes.
- Contract:
  - INPUT: validated package, restore plan, adapters, backup store, conflict policy
  - PRE: plan came from PLAN_LIBRARY_RESTORE and all required targets are confirmed
  - OUTPUT: { success: true, restored, skipped, warnings } | { success: false, restored, failed, rollback }
  - POST:
    - success => restored records and artifacts verify against package checksums; derived archive search is rebuilt
    - failure => prior state is restored when possible or rollback outcome explicitly reports retained partial state
  - FAILURE_MODES: BackupFailed, WriteFailed, VerificationFailed, RebuildFailed, PartialRestore
  - DATA: target library state, backup state, restore report
  - DATA_TRANSITION: target changes only after backup; each successful write is verified; failure enters compensation
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: EXECUTE_LIBRARY_RESTORE
  - backup = AWAIT backupStore.create(current target state); IF backup fails: RETURN BackupFailed
  - FOR action IN plan.actions IN dependency order:
    - result = AWAIT applyRestoreAction(action, conflictPolicy, adapters)
    - IF result fails: RETURN COMPENSATE_LIBRARY_RESTORE(backup, restored actions, result)
    - verification = AWAIT verifyRestoreAction(action, package manifest)
    - IF verification fails: RETURN COMPENSATE_LIBRARY_RESTORE(backup, restored actions, VerificationFailed)
  - rebuild = AWAIT rebuildArchiveContentSearchFromDurableArtifacts()
  - IF rebuild fails: RETURN COMPENSATE_LIBRARY_RESTORE(backup, restored actions, RebuildFailed)
  - RETURN { success: true, restored, skipped, warnings: package.manifest.excludedKeys }

## COMPENSATE_LIBRARY_RESTORE
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: restore the pre-import backup after an interrupted or failed package write and report whether compensation completed.
- Contract:
  - INPUT: backup, restored actions, failure
  - PRE: backup was created before the first mutation
  - OUTPUT: { success: false, rollback: restored | failed, failed }
  - POST:
    - rollback restored => target matches the backup snapshot
    - rollback failed => retained partial state is explicit and no success is claimed
  - FAILURE_MODES: RollbackFailed
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: COMPENSATE_LIBRARY_RESTORE
  - rollback = AWAIT restoreBackup(backup)
  - IF rollback fails: RETURN { success: false, rollback: failed, failed: [failure, RollbackFailed] }
  - RETURN { success: false, rollback: restored, failed: [failure] }

## LIBRARY_PORTABILITY_MESSAGE
- [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: expose export, dry-run planning, and restore operations through thin message/UI bindings without changing existing CSV, HTML, or config controls.
- Contract:
  - INPUT: package operation message and operation-specific data
  - PRE: message handler has the portability service and response channel
  - OUTPUT: package, dry-run plan, or restore report
  - POST: one response is returned and UI status distinguishes pending, success, warning, and failure
  - FAILURE_MODES: InvalidPackage, PlanFailed, RestoreFailed
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: LIBRARY_PORTABILITY_MESSAGE
  - IF operation = export: RETURN AWAIT COLLECT_LIBRARY_PACKAGE()
  - IF operation = plan: validated = VALIDATE_LIBRARY_PACKAGE(input.package); RETURN PLAN_LIBRARY_RESTORE(validated, input.current, input.policy, input.targets)
  - IF operation = restore: validated = VALIDATE_LIBRARY_PACKAGE(input.package); plan = PLAN_LIBRARY_RESTORE(validated, input.current, input.policy, input.targets); RETURN EXECUTE_LIBRARY_RESTORE(validated, plan, input.adapters, input.backupStore, input.policy)
