import type { PropertyModel } from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const propertyService = {
  getAll: () => apiClient.get<PropertyModel[]>('/properties'),
  getById: (propertyId: number) =>
    apiClient.get<PropertyModel>(`/properties/${propertyId}`),
}
