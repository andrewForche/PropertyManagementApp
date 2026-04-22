import { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from './auth-storage'
import { parseAuthSession } from './jwt'
import type { AuthSession } from './jwt'
import type { UserRole } from './roles'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  token: string | null
  roles: UserRole[]
  primaryRole: UserRole | null
  setToken: (token: string) => void
  clearToken: () => void
  hasAnyRole: (allowedRoles: readonly UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setTokenState] = useState(() => getStoredAuthToken())
  const [session, setSession] = useState(() => parseAuthSession(getStoredAuthToken()))

  useEffect(() => {
    setSession(parseAuthSession(token))
  }, [token])

  function setToken(nextToken: string) {
    const trimmed = nextToken.trim()
    setStoredAuthToken(trimmed)
    setTokenState(trimmed)
  }

  function clearToken() {
    clearStoredAuthToken()
    setTokenState(null)
  }

  const roles = session?.roles ?? []
  const primaryRole = roles[0] ?? null
  const isAuthenticated = Boolean(session?.token) && !session?.isExpired

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        token: session?.token ?? null,
        roles,
        primaryRole,
        setToken,
        clearToken,
        hasAnyRole: (allowedRoles) =>
          allowedRoles.length === 0 || allowedRoles.some((role) => roles.includes(role)),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
