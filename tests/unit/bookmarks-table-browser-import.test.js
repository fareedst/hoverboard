/**
 * === IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_IMPORT ===
 * [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] — Local Bookmarks Index live Browser source: getTree, flatten/collapse, search/folder filter, selection, target-scoped conflicts, root-stripped folder tags, extra tags, and saveBookmark.
 *
 * ## LOAD_BROWSER_SOURCE
 *
 * - [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements live Browser source loading in the Local Bookmarks Index.
 * - Contract:
 *   - INPUT: chrome.bookmarks.getTree()
 *   - PRE: `chrome.bookmarks.getTree` is available through the bookmarks permission
 *   - OUTPUT: one import row per cleaned URL with title, URL, folderPaths, folderPath, dateAdded, and root-stripped folder tags
 *   - POST:
 *     - success => duplicate URL nodes are collapsed; folder paths and tags are unioned; earliest dateAdded is retained
 *     - failure => empty source with an explanatory message
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: browserImportRecords, folderList, selectedBrowserImportUrls
 *   - DATA_TRANSITION: load success replaces source records and folder choices and clears prior selection; load failure replaces them with an empty source and explanatory message
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_BROWSER_SOURCE
 *   - tree = AWAIT chrome.bookmarks.getTree()
 *   - flattened = flattenTree(tree)
 *   - records = NORMALIZE_BROWSER_IMPORT_RECORDS(flattened)
 *   - folderList = BUILD_BROWSER_IMPORT_FOLDER_LIST(records)
 *   - CLEAR selectedBrowserImportUrls
 *   - APPLY_BROWSER_IMPORT_FILTER()
 *   - ON error: SET browserImportRecords and filtered records to empty; SHOW explanatory message; APPLY_BROWSER_IMPORT_FILTER()
 *
 * ## NORMALIZE_BROWSER_IMPORT_RECORDS
 *
 * - [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements Browser provider-compatible duplicate handling and root stripping.
 * - Contract:
 *   - INPUT: flattened Browser bookmark nodes
 *   - PRE: each node may contain id, url, title, dateAdded, and folderPath
 *   - OUTPUT: collapsed record list keyed by cleaned URL
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_BROWSER_IMPORT_RECORDS
 *   - FOR each node WITH url:
 *   - key = cleanUrl(node.url)
 *   - folderTags = folderPathToTags(node.folderPath, { stripRoots: true })
 *   - IF key is new: create record with node title, dateAdded, folderPaths, folderTags, and sourceIds
 *   - ELSE: union folderPaths, folderTags, and sourceIds; retain earliest dateAdded; fill an empty title from a later node
 *   - RETURN records
 *
 * ## APPLY_BROWSER_IMPORT_FILTER
 *
 * - [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements selective live-tree browsing in the Index Import group.
 * - Contract:
 *   - INPUT: records, search query, selected folder
 *   - PRE: records have collapsed folderPaths
 *   - OUTPUT: filtered records and selectable rows
 *   - DATA: filteredBrowserImportRecords, selectedBrowserImportUrls, count and empty-state DOM
 *   - DATA_TRANSITION: filtering replaces visible rows and count/empty-state state while retaining selected URLs outside the current filter
 *   - EFFECTS: State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_BROWSER_IMPORT_FILTER
 *   - IF selected folder is non-empty: keep records containing that exact folder path
 *   - IF search is non-empty: keep records whose title, URL, or folder path contains the case-folded query
 *   - RENDER rows with Select, Title, URL, Folder, and Date added
 *   - Preserve selected URLs while filters change
 *
 * ## RUN_BROWSER_IMPORT
 *
 * - [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements target-specific live Browser migration through the shared Index saveBookmark route.
 * - Contract:
 *   - INPUT: selected browser records, conflict mode (Skip|Overwrite|Merge), folder-tag toggle, extra tags, target (Local|File|Sync)
 *   - PRE: at least one record is selected; Browser is not a valid live-source target
 *   - OUTPUT: imported/skipped/failed counts and refreshed Index
 *   - POST:
 *     - success => counts reflect best-effort per-record writes
 *     - failure => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed, InvalidTarget
 *   - DATA: existingByUrl = selected target rows only; Browser source rows are excluded
 *   - DATA_TRANSITION: each save outcome increments its result counter; completion clears source selection and refreshes the Index
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_BROWSER_IMPORT
 *   - target = selected Local|File|Sync target; IF invalid: use Local
 *   - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(aggregate rows, target)
 *   - IF aggregate lookup fails AND target = Local: retry getLocalBookmarksForIndex; IF target is File|Sync or retry fails: SHOW conflict-detection error and RETURN without writes
 *   - FOR each selected record:
 *   - IF existingByUrl contains record.url AND mode = Skip: skipped++
 *   - ELSE payload = BUILD_BROWSER_IMPORT_PAYLOAD(record, existingByUrl[record.url], mode, tags)
 *   - SEND saveBookmark({ ...payload, preferredBackend: target })
 *   - IF response.success: imported++ ELSE failed++
 *   - CLEAR selectedBrowserImportUrls; loadBookmarks(); SHOW final counts
 *
 * === END IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_IMPORT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — One Import control group with File CSV/JSON and live Browser sources; target-scoped file conflicts plus selective Browser-tree migration; saveBookmark per row; pending then final result in #import-result.
 *
 * ## RUN_FILE_IMPORT
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — group is independent of selection actions. How: Implements runImport(file) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.
 * - Contract:
 *   - INPUT: source (File | Browser), file when source=File, mode (Only new | Overwrite) for File, conflict mode (Skip | Overwrite | Merge tags) for Browser, preferredBackend, allBookmarks
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: imported count, skipped count, failed count; refreshed table; #import-result pending then final | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: file rows = array of { url, description, tags, time, updated_at, shared, toread, extended }; Browser rows = collapsed live tree records; existingByUrl = set of URLs from selected target only
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_FILE_IMPORT
 *   - text = read file as text
 *   - rows = parseImportFile(text, filename)   // CSV -> parseCsv; JSON -> normalize array; skip empty url
 *   - IF rows empty: SHOW error in #import-result (not pending/final success); RETURN
 *   - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(allBookmarks, preferredBackend)
 *   - IF mode = "Only new": rows = rows FILTER url NOT IN existingByUrl
 *   - SHOW "Importing…" in #import-result WITH class is-pending   // accepted; warning color
 *   - imported = 0; skipped = 0; failed = 0
 *   - FOR each row IN rows:
 *   - payload = { ...row, preferredBackend }   // includes time, updated_at from file when present
 *   - response = SEND saveBookmark(payload)
 *   - IF response.success: imported++
 *   - ELSE: failed++
 *   - loadBookmarks()   // refresh table
 *   - SHOW "Imported N, skipped M, K failed" in #import-result WITH class is-final   // success color; clear is-pending
 *
 * ## RUN_BROWSER_IMPORT
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] How: The shared Index Import control delegates the live Browser source to IMPL-BROWSER_BOOKMARK_IMPORT while retaining one result/status surface.
 * - Contract:
 *   - INPUT: selected live Browser records, target Local|File|Sync, Skip|Overwrite|Merge tags, folder-tag toggle, extra tags
 *   - PRE: Browser source records are collapsed by cleaned URL; Browser is excluded as a destination
 *   - OUTPUT: imported/skipped/failed counts and refreshed Index
 *   - POST:
 *     - success => counts reflect best-effort per-row writes and the Index is refreshed
 *     - error OperationFailed => no writes occur after target conflict lookup failure
 *   - FAILURE_MODES: OperationFailed, InvalidTarget
 *   - DATA: existingByUrl = selected target rows only; selected Browser rows; import result counters
 *   - DATA_TRANSITION: each save outcome updates a result counter; completion refreshes the Index and result surface
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_BROWSER_IMPORT
 *   - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(aggregate rows, target)
 *   - IF target conflict lookup fails: retry Local only for Local target; otherwise SHOW error and RETURN without writes
 *   - FOR each selected Browser record:
 *   - IF existingByUrl contains url AND mode = Skip: skipped++
 *   - ELSE BUILD payload with root-stripped folder tags and sanitized extra tags
 *   - SEND saveBookmark({ ...payload, preferredBackend: target })
 *   - loadBookmarks(); SHOW final counts
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT ===
 */
