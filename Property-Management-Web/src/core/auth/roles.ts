export const USER_ROLES = ['Admin', 'Contractor', 'Landlord', 'Tenant'] as const

export type UserRole = (typeof USER_ROLES)[number]
