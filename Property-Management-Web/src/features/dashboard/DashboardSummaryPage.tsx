import { dashboardSummary } from '../../core/interfaces/view'
import { PageSection } from '../../shared/ui/PageSection'

export function DashboardSummaryPage() {
  return (
    <PageSection
      title="Dashboard"
      route="/dashboard"
      description="Landing surface for portfolio health, delinquency, work orders, and team alerts."
      bullets={dashboardSummary.highlights}
    />
  )
}

DashboardSummaryPage.displayName = 'DashboardSummaryPage'
