/**
 * Game State API
 *
 * Endpoints for saving and loading user game progress.
 * Uses userId from auth session to identify the user.
 *
 * GET  /api/game-state  - Load saved game state for current user
 * POST /api/game-state  - Save/update game state for current user
 */
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import { userGameProgress } from '../schema'

/**
 * Simple auth middleware that extracts userId from auth session.
 * Returns 401 if not authenticated.
 */
async function getUserIdFromSession(c: { var: { gateways: Env['Variables']['gateways'] }; req: { raw: Request }; env: Env['Bindings'] }): Promise<string | null> {
  try {
    const cookie = c.req.raw.headers.get('cookie') || ''
    const authorization = c.req.raw.headers.get('authorization') || ''

    const response = await c.var.gateways.auth.fetchAuthService(c.env, '/get-session', {
      method: 'GET',
      headers: {
        cookie,
        authorization,
      },
    })

    if (!response.ok) return null

    const data = await response.json() as { user?: { id?: string } }
    return data?.user?.id || null
  } catch {
    return null
  }
}

export const gameStateApp = new Hono<Env>()
  // GET /api/game-state - Load saved game state
  .get('/', async (c) => {
    const userId = await getUserIdFromSession(c)
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const db = c.var.db
    const result = await db
      .select()
      .from(userGameProgress)
      .where(eq(userGameProgress.userId, userId))
      .limit(1)

    if (result.length === 0) {
      return c.json({ data: null, message: 'No saved progress found' })
    }

    return c.json({
      data: {
        gameState: result[0].gameState,
        version: result[0].version,
        updatedAt: result[0].updatedAt,
      },
    })
  })

  // POST /api/game-state - Save/update game state
  .post('/', async (c) => {
    const userId = await getUserIdFromSession(c)
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json() as { gameState: unknown; version?: string }
    if (!body.gameState) {
      return c.json({ error: 'Missing gameState in request body' }, 400)
    }

    const db = c.var.db
    const now = new Date()
    const version = body.version || '1.3'

    // Upsert: insert or update based on userId
    const existing = await db
      .select({ id: userGameProgress.id })
      .from(userGameProgress)
      .where(eq(userGameProgress.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(userGameProgress)
        .set({
          gameState: body.gameState,
          version,
          updatedAt: now,
        })
        .where(eq(userGameProgress.userId, userId))
    } else {
      // Insert new record
      await db
        .insert(userGameProgress)
        .values({
          userId,
          gameState: body.gameState,
          version,
          updatedAt: now,
          createdAt: now,
        })
    }

    return c.json({
      success: true,
      message: 'Game state saved',
      updatedAt: now.toISOString(),
    })
  })

export type GameStateApp = typeof gameStateApp
