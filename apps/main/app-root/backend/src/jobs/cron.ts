
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../types/env'
import { logger } from '../middlewares/logger'



interface CronJobConfig {
  name: string
  schedule: string
  endpoint: string
  description: string
  execute: (c: Context<Env>) => Promise<unknown>
}

/**
 * Cron job configurations
 * Add new job configs here, with statically imported execute functions
 */
export const CRON_JOBS: readonly CronJobConfig[] = [


]

async function getConfigVersion(): Promise<string> {
  const content = JSON.stringify(
    CRON_JOBS.map((j) => ({
      name: j.name,
      schedule: j.schedule,
      endpoint: j.endpoint,
    }))
  )
  const data = new TextEncoder().encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  return Array.from(hashArray.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Use chained route definitions so `typeof cronApp` carries full route type information,
// enabling type-safe hc() clients in tests and other consumers.
export const cronApp = new Hono<Env>()
  .get('/', async (c) => {
    return c.json({
      jobs: CRON_JOBS.map(({ execute, ...config }) => config),
      version: await getConfigVersion(),
      appId: c.env.PARAFLOW_APP_ID,
    })
  })
  .post('/:jobName', async (c) => {
    const jobName = c.req.param('jobName')

    const job = CRON_JOBS.find(j => j.name === jobName)
    if (!job) {
      return c.json({ error: `Job "${jobName}" not found` }, 404)
    }

    try {
      logger.info(`[Cron] Executing job: ${jobName}`)

      const result = await job.execute(c)

      logger.info(`[Cron] Job completed: ${jobName}`)

      return c.json({
        success: true,
        jobName,
        result,
        triggeredAt: new Date().toISOString(),
      })

    } catch (error) {
      logger.error(`[Cron] Job failed: ${jobName}`, {
        error: error instanceof Error ? error.message : String(error),
      })

      return c.json({
        success: false,
        jobName,
        error: error instanceof Error ? error.message : String(error),
      }, 500)
    }
  })

export type CronApp = typeof cronApp
