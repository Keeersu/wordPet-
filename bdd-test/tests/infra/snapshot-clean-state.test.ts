import { describe, it, expect } from 'vitest'
import { getPgliteClientForTest } from '@backend/infra/gateway/fake'
import { getTestFileId } from '@bdd-test/helper'

describe('Snapshot clean state', () => {
  it('starts with empty tables after reset', async () => {
    const testId = getTestFileId()
    const client = await getPgliteClientForTest(testId)

    const allTables = await client.query<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    for (const { tablename } of allTables.rows) {
      const { rows } = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM "${tablename}"`
      )
      expect(rows[0]?.count, `table "${tablename}" should be empty`).toBe(0)
    }
  })
})
