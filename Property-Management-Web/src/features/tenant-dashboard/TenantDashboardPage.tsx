import { useEffect, useState } from 'react'
import type { RentPaymentModel, RentScheduleModel, TenantModel } from '../../core/interfaces/api'
import { rentService } from '../../core/services/rent/rent.service'
import { tenantService } from '../../core/services/tenants/tenant.service'

export function TenantDashboardPage() {
  const [tenant, setTenant] = useState<TenantModel | null>(null)
  const [payments, setPayments] = useState<RentPaymentModel[]>([])
  const [schedules, setSchedules] = useState<RentScheduleModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadTenantDashboard()
  }, [])

  async function loadTenantDashboard() {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      const [tenantResponse, paymentResponse, scheduleResponse] = await Promise.all([
        tenantService.getMe(),
        rentService.getMyPayments(),
        rentService.getMySchedules(),
      ])

      setTenant(tenantResponse)
      setPayments(paymentResponse)
      setSchedules(scheduleResponse)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <article className="page-section tenant-dashboard-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Tenant Portal</p>
          <h3>My Lease</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Private tenant view</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadTenantDashboard()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        Review your lease details, upcoming rent obligations, and payment history in one
        place.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
      {isLoading ? <p className="status-message">Loading your tenant information...</p> : null}

      {tenant ? (
        <div className="tenant-dashboard-layout">
          <section className="dashboard-panel dashboard-panel-wide">
            <div className="dashboard-panel-header">
              <div>
                <p className="eyebrow">Lease Profile</p>
                <h4>{tenant.fullName}</h4>
              </div>
              <span className={`status-pill ${toTenantStatusClass(tenant.tenantStatus)}`}>
                {tenant.tenantStatus.replace('_', ' ')}
              </span>
            </div>

            <dl className="property-details tenant-lease-details">
              <div>
                <dt>Property</dt>
                <dd>{tenant.propertyName}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{tenant.addressLine1}</dd>
              </div>
              <div>
                <dt>Unit</dt>
                <dd>{tenant.unitNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt>Lease Start</dt>
                <dd>{formatDate(tenant.leaseStartDate)}</dd>
              </div>
              <div>
                <dt>Lease End</dt>
                <dd>{formatDate(tenant.leaseEndDate)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{tenant.email}</dd>
              </div>
            </dl>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="eyebrow">Payment History</p>
                <h4>Payments</h4>
              </div>
              <span className="panel-caption">{payments.length} recorded</span>
            </div>

            {payments.length === 0 ? (
              <p className="status-message">No payments are available yet.</p>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.paymentId}>
                        <td>{formatDate(payment.paymentDate)}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{payment.referenceNumber || 'N/A'}</td>
                        <td>{formatCurrency(payment.amountPaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="eyebrow">Rent Schedule</p>
                <h4>Upcoming Charges</h4>
              </div>
              <span className="panel-caption">{schedules.length} entries</span>
            </div>

            {schedules.length === 0 ? (
              <p className="status-message">No rent schedules are available yet.</p>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Base Rent</th>
                      <th>Late Fee</th>
                      <th>Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((schedule) => (
                      <tr key={schedule.scheduleId}>
                        <td>{formatDate(schedule.dueDate)}</td>
                        <td>
                          <span className={`status-pill ${toScheduleStatusClass(schedule.scheduleStatus)}`}>
                            {schedule.scheduleStatus}
                          </span>
                        </td>
                        <td>{formatCurrency(schedule.baseRent)}</td>
                        <td>{formatCurrency(schedule.lateFeeAmount)}</td>
                        <td>{formatCurrency(schedule.balanceDue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </article>
  )
}

TenantDashboardPage.displayName = 'TenantDashboardPage'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value?: string) {
  if (!value) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading your tenant dashboard.'
}

function toScheduleStatusClass(status: RentScheduleModel['scheduleStatus']) {
  switch (status) {
    case 'Paid':
      return 'occupied'
    case 'Late':
      return 'danger'
    case 'Partial':
      return 'warning'
    default:
      return 'maintenance'
  }
}

function toTenantStatusClass(status: TenantModel['tenantStatus']) {
  switch (status) {
    case 'active':
      return 'occupied'
    case 'past_due':
      return 'warning'
    case 'former':
      return 'danger'
    default:
      return 'maintenance'
  }
}
