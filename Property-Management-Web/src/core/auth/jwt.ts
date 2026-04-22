import type { UserRole } from './roles'

const roleClaimKeys = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
] as const

export interface AuthSession {
  token: string
  roles: UserRole[]
  expiresAt: number | null
  isExpired: boolean
  subject: string | null
}

export function parseAuthSession(token: string | null): AuthSession | null {
  if (!token) {
    return null
  }

  const payload = parseTokenPayload(token)
  if (!payload) {
    return null
  }

  const roles = getRolesFromPayload(payload)
  const expiresAt = typeof payload.exp === 'number' ? payload.exp * 1000 : null

  return {
    token,
    roles,
    expiresAt,
    isExpired: expiresAt !== null && expiresAt <= Date.now(),
    subject: getStringClaim(payload.sub) ?? getStringClaim(payload.nameid) ?? null,
  }
}

function parseTokenPayload(token: string) {
  const parts = token.split('.')

  if (parts.length < 2) {
    return null
  }

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')

    return JSON.parse(window.atob(normalized)) as Record<string, unknown>
  } catch {
    return null
  }
}

function getRolesFromPayload(payload: Record<string, unknown>) {
  const discoveredRoles = roleClaimKeys.flatMap((claimKey) => {
    const claimValue = payload[claimKey]

    if (typeof claimValue === 'string') {
      return [claimValue]
    }

    if (Array.isArray(claimValue)) {
      return claimValue.filter((value): value is UserRole => typeof value === 'string')
    }

    return []
  })

  return Array.from(new Set(discoveredRoles)) as UserRole[]
}

function getStringClaim(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}
