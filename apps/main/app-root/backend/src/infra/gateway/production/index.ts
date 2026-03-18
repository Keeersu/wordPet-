/**
 * Production Gateway Implementations
 *
 * Exports the production implementations of all gateway interfaces.
 */
import type { Gateways } from '../index'
import { createDbClient } from './db'
import { fetchAuthService } from './auth'

export const productionGateways: Gateways = {
  db: { createDbClient },
  auth: { fetchAuthService },
}

// Re-export types and utilities from individual modules
export type { DbClient, DbTransaction } from './db'
export { createDbFromEnv, schema } from './db'
