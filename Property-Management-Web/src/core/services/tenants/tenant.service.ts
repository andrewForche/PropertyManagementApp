import type { TenantModel } from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const tenantService = {
  getAll: () => apiClient.get<TenantModel[]>('/tenants'),
  getById: (tenantId: number) => apiClient.get<TenantModel>(`/tenants/${tenantId}`),
}
