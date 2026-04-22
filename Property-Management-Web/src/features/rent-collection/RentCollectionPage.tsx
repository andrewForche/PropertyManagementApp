import { useEffect, useState } from 'react'
import type {
  CreateRentPaymentRequest,
  RentPaymentModel,
  RentScheduleModel,
  UpdateRentScheduleRequest,
} from '../../core/interfaces/api'
import { rentService } from '../../core/services/rent/rent.service'
import { AppModal } from '../../shared/ui/AppModal'
import { RoleWrapper } from '../../shared/auth/RoleWrapper'
import { CollapseToggleButton } from '../../shared/ui/CollapseToggleButton'
import { useToast } from '../../shared/ui/ToastProvider'

const emptyPaymentForm: CreateRentPaymentRequest = {
  scheduleId: 0,
  amountPaid: 0,
  paymentMethod: 'ACH',
  paymentDate: new Date().toISOString().slice(0, 16),
  referenceNumber: '',
}

export function RentCollectionPage() {
  const { showError, showSuccess } = useToast()
  const [schedules, setSchedules] = useState<RentScheduleModel[]>([])
  const [payments, setPayments] = useState<RentPaymentModel[]>([])
  const [paymentForm, setPaymentForm] = useState<CreateRentPaymentRequest>(emptyPaymentForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBoardExpanded, setIsBoardExpanded] = useState(true)
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadRentCollection()
  }, [])

  useEffect(() => {
    if (schedules.length > 0 && paymentForm.scheduleId === 0) {
      setPaymentForm((current) => ({
        ...current,
        scheduleId: schedules[0].scheduleId,
      }))
    }
  }, [paymentForm.scheduleId, schedules])

  async function loadRentCollection() {
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

  async function handleRecordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setErrorMessage(null)
      await rentService.createPayment({
        ...paymentForm,
        referenceNumber: paymentForm.referenceNumber?.trim() || undefined,
      })
      setPaymentForm({
        ...emptyPaymentForm,
        scheduleId: paymentForm.scheduleId,
        paymentDate: new Date().toISOString().slice(0, 16),
      })
      setIsModalOpen(false)
      showSuccess('Payment recorded', 'The payment was logged successfully.')
      await loadRentCollection()
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showError('Payment request failed', message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogReminder(schedule: RentScheduleModel) {
    const payload: UpdateRentScheduleRequest = {
      scheduleStatus: schedule.scheduleStatus,
      lateFeeAmount: schedule.lateFeeAmount,
      balanceDue: schedule.balanceDue,
      reminderCount: schedule.reminderCount + 1,
    }

    try {
      setErrorMessage(null)
      await rentService.updateSchedule(schedule.scheduleId, payload)
      showSuccess('Reminder logged', 'The rent reminder count was updated.')
      await loadRentCollection()
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showError('Reminder update failed', message)
    }
  }

  const outstandingBalance = schedules.reduce(
    (sum, schedule) => sum + schedule.balanceDue,
    0,
  )
  const lateCount = schedules.filter((schedule) => schedule.scheduleStatus === 'Late').length
  const unpaidCount = schedules.filter(
    (schedule) => schedule.scheduleStatus === 'Unpaid',
  ).length
  const partialCount = schedules.filter(
    (schedule) => schedule.scheduleStatus === 'Partial',
  ).length

  function openCreateModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setPaymentForm((current) => ({
      ...emptyPaymentForm,
      scheduleId: current.scheduleId || schedules[0]?.scheduleId || 0,
      paymentDate: new Date().toISOString().slice(0, 16),
    }))
  }

  return (
    <article className="page-section rent-collection-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Collections</p>
          <h3>Rent Collection</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Collections Workspace</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadRentCollection()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This module tracks rent status, reminders, and incoming payments for the
        current rent chase workflow.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <section className="dashboard-kpis" aria-label="Rent collection metrics">
        <DashboardMetric label="Outstanding" value={formatCurrency(outstandingBalance)} tone="danger" />
        <DashboardMetric label="Late" value={String(lateCount)} tone="danger" />
        <DashboardMetric label="Unpaid" value={String(unpaidCount)} tone="warning" />
        <DashboardMetric label="Partial" value={String(partialCount)} tone="warning" />
        <DashboardMetric label="Payments Logged" value={String(payments.length)} tone="success" />
      </section>

      <div className="single-panel-layout">
        <section
          className={`property-list-panel collapsible-panel ${isBoardExpanded ? '' : 'collapsed'}`}
          onClick={() => {
            if (!isBoardExpanded) {
              setIsBoardExpanded(true)
            }
          }}
        >
          <div className="property-list-header" onClick={(event) => event.stopPropagation()}>
            <h4>Rent Chase Board</h4>
            <CollapseToggleButton
              isExpanded={isBoardExpanded}
              onClick={() => setIsBoardExpanded((current) => !current)}
              collapseLabel="Collapse rent chase board"
              expandLabel="Expand rent chase board"
            />
          </div>

          {isBoardExpanded ? (
            <>
              {isLoading ? <p className="status-message">Loading rent schedules...</p> : null}

              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Property</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th>Balance</th>
                      <th>Reminders</th>
                      <th>Action</th>
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
                        <td>
                          <span
                            className={`status-pill ${toStatusClass(schedule.scheduleStatus)}`}
                          >
                            {schedule.scheduleStatus}
                          </span>
                        </td>
                        <td>{formatDate(schedule.dueDate)}</td>
                        <td>{formatCurrency(schedule.balanceDue)}</td>
                        <td>{schedule.reminderCount}</td>
                        <td>
                          <RoleWrapper allowedRoles={['Admin', 'Landlord']}>
                            <button
                              type="button"
                              className="secondary-button compact-button"
                              onClick={() => void handleLogReminder(schedule)}
                            >
                              Log Reminder
                            </button>
                          </RoleWrapper>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      </div>

      <section
        className={`dashboard-panel dashboard-panel-wide collapsible-panel ${isPaymentsExpanded ? '' : 'collapsed'}`}
        onClick={() => {
          if (!isPaymentsExpanded) {
            setIsPaymentsExpanded(true)
          }
        }}
      >
        <div className="dashboard-panel-header" onClick={(event) => event.stopPropagation()}>
          <div>
            <p className="eyebrow">Recent Payments</p>
            <h4>Payment activity</h4>
          </div>
          <div className="dashboard-actions">
            <RoleWrapper allowedRoles={['Admin', 'Landlord']}>
              <button
                type="button"
                className="primary-button"
                onClick={openCreateModal}
                disabled={schedules.length === 0}
              >
                Add Payment
              </button>
            </RoleWrapper>
            <CollapseToggleButton
              isExpanded={isPaymentsExpanded}
              onClick={() => setIsPaymentsExpanded((current) => !current)}
              collapseLabel="Collapse payment activity"
              expandLabel="Expand payment activity"
            />
          </div>
        </div>
        {isPaymentsExpanded ? (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{payment.tenantName}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{formatCurrency(payment.amountPaid)}</td>
                    <td>{formatDateTime(payment.paymentDate)}</td>
                    <td>{payment.referenceNumber || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <AppModal
        title="Record Payment"
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form className="property-form" onSubmit={handleRecordPayment}>
          <label>
            Rent Schedule
            <select
              value={paymentForm.scheduleId}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  scheduleId: Number(event.target.value),
                }))
              }
            >
              {schedules.map((schedule) => (
                <option key={schedule.scheduleId} value={schedule.scheduleId}>
                  {schedule.tenantName} - {schedule.propertyName} - {formatCurrency(schedule.balanceDue)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Amount Paid
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={paymentForm.amountPaid}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  amountPaid: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            Payment Method
            <select
              value={paymentForm.paymentMethod}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  paymentMethod: event.target.value as CreateRentPaymentRequest['paymentMethod'],
                }))
              }
            >
              <option value="ACH">ACH</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
            </select>
          </label>

          <label>
            Payment Date
            <input
              type="datetime-local"
              required
              value={paymentForm.paymentDate}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  paymentDate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Reference Number
            <input
              value={paymentForm.referenceNumber ?? ''}
              onChange={(event) =>
                setPaymentForm((current) => ({
                  ...current,
                  referenceNumber: event.target.value,
                }))
              }
            />
          </label>

          <button type="submit" className="primary-button" disabled={isSaving || schedules.length === 0}>
            {isSaving ? 'Recording...' : 'Record Payment'}
          </button>
        </form>
      </AppModal>
    </article>
  )
}

RentCollectionPage.displayName = 'RentCollectionPage'

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

  return 'Something went wrong while loading rent collection data.'
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
