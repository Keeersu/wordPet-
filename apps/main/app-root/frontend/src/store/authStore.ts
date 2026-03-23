/**
 * Auth Store - User authentication state management
 *
 * Manages user login/signup/logout via the backend auth service.
 * Works with both:
 * - Browser prototype mode (PGLite + fake auth)
 * - Production mode (real backend + real auth)
 */

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

const AUTH_USER_KEY = 'wordpet_auth_user'

// ─── Auth API Calls ──────────────────────────────────────────────────────────

export async function signIn(email: string, password: string, name?: string): Promise<{ user: AuthUser } | { error: string }> {
  try {
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data?.error?.message || '登录失败' }
    }

    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || 'user',
    }

    // Cache user info locally
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))

    return { user }
  } catch (err) {
    return { error: '网络错误，请重试' }
  }
}

export async function signUp(email: string, password: string, name: string): Promise<{ user: AuthUser } | { error: string }> {
  try {
    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data?.error?.message || '注册失败' }
    }

    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || 'user',
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))

    return { user }
  } catch (err) {
    return { error: '网络错误，请重试' }
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Ignore network errors on sign-out
  }
  localStorage.removeItem(AUTH_USER_KEY)
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/get-session', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      localStorage.removeItem(AUTH_USER_KEY)
      return null
    }

    const data = await response.json()
    if (!data?.user) {
      localStorage.removeItem(AUTH_USER_KEY)
      return null
    }

    const user: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role || 'user',
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    return user
  } catch {
    // Network error, try cached user
    return getCachedUser()
  }
}

export function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

// ─── Game State Sync API ─────────────────────────────────────────────────────

export async function saveGameStateToServer(gameState: unknown): Promise<boolean> {
  try {
    const response = await fetch('/api/game-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameState }),
      credentials: 'include',
    })
    return response.ok
  } catch {
    return false
  }
}

export async function loadGameStateFromServer(): Promise<unknown | null> {
  try {
    const response = await fetch('/api/game-state', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) return null

    const data = await response.json()
    return data?.data?.gameState || null
  } catch {
    return null
  }
}
