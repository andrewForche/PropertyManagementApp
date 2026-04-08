import { FEATURE_ROUTES } from '../shared/constants/navigation'
import { AppEnvironmentSummary } from './config/AppEnvironmentSummary'
import { DashboardSummaryPage } from '../features/dashboard/DashboardSummaryPage'
import { RentCollectionPage } from '../features/rent-collection/RentCollectionPage'
import { RentRecordsPage } from '../features/rent-records/RentRecordsPage'
import { MaintenanceProjectsPage } from '../features/maintenance/MaintenanceProjectsPage'
import { InvoicesPage } from '../features/invoices/InvoicesPage'
import { PropertiesPage } from '../features/properties/PropertiesPage'
import { TenantsPage } from '../features/tenants/TenantsPage'

const pages = [
  DashboardSummaryPage,
  RentCollectionPage,
  RentRecordsPage,
  MaintenanceProjectsPage,
  InvoicesPage,
  PropertiesPage,
  TenantsPage,
]

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Property Management App</p>
          <h1>Frontend foundation scaffold</h1>
          <p className="lead">
            React pages, typed interfaces, and service connectors are in place so we
            can wire the API and database in without reshaping the frontend.
          </p>
        </div>

        <nav aria-label="Primary">
          <ul className="nav-list">
            {FEATURE_ROUTES.map((route) => (
              <li key={route.path}>
                <a href={route.path}>{route.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <AppEnvironmentSummary />
      </aside>

      <main className="content">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Scaffold Status</p>
            <h2>Ready for API and database integration</h2>
          </div>
          <div className="hero-metrics" aria-label="Scaffold summary">
            <div>
              <strong>7</strong>
              <span>feature modules</span>
            </div>
            <div>
              <strong>2</strong>
              <span>model layers</span>
            </div>
            <div>
              <strong>1</strong>
              <span>shared service gateway</span>
            </div>
          </div>
        </section>

        <section className="page-grid" aria-label="Feature scaffold preview">
          {pages.map((PageComponent) => (
            <PageComponent key={PageComponent.displayName} />
          ))}
        </section>
      </main>
    </div>
  )
}
