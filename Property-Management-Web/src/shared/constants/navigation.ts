export interface FeatureRoute {
  label: string
  path: string
}

export const FEATURE_ROUTES: FeatureRoute[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Rent Collection', path: '/rent-collection' },
  { label: 'Rent Records', path: '/rent-records' },
  { label: 'Maintenance', path: '/maintenance' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Properties', path: '/properties' },
  { label: 'Tenants', path: '/tenants' },
]
