/**
 * [IMPL-SIDE_PANEL_TAGS_TREE] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_TAGS_TREE]
 * Rich placeholder bookmarks for the By Tag / Tags tree demo (?demo=1, ?screenshot=1).
 * Array shape: { url, description, extended?, tags, time?, updated_at? } for tag selector, tree, filters (time/domain), and search.
 * Many bookmarks (25+), many tags (15+), overlapping tags, varied time/updated_at and domains so the demo GIF shows a robust use case.
 */

/** [IMPL-SIDE_PANEL_TAGS_TREE] [PROC-DEMO_RECORDING] Tags-tree placeholder: array of bookmarks for loadPlaceholderForScreenshot. */
export const tagsTreePlaceholderBookmarks = [
  { url: 'https://pinboard.in', description: 'Pinboard: social bookmarking', extended: 'Main bookmarking service. Syncs with extension and file export.', tags: ['bookmarks', 'pinboard', 'reading', 'tools', 'sync', 'reference', 'favorites'], time: '2025-01-15T12:00:00Z', updated_at: '2025-01-15T12:00:00Z' },
  { url: 'https://example.com', description: 'Example Domain', extended: 'Placeholder for screenshots and demos.', tags: ['example', 'work', 'reference'], time: '2025-01-14T10:00:00Z', updated_at: '2025-01-14T10:00:00Z' },
  { url: 'https://example.org', description: 'Example Org', extended: '', tags: ['work', 'personal', 'reading'], time: '2025-01-14T09:00:00Z', updated_at: '2025-01-14T09:00:00Z' },
  { url: 'https://example.net', description: 'Sample Page', extended: 'Sample extended notes for search demo.', tags: ['personal', 'reading', 'reference'], time: '2025-01-13T16:00:00Z', updated_at: '2025-01-13T16:00:00Z' },
  { url: 'https://github.com', description: 'GitHub', extended: 'Code hosting and collaboration.', tags: ['development', 'code', 'git', 'repos', 'dev', 'tools'], time: '2025-01-13T09:00:00Z', updated_at: '2025-01-13T09:00:00Z' },
  { url: 'https://developer.mozilla.org', description: 'MDN Web Docs', extended: 'Web API and docs reference.', tags: ['docs', 'reference', 'web', 'javascript', 'html', 'css'], time: '2025-01-12T08:00:00Z', updated_at: '2025-01-12T08:00:00Z' },
  { url: 'https://www.npmjs.com', description: 'npm', extended: '', tags: ['javascript', 'packages', 'node', 'dev', 'docs'], time: '2025-01-11T07:00:00Z', updated_at: '2025-01-11T07:00:00Z' },
  { url: 'https://playwright.dev', description: 'Playwright', extended: 'Browser automation and E2E testing.', tags: ['testing', 'e2e', 'automation', 'dev', 'tutorial'], time: '2025-01-10T14:00:00Z', updated_at: '2025-01-10T14:00:00Z' },
  { url: 'https://nodejs.org', description: 'Node.js', extended: '', tags: ['node', 'javascript', 'runtime', 'dev', 'docs', 'tutorial'], time: '2025-01-09T11:00:00Z', updated_at: '2025-01-09T11:00:00Z' },
  { url: 'https://stackoverflow.com', description: 'Stack Overflow', extended: 'Q&A for developers.', tags: ['qa', 'programming', 'help', 'dev', 'reference', 'tutorial'], time: '2025-01-08T16:00:00Z', updated_at: '2025-01-08T16:00:00Z' },
  { url: 'https://docs.npmjs.com', description: 'npm documentation', extended: 'npm docs and API.', tags: ['npm', 'docs', 'packages', 'reference'], time: '2025-01-07T09:30:00Z', updated_at: '2025-01-07T09:30:00Z' },
  { url: 'https://web.dev', description: 'web.dev', extended: 'Web development guides and best practices.', tags: ['web', 'docs', 'performance', 'pwa', 'reference'], time: '2025-01-06T13:00:00Z', updated_at: '2025-01-06T13:00:00Z' },
  { url: 'https://www.typescriptlang.org', description: 'TypeScript', extended: '', tags: ['typescript', 'javascript', 'typing', 'dev'], time: '2025-01-05T10:00:00Z', updated_at: '2025-01-05T10:00:00Z' },
  { url: 'https://eslint.org', description: 'ESLint', extended: 'Linting for JavaScript.', tags: ['lint', 'javascript', 'tooling', 'dev'], time: '2025-01-04T08:00:00Z', updated_at: '2025-01-04T08:00:00Z' },
  { url: 'https://jestjs.io', description: 'Jest', extended: '', tags: ['testing', 'javascript', 'unit', 'dev', 'tutorial'], time: '2025-01-03T12:00:00Z', updated_at: '2025-01-03T12:00:00Z' },
  { url: 'https://nodejs.org/docs', description: 'Node.js docs', extended: 'Node API and guides.', tags: ['node', 'docs', 'api', 'reference'], time: '2025-01-02T14:00:00Z', updated_at: '2025-01-02T14:00:00Z' },
  { url: 'https://github.com/features', description: 'GitHub Features', extended: '', tags: ['github', 'features', 'ci', 'dev', 'tools'], time: '2025-01-01T09:00:00Z', updated_at: '2025-01-01T09:00:00Z' },
  { url: 'https://vuejs.org', description: 'Vue.js', extended: 'Progressive JavaScript framework.', tags: ['vue', 'javascript', 'frontend', 'framework', 'dev'], time: '2024-12-31T11:00:00Z', updated_at: '2024-12-31T11:00:00Z' },
  { url: 'https://react.dev', description: 'React', extended: 'Library for building user interfaces.', tags: ['react', 'javascript', 'frontend', 'dev', 'tutorial'], time: '2024-12-30T10:00:00Z', updated_at: '2024-12-30T10:00:00Z' },
  { url: 'https://tailwindcss.com', description: 'Tailwind CSS', extended: 'Utility-first CSS framework.', tags: ['css', 'frontend', 'tools', 'dev'], time: '2024-12-29T15:00:00Z', updated_at: '2024-12-29T15:00:00Z' },
  { url: 'https://vitejs.dev', description: 'Vite', extended: 'Next generation frontend tooling.', tags: ['vite', 'build', 'dev', 'javascript', 'tools'], time: '2024-12-28T09:00:00Z', updated_at: '2024-12-28T09:00:00Z' },
  { url: 'https://www.ecma-international.org', description: 'ECMAScript', extended: 'ECMAScript specification.', tags: ['javascript', 'spec', 'reference', 'docs'], time: '2024-12-27T14:00:00Z', updated_at: '2024-12-27T14:00:00Z' }
  // { url: 'https://css-tricks.com', description: 'CSS-Tricks', extended: 'Front-end development articles.', tags: ['css', 'web', 'reference', 'reading'], time: '2024-12-26T08:00:00Z', updated_at: '2024-12-26T08:00:00Z' },
  // { url: 'https://dev.to', description: 'DEV Community', extended: 'Developer community and articles.', tags: ['reading', 'dev', 'community', 'tutorial'], time: '2024-12-25T12:00:00Z', updated_at: '2024-12-25T12:00:00Z' },
  // { url: 'https://frontendmasters.com', description: 'Frontend Masters', extended: 'Front-end training courses.', tags: ['learning', 'frontend', 'tutorial', 'dev'], time: '2024-12-24T10:00:00Z', updated_at: '2024-12-24T10:00:00Z' },
  // { url: 'https://caniuse.com', description: 'Can I use', extended: 'Browser support tables.', tags: ['web', 'reference', 'compatibility', 'tools'], time: '2024-12-23T16:00:00Z', updated_at: '2024-12-23T16:00:00Z' },
  // { url: 'https://regex101.com', description: 'regex101', extended: 'Regex tester and debugger.', tags: ['regex', 'tools', 'dev', 'reference'], time: '2024-12-22T11:00:00Z', updated_at: '2024-12-22T11:00:00Z' },
  // { url: 'https://jsonplaceholder.typicode.com', description: 'JSONPlaceholder', extended: 'Fake API for testing.', tags: ['api', 'testing', 'dev', 'tools'], time: '2024-12-21T09:00:00Z', updated_at: '2024-12-21T09:00:00Z' },
  // { url: 'https://httpbin.org', description: 'httpbin', extended: 'HTTP request and response service.', tags: ['api', 'testing', 'http', 'dev'], time: '2024-12-20T14:00:00Z', updated_at: '2024-12-20T14:00:00Z' },
  // { url: 'https://postman.com', description: 'Postman', extended: 'API platform for development.', tags: ['api', 'tools', 'dev', 'testing'], time: '2024-12-19T08:00:00Z', updated_at: '2024-12-19T08:00:00Z' },
  // { url: 'https://git-scm.com', description: 'Git', extended: 'Distributed version control.', tags: ['git', 'dev', 'reference', 'docs'], time: '2024-12-18T10:00:00Z', updated_at: '2024-12-18T10:00:00Z' },
  // { url: 'https://github.com/docs', description: 'GitHub Docs', extended: 'GitHub documentation.', tags: ['github', 'docs', 'reference', 'dev'], time: '2024-12-17T12:00:00Z', updated_at: '2024-12-17T12:00:00Z' },
]
