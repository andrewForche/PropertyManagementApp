import type {
  CreateRentPaymentRequest,
  RentPaymentModel,
  RentScheduleModel,
  UpdateRentScheduleRequest,
} from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const rentService = {
  getSchedules: () => apiClient.get<RentScheduleModel[]>('/rent-schedules'),
  getMySchedules: () => apiClient.get<RentScheduleModel[]>('/rent-schedules/me'),
  getPayments: () => apiClient.get<RentPaymentModel[]>('/rent-payments'),
  getMyPayments: () => apiClient.get<RentPaymentModel[]>('/rent-payments/me'),
  updateSchedule: (scheduleId: number, payload: UpdateRentScheduleRequest) =>
    apiClient.put<UpdateRentScheduleRequest, RentScheduleModel>(
      `/rent-schedules/${scheduleId}`,
      payload,
    ),
  createPayment: (payload: CreateRentPaymentRequest) =>
    apiClient.post<CreateRentPaymentRequest, RentPaymentModel>(
      '/rent-payments',
      payload,
    ),
}
