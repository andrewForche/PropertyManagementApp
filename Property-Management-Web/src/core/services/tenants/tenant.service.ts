import type {
  CreateTenantRequest,
  TenantModel,
  UpdateTenantRequest,
} from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const tenantService = {
  getAll: () => apiClient.get<TenantModel[]>('/tenants'),
  getById: (tenantId: number) => apiClient.get<TenantModel>(`/tenants/${tenantId}`),
  create: (payload: CreateTenantRequest) =>
    apiClient.post<CreateTenantRequest, TenantModel>('/tenants', payload),
  update: (tenantId: number, payload: UpdateTenantRequest) =>
    apiClient.put<UpdateTenantRequest, TenantModel>(`/tenants/${tenantId}`, payload),
  delete: (tenantId: number) => apiClient.delete(`/tenants/${tenantId}`),
}
