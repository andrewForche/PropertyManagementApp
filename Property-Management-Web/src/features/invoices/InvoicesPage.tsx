import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  CreateInvoiceRequest,
  InvoiceModel,
  InvoiceProjectOptionModel,
  UpdateInvoiceRequest,
} from '../../core/interfaces/api'
import { invoiceService } from '../../core/services/invoices/invoice.service'
import { AppModal } from '../../shared/ui/AppModal'
import { ConfirmationModal } from '../../shared/ui/ConfirmationModal'
import { CollapseToggleButton } from '../../shared/ui/CollapseToggleButton'
import { useToast } from '../../shared/ui/ToastProvider'

const emptyForm: CreateInvoiceRequest = {
  projectId: 0,
  totalAmount: 0,
  invoiceStatus: 'Draft',
  issuedOn: '',
  paidOn: '',
  isExported: false,
}

export function InvoicesPage() {
  const { showError, showSuccess } = useToast()
  const [invoices, setInvoices] = useState<InvoiceModel[]>([])
  const [projectOptions, setProjectOptions] = useState<InvoiceProjectOptionModel[]>([])
  const [form, setForm] = useState<CreateInvoiceRequest>(emptyForm)
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null)
  const [pendingDeleteInvoiceId, setPendingDeleteInvoiceId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRecordsExpanded, setIsRecordsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadInvoicesModule()
  }, [])

  useEffect(() => {
    if (projectOptions.length > 0 && form.projectId === 0) {
      setForm((current) => ({
        ...current,
        projectId: projectOptions[0].projectId,
      }))
    }
  }, [form.projectId, projectOptions])

  async function loadInvoicesModule() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const [invoiceData, projectData] = await Promise.all([
        invoiceService.getAll(),
        invoiceService.getProjectOptions(),
      ])
      setInvoices(invoiceData)
      setProjectOptions(projectData)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setErrorMessage(null)

      const payload = normalizeForm(form)

      if (editingInvoiceId === null) {
        await invoiceService.create(payload)
        showSuccess('Invoice created', 'The invoice record was added successfully.')
      } else {
        const updatePayload: UpdateInvoiceRequest = { ...payload }
        await invoiceService.update(editingInvoiceId, updatePayload)
        showSuccess('Invoice updated', 'The invoice changes were saved.')
      }

      resetForm()
      setIsModalOpen(false)
      await loadInvoicesModule()
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showError('Invoice request failed', message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(invoice: InvoiceModel) {
    setEditingInvoiceId(invoice.invoiceId)
    setForm({
      projectId: invoice.projectId,
      totalAmount: invoice.totalAmount,
      invoiceStatus: invoice.invoiceStatus,
      issuedOn: invoice.issuedOn ? toDateInput(invoice.issuedOn) : '',
      paidOn: invoice.paidOn ? toDateInput(invoice.paidOn) : '',
      isExported: invoice.isExported,
    })
    setIsModalOpen(true)
  }

  async function handleDelete(invoiceId: number) {
    try {
      setErrorMessage(null)
      await invoiceService.delete(invoiceId)
      setPendingDeleteInvoiceId(null)
      showSuccess('Invoice deleted', 'The invoice record was removed.')

      if (editingInvoiceId === invoiceId) {
        resetForm()
      }

      await loadInvoicesModule()
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showError('Invoice delete failed', message)
    }
  }

  function resetForm() {
    setEditingInvoiceId(null)
    setForm({
      ...emptyForm,
      projectId: projectOptions[0]?.projectId ?? 0,
    })
  }

  function openCreateModal() {
    resetForm()
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    resetForm()
  }

  function openDeleteConfirmation(invoiceId: number) {
    setPendingDeleteInvoiceId(invoiceId)
  }

  function closeDeleteConfirmation() {
    setPendingDeleteInvoiceId(null)
  }

  const totalBilled = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const paidCount = invoices.filter((invoice) => invoice.invoiceStatus === 'Paid').length
  const overdueCount = invoices.filter((invoice) => invoice.invoiceStatus === 'Overdue').length
  const exportedCount = invoices.filter((invoice) => invoice.isExported).length

  return (
    <article className="page-section properties-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h3>Invoices</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Vendor Billing</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadInvoicesModule()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This module tracks maintenance invoice records, billing status, and export readiness.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <section className="dashboard-kpis" aria-label="Invoice metrics">
        <DashboardMetric label="Invoice Records" value={String(invoices.length)} tone="default" />
        <DashboardMetric label="Total Billed" value={formatCurrency(totalBilled)} tone="success" />
        <DashboardMetric label="Paid" value={String(paidCount)} tone="success" />
        <DashboardMetric label="Overdue" value={String(overdueCount)} tone="danger" />
        <DashboardMetric label="Exported" value={String(exportedCount)} tone="warning" />
      </section>

      <div className="single-panel-layout">
        <section
          className={`property-list-panel collapsible-panel ${isRecordsExpanded ? '' : 'collapsed'}`}
          onClick={() => {
            if (!isRecordsExpanded) {
              setIsRecordsExpanded(true)
            }
          }}
        >
          <div className="property-list-header" onClick={(event) => event.stopPropagation()}>
            <h4>Invoice Records</h4>
            <div className="dashboard-actions">
              <button
                type="button"
                className="primary-button"
                onClick={openCreateModal}
                disabled={projectOptions.length === 0}
              >
                Add Invoice
              </button>
              <CollapseToggleButton
                isExpanded={isRecordsExpanded}
                onClick={() => setIsRecordsExpanded((current) => !current)}
                collapseLabel="Collapse invoice records"
                expandLabel="Expand invoice records"
              />
            </div>
          </div>

          {isRecordsExpanded ? (
            <>
              {isLoading ? <p className="status-message">Loading invoices...</p> : null}

              {!isLoading && invoices.length === 0 ? (
                <p className="status-message">
                  No invoices returned yet. Create one from a maintenance project to get started.
                </p>
              ) : null}

              <div className="property-card-list">
                {invoices.map((invoice) => (
                  <article key={invoice.invoiceId} className="property-card tenant-card">
                    <div className="property-card-header">
                      <div>
                        <h5>{invoice.projectTitle}</h5>
                        <p>{invoice.propertyName}</p>
                      </div>
                      <span className={`status-pill ${toInvoiceStatusClass(invoice.invoiceStatus)}`}>
                        {invoice.invoiceStatus}
                      </span>
                    </div>

                    <dl className="property-details tenant-details">
                      <div>
                        <dt>Amount</dt>
                        <dd>{formatCurrency(invoice.totalAmount)}</dd>
                      </div>
                      <div>
                        <dt>Vendor</dt>
                        <dd>{invoice.assignedVendor || 'Unassigned'}</dd>
                      </div>
                      <div>
                        <dt>Exported</dt>
                        <dd>{invoice.isExported ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>

                    <p className="tenant-address">
                      {invoice.addressLine1}
                      {invoice.unitNumber ? `, ${invoice.unitNumber}` : ''}
                    </p>

                    <dl className="property-details tenant-details">
                      <div>
                        <dt>Issued</dt>
                        <dd>{invoice.issuedOn ? formatDate(invoice.issuedOn) : 'Not set'}</dd>
                      </div>
                      <div>
                        <dt>Paid</dt>
                        <dd>{invoice.paidOn ? formatDate(invoice.paidOn) : 'Not paid'}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{formatDate(invoice.updatedAt)}</dd>
                      </div>
                    </dl>

                    <div className="property-card-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleEdit(invoice)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => openDeleteConfirmation(invoice.invoiceId)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>

      <AppModal
        title={editingInvoiceId === null ? 'Add Invoice' : 'Edit Invoice'}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form className="property-form" onSubmit={handleSubmit}>
          <label>
            Maintenance Project
            <select
              required
              value={form.projectId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  projectId: Number(event.target.value),
                }))
              }
            >
              {projectOptions.map((project) => (
                <option key={project.projectId} value={project.projectId}>
                  {project.projectTitle} - {project.propertyName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Total Amount
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.totalAmount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  totalAmount: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            Invoice Status
            <select
              value={form.invoiceStatus}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  invoiceStatus: event.target.value as InvoiceModel['invoiceStatus'],
                }))
              }
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </label>

          <label>
            Issued On
            <input
              type="date"
              value={form.issuedOn ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  issuedOn: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Paid On
            <input
              type="date"
              value={form.paidOn ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  paidOn: event.target.value,
                }))
              }
            />
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.isExported}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isExported: event.target.checked,
                }))
              }
            />
            Mark as exported
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isSaving || projectOptions.length === 0}
          >
            {isSaving
              ? 'Saving...'
              : editingInvoiceId === null
                ? 'Create Invoice'
                : 'Save Changes'}
          </button>
        </form>
      </AppModal>

      <ConfirmationModal
        title="Delete Invoice"
        message="Delete this invoice record? This action cannot be undone."
        confirmLabel="Delete Invoice"
        isOpen={pendingDeleteInvoiceId !== null}
        onCancel={closeDeleteConfirmation}
        onConfirm={() => {
          if (pendingDeleteInvoiceId !== null) {
            void handleDelete(pendingDeleteInvoiceId)
          }
        }}
      />
    </article>
  )
}

InvoicesPage.displayName = 'InvoicesPage'

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

function normalizeForm(form: CreateInvoiceRequest): CreateInvoiceRequest {
  return {
    ...form,
    issuedOn: form.issuedOn || undefined,
    paidOn: form.paidOn || undefined,
  }
}

function toDateInput(value: string) {
  return value.slice(0, 10)
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading invoice data.'
}

function toInvoiceStatusClass(status: InvoiceModel['invoiceStatus']) {
  switch (status) {
    case 'Paid':
      return 'occupied'
    case 'Draft':
      return 'vacant'
    case 'Sent':
      return 'maintenance'
    case 'Overdue':
      return 'danger'
  }
}
