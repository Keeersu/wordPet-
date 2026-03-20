/**
 * Browser Gateways for FAST_PROTOTYPE_MODE.
 *
 * Provides gateway implementations that work entirely in the browser:
 * - db: Uses PGLite (WASM PostgreSQL)
 * - auth: Fake auth client (pure TypeScript)
 */
import type { Gateways, DbClient } from '@backend/infra/gateway'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@backend/schema'

// Import fake implementations (pure TypeScript, browser-compatible)
import { authFake } from '@backend/infra/gateway/fake/authClient'
import { getBrowserPglite } from './browserPglite'

/**
 * Create browser-compatible gateways.
 * These use PGLite for the database and fake implementations for external services.
 */
export function createBrowserGateways(): Gateways {
  return {
    db: {

      async createDbClient(_env: unknown): Promise<{ db: DbClient; cleanup: () => Promise<void> }> {
        const client = getBrowserPglite()
        const db = drizzle(client, { schema }) as unknown as DbClient

        return {
          db,
          cleanup: async () => {
            // No cleanup needed - PGLite instance is reused
          },
        }
      },
    },
    auth: {
      fetchAuthService: (...args) => authFake.fetch(...args),
    },
  }
}
