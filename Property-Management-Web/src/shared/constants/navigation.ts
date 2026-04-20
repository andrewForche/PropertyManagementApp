export interface FeatureRoute {
  label: string
  path: string
  description: string
}

export const FEATURE_ROUTES: FeatureRoute[] = [
  {
    label: 'Dashboard',
    path: '/',
    description: 'Portfolio snapshot, high-priority queues, and quick operational totals.',
  },
  {
    label: 'Rent Collection',
    path: '/rent-collection',
    description: 'Track outstanding balances, log reminders, and record incoming rent payments.',
  },
  {
    label: 'Rent Records',
    path: '/rent-records',
    description: 'Review ledger-style rent schedules and payment history across the portfolio.',
  },
  {
    label: 'Maintenance',
    path: '/maintenance',
    description: 'Manage project pipelines, vendor assignments, and job progress.',
  },
  {
    label: 'Work Logs',
    path: '/work-logs',
    description: 'Audit field activity, proof capture, and time-based maintenance evidence.',
  },
  {
    label: 'Invoices',
    path: '/invoices',
    description: 'Track maintenance billing, payment status, and export readiness.',
  },
  {
    label: 'Properties',
    path: '/properties',
    description: 'Manage property records, occupancy status, and monthly rent setup.',
  },
  {
    label: 'Tenants',
    path: '/tenants',
    description: 'Manage tenant profiles, lease dates, and property assignments.',
  },
]
