import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import type { UserRole } from '../../core/auth/roles'

interface ProtectedRouteProps {
  allowedRoles: readonly UserRole[]
  fallback?: ReactNode
  children: ReactNode
}

export function ProtectedRoute({
  allowedRoles,
  fallback,
  children,
}: ProtectedRouteProps) {
  const { hasAnyRole, isAuthenticated, primaryRole } = useAuth()

  useEffect(() => {
    if (isAuthenticated || window.location.pathname === '/login') {
      return
    }

    window.history.replaceState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  if (!hasAnyRole(allowedRoles)) {
    return (
      <>
        {fallback ?? (
          <article className="page-section">
            <div className="page-section-header">
              <div>
                <p className="eyebrow">Access denied</p>
                <h3>Role mismatch</h3>
              </div>
            </div>
            <p>
              Your current role is <strong>{primaryRole ?? 'Unknown'}</strong>. This route
              requires one of: {allowedRoles.join(', ')}.
            </p>
          </article>
        )}
      </>
    )
  }

  return <>{children}</>
}
