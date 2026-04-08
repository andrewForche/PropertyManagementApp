import { PageSection } from '../../shared/ui/PageSection'

export function RentRecordsPage() {
  return (
    <PageSection
      title="Rent Records"
      route="/rent-records"
      description="Foundation for tenant ledgers, payment history, statements, and export workflows."
      bullets={[
        'Ledger-oriented view interfaces are ready to extend',
        'Payment and balance types map cleanly to backend DTOs',
        'Export service layer can be added without moving page code',
      ]}
    />
  )
}

RentRecordsPage.displayName = 'RentRecordsPage'
