
import { vi, beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest'
import { createApp } from '@backend/app'
import { fakeGateways, resetDatabaseForTest, authFake, dbFake, getPgliteClientForTest } from '@backend/infra/gateway/fake'
import { TEST_BASE_TIME, store, cleanupRender, getTestFileId } from './helper'
import { getTestEnv } from './setupTestEnv'
import { validateSchemaMigrationConsistency } from './validation/schemaValidator'
import * as backendSchema from '@backend/schema'

// Get test app with injected fake gateways (no vi.mock needed)
const app = createApp(fakeGateways)

/**
 * Cookie storage for test environment.
 * Since we're not in a real browser, we need to manually manage cookies.
 * Map: testFileId -> cookie string
 */
const testCookieStore = new Map<string, string>()

/**
 * Parse Set-Cookie header and extract cookie value
 */
const parseSetCookie = (setCookie: string): { name: string; value: string } | null => {
  const match = setCookie.match(/^([^=]+)=([^;]*)/)
  if (!match) return null
  return { name: match[1], value: match[2] }
}

/**
 * Helper function to create a fetch that routes API requests to Hono
 * and other requests to the original fetch
 */
const createApiRoutingFetch = (originalFetch: typeof fetch) => {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    // In test environment, prepend origin to relative URLs (fetch doesn't auto-resolve like browsers)
    if (url.startsWith('/')) {
      url = `${window.location.origin}${url}`
    }

    // Route /api/* requests to Hono backend
    if (url.includes('/api/')) {
      // Use file-level ID instead of test-level ID for DB sharing
      const testId = getTestFileId()

      const request = new Request(url, init)
      request.headers.set('x-test-id', testId)

      // Add stored cookies to request (simulate browser cookie behavior)
      const storedCookie = testCookieStore.get(testId)
      if (storedCookie) {
        request.headers.set('Cookie', storedCookie)
      }

      const response = await app.fetch(request, getTestEnv())

      // Detect unregistered backend routes via HONO_ROUTE_NOT_FOUND marker
      if (response.status === 404) {
        const clonedResponse = response.clone()
        const body = await clonedResponse.json().catch(() => null) as { error?: string; path?: string } | null
        if (body?.error === 'HONO_ROUTE_NOT_FOUND') {
          return new Response(
            JSON.stringify({ error: `Backend route not registered: ${body.path}` }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      // Extract and store Set-Cookie header (simulate browser cookie storage)
      const setCookie = response.headers.get('Set-Cookie')
      if (setCookie) {
        const parsed = parseSetCookie(setCookie)
        if (parsed) {
          if (parsed.value === '' || setCookie.includes('Max-Age=0')) {
            // Cookie is being cleared
            testCookieStore.delete(testId)
          } else {
            // Store the cookie
            testCookieStore.set(testId, `${parsed.name}=${parsed.value}`)
          }
        }
      }

      return response
    }

    // All other requests use the original fetch
    return originalFetch(input as RequestInfo | URL, init)
  }) as typeof fetch
}

let originalFetch: typeof fetch

// Exit module initialization phase when setupTeardown loads
// Note: Cannot delay further because PGLite and other deps need real Date
// But test files' imports still run under epoch 0 (before setupFiles execute)
const epochZeroPreload = globalThis.__epochZeroPreload
if (epochZeroPreload) {
  epochZeroPreload.exitModuleInitPhase()
  epochZeroPreload.restoreOriginalDate()
}

// Schema validation flag — run once per fork on the first test's PGlite instance.
// Previously this created a separate 'schema-validation' PGlite instance in beforeAll,
// but that doubled the PGlite count per fork. Migration SQL is only ~20ms; the real
// cost is WASM bootstrap (~500-700ms per instance). Reusing the test DB saves one instance.
let _schemaValidated = false

beforeAll(async () => {
  // Enable React act environment for proper error handling
  globalThis.IS_REACT_ACT_ENVIRONMENT = true

  // Setup fake timers globally
  vi.useFakeTimers({
    shouldAdvanceTime: true,
  })
  vi.setSystemTime(TEST_BASE_TIME)

  originalFetch = globalThis.fetch
  const newFetch = createApiRoutingFetch(originalFetch)
  vi.stubGlobal('fetch', newFetch)
})

// Clean database before each test to ensure isolation
beforeEach(async () => {
  // Reset Jotai store to ensure clean state between tests
  store.reset()

  // Reset fake time to base time for each test
  vi.setSystemTime(TEST_BASE_TIME)

  const testId = getTestFileId()

  // Clear cookies for this test file
  testCookieStore.delete(testId)
  await resetDatabaseForTest(testId)

  // Reset fakes to default behavior for test isolation.
  // dbFake.reset() sets the testId used by createDbClient() for subsequent
  // database operations routed through the Hono app.
  dbFake.reset(testId)
  authFake.reset(testId)

  const client = await getPgliteClientForTest(testId)

  // Validate schema-migration consistency once per fork (first test only).
  // Uses the same PGlite instance as the test DB — no extra instance needed.
  if (!_schemaValidated) {
    await validateSchemaMigrationConsistency(client, backendSchema as Record<string, unknown>)
    _schemaValidated = true
  }
})

// Clean up React render to prevent "window is not defined" errors
afterEach(() => {
  cleanupRender()
})

afterAll(() => {
  vi.useRealTimers()
  vi.stubGlobal('fetch', originalFetch)
})
