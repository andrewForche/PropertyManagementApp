import { PageSection } from '../../shared/ui/PageSection'

export function TenantsPage() {
  return (
    <PageSection
      title="Tenants"
      route="/tenants"
      description="Scaffold for tenant profiles, lease context, balances, and communication history."
      bullets={[
        'Tenant contracts support backend-synced and frontend-only fields',
        'Feature structure supports list and detail routes later',
        'Rent and communication modules can depend on the same typed model',
      ]}
    />
  )
}

TenantsPage.displayName = 'TenantsPage'
