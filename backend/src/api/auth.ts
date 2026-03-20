/**
 * Auth Proxy API
 *
 * Proxies authentication requests to the auth gateway service.
 * This enables the frontend to call /api/auth/* endpoints which get
 * forwarded to the auth service (fake in prototype mode, real in production).
 *
 * Endpoints:
 * POST /api/auth/sign-in/email  - Sign in with email/password
 * POST /api/auth/sign-up/email  - Sign up with email/password
 * POST /api/auth/sign-out       - Sign out
 * GET  /api/auth/get-session    - Get current session
 */
import { Hono } from 'hono'
import type { Env } from '../types/env'

export const authApp = new Hono<Env>()
  // Proxy all auth requests to the auth gateway
  .all('/*', async (c) => {
    // Extract the auth path (everything after /api/auth)
    const fullPath = c.req.path
    const authPath = fullPath.replace(/^\/api\/auth/, '') || '/'

    // Forward the request to auth gateway
    const response = await c.var.gateways.auth.fetchAuthService(c.env, authPath, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' ? c.req.raw.body : null,
    })

    // Clone response headers
    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value)
    })

    // Return the proxied response
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  })

export type AuthApp = typeof authApp
