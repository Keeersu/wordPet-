/**
 * Fake Gateways
 *
 * Provides fake implementations for all gateway interfaces.
 * These replace the production gateways in tests via Hono context injection.
 */
import type { Gateways } from '../index'
import { authFake } from './authClient'
import { dbFake } from './dbClient'

export const fakeGateways: Gateways = {
  db: {
    createDbClient: (...args) => dbFake.createDbClient(...args),
  },
  auth: {
    fetchAuthService: (...args) => authFake.fetch(...args),
  },
}

// Re-export fakes for test reset in beforeEach
export { authFake, dbFake }

// Re-export test infrastructure
export { getPgliteClientForTest, resetDatabaseForTest } from './testInfra'
