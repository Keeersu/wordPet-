
import { pgTable, text, timestamp, uuid, integer, pgEnum, jsonb, index, boolean, varchar } from 'drizzle-orm/pg-core'

// ============================================================================
// User Game Progress
// ============================================================================
// Stores the full gameState (JSONB) per user for cloud sync.
// One row per user — upsert on save.

export const userGameProgress = pgTable('user_game_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  gameState: jsonb('game_state').notNull(),
  version: text('version').notNull().default('1.3'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_game_progress_user_id_idx').on(table.userId),
])
