/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [IMPL-LIBRARY_PORTABILITY]
 * [ARCH-CROSS_RESOURCE_RETRIEVAL] [ARCH-LIBRARY_PORTABILITY]
 * [REQ-CROSS_RESOURCE_RETRIEVAL] [REQ-LIBRARY_PORTABILITY]
 * Composition tests for MessageHandler bindings without invoking UI.
 */
/**
 * ## SEARCH_LIBRARY_RESOURCES_MESSAGE
 * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: expose the query contract through a new message while keeping SEARCH_TITLE compatibility explicit.
 * - Contract:
 *   - INPUT: message with type SEARCH_LIBRARY_RESOURCES and query data
 *   - PRE: message handler has the retrieval service and response channel
 *   - OUTPUT: retrieval result or structured error response
 *   - POST: one response is returned; no source write occurs
 *   - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SEARCH_LIBRARY_RESOURCES_MESSAGE
 *   - response = AWAIT QUERY_CROSS_RESOURCES(message.data)
 *   - RETURN response
 *   - SEARCH_TITLE remains a compatibility route returning its documented legacy shape until a separate deprecation change updates callers and tests
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
import { MessageHandler, MESSAGE_TYPES } from '../../src/core/message-handler.js'

const provider = {
  getBookmarkForUrl: jest.fn().mockResolvedValue(null),
  saveBookmark: jest.fn().mockResolvedValue({ success: true }),
  deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
  getRecentBookmarks: jest.fn().mockResolvedValue([]),
  getAllBookmarks: jest.fn().mockResolvedValue([]),
  saveTag: jest.fn().mockResolvedValue({ success: true }),
  deleteTag: jest.fn().mockResolvedValue({ success: true })
}

describe('[REQ-CROSS_RESOURCE_RETRIEVAL] and [REQ-LIBRARY_PORTABILITY] message dispatch', () => {
  test('constructs both additive services before optional test setters run', () => {
    const handler = new MessageHandler(provider)

    expect(handler.crossResourceRetrievalService).toBeTruthy()
    expect(handler.libraryPortabilityService).toBeTruthy()
    expect(typeof handler.crossResourceRetrievalService.query).toBe('function')
    expect(typeof handler.libraryPortabilityService.export).toBe('function')
  })

  test('dispatches SEARCH_LIBRARY_RESOURCES to the read-only retrieval service', async () => {
    const handler = new MessageHandler(provider)
    const query = jest.fn().mockResolvedValue({
      results: [{ source: 'tabs', action: { kind: 'focusTab', tabId: 7 } }]
    })
    handler.setCrossResourceRetrievalService({ query })

    const response = await handler.processMessage({
      type: MESSAGE_TYPES.SEARCH_LIBRARY_RESOURCES,
      data: { query: 'offline', scopes: ['tabs'] }
    }, {})

    expect(query).toHaveBeenCalledWith({ query: 'offline', scopes: ['tabs'] })
    expect(response.results[0].action.kind).toBe('focusTab')
  })

  test('dispatches package export and import modes to the portability service', async () => {
    const handler = new MessageHandler(provider)
    const portability = {
      export: jest.fn().mockResolvedValue({ manifest: { packageVersion: 1 } }),
      plan: jest.fn().mockResolvedValue({ actions: [] }),
      restore: jest.fn().mockResolvedValue({ success: true })
    }
    handler.setLibraryPortabilityService(portability)

    await expect(handler.processMessage({
      type: MESSAGE_TYPES.EXPORT_LIBRARY_PACKAGE,
      data: {}
    }, {})).resolves.toEqual({ manifest: { packageVersion: 1 } })
    await expect(handler.processMessage({
      type: MESSAGE_TYPES.IMPORT_LIBRARY_PACKAGE,
      data: { mode: 'plan', package: { manifest: {} } }
    }, {})).resolves.toEqual({ actions: [] })
    await expect(handler.processMessage({
      type: MESSAGE_TYPES.IMPORT_LIBRARY_PACKAGE,
      data: { mode: 'restore', package: { manifest: {} } }
    }, {})).resolves.toEqual({ success: true })
    expect(portability.plan).toHaveBeenCalled()
    expect(portability.restore).toHaveBeenCalled()
  })
})
