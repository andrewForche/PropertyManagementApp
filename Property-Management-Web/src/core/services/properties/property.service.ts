import type {
  CreatePropertyRequest,
  PropertyModel,
  UpdatePropertyRequest,
} from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const propertyService = {
  getAll: () => apiClient.get<PropertyModel[]>('/properties'),
  getById: (propertyId: number) =>
    apiClient.get<PropertyModel>(`/properties/${propertyId}`),
  create: (payload: CreatePropertyRequest) =>
    apiClient.post<CreatePropertyRequest, PropertyModel>('/properties', payload),
  update: (propertyId: number, payload: UpdatePropertyRequest) =>
    apiClient.put<UpdatePropertyRequest, PropertyModel>(
      `/properties/${propertyId}`,
      payload,
    ),
  delete: (propertyId: number) => apiClient.delete(`/properties/${propertyId}`),
}
