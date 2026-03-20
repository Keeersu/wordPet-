import { PGlite } from '@electric-sql/pglite'
import path from 'node:path'
import {
  validateJournalSnapshotConsistency,
  getDataMigrationGuide,
  getLastJournalIdx,
} from '../../../lib/migrationValidator'
import { migrations } from '../../../../drizzle/migrations'
import { AUDIT_SESSION_VARS } from '../../../middlewares/db'

const _dbInst = new Map<string, Promise<PGlite>>()

// __dirname in Vite test environment points to backend/src/infra/gateway/testing
// Navigate up to backend root
const BACKEND_ROOT = path.join(__dirname, '..', '..', '..', '..')
const DRIZZLE_DIR = path.join(BACKEND_ROOT, 'drizzle')

/**
 * Load all SQL migration files and validate consistency.
 * Called once per PGlite instance creation (once per test file in fork mode).
 */
function getMigrationSQL(): string {
    const validation = validateJournalSnapshotConsistency(DRIZZLE_DIR)
    if (!validation.valid) {
        const lastIdx = getLastJournalIdx(DRIZZLE_DIR)
        const errorMsg = [
            '',
            '❌ Migration file consistency check failed!',
            '',
            'Errors:',
            ...validation.errors.map((e) => `  - ${e}`),
            '',
            getDataMigrationGuide(lastIdx),
        ].join('\n')
        throw new Error(errorMsg)
    }
    return migrations.join('\n')
}

async function truncateAllPublicTables(client: PGlite): Promise<void> {
  const { rows } = await client.query<{ tablename: string }>(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `)

  for (const { tablename } of rows) {
    // Table names come from pg_tables under public schema.
    // Quote identifiers to keep SQL safe for mixed-case names.
    await client.exec(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`)
  }
}

export const getPgliteClientForTest = (testId: string) => {
  if (_dbInst.has(testId)) {
    return _dbInst.get(testId)!
  }
  const f = async () => {
    // Create PGlite and run migrations directly.
    // Migration SQL is only ~20ms; the real cost is PGlite WASM bootstrap (~500-700ms).
    // Snapshot (dumpDataDir/loadDataDir) was removed because:
    //   - dumpDataDir costs ~300ms but each fork only restores once
    //   - Net effect: snapshot adds overhead in single-restore scenarios
    const client = new PGlite()
    await client.waitReady

    // Get statements to execute
    const sql = getMigrationSQL()
    const statements = sql.split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    // Execute each statement
    for (const stmt of statements) {
      await client.exec(stmt)
    }

    // Clean state: schema exists, all data from migration SQL removed.
    await truncateAllPublicTables(client)

    return client
  }
  const res = f()
  _dbInst.set(testId, res)
  return res
}

/**
 * Reset database state for a test.
 * Truncates all public tables to restore clean state, reusing the existing
 * PGlite instance. TRUNCATE is near-instant (~15-25ms).
 *
 * This enables file-level DB sharing: all tests in a file use
 * the same database, but each test starts from an empty dataset.
 */
export async function resetDatabaseForTest(testId: string) {
  // Only reset if DB already exists (avoid creating unnecessary instances)
  if (!_dbInst.has(testId)) {
    return
  }

  // Reuse existing client — truncate tables for clean state.
  const client = await _dbInst.get(testId)!
  await truncateAllPublicTables(client)

  // Clear stale session variables left by previous tests.
  // setupAuditContextMiddleware uses set_config(..., false) which sets
  // connection-level (not transaction-level) variables. Since PGLite
  // instances are reused across tests, a stale app.user_id from a
  // previous test would cause audit_before_trigger to write a user ID
  // that no longer exists after TRUNCATE → FK violation on created_by/updated_by.
  await client.query(`SELECT set_config('${AUDIT_SESSION_VARS.userId}', '', false), set_config('${AUDIT_SESSION_VARS.traceId}', '', false)`)
}
