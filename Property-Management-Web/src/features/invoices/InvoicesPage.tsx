import { PageSection } from '../../shared/ui/PageSection'

export function InvoicesPage() {
  return (
    <PageSection
      title="Invoices"
      route="/invoices"
      description="Space for invoice lists, payment status tracking, and outbound payment links."
      bullets={[
        'Invoice contract matches the future API layer',
        'Collection methods are stubbed in the service module',
        'UI can evolve independently from transport details',
      ]}
    />
  )
}

InvoicesPage.displayName = 'InvoicesPage'
