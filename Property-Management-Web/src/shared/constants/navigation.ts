import type { UserRole } from '../../core/auth/roles'

export interface FeatureRoute {
  label: string
  path: string
  description: string
  allowedRoles: readonly UserRole[]
}

export const FEATURE_ROUTES: FeatureRoute[] = [
  {
    label: 'My Lease',
    path: '/tenant-dashboard',
    description: 'View your lease, rent, and payments.',
    allowedRoles: ['Tenant'],
  },
  {
    label: 'Dashboard',
    path: '/',
    description: 'Portfolio snapshot, high-priority queues, and quick operational totals.',
    allowedRoles: ['Admin', 'Landlord'],
  },
  {
    label: 'Rent Collection',
    path: '/rent-collection',
    description: 'Track outstanding balances, log reminders, and record incoming rent payments.',
    allowedRoles: ['Admin', 'Landlord'],
  },
  {
    label: 'Rent Records',
    path: '/rent-records',
    description: 'Review ledger-style rent schedules and payment history across the portfolio.',
    allowedRoles: ['Admin', 'Landlord'],
  },
  {
    label: 'Maintenance',
    path: '/maintenance',
    description: 'Manage project pipelines, vendor assignments, and job progress.',
    allowedRoles: ['Admin', 'Landlord', 'Contractor'],
  },
  {
    label: 'Work Logs',
    path: '/work-logs',
    description: 'Audit field activity, proof capture, and time-based maintenance evidence.',
    allowedRoles: ['Admin', 'Landlord', 'Contractor'],
  },
  {
    label: 'Invoices',
    path: '/invoices',
    description: 'Track maintenance billing, payment status, and export readiness.',
    allowedRoles: ['Admin', 'Landlord'],
  },
  {
    label: 'Properties',
    path: '/properties',
    description: 'Manage property records, occupancy status, and monthly rent setup.',
    allowedRoles: ['Admin', 'Landlord'],
  },
  {
    label: 'Tenants',
    path: '/tenants',
    description: 'Manage tenant profiles, lease dates, and property assignments.',
    allowedRoles: ['Admin', 'Landlord'],
  },
]