import {
  normalizeBrowserImportRecords,
  buildBrowserImportFolderList,
  filterBrowserImportRecords,
  buildBrowserImportPayload,
  buildTargetBookmarksByUrl
} from '../../src/ui/bookmarks-table/bookmarks-table-browser-import.js'

const browserTree = [
  {
    id: '1',
    title: 'Bookmarks Bar',
    children: [
      {
        id: '10',
        title: 'Work',
        children: [
          { id: '11', title: 'Docs', url: 'https://example.com/', dateAdded: 2000 }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Other Bookmarks',
    children: [
      {
        id: '20',
        title: 'Read',
        children: [
          { id: '21', title: 'Example', url: 'https://example.com', dateAdded: 1000 }
        ]
      },
      { id: '22', title: 'Unique', url: 'https://unique.test', dateAdded: 3000 }
    ]
  }
]

describe('Index live Browser source [REQ-BROWSER_BOOKMARK_IMPORT]', () => {
  test('collapses cleaned duplicate URLs, unions folders/tags, and keeps earliest date', () => {
    const records = normalizeBrowserImportRecords(browserTree)
    const example = records.find(record => record.url === 'https://example.com')

    expect(records).toHaveLength(2)
    expect(example).toMatchObject({
      title: 'Docs',
      dateAdded: 1000,
      tags: ['work', 'read']
    })
    expect(example.folderPaths).toEqual([
      'Bookmarks Bar / Work',
      'Other Bookmarks / Read'
    ])
    expect(example.folderPath).toBe('Bookmarks Bar / Work | Other Bookmarks / Read')
  })

  test('builds folder choices and filters by folder or searchable text', () => {
    const records = normalizeBrowserImportRecords(browserTree)

    expect(buildBrowserImportFolderList(records)).toEqual([
      'Bookmarks Bar / Work',
      'Other Bookmarks',
      'Other Bookmarks / Read'
    ])
    expect(filterBrowserImportRecords(records, '', 'Other Bookmarks / Read')).toHaveLength(1)
    expect(filterBrowserImportRecords(records, 'unique.test')).toHaveLength(1)
    expect(filterBrowserImportRecords(records, 'work')).toHaveLength(1)
  })

  test('builds root-stripped folder tags and sanitized extra tags', () => {
    const [record] = normalizeBrowserImportRecords(browserTree)
    const payload = buildBrowserImportPayload(record, {
      useFolderTags: true,
      extraTags: 'Imported, browser bookmarks'
    })

    expect(payload).toMatchObject({
      url: 'https://example.com',
      description: 'Docs',
      tags: ['work', 'read', 'imported', 'browser_bookmarks']
    })
    expect(payload.tags).not.toContain('bookmarks_bar')
    expect(payload.tags).not.toContain('other_bookmarks')
  })

  test('merge preserves target metadata and adds source tags', () => {
    const [record] = normalizeBrowserImportRecords(browserTree)
    const payload = buildBrowserImportPayload(record, {
      conflictMode: 'merge',
      existing: {
        url: record.url,
        description: 'Target title',
        extended: 'Existing notes',
        tags: ['existing'],
        shared: 'no',
        toread: 'yes'
      },
      useFolderTags: true,
      extraTags: 'existing, imported'
    })

    expect(payload).toMatchObject({
      description: 'Target title',
      extended: 'Existing notes',
      shared: 'no',
      toread: 'yes',
      tags: ['existing', 'work', 'read', 'imported']
    })
  })

  test('conflict lookup is scoped to the selected target backend', () => {
    const bookmarks = [
      { url: 'https://same.test', storage: 'browser' },
      { url: 'https://same.test', storage: 'local' },
      { url: 'https://other.test', storage: 'file' }
    ]

    expect([...buildTargetBookmarksByUrl(bookmarks, 'local').keys()]).toEqual(['https://same.test'])
    expect(buildTargetBookmarksByUrl(bookmarks, 'sync')).toEqual(new Map())
    expect(buildTargetBookmarksByUrl(bookmarks, 'browser').get('https://same.test').storage).toBe('browser')
  })
})
