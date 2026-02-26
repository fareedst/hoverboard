/**
 * [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE]
 * Offscreen READ_FILE_BOOKMARKS / WRITE_FILE_BOOKMARKS message contract tests.
 */

import { handleOffscreenMessage } from '../../src/offscreen/file-bookmark-io.js'

describe('[IMPL-FILE_BOOKMARK_SERVICE] Offscreen READ_FILE_BOOKMARKS contract', () => {
  test('returns { error: null, data: { version, bookmarks } } when handle and read succeed', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe(null)
      expect(r.data).toBeDefined()
      expect(r.data).toHaveProperty('version')
      expect(r.data).toHaveProperty('bookmarks')
      expect(typeof r.data.bookmarks).toBe('object')
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({ version: 1, bookmarks: {} }),
      writeFile: () => Promise.resolve()
    }
    const result = handleOffscreenMessage({ type: 'READ_FILE_BOOKMARKS' }, sendResponse, io)
    expect(result).toBe(true)
  })

  test('returns { error: "NO_HANDLE", data: null } when no handle', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe('NO_HANDLE')
      expect(r.data).toBe(null)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve(null),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    }
    handleOffscreenMessage({ type: 'READ_FILE_BOOKMARKS' }, sendResponse, io)
  })

  test('returns { error: string, data: null } on read failure', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBeDefined()
      expect(typeof r.error).toBe('string')
      expect(r.data).toBe(null)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.reject(new Error('READ_FAILED')),
      writeFile: () => Promise.resolve()
    }
    handleOffscreenMessage({ type: 'READ_FILE_BOOKMARKS' }, sendResponse, io)
  })
})

describe('[IMPL-FILE_BOOKMARK_SERVICE] Offscreen WRITE_FILE_BOOKMARKS contract', () => {
  test('returns { error: null, success: true } when handle and write succeed', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe(null)
      expect(r.success).toBe(true)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    }
    const result = handleOffscreenMessage({ type: 'WRITE_FILE_BOOKMARKS', data: { bookmarks: {} } }, sendResponse, io)
    expect(result).toBe(true)
  })

  test('returns { error: "NO_HANDLE", success: false } when no handle', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBe('NO_HANDLE')
      expect(r.success).toBe(false)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve(null),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    }
    handleOffscreenMessage({ type: 'WRITE_FILE_BOOKMARKS' }, sendResponse, io)
  })

  test('returns { error: string, success: false } on write failure', (done) => {
    const sendResponse = (r) => {
      expect(r.error).toBeDefined()
      expect(r.success).toBe(false)
      done()
    }
    const io = {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.reject(new Error('WRITE_FAILED'))
    }
    handleOffscreenMessage({ type: 'WRITE_FILE_BOOKMARKS' }, sendResponse, io)
  })
})

describe('[IMPL-FILE_BOOKMARK_SERVICE] Offscreen unknown type', () => {
  test('returns false for unknown message type (no sendResponse)', () => {
    const sendResponse = jest.fn()
    const result = handleOffscreenMessage({ type: 'UNKNOWN_TYPE' }, sendResponse, {
      getDirectoryHandle: () => Promise.resolve({}),
      readFile: () => Promise.resolve({}),
      writeFile: () => Promise.resolve()
    })
    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })
})
