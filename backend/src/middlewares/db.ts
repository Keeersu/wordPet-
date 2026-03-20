import { sql } from 'drizzle-orm'
import type { Env } from '../types/env'
import { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { DbTransaction } from '../infra/gateway'

/** PostgreSQL session variable names used by audit triggers (0000_audit_logs.sql). */
export const AUDIT_SESSION_VARS = {
  userId: 'app.user_id',
  traceId: 'app.trace_id',
} as const

function getSentryTraceId(c: Context<Env>): string | null {
  const sentryTrace = c.req.header('sentry-trace')
  const traceId = sentryTrace?.split('-')[0]
  return traceId && /^[0-9a-f]{32}$/i.test(traceId) ? traceId : null
}

/**
 * Middleware: Initialize database connection.
 * Sets up a database connection per request using the gateway layer.
 *
 * After this middleware runs, access the database via `c.var.db`.
 */
export const dbMiddleware = createMiddleware<Env>(async (c, next) => {
  const traceId = getSentryTraceId(c) ?? crypto.randomUUID()
  c.set('traceId', traceId)

  const { db, cleanup } = await c.var.gateways.db.createDbClient(c.env)
  c.set('db', db)

  await next()
  await cleanup()
})

/**
 * Middleware: Setup audit context for database operations.
 *
 * This middleware:
 * 1. Sets PostgreSQL session variables (app.user_id, app.trace_id) for audit triggers
 * 2. Executes the handler function (application code)
 *
 * Usage: Called automatically by authentication middlewares (loginRequired, adminRequired, publicAccessible)
 * Application code uses `c.var.db` for all operations and doesn't need to be aware of audit logging.
 *
 * Note: Uses connection-level session variables (false parameter) instead of transaction-level,
 * so they persist for the entire connection lifetime but are automatically cleaned up when the
 * connection is returned to the pool.
 */
export const setupAuditContextMiddleware = createMiddleware<Env>(async (c, next) => {
  const db = c.var.db
  const userId = c.var.userId ?? ''  // Empty string for public endpoints
  const traceId = c.var.traceId ?? ''

  // Set connection-level session variables for audit triggers
  await db.execute(sql`
    SELECT set_config(${AUDIT_SESSION_VARS.userId}, ${userId}, false),
           set_config(${AUDIT_SESSION_VARS.traceId}, ${traceId}, false)
  `)

  await next()  // Execute application code
})

/**
 * @internal - Only for auth middleware user sync operations
 */
export async function withAuditContextAndInfo<T>(
  c: Context<Env>,
  userId: string,
  traceId: string,
  fn: (tx: DbTransaction) => Promise<T>
): Promise<T> {
  const db = c.var.db

  return db.transaction(async (tx) => {
    await tx.execute(sql`
      SELECT set_config(${AUDIT_SESSION_VARS.userId}, ${userId}, true),
             set_config(${AUDIT_SESSION_VARS.traceId}, ${traceId}, true)
    `)
    return fn(tx)
  })
}
