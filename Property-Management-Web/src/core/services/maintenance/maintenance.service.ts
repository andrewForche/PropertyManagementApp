import type { MaintenanceProjectModel, WorkLogModel } from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const maintenanceService = {
  getProjects: () =>
    apiClient.get<MaintenanceProjectModel[]>('/maintenance-projects'),
  getWorkLogs: (projectId: number) =>
    apiClient.get<WorkLogModel[]>(`/maintenance-projects/${projectId}/work-logs`),
}
