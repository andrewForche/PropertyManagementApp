import { useEffect, useState } from 'react'
import type { RentPaymentModel, RentScheduleModel } from '../../core/interfaces/api'
import { rentService } from '../../core/services/rent/rent.service'

export function RentRecordsPage() {
  const [schedules, setSchedules] = useState<RentScheduleModel[]>([])
  const [payments, setPayments] = useState<RentPaymentModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadRentRecords()
  }, [])

  async function loadRentRecords() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const [scheduleData, paymentData] = await Promise.all([
        rentService.getSchedules(),
        rentService.getPayments(),
      ])
      setSchedules(scheduleData)
      setPayments(paymentData)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const scheduledTotal = schedules.reduce(
    (sum, schedule) => sum + schedule.baseRent + schedule.lateFeeAmount,
    0,
  )
  const receivedTotal = payments.reduce((sum, payment) => sum + payment.amountPaid, 0)
  const outstandingTotal = schedules.reduce(
    (sum, schedule) => sum + schedule.balanceDue,
    0,
  )
  const paidSchedules = schedules.filter((schedule) => schedule.scheduleStatus === 'Paid').length
  const openSchedules = schedules.length - paidSchedules

  return (
    <article className="page-section rent-records-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Live Feature</p>
          <h3>Rent Records</h3>
        </div>
        <div className="dashboard-actions">
          <code>/api/rent-schedules + /api/rent-payments</code>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadRentRecords()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This module gives us the ledger-style view of scheduled rent, payment history,
        remaining balances, and current collection status across the portfolio.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <section className="dashboard-kpis" aria-label="Rent record metrics">
        <DashboardMetric label="Scheduled" value={formatCurrency(scheduledTotal)} tone="default" />
        <DashboardMetric label="Received" value={formatCurrency(receivedTotal)} tone="success" />
        <DashboardMetric label="Outstanding" value={formatCurrency(outstandingTotal)} tone="danger" />
        <DashboardMetric label="Paid Schedules" value={String(paidSchedules)} tone="success" />
        <DashboardMetric label="Open Schedules" value={String(openSchedules)} tone="warning" />
      </section>

      <div className="dashboard-layout">
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header">
            <div>
              <p className="eyebrow">Ledger View</p>
              <h4>Scheduled rent records</h4>
            </div>
          </div>

          {isLoading ? <p className="status-message">Loading rent records...</p> : null}

          {!isLoading && schedules.length === 0 ? (
            <p className="status-message">No rent schedules returned yet.</p>
          ) : null}

          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Base Rent</th>
                  <th>Late Fee</th>
                  <th>Balance</th>
                  <th>Reminders</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.scheduleId}>
                    <td>{schedule.tenantName}</td>
                    <td>
                      {schedule.propertyName}
                      <br />
                      <span className="table-subtext">
                        {schedule.addressLine1}
                        {schedule.unitNumber ? `, ${schedule.unitNumber}` : ''}
                      </span>
                    </td>
                    <td>{formatDate(schedule.dueDate)}</td>
                    <td>
                      <span className={`status-pill ${toStatusClass(schedule.scheduleStatus)}`}>
                        {schedule.scheduleStatus}
                      </span>
                    </td>
                    <td>{formatCurrency(schedule.baseRent)}</td>
                    <td>{formatCurrency(schedule.lateFeeAmount)}</td>
                    <td>{formatCurrency(schedule.balanceDue)}</td>
                    <td>{schedule.reminderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header">
            <div>
              <p className="eyebrow">Payment History</p>
              <h4>Recorded rent payments</h4>
            </div>
          </div>

          {!isLoading && payments.length === 0 ? (
            <p className="status-message">No rent payments returned yet.</p>
          ) : null}

          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Schedule Id</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Payment Date</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{payment.tenantName}</td>
                    <td>{payment.scheduleId}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{formatCurrency(payment.amountPaid)}</td>
                    <td>{formatDateTime(payment.paymentDate)}</td>
                    <td>{payment.referenceNumber || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </article>
  )
}

RentRecordsPage.displayName = 'RentRecordsPage'

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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US')
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US')
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading rent record data.'
}

function toStatusClass(status: RentScheduleModel['scheduleStatus']) {
  switch (status) {
    case 'Paid':
      return 'occupied'
    case 'Partial':
      return 'maintenance'
    case 'Late':
      return 'danger'
    case 'Unpaid':
      return 'vacant'
  }
}
