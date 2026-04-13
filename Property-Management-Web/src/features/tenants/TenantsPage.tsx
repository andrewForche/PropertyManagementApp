import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  CreateTenantRequest,
  PropertyModel,
  TenantModel,
  UpdateTenantRequest,
} from '../../core/interfaces/api'
import { propertyService } from '../../core/services/properties/property.service'
import { tenantService } from '../../core/services/tenants/tenant.service'
import { AppModal } from '../../shared/ui/AppModal'

const emptyForm: CreateTenantRequest = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  propertyId: 0,
  leaseStartDate: '',
  leaseEndDate: '',
  tenantStatus: 'active',
}

export function TenantsPage() {
  const [tenants, setTenants] = useState<TenantModel[]>([])
  const [properties, setProperties] = useState<PropertyModel[]>([])
  const [form, setForm] = useState<CreateTenantRequest>(emptyForm)
  const [editingTenantId, setEditingTenantId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadTenantModule()
  }, [])

  useEffect(() => {
    if (properties.length > 0 && form.propertyId === 0) {
      setForm((current) => ({
        ...current,
        propertyId: properties[0].propertyId,
      }))
    }
  }, [form.propertyId, properties])

  async function loadTenantModule() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const [tenantData, propertyData] = await Promise.all([
        tenantService.getAll(),
        propertyService.getAll(),
      ])
      setTenants(tenantData)
      setProperties(propertyData)
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

      if (editingTenantId === null) {
        await tenantService.create(payload)
      } else {
        const updatePayload: UpdateTenantRequest = { ...payload }
        await tenantService.update(editingTenantId, updatePayload)
      }

      resetForm()
      setIsModalOpen(false)
      await loadTenantModule()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(tenant: TenantModel) {
    setEditingTenantId(tenant.tenantId)
    setForm({
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phoneNumber: tenant.phoneNumber,
      propertyId: tenant.propertyId,
      leaseStartDate: tenant.leaseStartDate ? toDateInput(tenant.leaseStartDate) : '',
      leaseEndDate: tenant.leaseEndDate ? toDateInput(tenant.leaseEndDate) : '',
      tenantStatus: tenant.tenantStatus,
    })
    setIsModalOpen(true)
  }

  async function handleDelete(tenantId: number) {
    const confirmed = window.confirm(
      'Delete this tenant record? This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    try {
      setErrorMessage(null)
      await tenantService.delete(tenantId)

      if (editingTenantId === tenantId) {
        resetForm()
      }

      await loadTenantModule()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  function resetForm() {
    setEditingTenantId(null)
    setForm({
      ...emptyForm,
      propertyId: properties[0]?.propertyId ?? 0,
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

  const activeCount = tenants.filter((tenant) => tenant.tenantStatus === 'active').length
  const pastDueCount = tenants.filter((tenant) => tenant.tenantStatus === 'past_due').length
  const applicantCount = tenants.filter((tenant) => tenant.tenantStatus === 'applicant').length

  return (
    <article className="page-section properties-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Leasing</p>
          <h3>Tenants</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Tenant Directory</span>
          <button
            type="button"
            className="primary-button"
            onClick={openCreateModal}
            disabled={properties.length === 0}
          >
            Add Tenant
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadTenantModule()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This module manages tenant profiles, assigned properties, lease windows,
        and current account status.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <section className="dashboard-kpis" aria-label="Tenant metrics">
        <DashboardMetric label="Tenant Records" value={String(tenants.length)} tone="default" />
        <DashboardMetric label="Active" value={String(activeCount)} tone="success" />
        <DashboardMetric label="Past Due" value={String(pastDueCount)} tone="danger" />
        <DashboardMetric label="Applicants" value={String(applicantCount)} tone="warning" />
        <DashboardMetric label="Properties Linked" value={String(properties.length)} tone="default" />
      </section>

      <div className="single-panel-layout">
        <section className="property-list-panel">
          <div className="property-list-header">
            <h4>Tenant Records</h4>
          </div>

          {isLoading ? <p className="status-message">Loading tenants...</p> : null}

          {!isLoading && tenants.length === 0 ? (
            <p className="status-message">
              No tenants returned yet. Add a tenant once properties are available.
            </p>
          ) : null}

          <div className="property-card-list">
            {tenants.map((tenant) => (
              <article key={tenant.tenantId} className="property-card tenant-card">
                <div className="property-card-header">
                  <div>
                    <h5>{tenant.fullName}</h5>
                    <p>{tenant.email}</p>
                  </div>
                  <span className={`status-pill ${toTenantStatusClass(tenant.tenantStatus)}`}>
                    {tenant.tenantStatus.replace('_', ' ')}
                  </span>
                </div>

                <dl className="property-details tenant-details">
                  <div>
                    <dt>Phone</dt>
                    <dd>{tenant.phoneNumber}</dd>
                  </div>
                  <div>
                    <dt>Property</dt>
                    <dd>{tenant.propertyName}</dd>
                  </div>
                  <div>
                    <dt>Unit</dt>
                    <dd>{tenant.unitNumber || 'N/A'}</dd>
                  </div>
                </dl>

                <p className="tenant-address">
                  {tenant.addressLine1}
                  {tenant.unitNumber ? `, ${tenant.unitNumber}` : ''}
                </p>

                <dl className="property-details tenant-details">
                  <div>
                    <dt>Lease Start</dt>
                    <dd>{tenant.leaseStartDate ? formatDate(tenant.leaseStartDate) : 'Not set'}</dd>
                  </div>
                  <div>
                    <dt>Lease End</dt>
                    <dd>{tenant.leaseEndDate ? formatDate(tenant.leaseEndDate) : 'Not set'}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatDate(tenant.updatedAt)}</dd>
                  </div>
                </dl>

                <div className="property-card-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleEdit(tenant)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDelete(tenant.tenantId)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <AppModal
        title={editingTenantId === null ? 'Add Tenant' : 'Edit Tenant'}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form className="property-form" onSubmit={handleSubmit}>
          <label>
            First Name
            <input
              required
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Last Name
            <input
              required
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Phone Number
            <input
              required
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phoneNumber: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Assigned Property
            <select
              required
              value={form.propertyId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  propertyId: Number(event.target.value),
                }))
              }
            >
              {properties.map((property) => (
                <option key={property.propertyId} value={property.propertyId}>
                  {property.propertyName} - {property.addressLine1}
                  {property.unitNumber ? `, ${property.unitNumber}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            Lease Start
            <input
              type="date"
              value={form.leaseStartDate ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  leaseStartDate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Lease End
            <input
              type="date"
              value={form.leaseEndDate ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  leaseEndDate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Tenant Status
            <select
              value={form.tenantStatus}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tenantStatus: event.target.value as TenantModel['tenantStatus'],
                }))
              }
            >
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="former">Former</option>
              <option value="applicant">Applicant</option>
            </select>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isSaving || properties.length === 0}
          >
            {isSaving
              ? 'Saving...'
              : editingTenantId === null
                ? 'Create Tenant'
                : 'Save Changes'}
          </button>
        </form>
      </AppModal>
    </article>
  )
}

TenantsPage.displayName = 'TenantsPage'

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

function normalizeForm(form: CreateTenantRequest): CreateTenantRequest {
  return {
    ...form,
    leaseStartDate: form.leaseStartDate || undefined,
    leaseEndDate: form.leaseEndDate || undefined,
  }
}

function toDateInput(value: string) {
  return value.slice(0, 10)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US')
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading tenant data.'
}

function toTenantStatusClass(status: TenantModel['tenantStatus']) {
  switch (status) {
    case 'active':
      return 'occupied'
    case 'past_due':
      return 'danger'
    case 'former':
      return 'maintenance'
    case 'applicant':
      return 'vacant'
  }
}
