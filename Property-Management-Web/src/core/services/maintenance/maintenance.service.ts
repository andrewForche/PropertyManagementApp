import type {
  CreateMaintenanceProjectRequest,
  CreateWorkLogRequest,
  MaintenanceProjectModel,
  UpdateMaintenanceProjectRequest,
  WorkLogModel,
} from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const maintenanceService = {
  getProjects: () =>
    apiClient.get<MaintenanceProjectModel[]>('/maintenance-projects'),
  getAllWorkLogs: () => apiClient.get<WorkLogModel[]>('/work-logs'),
  getProjectById: (projectId: number) =>
    apiClient.get<MaintenanceProjectModel>(`/maintenance-projects/${projectId}`),
  createProject: (payload: CreateMaintenanceProjectRequest) =>
    apiClient.post<CreateMaintenanceProjectRequest, MaintenanceProjectModel>(
      '/maintenance-projects',
      payload,
    ),
  updateProject: (projectId: number, payload: UpdateMaintenanceProjectRequest) =>
    apiClient.put<UpdateMaintenanceProjectRequest, MaintenanceProjectModel>(
      `/maintenance-projects/${projectId}`,
      payload,
    ),
  deleteProject: (projectId: number) =>
    apiClient.delete(`/maintenance-projects/${projectId}`),
  getWorkLogs: (projectId: number) =>
    apiClient.get<WorkLogModel[]>(`/maintenance-projects/${projectId}/work-logs`),
  createWorkLog: (projectId: number, payload: CreateWorkLogRequest) =>
    apiClient.post<CreateWorkLogRequest, WorkLogModel>(
      `/maintenance-projects/${projectId}/work-logs`,
      payload,
    ),
}
