import { useEffect, useRef, useState } from 'react'
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
import { AppModal } from '../../shared/ui/AppModal'
import { ConfirmationModal } from '../../shared/ui/ConfirmationModal'
import { CollapseToggleButton } from '../../shared/ui/CollapseToggleButton'
import { useToast } from '../../shared/ui/ToastProvider'

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
  const { showError, showSuccess } = useToast()
  const [projects, setProjects] = useState<MaintenanceProjectModel[]>([])
  const [properties, setProperties] = useState<PropertyModel[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLogModel[]>([])
  const [projectIdsWithLogs, setProjectIdsWithLogs] = useState<number[]>([])
  const [projectForm, setProjectForm] = useState<CreateMaintenanceProjectRequest>(emptyProjectForm)
  const [workLogForm, setWorkLogForm] = useState<CreateWorkLogRequest>(emptyWorkLogForm)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [createWorkLogProjectId, setCreateWorkLogProjectId] = useState<number>(0)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<number | null>(null)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false)
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true)
  const [isWorkLogsExpanded, setIsWorkLogsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [isSavingWorkLog, setIsSavingWorkLog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const workLogsSectionRef = useRef<HTMLElement | null>(null)

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
      setProjectIdsWithLogs(
        Array.from(new Set(allWorkLogs.map((workLog) => workLog.projectId))),
      )
      setCreateWorkLogProjectId((current) => current || projectData[0]?.projectId || 0)
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
        showSuccess('Project created', 'The maintenance project was added successfully.')
      } else {
        await maintenanceService.updateProject(editingProjectId, payload as UpdateMaintenanceProjectRequest)
        nextSelectedProjectId = editingProjectId
        showSuccess('Project updated', 'The maintenance project changes were saved.')
      }

      resetProjectForm()
      setIsProjectModalOpen(false)
      await loadMaintenanceModule()
      if (nextSelectedProjectId !== null) {
        await selectProject(nextSelectedProjectId)
      }
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showError('Project request failed', message)
    } finally {
      setIsSavingProject(false)
    }
  }

  async function handleWorkLogSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (createWorkLogProjectId === 0) {
      return
    }

    try {
      setIsSavingWorkLog(true)
      setErrorMessage(null)
      await maintenanceService.createWorkLog(
        createWorkLogProjectId,
        normalizeWorkLogForm(workLogForm),
      )
      setWorkLogForm({
        ...emptyWorkLogForm,
        clockInTime: new Date().toISOString().slice(0, 16),
      })
      setIsWorkLogModalOpen(false)
      showSuccess('Work log added', 'The work log entry was recorded successfully.')
      await loadMaintenanceModule()
      await selectProject(createWorkLogProjectId)
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showError('Work log request failed', message)
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
    setIsProjectModalOpen(true)
  }

  async function handleDelete(projectId: number) {
    try {
      setErrorMessage(null)
      await maintenanceService.deleteProject(projectId)
      setPendingDeleteProjectId(null)
      showSuccess('Project deleted', 'The maintenance project was removed.')

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
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showError('Project delete failed', message)
    }
  }

  function resetProjectForm() {
    setEditingProjectId(null)
    setProjectForm({
      ...emptyProjectForm,
      propertyId: properties[0]?.propertyId ?? 0,
    })
  }

  function openProjectModal() {
    resetProjectForm()
    setIsProjectModalOpen(true)
  }

  function closeProjectModal() {
    setIsProjectModalOpen(false)
    resetProjectForm()
  }

  function openWorkLogModal() {
    setCreateWorkLogProjectId(selectedProjectId ?? projects[0]?.projectId ?? 0)
    setIsWorkLogModalOpen(true)
  }

  function closeWorkLogModal() {
    setIsWorkLogModalOpen(false)
    setWorkLogForm({
      ...emptyWorkLogForm,
      clockInTime: new Date().toISOString().slice(0, 16),
    })
    setCreateWorkLogProjectId(selectedProjectId ?? projects[0]?.projectId ?? 0)
  }

  function openDeleteConfirmation(projectId: number) {
    setPendingDeleteProjectId(projectId)
  }

  function closeDeleteConfirmation() {
    setPendingDeleteProjectId(null)
  }

  async function handleViewLogs(projectId: number) {
    setIsWorkLogsExpanded(true)
    await selectProject(projectId)
    requestAnimationFrame(() => {
      workLogsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
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
          <p className="eyebrow">Maintenance</p>
          <h3>Maintenance Projects</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Project Pipeline</span>
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

      <div className="single-panel-layout">
        <section
          className={`property-list-panel collapsible-panel ${isProjectsExpanded ? '' : 'collapsed'}`}
          onClick={() => {
            if (!isProjectsExpanded) {
              setIsProjectsExpanded(true)
            }
          }}
        >
          <div className="property-list-header" onClick={(event) => event.stopPropagation()}>
            <h4>Project Records</h4>
            <div className="dashboard-actions">
              <button
                type="button"
                className="primary-button"
                onClick={openProjectModal}
                disabled={properties.length === 0}
              >
                Add Project
              </button>
              <CollapseToggleButton
                isExpanded={isProjectsExpanded}
                onClick={() => setIsProjectsExpanded((current) => !current)}
                collapseLabel="Collapse project records"
                expandLabel="Expand project records"
              />
            </div>
          </div>

          {isProjectsExpanded ? (
            <>
              {isLoading ? <p className="status-message">Loading maintenance projects...</p> : null}

              {!isLoading && projects.length === 0 ? (
                <p className="status-message">
                  No maintenance projects returned yet. Add one to start tracking work.
                </p>
              ) : null}

              <div className="property-card-list">
                {projects.map((project) => {
                  const hasLogs = projectIdsWithLogs.includes(project.projectId)

                  return (
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
                          onClick={() => handleEdit(project)}
                        >
                          Edit
                        </button>
                        {hasLogs ? (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => void handleViewLogs(project.projectId)}
                          >
                            View Logs
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => openDeleteConfirmation(project.projectId)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          ) : null}
        </section>
      </div>

      <section
        className={`dashboard-panel dashboard-panel-wide collapsible-panel ${isWorkLogsExpanded ? '' : 'collapsed'}`}
        ref={workLogsSectionRef}
        onClick={() => {
          if (!isWorkLogsExpanded) {
            setIsWorkLogsExpanded(true)
          }
        }}
      >
          <div className="dashboard-panel-header" onClick={(event) => event.stopPropagation()}>
            <div>
              <p className="eyebrow">Work Logs</p>
              <h4>Project activity</h4>
            </div>
            <div className="dashboard-actions">
              <button
                type="button"
                className="primary-button"
                onClick={openWorkLogModal}
                disabled={projects.length === 0}
              >
                Add Work Log
              </button>
              <CollapseToggleButton
                isExpanded={isWorkLogsExpanded}
                onClick={() => setIsWorkLogsExpanded((current) => !current)}
                collapseLabel="Collapse work logs"
                expandLabel="Expand work logs"
              />
            </div>
          </div>

          {isWorkLogsExpanded ? selectedProjectId === null ? (
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
          ) : null}
        </section>

      <AppModal
        title={editingProjectId === null ? 'Add Project' : 'Edit Project'}
        isOpen={isProjectModalOpen}
        onClose={closeProjectModal}
      >
        <form className="property-form" onSubmit={handleProjectSubmit}>
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
            <textarea
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
      </AppModal>

      <AppModal
        title="Add Work Log"
        isOpen={isWorkLogModalOpen}
        onClose={closeWorkLogModal}
      >
        <form className="property-form" onSubmit={handleWorkLogSubmit}>
          <label>
            Project
            <select
              required
              value={createWorkLogProjectId}
              onChange={(event) => setCreateWorkLogProjectId(Number(event.target.value))}
            >
              <option value={0}>Select a project</option>
              {projects.map((project) => (
                <option key={project.projectId} value={project.projectId}>
                  {project.projectTitle} - {project.propertyName}
                </option>
              ))}
            </select>
          </label>

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
            <textarea
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
            disabled={isSavingWorkLog || createWorkLogProjectId === 0}
          >
            {isSavingWorkLog ? 'Saving...' : 'Add Work Log'}
          </button>
        </form>
      </AppModal>

      <ConfirmationModal
        title="Delete Maintenance Project"
        message="Delete this maintenance project? Linked work logs will also be removed."
        confirmLabel="Delete Project"
        isOpen={pendingDeleteProjectId !== null}
        onCancel={closeDeleteConfirmation}
        onConfirm={() => {
          if (pendingDeleteProjectId !== null) {
            void handleDelete(pendingDeleteProjectId)
          }
        }}
      />
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
