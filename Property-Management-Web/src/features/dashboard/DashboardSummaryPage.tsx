import { useEffect, useState } from 'react'
import type { PropertyModel } from '../../core/interfaces/api'
import {
  dashboardActivity,
  dashboardMaintenanceQueue,
  dashboardRentChaseQueue,
} from '../../core/interfaces/view'
import { propertyService } from '../../core/services/properties/property.service'

export function DashboardSummaryPage() {
  const [properties, setProperties] = useState<PropertyModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const propertyData = await propertyService.getAll()
      setProperties(propertyData)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const occupiedCount = properties.filter(
    (property) => property.occupancyStatus === 'occupied',
  ).length
  const vacantCount = properties.filter(
    (property) => property.occupancyStatus === 'vacant',
  ).length
  const maintenanceCount = properties.filter(
    (property) => property.occupancyStatus === 'maintenance',
  ).length
  const totalScheduledRent = properties.reduce(
    (total, property) => total + property.monthlyRent,
    0,
  )

  return (
    <article className="page-section dashboard-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Operations Hub</p>
          <h3>Dashboard</h3>
        </div>
        <div className="dashboard-actions">
          <code>/dashboard</code>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadDashboard()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This dashboard is the quick-glance operating center for portfolio health,
        rent follow-up, maintenance triage, and recent activity.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <section className="dashboard-kpis" aria-label="Portfolio metrics">
        <DashboardMetric
          label="Properties"
          value={isLoading ? '...' : String(properties.length)}
          tone="default"
        />
        <DashboardMetric
          label="Occupied"
          value={isLoading ? '...' : String(occupiedCount)}
          tone="success"
        />
        <DashboardMetric
          label="Vacant"
          value={isLoading ? '...' : String(vacantCount)}
          tone="warning"
        />
        <DashboardMetric
          label="Maintenance"
          value={isLoading ? '...' : String(maintenanceCount)}
          tone="danger"
        />
        <DashboardMetric
          label="Scheduled Rent"
          value={isLoading ? '...' : formatCurrency(totalScheduledRent)}
          tone="default"
        />
      </section>

      <div className="dashboard-layout">
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header">
            <div>
              <p className="eyebrow">Live Portfolio</p>
              <h4>Property snapshot</h4>
            </div>
            <span className="panel-caption">Pulled from `/api/properties`</span>
          </div>

          {isLoading ? <p className="status-message">Loading portfolio data...</p> : null}

          {!isLoading && properties.length === 0 ? (
            <p className="status-message">
              No properties are loaded yet. Add property records to populate the
              dashboard.
            </p>
          ) : null}

          {properties.length > 0 ? (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Address</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Rent</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.slice(0, 6).map((property) => (
                    <tr key={property.propertyId}>
                      <td>{property.propertyName}</td>
                      <td>{property.addressLine1}</td>
                      <td>{property.unitNumber || 'N/A'}</td>
                      <td>
                        <span className={`status-pill ${property.occupancyStatus}`}>
                          {property.occupancyStatus}
                        </span>
                      </td>
                      <td>{formatCurrency(property.monthlyRent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <DashboardQueueTable
          title="Rent chase queue"
          subtitle="Immediate follow-up"
          columns={['Tenant', 'Step', 'Due', 'Balance']}
          rows={dashboardRentChaseQueue}
        />

        <DashboardQueueTable
          title="Maintenance watchlist"
          subtitle="Proof-based workflow"
          columns={['Property', 'Project', 'Status', 'Vendor']}
          rows={dashboardMaintenanceQueue}
        />

        <DashboardQueueTable
          title="Recent activity"
          subtitle="Audit trail preview"
          columns={['When', 'Type', 'Summary', 'Owner']}
          rows={dashboardActivity}
        />
      </div>
    </article>
  )
}

DashboardSummaryPage.displayName = 'DashboardSummaryPage'

function DashboardMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'default' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className={`dashboard-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DashboardQueueTable({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string
  subtitle: string
  columns: string[]
  rows: string[][]
}) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h4>{title}</h4>
        </div>
      </div>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join('-')}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading dashboard data.'
}
