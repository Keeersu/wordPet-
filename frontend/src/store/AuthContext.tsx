/**
 * Auth Context - Global authentication state provider
 *
 * Provides user authentication state to the entire app.
 * On mount, checks for existing session and caches the result.
 */
import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react'
import { getSession, signOut as authSignOut, getCachedUser, type AuthUser } from './authStore'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isLoggedIn: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getCachedUser())
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const sessionUser = await getSession()
      setUser(sessionUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await authSignOut()
    setUser(null)
  }, [])

  // Check session on mount
  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isLoggedIn: !!user,
      refreshSession,
      logout,
    }),
    [user, isLoading, refreshSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
