import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  CreateMaintenanceProjectRequest,
  CreateWorkLogRequest,
  MaintenanceProjectModel,
  PropertyModel,
  UpdateMaintenanceProjectRequest,
  WorkLogModel,
} from '../../core/interfaces/api'
import { maintenanceService } from '../../core/services/maintenance/maintenance.service'
import { propertyService } from '../../core/services/properties/property.service'

const emptyProjectForm: CreateMaintenanceProjectRequest = {
  propertyId: 0,
  projectTitle: '',
  projectDescription: '',
  bidAmount: 0,
  projectStatus: 'Bid',
  assignedVendor: '',
}

const emptyWorkLogForm: CreateWorkLogRequest = {
  clockInTime: new Date().toISOString().slice(0, 16),
  clockOutTime: '',
  gpsLocation: '',
  proofPhotoUrl: '',
  workNotes: '',
}

export function MaintenanceProjectsPage() {
  const [projects, setProjects] = useState<MaintenanceProjectModel[]>([])
  const [properties, setProperties] = useState<PropertyModel[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLogModel[]>([])
  const [projectForm, setProjectForm] = useState<CreateMaintenanceProjectRequest>(emptyProjectForm)
  const [workLogForm, setWorkLogForm] = useState<CreateWorkLogRequest>(emptyWorkLogForm)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [isSavingWorkLog, setIsSavingWorkLog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadMaintenanceModule()
  }, [])

  useEffect(() => {
    if (properties.length > 0 && projectForm.propertyId === 0) {
      setProjectForm((current) => ({
        ...current,
        propertyId: properties[0].propertyId,
      }))
    }
  }, [projectForm.propertyId, properties])

  async function loadMaintenanceModule() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const [projectData, propertyData, allWorkLogs] = await Promise.all([
        maintenanceService.getProjects(),
        propertyService.getAll(),
        maintenanceService.getAllWorkLogs(),
      ])
      setProjects(projectData)
      setProperties(propertyData)
      if (projectData.length === 0) {
        setSelectedProjectId(null)
        setWorkLogs([])
      } else if (selectedProjectId === null) {
        const preferredProjectId =
          allWorkLogs[0]?.projectId ?? projectData[0].projectId
        await selectProject(preferredProjectId)
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  async function selectProject(projectId: number) {
    try {
      setSelectedProjectId(projectId)
      const logs = await maintenanceService.getWorkLogs(projectId)
      setWorkLogs(logs)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSavingProject(true)
      setErrorMessage(null)

      const payload = normalizeProjectForm(projectForm)

      let nextSelectedProjectId = selectedProjectId

      if (editingProjectId === null) {
        const createdProject = await maintenanceService.createProject(payload)
        nextSelectedProjectId = createdProject.projectId
        setSelectedProjectId(createdProject.projectId)
      } else {
        await maintenanceService.updateProject(editingProjectId, payload as UpdateMaintenanceProjectRequest)
        nextSelectedProjectId = editingProjectId
      }

      resetProjectForm()
      await loadMaintenanceModule()
      if (nextSelectedProjectId !== null) {
        await selectProject(nextSelectedProjectId)
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSavingProject(false)
    }
  }

  async function handleWorkLogSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedProjectId === null) {
      return
    }

    try {
      setIsSavingWorkLog(true)
      setErrorMessage(null)
      await maintenanceService.createWorkLog(
        selectedProjectId,
        normalizeWorkLogForm(workLogForm),
      )
      setWorkLogForm({
        ...emptyWorkLogForm,
        clockInTime: new Date().toISOString().slice(0, 16),
      })
      await selectProject(selectedProjectId)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSavingWorkLog(false)
    }
  }

  function handleEdit(project: MaintenanceProjectModel) {
    setEditingProjectId(project.projectId)
    setProjectForm({
      propertyId: project.propertyId,
      projectTitle: project.projectTitle,
      projectDescription: project.projectDescription ?? '',
      bidAmount: project.bidAmount ?? 0,
      projectStatus: project.projectStatus,
      assignedVendor: project.assignedVendor ?? '',
    })
  }

  async function handleDelete(projectId: number) {
    const confirmed = window.confirm(
      'Delete this maintenance project? Linked work logs will also be removed.',
    )

    if (!confirmed) {
      return
    }

    try {
      setErrorMessage(null)
      await maintenanceService.deleteProject(projectId)

      if (editingProjectId === projectId) {
        resetProjectForm()
      }

      await loadMaintenanceModule()
      if (selectedProjectId === projectId) {
        const remainingProjects = await maintenanceService.getProjects()
        if (remainingProjects.length > 0) {
          await selectProject(remainingProjects[0].projectId)
        } else {
          setSelectedProjectId(null)
          setWorkLogs([])
        }
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  function resetProjectForm() {
    setEditingProjectId(null)
    setProjectForm({
      ...emptyProjectForm,
      propertyId: properties[0]?.propertyId ?? 0,
    })
  }

  const openProjects = projects.filter((project) => project.projectStatus !== 'Closed').length
  const invoicedProjects = projects.filter((project) => project.projectStatus === 'Invoiced').length
  const bidPipeline = projects.filter((project) => project.projectStatus === 'Bid').length
  const assignedCount = projects.filter((project) => project.assignedVendor).length

  return (
    <article className="page-section properties-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Live Feature</p>
          <h3>Maintenance Projects</h3>
        </div>
        <div className="dashboard-actions">
          <code>/api/maintenance-projects</code>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadMaintenanceModule()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This module manages project bidding, vendor assignment, status tracking,
        and proof-based work logs tied to each maintenance project.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <section className="dashboard-kpis" aria-label="Maintenance metrics">
        <DashboardMetric label="Projects" value={String(projects.length)} tone="default" />
        <DashboardMetric label="Open" value={String(openProjects)} tone="warning" />
        <DashboardMetric label="Invoiced" value={String(invoicedProjects)} tone="success" />
        <DashboardMetric label="Bid Pipeline" value={String(bidPipeline)} tone="warning" />
        <DashboardMetric label="Assigned Vendors" value={String(assignedCount)} tone="default" />
      </section>

      <div className="properties-layout maintenance-layout">
        <form className="property-form" onSubmit={handleProjectSubmit}>
          <div className="property-form-header">
            <h4>{editingProjectId === null ? 'Add Project' : 'Edit Project'}</h4>
            {editingProjectId !== null ? (
              <button type="button" className="secondary-button" onClick={resetProjectForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>

          <label>
            Property
            <select
              required
              value={projectForm.propertyId}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  propertyId: Number(event.target.value),
                }))
              }
            >
              {properties.map((property) => (
                <option key={property.propertyId} value={property.propertyId}>
                  {property.propertyName} - {property.addressLine1}
                </option>
              ))}
            </select>
          </label>

          <label>
            Project Title
            <input
              required
              value={projectForm.projectTitle}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  projectTitle: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Description
            <input
              value={projectForm.projectDescription ?? ''}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  projectDescription: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Bid Amount
            <input
              min="0"
              step="0.01"
              type="number"
              value={projectForm.bidAmount ?? 0}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  bidAmount: Number(event.target.value),
                }))
              }
            />
          </label>

          <label>
            Status
            <select
              value={projectForm.projectStatus}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  projectStatus: event.target.value as MaintenanceProjectModel['projectStatus'],
                }))
              }
            >
              <option value="Bid">Bid</option>
              <option value="Approved">Approved</option>
              <option value="Work Order">Work Order</option>
              <option value="Invoiced">Invoiced</option>
              <option value="Closed">Closed</option>
            </select>
          </label>

          <label>
            Assigned Vendor
            <input
              value={projectForm.assignedVendor ?? ''}
              onChange={(event) =>
                setProjectForm((current) => ({
                  ...current,
                  assignedVendor: event.target.value,
                }))
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isSavingProject || properties.length === 0}
          >
            {isSavingProject
              ? 'Saving...'
              : editingProjectId === null
                ? 'Create Project'
                : 'Save Changes'}
          </button>
        </form>

        <section className="property-list-panel">
          <div className="property-list-header">
            <h4>Project Records</h4>
          </div>

          {isLoading ? <p className="status-message">Loading maintenance projects...</p> : null}

          {!isLoading && projects.length === 0 ? (
            <p className="status-message">
              No maintenance projects returned yet. Add one to start tracking work.
            </p>
          ) : null}

          <div className="property-card-list">
            {projects.map((project) => (
              <article
                key={project.projectId}
                className={`property-card tenant-card ${selectedProjectId === project.projectId ? 'selected-card' : ''}`}
              >
                <div className="property-card-header">
                  <div>
                    <h5>{project.projectTitle}</h5>
                    <p>{project.propertyName}</p>
                  </div>
                  <span className={`status-pill ${toProjectStatusClass(project.projectStatus)}`}>
                    {project.projectStatus}
                  </span>
                </div>

                <dl className="property-details tenant-details">
                  <div>
                    <dt>Bid</dt>
                    <dd>{project.bidAmount ? formatCurrency(project.bidAmount) : 'N/A'}</dd>
                  </div>
                  <div>
                    <dt>Vendor</dt>
                    <dd>{project.assignedVendor || 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt>Unit</dt>
                    <dd>{project.unitNumber || 'N/A'}</dd>
                  </div>
                </dl>

                <p className="tenant-address">
                  {project.addressLine1}
                  {project.projectDescription ? ` - ${project.projectDescription}` : ''}
                </p>

                <div className="property-card-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void selectProject(project.projectId)}
                  >
                    View Logs
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleEdit(project)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void handleDelete(project.projectId)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-layout">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="eyebrow">Work Logs</p>
              <h4>Project activity</h4>
            </div>
          </div>

          {selectedProjectId === null ? (
            <p className="status-message">Select a maintenance project to view work logs.</p>
          ) : workLogs.length === 0 ? (
            <p className="status-message">No work logs yet for this project.</p>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>GPS</th>
                    <th>Photo</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {workLogs.map((workLog) => (
                    <tr key={workLog.workLogId}>
                      <td>{formatDateTime(workLog.clockInTime)}</td>
                      <td>{workLog.clockOutTime ? formatDateTime(workLog.clockOutTime) : 'Open'}</td>
                      <td>{workLog.gpsLocation || 'N/A'}</td>
                      <td>{workLog.proofPhotoUrl || 'N/A'}</td>
                      <td>{workLog.workNotes || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="property-form" onSubmit={handleWorkLogSubmit}>
          <div className="property-form-header">
            <h4>Add Work Log</h4>
          </div>

          <label>
            Clock In
            <input
              required
              type="datetime-local"
              value={workLogForm.clockInTime}
              onChange={(event) =>
                setWorkLogForm((current) => ({
                  ...current,
                  clockInTime: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Clock Out
            <input
              type="datetime-local"
              value={workLogForm.clockOutTime ?? ''}
              onChange={(event) =>
                setWorkLogForm((current) => ({
                  ...current,
                  clockOutTime: event.target.value,
                }))
              }
            />
          </label>

          <label>
            GPS Location
            <input
              value={workLogForm.gpsLocation ?? ''}
              onChange={(event) =>
                setWorkLogForm((current) => ({
                  ...current,
                  gpsLocation: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Proof Photo URL
            <input
              value={workLogForm.proofPhotoUrl ?? ''}
              onChange={(event) =>
                setWorkLogForm((current) => ({
                  ...current,
                  proofPhotoUrl: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Notes
            <input
              value={workLogForm.workNotes ?? ''}
              onChange={(event) =>
                setWorkLogForm((current) => ({
                  ...current,
                  workNotes: event.target.value,
                }))
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isSavingWorkLog || selectedProjectId === null}
          >
            {isSavingWorkLog ? 'Saving...' : 'Add Work Log'}
          </button>
        </form>
      </div>
    </article>
  )
}

MaintenanceProjectsPage.displayName = 'MaintenanceProjectsPage'

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

function normalizeProjectForm(
  form: CreateMaintenanceProjectRequest,
): CreateMaintenanceProjectRequest {
  return {
    ...form,
    projectDescription: form.projectDescription || undefined,
    bidAmount: form.bidAmount && form.bidAmount > 0 ? form.bidAmount : undefined,
    assignedVendor: form.assignedVendor || undefined,
  }
}

function normalizeWorkLogForm(form: CreateWorkLogRequest): CreateWorkLogRequest {
  return {
    ...form,
    clockOutTime: form.clockOutTime || undefined,
    gpsLocation: form.gpsLocation || undefined,
    proofPhotoUrl: form.proofPhotoUrl || undefined,
    workNotes: form.workNotes || undefined,
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US')
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading maintenance data.'
}

function toProjectStatusClass(status: MaintenanceProjectModel['projectStatus']) {
  switch (status) {
    case 'Closed':
      return 'occupied'
    case 'Invoiced':
      return 'maintenance'
    case 'Approved':
      return 'vacant'
    case 'Work Order':
      return 'warning'
    case 'Bid':
      return 'danger'
  }
}
