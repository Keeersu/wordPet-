/**
 * Gateway Registry
 *
 * Defines interfaces for all external service gateways.
 * In production, uses real implementations.
 * In tests, can be replaced with mocks via Hono context injection.
 */
import type { Bindings } from '../../types/env'
import type { DbClient } from './production/db'

// ============================================================================
// Gateway Interfaces
// ============================================================================

export interface Gateways {
  db: {
    createDbClient(env: Bindings): Promise<{ db: DbClient; cleanup: () => Promise<void> }>
  }
  auth: {
    fetchAuthService(
      env: Bindings,
      path: string,
      options?: {
        method?: string
        headers?: HeadersInit
        body?: BodyInit | null
      }
    ): Promise<Response>
  }
}

// ============================================================================
// Re-export from production for backward compatibility
// ============================================================================

export { productionGateways } from './production'
export type { DbClient, DbTransaction } from './production/db'
export { createDbFromEnv, schema } from './production/db'
