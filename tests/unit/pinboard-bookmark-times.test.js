/**
 * Pinboard bookmark create/update times - [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]
 * Pinboard only has create-time; updated_at is always equal to time.
 */

import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'

describe('PinboardService bookmark times [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
  let service

  beforeEach(() => {
    service = new PinboardService()
  })

  describe('createEmptyBookmark', () => {
    test('includes updated_at empty [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
      const b = service.createEmptyBookmark('https://example.com', 'Title')
      expect(b).toHaveProperty('updated_at', '')
      expect(b.time).toBe('')
    })
  })

  describe('parseBookmarkResponse', () => {
    test('sets updated_at equal to time from API [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
      const xmlObj = {
        posts: {
          post: [
            {
              '@_href': 'https://example.com',
              '@_description': 'Example',
              '@_extended': '',
              '@_tag': 'a b',
              '@_time': '2026-02-14T12:00:00.000Z',
              '@_shared': 'yes',
              '@_toread': 'no',
              '@_hash': 'h'
            }
          ]
        }
      }
      const result = service.parseBookmarkResponse(xmlObj, 'https://example.com', 'Example')
      expect(result.time).toBe('2026-02-14T12:00:00.000Z')
      expect(result.updated_at).toBe('2026-02-14T12:00:00.000Z')
    })

    test('single post object (not array) sets updated_at equal to time', () => {
      const xmlObj = {
        posts: {
          post: {
            '@_href': 'https://single.com',
            '@_description': 'Single',
            '@_tag': '',
            '@_time': '2026-02-10T08:00:00.000Z',
            '@_shared': 'yes',
            '@_toread': 'no',
            '@_hash': ''
          }
        }
      }
      const result = service.parseBookmarkResponse(xmlObj, 'https://single.com', 'Single')
      expect(result.time).toBe('2026-02-10T08:00:00.000Z')
      expect(result.updated_at).toBe('2026-02-10T08:00:00.000Z')
    })
  })
})
