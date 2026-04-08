import { PageSection } from '../../shared/ui/PageSection'

export function RentCollectionPage() {
  return (
    <PageSection
      title="Rent Collection"
      route="/rent-collection"
      description="Home for rent chase workflows, late fee policy views, communication logs, and notice triggers."
      bullets={[
        'Tenant rent status board scaffold',
        'Reminder and notice action flow placeholder',
        'Timeline-ready communication service hooks',
      ]}
    />
  )
}

RentCollectionPage.displayName = 'RentCollectionPage'
