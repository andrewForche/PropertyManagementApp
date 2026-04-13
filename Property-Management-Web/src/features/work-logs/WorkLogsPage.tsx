import { useEffect, useState } from 'react'
import type {
  CreateWorkLogRequest,
  MaintenanceProjectModel,
  WorkLogModel,
} from '../../core/interfaces/api'
import { maintenanceService } from '../../core/services/maintenance/maintenance.service'
import { AppModal } from '../../shared/ui/AppModal'
import { CollapseToggleButton } from '../../shared/ui/CollapseToggleButton'

const emptyWorkLogForm: CreateWorkLogRequest = {
  clockInTime: new Date().toISOString().slice(0, 16),
  clockOutTime: '',
  gpsLocation: '',
  proofPhotoUrl: '',
  workNotes: '',
}

export function WorkLogsPage() {
  const [workLogs, setWorkLogs] = useState<WorkLogModel[]>([])
  const [projects, setProjects] = useState<MaintenanceProjectModel[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0)
  const [createProjectId, setCreateProjectId] = useState<number>(0)
  const [form, setForm] = useState<CreateWorkLogRequest>(emptyWorkLogForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRecordsExpanded, setIsRecordsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadWorkLogsModule()
  }, [])

  async function loadWorkLogsModule() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const [workLogData, projectData] = await Promise.all([
        maintenanceService.getAllWorkLogs(),
        maintenanceService.getProjects(),
      ])
      setWorkLogs(workLogData)
      setProjects(projectData)
      setCreateProjectId((current) => current || projectData[0]?.projectId || 0)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (createProjectId === 0) {
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)
      await maintenanceService.createWorkLog(
        createProjectId,
        normalizeForm(form),
      )
      setForm({
        ...emptyWorkLogForm,
        clockInTime: new Date().toISOString().slice(0, 16),
      })
      setIsModalOpen(false)
      await loadWorkLogsModule()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const visibleLogs =
    selectedProjectId === 0
      ? workLogs
      : workLogs.filter((workLog) => workLog.projectId === selectedProjectId)

  const openLogs = workLogs.filter((workLog) => !workLog.clockOutTime).length
  const logsWithGps = workLogs.filter((workLog) => workLog.gpsLocation).length
  const logsWithPhotos = workLogs.filter((workLog) => workLog.proofPhotoUrl).length
  const activeProjects = new Set(workLogs.map((workLog) => workLog.projectId)).size

  function openCreateModal() {
    setCreateProjectId((current) => current || projects[0]?.projectId || 0)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setForm({
      ...emptyWorkLogForm,
      clockInTime: new Date().toISOString().slice(0, 16),
    })
    setCreateProjectId(projects[0]?.projectId ?? 0)
  }

  return (
    <article className="page-section work-logs-page">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Field Activity</p>
          <h3>Work Logs</h3>
        </div>
        <div className="dashboard-actions">
          <span className="module-chip">Proof and Time Tracking</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadWorkLogsModule()}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      <p>
        This module gives us a portfolio-wide view of field activity, proof capture,
        and project-level labor history across maintenance work.
      </p>

      {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}

      <section className="dashboard-kpis" aria-label="Work log metrics">
        <DashboardMetric label="Work Logs" value={String(workLogs.length)} tone="default" />
        <DashboardMetric label="Open Sessions" value={String(openLogs)} tone="warning" />
        <DashboardMetric label="With GPS" value={String(logsWithGps)} tone="success" />
        <DashboardMetric label="With Photos" value={String(logsWithPhotos)} tone="success" />
        <DashboardMetric label="Active Projects" value={String(activeProjects)} tone="default" />
      </section>

      <div className="single-panel-layout">
        <section className="property-list-panel">
          <div className="property-list-header">
            <h4>Work Log Activity</h4>
            <div className="dashboard-actions">
              <select
                className="inline-filter"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(Number(event.target.value))}
              >
                <option value={0}>All Projects</option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.projectTitle}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="primary-button"
                onClick={openCreateModal}
                disabled={projects.length === 0}
              >
                Add Work Log
              </button>
              <CollapseToggleButton
                isExpanded={isRecordsExpanded}
                onClick={() => setIsRecordsExpanded((current) => !current)}
                collapseLabel="Collapse work log activity"
                expandLabel="Expand work log activity"
              />
            </div>
          </div>

          {isRecordsExpanded ? (
            <>
              {isLoading ? <p className="status-message">Loading work logs...</p> : null}

              {!isLoading && visibleLogs.length === 0 ? (
                <p className="status-message">No work logs returned for the current filter.</p>
              ) : null}

              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Property</th>
                      <th>Status</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>GPS</th>
                      <th>Photo</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLogs.map((workLog) => (
                      <tr key={workLog.workLogId}>
                        <td>
                          {workLog.projectTitle}
                          <br />
                          <span className="table-subtext">
                            {workLog.assignedVendor || 'Unassigned vendor'}
                          </span>
                        </td>
                        <td>
                          {workLog.propertyName}
                          <br />
                          <span className="table-subtext">
                            {workLog.addressLine1}
                            {workLog.unitNumber ? `, ${workLog.unitNumber}` : ''}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${toProjectStatusClass(workLog.projectStatus)}`}>
                            {workLog.projectStatus}
                          </span>
                        </td>
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
            </>
          ) : (
            <p className="status-message">Work log activity is collapsed.</p>
          )}
        </section>
      </div>

      <AppModal
        title="Add Work Log"
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <form className="property-form" onSubmit={handleSubmit}>
          <label>
            Project
            <select
              required
              value={createProjectId}
              onChange={(event) => setCreateProjectId(Number(event.target.value))}
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
              value={form.clockInTime}
              onChange={(event) =>
                setForm((current) => ({
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
              value={form.clockOutTime ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  clockOutTime: event.target.value,
                }))
              }
            />
          </label>

          <label>
            GPS Location
            <input
              value={form.gpsLocation ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gpsLocation: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Proof Photo URL
            <input
              value={form.proofPhotoUrl ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  proofPhotoUrl: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Notes
            <textarea
              value={form.workNotes ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  workNotes: event.target.value,
                }))
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={isSaving || createProjectId === 0}
          >
            {isSaving ? 'Saving...' : 'Create Work Log'}
          </button>
        </form>
      </AppModal>
    </article>
  )
}

WorkLogsPage.displayName = 'WorkLogsPage'

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

function normalizeForm(form: CreateWorkLogRequest): CreateWorkLogRequest {
  return {
    ...form,
    clockOutTime: form.clockOutTime || undefined,
    gpsLocation: form.gpsLocation || undefined,
    proofPhotoUrl: form.proofPhotoUrl || undefined,
    workNotes: form.workNotes || undefined,
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US')
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading work log data.'
}

function toProjectStatusClass(status: WorkLogModel['projectStatus']) {
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
