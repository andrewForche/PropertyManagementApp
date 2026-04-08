import { PageSection } from '../../shared/ui/PageSection'

export function PropertiesPage() {
  return (
    <PageSection
      title="Properties"
      route="/properties"
      description="Core property directory scaffold for units, occupancy, addresses, and property-level reporting."
      bullets={[
        'Property model layer is separated from UI display shapes',
        'Feature folder is ready for list, detail, and edit screens',
        'Service file will be the connector to CRUD endpoints',
      ]}
    />
  )
}

PropertiesPage.displayName = 'PropertiesPage'
