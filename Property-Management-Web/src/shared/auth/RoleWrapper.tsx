import type { PropsWithChildren, ReactNode } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import type { UserRole } from '../../core/auth/roles'

interface RoleWrapperProps extends PropsWithChildren {
  allowedRoles: readonly UserRole[]
  fallback?: ReactNode
}

export function RoleWrapper({
  allowedRoles,
  fallback = null,
  children,
}: RoleWrapperProps) {
  const { hasAnyRole } = useAuth()

  if (!hasAnyRole(allowedRoles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
