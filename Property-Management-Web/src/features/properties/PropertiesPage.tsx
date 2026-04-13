import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  CreatePropertyRequest,
  PropertyModel,
  UpdatePropertyRequest,
} from '../../core/interfaces/api'
import { propertyService } from '../../core/services/properties/property.service'
import { AppModal } from '../../shared/ui/AppModal'

const emptyForm: CreatePropertyRequest = {
  propertyName: '',
  addressLine1: '',
  unitNumber: '',
  monthlyRent: 0,
  occupancyStatus: 'vacant',
}

export function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyModel[]>([])
  const [form, setForm] = useState<CreatePropertyRequest>(emptyForm)
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadProperties()
  }, [])

  async function loadProperties() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const data = await propertyService.getAll()
      setProperties(data)
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

      if (editingPropertyId === null) {
        await propertyService.create(form)
      } else {
        const payload: UpdatePropertyRequest = { ...form }
        await propertyService.update(editingPropertyId, payload)
      }

      resetForm()
      setIsModalOpen(false)
      await loadProperties()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(property: PropertyModel) {
    setEditingPropertyId(property.propertyId)
    setForm({
      propertyName: property.propertyName,
      addressLine1: property.addressLine1,
      unitNumber: property.unitNumber ?? '',
      monthlyRent: property.monthlyRent,
      occupancyStatus: property.occupancyStatus,
    })
    setIsModalOpen(true)
  }

  async function handleDelete(propertyId: number) {
    const confirmed = window.confirm(
      'Delete this property record? This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    try {
      setErrorMessage(null)
      await propertyService.delete(propertyId)

      if (editingPropertyId === propertyId) {
        resetForm()
      }

      await loadProperties()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  function resetForm() {
    setEditingPropertyId(null)
    setForm({ ...emptyForm })
  }

  function openCreateModal() {
    resetForm()
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    resetForm()
  }

  return (
    <article className="page-section properties-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h3>Properties</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Property Administration</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadProperties()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This module is wired to the API and database. You can load, create,
        update, and delete property records from the React frontend.
      </p>

      <div className="single-panel-layout">
        <section className="property-list-panel">
          <div className="property-list-header">
            <h4>Property Records</h4>
            <button type="button" className="primary-button" onClick={openCreateModal}>
              Add Property
            </button>
          </div>

          {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
          {isLoading ? <p className="status-message">Loading properties...</p> : null}

          {!isLoading && properties.length === 0 ? (
            <p className="status-message">
              No properties returned yet. If the API is running, try adding one.
            </p>
          ) : null}

          <div className="property-card-list">
            {properties.map((property) => (
              <article key={property.propertyId} className="property-card">
                <div className="property-card-header">
                  <div>
                    <h5>{property.propertyName}</h5>
                    <p>{property.addressLine1}</p>
                  </div>
                  <span className={`status-pill ${property.occupancyStatus}`}>
                    {property.occupancyStatus}
                  </span>
                </div>

                <dl className="property-details">
                  <div>
                    <dt>Unit</dt>
                    <dd>{property.unitNumber || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt>Rent</dt>
                    <dd>{formatCurrency(property.monthlyRent)}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatDate(property.createdAt)}</dd>
                  </div>
                </dl>

                <div className="property-card-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleEdit(property)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDelete(property.propertyId)}
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
        title={editingPropertyId === null ? 'Add Property' : 'Edit Property'}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form className="property-form" onSubmit={handleSubmit}>
          <label>
            Property Name
            <input
              required
              value={form.propertyName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  propertyName: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Address
            <input
              required
              value={form.addressLine1}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  addressLine1: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Unit Number
            <input
              value={form.unitNumber ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unitNumber: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Monthly Rent
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.monthlyRent}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  monthlyRent: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            Occupancy Status
            <select
              value={form.occupancyStatus}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  occupancyStatus: event.target.value as PropertyModel['occupancyStatus'],
                }))
              }
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>

          <button type="submit" className="primary-button" disabled={isSaving}>
            {isSaving
              ? 'Saving...'
              : editingPropertyId === null
                ? 'Create Property'
                : 'Save Changes'}
          </button>
        </form>
      </AppModal>
    </article>
  )
}

PropertiesPage.displayName = 'PropertiesPage'

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

  return 'Something went wrong while talking to the API.'
}
