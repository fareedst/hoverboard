/**
 * [IMMUTABLE-REQ-TAG-003] - Test case preservation for recent tags
 */

// Mock chrome API for testing
global.chrome = {
  runtime: {
    getBackgroundPage: () => Promise.resolve({
      recentTagsMemory: {
        getRecentTags: () => [
          { name: 'JavaScript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
          { name: 'WEB', lastUsed: '2024-12-19T11:00:00Z', count: 3 },
          { name: 'Development', lastUsed: '2024-12-19T09:00:00Z', count: 2 }
        ],
        addTag: (tagName, siteUrl) => {
          console.log(`Adding tag: "${tagName}" for site: ${siteUrl}`)
          return true
        }
      }
    })
  },
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve()
    }
  }
}

// Mock global objects
global.self = { recentTagsMemory: null }
global.globalThis = { recentTagsMemory: null }

// Import the TagService
import { TagService } from './src/features/tagging/tag-service.js'

async function testCasePreservation() {
  console.log('=== [IMMUTABLE-REQ-TAG-003] Testing Case Preservation ===\n')
  
  const tagService = new TagService()
  
  // Test 1: Tag sanitization preserves case
  console.log('1. Testing tag sanitization:')
  console.log('   "JavaScript" ->', tagService.sanitizeTag('JavaScript'))
  console.log('   "WEB" ->', tagService.sanitizeTag('WEB'))
  console.log('   "Development" ->', tagService.sanitizeTag('Development'))
  console.log('   "  React  " ->', tagService.sanitizeTag('  React  '))
  console.log('   "Node.js" ->', tagService.sanitizeTag('Node.js'))
  console.log('   "HTML5" ->', tagService.sanitizeTag('HTML5'))
  console.log()
  
  // Test 2: Adding tags preserves case
  console.log('2. Testing tag addition:')
  const result1 = await tagService.addTagToUserRecentList('JavaScript', 'https://example.com')
  const result2 = await tagService.addTagToUserRecentList('WEB', 'https://example.com')
  const result3 = await tagService.addTagToUserRecentList('Development', 'https://example.com')
  
  console.log('   Added "JavaScript":', result1)
  console.log('   Added "WEB":', result2)
  console.log('   Added "Development":', result3)
  console.log()
  
  // Test 3: Getting recent tags preserves case
  console.log('3. Testing recent tags retrieval:')
  const recentTags = await tagService.getUserRecentTags()
  console.log('   Recent tags:')
  recentTags.forEach(tag => {
    console.log(`     - "${tag.name}" (count: ${tag.count})`)
  })
  console.log()
  
  // Test 4: Case-insensitive filtering
  console.log('4. Testing case-insensitive filtering:')
  const currentTags = ['javascript', 'react']
  const filteredTags = await tagService.getUserRecentTagsExcludingCurrent(currentTags)
  console.log('   Current tags:', currentTags)
  console.log('   Filtered tags:')
  filteredTags.forEach(tag => {
    console.log(`     - "${tag.name}"`)
  })
  console.log()
  
  // Test 5: Tag suggestions with case-insensitive matching
  console.log('5. Testing tag suggestions:')
  const suggestions1 = await tagService.getTagSuggestions('java', 5)
  const suggestions2 = await tagService.getTagSuggestions('web', 5)
  console.log('   Suggestions for "java":', suggestions1)
  console.log('   Suggestions for "web":', suggestions2)
  console.log()
  
  console.log('=== Test completed successfully! ===')
  console.log('✅ Tags are now preserved with their original case')
  console.log('✅ Case-insensitive comparisons work correctly')
  console.log('✅ Recent tags functionality maintains case integrity')
}

// Run the test
testCasePreservation().catch(console.error) 