import { PageSection } from '../../shared/ui/PageSection'

export function MaintenanceProjectsPage() {
  return (
    <PageSection
      title="Maintenance Projects"
      route="/maintenance"
      description="Scaffold for bids, work orders, proof-based logs, invoices, and vendor coordination."
      bullets={[
        'Project, work log, and evidence interfaces are separated for clarity',
        'Service connectors are ready for vendor, project, and invoice endpoints',
        'Proof workflow can layer in photos, GPS, and timestamps later',
      ]}
    />
  )
}

MaintenanceProjectsPage.displayName = 'MaintenanceProjectsPage'
